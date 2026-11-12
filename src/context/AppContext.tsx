'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Profile, 
  TransitBooking, 
  CardProduct, 
  CardWorkLog, 
  UserRole, 
  TransitStatus, 
  AssignedSpace, 
  ArtisanSummary, 
  MobilityType, 
  Vehicle, 
  DriverLeave, 
  LeaveStatus,
  BeneficiaryType 
} from '@/types';
import { 
  INITIAL_PROFILES, 
  INITIAL_PRODUCTS, 
  INITIAL_WORK_LOGS, 
  INITIAL_TRANSIT_BOOKINGS, 
  DEFAULT_VEHICLE, 
  INITIAL_VEHICLES, 
  INITIAL_DRIVER_LEAVES, 
  getTodayDateString 
} from '@/lib/mockData';
import { formatPhoneNumber, formatICNumber } from '@/lib/formatters';
import {
  isSupabaseConfigured,
  supabase,
  dbFetchProfiles,
  dbUpsertProfile,
  dbDeleteProfile,
  dbFetchBookings,
  dbInsertBooking,
  dbUpdateBooking,
  dbFetchProducts,
  dbUpsertProduct,
  dbDeleteProduct,
  dbFetchWorkLogs,
  dbInsertWorkLog,
  dbFetchVehicles,
  dbUpsertVehicle,
  dbFetchDriverLeaves,
  dbInsertDriverLeave,
  dbUpdateDriverLeaveStatus,
} from '@/lib/supabaseClient';

interface AppContextType {
  currentUser: Profile | null;
  profiles: Profile[];
  products: CardProduct[];
  bookings: TransitBooking[];
  workLogs: CardWorkLog[];
  isLoaded: boolean;
  isSupabaseLive: boolean;
  switchRole: (role: UserRole, userId?: string) => void;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: {
    full_name: string;
    ic_or_oku_number: string;
    phone: string;
    email: string;
    role: UserRole;
    mobility_type: MobilityType;
    beneficiary_type?: BeneficiaryType;
    password?: string;
  }) => Promise<Profile> | Profile;
  logout: () => void;
  // Booking actions
  createBooking: (data: {
    appointment_time: string;
    assigned_space: AssignedSpace | string;
    pickup_address: string;
    hospital_name: string;
    clinic_department: string;
    mobility_type: MobilityType;
    date?: string;
    destination_coordinates?: { lat: number; lon: number };
    destination_verified?: boolean;
    passenger_name?: string;
    oku_id?: string;
    phone?: string;
  }) => Promise<TransitBooking> | TransitBooking;
  updateBookingStatus: (bookingId: string, newStatus: TransitStatus) => void;
  approveBooking: (bookingId: string) => void;
  declineBooking: (bookingId: string) => void;
  rateBooking: (bookingId: string, rating: number, feedback?: string) => void;
  recordDonation: (bookingId: string, amount: number, method: 'cash' | 'qr') => void;
  verifyDonation: (bookingId: string) => void;
  exportDonationsCSV: () => void;
  // Work log actions
  addWorkLog: (units: number, cardId: string, workerId?: string) => CardWorkLog;
  overrideWorkLog: (logId: string, units: number) => void;
  // Stats helpers
  getArtisanStats: (workerId: string) => ArtisanSummary;
  exportPayrollCSV: () => void;
  // Profile management
  updateProfile: (profileId: string, updates: Partial<Profile>) => void;
  deleteProfile: (profileId: string) => Promise<boolean>;
  approveDriverAccount: (profileId: string) => void;
  rejectDriverAccount: (profileId: string) => void;
  // Vehicle management
  vehicles: Vehicle[];
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => Promise<boolean> | boolean;
  // Workshop Collaborator & Product management
  updateProduct: (productId: string, updates: Partial<CardProduct>) => Promise<boolean>;
  addProduct: (newProduct: Omit<CardProduct, 'id'>) => Promise<CardProduct>;
  deleteProduct: (productId: string) => Promise<boolean>;
  // Driver Leave management
  driverLeaves: DriverLeave[];
  requestDriverLeave: (data: { date: string; reason?: string }) => Promise<DriverLeave> | DriverLeave;
  approveDriverLeave: (leaveId: string) => void;
  rejectDriverLeave: (leaveId: string) => void;
  isDateBlockedByLeave: (dateStr: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'bg_current_user',
  BOOKINGS: 'bg_transit_bookings_v2',
  WORK_LOGS: 'bg_work_logs_v2',
  PROFILES: 'bg_profiles_v2',
  VEHICLES: 'bg_vehicles_v2',
  DRIVER_LEAVES: 'bg_driver_leaves_v2',
  PRODUCTS: 'bg_card_products_v2',
};

// Safe client-side password hash helper
export function hashPassword(pwd: string): string {
  if (!pwd) return '';
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    const char = pwd.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'bg_' + Math.abs(hash).toString(16);
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [bookings, setBookings] = useState<TransitBooking[]>(INITIAL_TRANSIT_BOOKINGS);
  const [workLogs, setWorkLogs] = useState<CardWorkLog[]>(INITIAL_WORK_LOGS);
  const [products, setProducts] = useState<CardProduct[]>(INITIAL_PRODUCTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [driverLeaves, setDriverLeaves] = useState<DriverLeave[]>(INITIAL_DRIVER_LEAVES);

  // Initialize and Sync (Supabase or LocalStorage)
  useEffect(() => {
    let isSubscribed = true;
    let activeChannel: any = null;

    async function initializeData() {
      const live = isSupabaseConfigured();
      setIsSupabaseLive(live);

      // Clean old legacy storage keys
      try {
        localStorage.removeItem('bg_transit_bookings');
        localStorage.removeItem('bg_work_logs');
        localStorage.removeItem('bg_profiles');
      } catch {}

      let loadedFromSupabase = false;

      if (live && supabase) {
        try {
          // 1. Fetch live Supabase data
          const [sbProfiles, sbBookings, sbProducts, sbWorkLogs, sbVehicles, sbLeaves] = await Promise.all([
            dbFetchProfiles(),
            dbFetchBookings(),
            dbFetchProducts(),
            dbFetchWorkLogs(),
            dbFetchVehicles(),
            dbFetchDriverLeaves(),
          ]);

          if (isSubscribed) {
            if (sbProfiles && sbProfiles.length > 0) {
              setProfiles(sbProfiles);
              try { localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(sbProfiles)); } catch {}
            }
            if (sbBookings) {
              setBookings(sbBookings);
              try { localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(sbBookings)); } catch {}
            }
            if (sbProducts && sbProducts.length > 0) {
              setProducts(sbProducts);
              try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sbProducts)); } catch {}
            }
            if (sbWorkLogs) {
              setWorkLogs(sbWorkLogs);
              try { localStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(sbWorkLogs)); } catch {}
            }
            if (sbVehicles && sbVehicles.length > 0) {
              setVehicles(sbVehicles);
              try { localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(sbVehicles)); } catch {}
            }
            if (sbLeaves) {
              setDriverLeaves(sbLeaves);
              try { localStorage.setItem(STORAGE_KEYS.DRIVER_LEAVES, JSON.stringify(sbLeaves)); } catch {}
            }
            loadedFromSupabase = true;
          }

          // 2. Realtime listener for live Supabase changes across clients
          // Remove any stale or already-subscribed channels with same topic to avoid duplicate callback errors
          const existingChannels = supabase.getChannels() || [];
          for (const ch of existingChannels) {
            if (ch.topic.includes('bg_realtime_sync')) {
              await supabase.removeChannel(ch);
            }
          }

          if (isSubscribed) {
            activeChannel = supabase
              .channel(`bg_realtime_sync_${Date.now()}`)
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transit_bookings' },
                async () => {
                  const refreshed = await dbFetchBookings();
                  if (refreshed && isSubscribed) setBookings(refreshed);
                }
              )
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                async () => {
                  const refreshed = await dbFetchProfiles();
                  if (refreshed && isSubscribed) setProfiles(refreshed);
                }
              )
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'vehicles' },
                async () => {
                  const refreshed = await dbFetchVehicles();
                  if (refreshed && refreshed.length > 0 && isSubscribed) setVehicles(refreshed);
                }
              )
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'driver_leaves' },
                async () => {
                  const refreshed = await dbFetchDriverLeaves();
                  if (refreshed && isSubscribed) setDriverLeaves(refreshed);
                }
              )
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'card_products' },
                async () => {
                  const refreshed = await dbFetchProducts();
                  if (refreshed && refreshed.length > 0 && isSubscribed) setProducts(refreshed);
                }
              )
              .subscribe();
          }
        } catch (err) {
          console.warn('Error connecting to live Supabase, using local fallback:', err);
        }
      }

      // Hydrate from local storage if not fetched live from Supabase
      if (!loadedFromSupabase) {
        try {
          const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
          if (storedProfiles) {
            setProfiles(JSON.parse(storedProfiles));
          }

          const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
          if (storedBookings) {
            setBookings(JSON.parse(storedBookings));
          }

          const storedLogs = localStorage.getItem(STORAGE_KEYS.WORK_LOGS);
          if (storedLogs) {
            setWorkLogs(JSON.parse(storedLogs));
          }

          const storedVehicles = localStorage.getItem(STORAGE_KEYS.VEHICLES);
          if (storedVehicles) {
            setVehicles(JSON.parse(storedVehicles));
          }

          const storedLeaves = localStorage.getItem(STORAGE_KEYS.DRIVER_LEAVES);
          if (storedLeaves) {
            setDriverLeaves(JSON.parse(storedLeaves));
          }

          const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
          if (storedProducts) {
            setProducts(JSON.parse(storedProducts));
          }
        } catch (e) {
          console.warn('LocalStorage error', e);
        }
      }

      // User session restore
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn('User restore error', e);
      }

      if (isSubscribed) {
        setIsLoaded(true);
      }
    }

    initializeData();

    return () => {
      isSubscribed = false;
      if (activeChannel) {
        supabase?.removeChannel(activeChannel);
      }
    };
  }, []);

  // Multi-tab storage listener for real-time local synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.BOOKINGS) {
          setBookings(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.WORK_LOGS) {
          setWorkLogs(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.CURRENT_USER) {
          setCurrentUser(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.PROFILES) {
          setProfiles(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.error('Failed to sync storage event', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveBookings = useCallback((newBookings: TransitBooking[]) => {
    setBookings(newBookings);
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(newBookings));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const saveWorkLogs = useCallback((newLogs: CardWorkLog[]) => {
    setWorkLogs(newLogs);
    try {
      localStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(newLogs));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const saveCurrentUser = useCallback((user: Profile | null) => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const switchRole = useCallback((role: UserRole, userId?: string) => {
    let targetUser: Profile | undefined;
    if (userId) {
      targetUser = profiles.find(p => p.id === userId);
    }
    if (!targetUser) {
      targetUser = profiles.find(p => p.role === role);
    }
    if (targetUser) {
      saveCurrentUser(targetUser);
    }
  }, [profiles, saveCurrentUser]);

  const login = useCallback(async (
    email: string,
    password?: string,
    role?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    let match = profiles.find(p => p.email.toLowerCase() === trimmedEmail);
    
    // If Supabase is active and not matched locally, check live Supabase profiles
    if (!match && isSupabaseConfigured()) {
      const liveProfiles = await dbFetchProfiles();
      if (liveProfiles) {
        setProfiles(liveProfiles);
        match = liveProfiles.find(p => p.email.toLowerCase() === trimmedEmail);
      }
    }

    if (!match && role) {
      match = profiles.find(p => p.role === role);
    }

    // Account not found
    if (!match) {
      return { success: false, error: 'account_not_found' };
    }

    // Check password if provided or required
    if (password !== undefined) {
      const enteredHash = hashPassword(password);
      
      if (match.password_hash) {
        if (match.password_hash !== enteredHash) {
          return { success: false, error: 'invalid_password' };
        }
      } else {
        // Fallback for seed accounts without an explicit password_hash yet
        const defaultAdminHash = hashPassword('admin123');
        const defaultDriverHash = hashPassword('driver123');

        if (match.role === 'admin' && enteredHash !== defaultAdminHash && match.email === 'tan.beechian@beautifulgate.org.my') {
          return { success: false, error: 'invalid_password' };
        } else if (match.role === 'driver' && enteredHash !== defaultDriverHash && match.email === 'wong.kokfu@beautifulgate.org.my') {
          return { success: false, error: 'invalid_password' };
        } else if (!match.password_hash && password) {
          // First login for user without hash: bind this password to their profile
          match.password_hash = enteredHash;
          dbUpsertProfile(match).catch(err => console.warn('Supabase profile password update error:', err));
        }
      }
    }

    saveCurrentUser(match);
    return { success: true };
  }, [profiles, saveCurrentUser]);

  const signup = useCallback(async (userData: {
    full_name: string;
    ic_or_oku_number: string;
    phone: string;
    email: string;
    role: UserRole;
    mobility_type: MobilityType;
    beneficiary_type?: BeneficiaryType;
    password?: string;
  }): Promise<Profile> => {
    // If staff/driver signs up, they require administrator approval before active duty
    const isStaffOrDriver = userData.role === 'driver' || userData.role === 'admin';
    const passwordHash = userData.password ? hashPassword(userData.password) : undefined;

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      full_name: userData.full_name,
      ic_or_oku_number: formatICNumber(userData.ic_or_oku_number),
      phone: formatPhoneNumber(userData.phone),
      email: userData.email,
      role: userData.role,
      mobility_type: userData.mobility_type,
      beneficiary_type: userData.role === 'customer' ? (userData.beneficiary_type || 'resident') : undefined,
      password_hash: passwordHash,
      is_approved: isStaffOrDriver ? false : true,
      driver_status: userData.role === 'driver' ? 'standby' : undefined,
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    // Persist to Supabase if configured
    await dbUpsertProfile(newProfile);

    saveCurrentUser(newProfile);
    return newProfile;
  }, [profiles, saveCurrentUser]);

  // Update profile details and/or avatar photo
  const updateProfile = useCallback((profileId: string, updates: Partial<Profile>) => {
    const normalizedUpdates = {
      ...updates,
      ...(updates.phone !== undefined ? { phone: formatPhoneNumber(updates.phone) } : {}),
      ...(updates.ic_or_oku_number !== undefined ? { ic_or_oku_number: formatICNumber(updates.ic_or_oku_number) } : {}),
    };

    setProfiles(prevProfiles => {
      const updated = prevProfiles.map(p => {
        if (p.id === profileId) {
          const merged = { ...p, ...normalizedUpdates };
          // Persist to Supabase asynchronously
          dbUpsertProfile(merged).catch(err => console.warn('Supabase updateProfile error', err));
          return merged;
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage error saving profiles', err);
      }
      return updated;
    });

    setCurrentUser(prevUser => {
      if (prevUser && prevUser.id === profileId) {
        const updatedUser = { ...prevUser, ...normalizedUpdates };
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
        } catch (err) {
          console.warn('Storage error saving current user', err);
        }
        return updatedUser;
      }
      return prevUser;
    });
  }, []);

  // Administrator permanently deletes a user or driver account
  const deleteProfile = useCallback(async (profileId: string): Promise<boolean> => {
    if (currentUser?.id === profileId) {
      console.warn('Cannot delete currently logged-in administrator account.');
      return false;
    }

    setProfiles(prevProfiles => {
      const updated = prevProfiles.filter(p => p.id !== profileId);
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
      } catch (err) {
        console.warn('Storage error deleting profile', err);
      }
      return updated;
    });

    try {
      await dbDeleteProfile(profileId);
    } catch (err) {
      console.warn('Supabase deleteProfile error:', err);
    }
    return true;
  }, [currentUser]);

  // Administrator approves staff/driver account
  const approveDriverAccount = useCallback((profileId: string) => {
    updateProfile(profileId, { 
      is_approved: true, 
      driver_status: 'active' 
    });
  }, [updateProfile]);

  // Administrator rejects / revokes staff/driver account
  const rejectDriverAccount = useCallback((profileId: string) => {
    updateProfile(profileId, { 
      is_approved: false, 
      driver_status: 'standby' 
    });
  }, [updateProfile]);

  // Vehicle management
  const updateVehicle = useCallback(async (vehicleId: string, updates: Partial<Vehicle>): Promise<boolean> => {
    let targetUpdated: Vehicle | null = null;
    setVehicles(prev => {
      const updatedList = prev.map(v => {
        if (v.id === vehicleId || v.plate === vehicleId) {
          targetUpdated = { ...v, ...updates, updated_at: new Date().toISOString() };
          return targetUpdated;
        }
        return v;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updatedList));
      } catch (e) {
        console.warn(e);
      }
      return updatedList;
    });

    if (targetUpdated) {
      await dbUpsertVehicle(targetUpdated);
      return true;
    }
    return false;
  }, []);

  // Workshop Collaborator & Product management
  const updateProduct = useCallback(async (productId: string, updates: Partial<CardProduct>): Promise<boolean> => {
    let targetUpdated: CardProduct | null = null;
    setProducts(prev => {
      const updatedList = prev.map(p => {
        if (p.id === productId) {
          targetUpdated = { ...p, ...updates };
          return targetUpdated;
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedList));
      } catch (e) {
        console.warn(e);
      }
      return updatedList;
    });

    if (targetUpdated) {
      await dbUpsertProduct(targetUpdated);
      return true;
    }
    return false;
  }, []);

  const addProduct = useCallback(async (newProductData: Omit<CardProduct, 'id'>): Promise<CardProduct> => {
    const newProduct: CardProduct = {
      id: `prod-${Date.now()}`,
      name: newProductData.name,
      resort_client: newProductData.resort_client,
      piece_rate: Number(newProductData.piece_rate) || 1.50,
    };

    setProducts(prev => {
      const updatedList = [newProduct, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedList));
      } catch (e) {
        console.warn(e);
      }
      return updatedList;
    });

    await dbUpsertProduct(newProduct);
    return newProduct;
  }, []);

  const deleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    setProducts(prev => {
      const updatedList = prev.filter(p => p.id !== productId);
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedList));
      } catch (e) {
        console.warn(e);
      }
      return updatedList;
    });

    await dbDeleteProduct(productId);
    return true;
  }, []);

  // Driver leave requests
  const requestDriverLeave = useCallback(async (data: { date: string; reason?: string }): Promise<DriverLeave> => {
    const newLeave: DriverLeave = {
      id: `leave-${Date.now()}`,
      driver_id: currentUser?.id || 'user-driver-wongkokfu',
      driver_name: currentUser?.full_name || 'Wong Kok Fu',
      date: data.date,
      reason: data.reason || 'Personal / Medical Leave',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDriverLeaves(prev => {
      const updated = [newLeave, ...prev.filter(l => l.date !== data.date || l.status === 'rejected')];
      try {
        localStorage.setItem(STORAGE_KEYS.DRIVER_LEAVES, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });

    await dbInsertDriverLeave(newLeave);
    return newLeave;
  }, [currentUser]);

  const approveDriverLeave = useCallback(async (leaveId: string) => {
    const approver = currentUser?.full_name || 'Administrator';
    setDriverLeaves(prev => {
      const updated = prev.map(l => l.id === leaveId ? { ...l, status: 'approved' as LeaveStatus, approved_by: approver, updated_at: new Date().toISOString() } : l);
      try {
        localStorage.setItem(STORAGE_KEYS.DRIVER_LEAVES, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    await dbUpdateDriverLeaveStatus(leaveId, 'approved', approver);
  }, [currentUser]);

  const rejectDriverLeave = useCallback(async (leaveId: string) => {
    const rejecter = currentUser?.full_name || 'Administrator';
    setDriverLeaves(prev => {
      const updated = prev.map(l => l.id === leaveId ? { ...l, status: 'rejected' as LeaveStatus, approved_by: rejecter, updated_at: new Date().toISOString() } : l);
      try {
        localStorage.setItem(STORAGE_KEYS.DRIVER_LEAVES, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
    await dbUpdateDriverLeaveStatus(leaveId, 'rejected', rejecter);
  }, [currentUser]);

  const isDateBlockedByLeave = useCallback((dateStr: string): boolean => {
    if (!dateStr) return false;
    const cleanQuery = dateStr.trim();
    return driverLeaves.some(l => {
      if (l.status !== 'approved') return false;
      const cleanLeave = (l.date || '').trim();
      if (cleanQuery.includes(cleanLeave) || cleanLeave.includes(cleanQuery)) return true;

      const queryDayMonth = cleanQuery.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
      const leaveDayMonth = cleanLeave.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (queryDayMonth && leaveDayMonth) {
        const monthMap: Record<string, string> = {
          jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
          jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };
        const qDay = queryDayMonth[1].padStart(2, '0');
        const qMonth = monthMap[queryDayMonth[2].toLowerCase().slice(0, 3)];
        if (qDay === leaveDayMonth[3] && qMonth === leaveDayMonth[2]) {
          return true;
        }
      }

      try {
        const leaveD = new Date(cleanLeave);
        const queryD = new Date(cleanQuery);
        if (!isNaN(leaveD.getTime()) && !isNaN(queryD.getTime())) {
          return leaveD.toISOString().split('T')[0] === queryD.toISOString().split('T')[0];
        }
      } catch {}
      return false;
    });
  }, [driverLeaves]);

  const logout = useCallback(() => {
    saveCurrentUser(null);
  }, [saveCurrentUser]);

  // Create Transit Booking
  const createBooking = useCallback(async (data: {
    appointment_time: string;
    assigned_space: AssignedSpace | string;
    pickup_address: string;
    hospital_name: string;
    clinic_department: string;
    mobility_type: MobilityType;
    date?: string;
    destination_coordinates?: { lat: number; lon: number };
    destination_verified?: boolean;
    passenger_name?: string;
    oku_id?: string;
    phone?: string;
  }): Promise<TransitBooking> => {
    // Find active AND approved driver if one exists in the roster
    const activeDriver = profiles.find(p => p.role === 'driver' && p.is_approved !== false && p.driver_status !== 'on_leave');

    const newBooking: TransitBooking = {
      id: `bk-${Date.now()}`,
      passenger_id: currentUser?.id || 'guest',
      passenger_name: data.passenger_name || currentUser?.full_name || 'Passenger',
      oku_id: formatICNumber(data.oku_id || currentUser?.ic_or_oku_number || ''),
      phone: formatPhoneNumber(data.phone || currentUser?.phone || ''),
      pickup_address: data.pickup_address,
      hospital_name: data.hospital_name,
      clinic_department: data.clinic_department || 'General Outpatient / Clinic',
      appointment_time: data.appointment_time,
      mobility_type: data.mobility_type || currentUser?.mobility_type || 'Manual Wheelchair',
      assigned_space: data.assigned_space,
      assigned_driver: activeDriver?.full_name || 'Assigned Driver',
      assigned_vehicle: activeDriver?.assigned_vehicle_plate ? {
        plate: activeDriver.assigned_vehicle_plate,
        brand: vehicles?.[0]?.brand || 'Toyota',
        model: vehicles?.[0]?.model || 'HiAce Commuter',
        color: vehicles?.[0]?.color || 'Pearl White',
        configuration: vehicles?.[0]?.seats || 'Row 1: Driver + 1 Pax | Row 2: 4 Pax | Row 3: 2 Wheelchairs',
      } : (vehicles?.[0] ? {
        plate: vehicles[0].plate,
        brand: vehicles[0].brand,
        model: vehicles[0].model,
        color: vehicles[0].color,
        configuration: vehicles[0].seats,
      } : DEFAULT_VEHICLE),
      status: 'pending',
      date: data.date || getTodayDateString(),
      destination_coordinates: data.destination_coordinates,
      destination_verified: data.destination_verified ?? Boolean(data.destination_coordinates),
      timestamps: {
        requested: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    const updated = [newBooking, ...bookings];
    saveBookings(updated);

    // Persist to Supabase if live
    await dbInsertBooking(newBooking);

    return newBooking;
  }, [currentUser, profiles, bookings, saveBookings]);

  // Update Booking Status
  const updateBookingStatus = useCallback((bookingId: string, newStatus: TransitStatus) => {
    const nowIso = new Date().toISOString();
    let updatedTimestamps: any = {};
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        updatedTimestamps = {
          ...b.timestamps,
          [newStatus]: nowIso,
        };
        return {
          ...b,
          status: newStatus,
          timestamps: updatedTimestamps,
        };
      }
      return b;
    });
    saveBookings(updated);
    dbUpdateBooking(bookingId, { 
      status: newStatus,
      timestamps: updatedTimestamps 
    }).catch(err => console.warn(err));
  }, [bookings, saveBookings]);

  const approveBooking = useCallback((bookingId: string) => {
    const nowIso = new Date().toISOString();
    const activeDriver = profiles.find(p => p.role === 'driver' && p.is_approved !== false && p.driver_status !== 'on_leave');
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'approved' as TransitStatus,
          assigned_driver: b.assigned_driver || activeDriver?.full_name || 'Assigned Driver',
          assigned_vehicle: b.assigned_vehicle || (vehicles?.[0] ? {
            plate: vehicles[0].plate,
            brand: vehicles[0].brand,
            model: vehicles[0].model,
            color: vehicles[0].color,
            configuration: vehicles[0].seats,
          } : DEFAULT_VEHICLE),
          timestamps: {
            ...b.timestamps,
            approved: nowIso,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
    dbUpdateBooking(bookingId, { 
      status: 'approved', 
      assigned_driver: activeDriver?.full_name || 'Assigned Driver' 
    }).catch(err => console.warn(err));
  }, [bookings, profiles, saveBookings]);

  const declineBooking = useCallback((bookingId: string) => {
    const nowIso = new Date().toISOString();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'declined' as TransitStatus,
          timestamps: {
            ...b.timestamps,
            declined: nowIso,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
    dbUpdateBooking(bookingId, { status: 'declined' }).catch(err => console.warn(err));
  }, [bookings, saveBookings]);

  const rateBooking = useCallback((bookingId: string, rating: number, feedback?: string) => {
    const nowIso = new Date().toISOString();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          rating,
          feedback,
          rated_at: nowIso,
        };
      }
      return b;
    });
    saveBookings(updated);
    dbUpdateBooking(bookingId, { rating, rating_feedback: feedback }).catch(err => console.warn(err));
  }, [bookings, saveBookings]);

  const recordDonation = useCallback((bookingId: string, amount: number, method: 'cash' | 'qr') => {
    const nowIso = new Date().toISOString();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          donation: {
            amount,
            method,
            status: method === 'qr' ? ('paid' as const) : ('pledged' as const),
            timestamp: nowIso,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
    dbUpdateBooking(bookingId, {
      donation_amount: amount,
      donation_method: method,
      donation_status: method === 'qr' ? 'verified' : 'pending_verification',
      donation_recorded_at: nowIso,
    }).catch(err => console.warn(err));
  }, [bookings, saveBookings]);

  // Supervisor verifies cash donation handed over by driver
  const verifyDonation = useCallback((bookingId: string) => {
    const updated = bookings.map(b => {
      if (b.id === bookingId && b.donation) {
        return {
          ...b,
          donation: {
            ...b.donation,
            status: 'paid' as const,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
    dbUpdateBooking(bookingId, { donation_status: 'verified' }).catch(err => console.warn(err));
  }, [bookings, saveBookings]);

  // Export Donation CSV with Monthly Summary Totals
  const exportDonationsCSV = useCallback(() => {
    const donatedBookings = bookings.filter(b => Boolean(b.donation));

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const isThisMonth = (dateStr?: string) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    };

    const monthDonations = donatedBookings.filter(b => isThisMonth(b.donation?.timestamp));
    const totalMonth = monthDonations.reduce((sum, b) => sum + (b.donation?.amount || 0), 0);
    const qrMonth = monthDonations.filter(b => b.donation?.method === 'qr');
    const totalQrMonth = qrMonth.reduce((sum, b) => sum + (b.donation?.amount || 0), 0);
    const cashMonth = monthDonations.filter(b => b.donation?.method === 'cash');
    const totalCashMonth = cashMonth.reduce((sum, b) => sum + (b.donation?.amount || 0), 0);

    const rows = [
      ['"BEAUTIFUL GATE FOUNDATION FOR THE DISABLED"'],
      ['"TRANSIT DONATION & ACCESSIBLE TRANSPORT SUBSIDY AUDIT"'],
      ['"Generated At"', `"${new Date().toLocaleString()}"`],
      ['"Audit Period Scope"', '"Month-to-Date Audit"'],
      ['""'],
      ['"=== MONTHLY AUDIT SUMMARY TOTALS ==="'],
      ['"Metric Description"', '"Amount (MYR)"', '"Contributions Count"'],
      ['"Total in a Month"', `"RM ${totalMonth.toFixed(2)}"`, `"${monthDonations.length} contributions"`],
      ['"Total from QR in a Month"', `"RM ${totalQrMonth.toFixed(2)}"`, `"${qrMonth.length} contributions"`],
      ['"Total from Cash to Driver in a Month"', `"RM ${totalCashMonth.toFixed(2)}"`, `"${cashMonth.length} contributions"`],
      ['""'],
      ['"=== DETAILED TRANSACTION AUDIT LEDGER ==="'],
      [
        'Time Slot',
        'Date',
        'Passenger Name',
        'Assigned Driver',
        'Payment Method',
        'Amount (MYR)',
        'Status',
        'Destination Hospital',
        'Reference ID',
        'OKU Number',
        'Contact Phone',
        'Timestamp'
      ],
    ];

    donatedBookings.forEach(b => {
      const d = b.donation!;
      rows.push([
        `"${b.appointment_time}"`,
        `"${b.date}"`,
        `"${b.passenger_name}"`,
        `"${b.assigned_driver || 'Unassigned'} (${b.assigned_vehicle?.plate || vehicles?.[0]?.plate || 'NDC 9751'})"`,
        `"${d.method === 'cash' ? 'Cash to Driver' : 'DuitNow QR'}"`,
        `"${d.amount.toFixed(2)}"`,
        `"${d.status === 'paid' ? 'Paid / Reconciled' : 'Pledged to Driver'}"`,
        `"${b.hospital_name}"`,
        `"BG-TR-${b.id.toUpperCase()}"`,
        `"${b.oku_id}"`,
        `"${b.phone}"`,
        `"${d.timestamp}"`
      ]);
    });

    // Summary totals at bottom of spreadsheet
    rows.push(['""']);
    rows.push(['"--- MONTHLY LEDGER TOTALS ---"']);
    rows.push([
      '""',
      '""',
      '""',
      '""',
      '"TOTAL IN A MONTH"',
      `"RM ${totalMonth.toFixed(2)}"`,
      `"${monthDonations.length} records"`
    ]);
    rows.push([
      '""',
      '""',
      '""',
      '""',
      '"TOTAL FROM QR IN A MONTH"',
      `"RM ${totalQrMonth.toFixed(2)}"`,
      `"${qrMonth.length} records"`
    ]);
    rows.push([
      '""',
      '""',
      '""',
      '""',
      '"TOTAL FROM CASH TO DRIVER IN A MONTH"',
      `"RM ${totalCashMonth.toFixed(2)}"`,
      `"${cashMonth.length} records"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const today = getTodayDateString();
    link.setAttribute('download', `BeautifulGate_Transit_Donations_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [bookings]);

  // Add work log
  const addWorkLog = useCallback((units: number, cardId: string, workerId?: string): CardWorkLog => {
    const targetWorkerId = workerId || currentUser?.id || 'unknown';
    const worker = profiles.find(p => p.id === targetWorkerId) || currentUser;
    const product = products.find(p => p.id === cardId) || {
      id: cardId,
      name: 'Standard Greeting Card',
      resort_client: 'Beautiful Gate Artisan',
      piece_rate: 1.50,
    };
    const earned = Number((units * product.piece_rate).toFixed(2));
    
    const newLog: CardWorkLog = {
      id: `log-${Date.now()}`,
      worker_id: targetWorkerId,
      worker_name: worker?.full_name || 'Worker',
      card_id: product.id,
      card_name: product.name,
      units_completed: units,
      piece_rate_snapshot: product.piece_rate,
      total_earned: earned,
      logged_date: getTodayDateString(),
    };

    const updated = [newLog, ...workLogs];
    saveWorkLogs(updated);

    // Persist to Supabase if live
    dbInsertWorkLog(newLog).catch(err => console.warn(err));

    return newLog;
  }, [currentUser, profiles, products, workLogs, saveWorkLogs]);

  // Override work log (Admin action)
  const overrideWorkLog = useCallback((logId: string, units: number) => {
    const updated = workLogs.map(l => {
      if (l.id === logId) {
        const total = Number((units * l.piece_rate_snapshot).toFixed(2));
        return {
          ...l,
          units_completed: units,
          total_earned: total,
        };
      }
      return l;
    });
    saveWorkLogs(updated);
  }, [workLogs, saveWorkLogs]);

  // Artisan stats calculation helper
  const getArtisanStats = useCallback((workerId: string): ArtisanSummary => {
    const worker = profiles.find(p => p.id === workerId) || currentUser || {
      id: workerId,
      full_name: 'Worker',
      ic_or_oku_number: '',
      phone: '',
      email: '',
      role: 'customer' as UserRole,
      mobility_type: 'None' as MobilityType,
    };
    const logs = workLogs.filter(l => l.worker_id === workerId);
    const todayStr = getTodayDateString();

    const now = new Date();
    // Start of week (Monday 00:00:00) to End of week (Sunday 23:59:59)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let todayEarned = 0;
    let todayUnits = 0;
    let weekEarned = 0;
    let weekUnits = 0;
    let monthEarned = 0;
    let monthUnits = 0;
    let yearEarned = 0;
    let yearUnits = 0;

    logs.forEach(log => {
      const logDate = new Date(log.logged_date);
      const isToday = log.logged_date === todayStr;
      const isThisWeek = logDate >= startOfWeek && logDate <= endOfWeek;
      const isThisMonth = logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;
      const isThisYear = logDate.getFullYear() === currentYear;

      if (isToday) {
        todayEarned += log.total_earned;
        todayUnits += log.units_completed;
      }
      if (isThisWeek) {
        weekEarned += log.total_earned;
        weekUnits += log.units_completed;
      }
      if (isThisMonth) {
        monthEarned += log.total_earned;
        monthUnits += log.units_completed;
      }
      if (isThisYear) {
        yearEarned += log.total_earned;
        yearUnits += log.units_completed;
      }
    });

    return {
      profile: worker,
      todayEarned: Number(todayEarned.toFixed(2)),
      todayUnits,
      weekEarned: Number(weekEarned.toFixed(2)),
      weekUnits,
      monthEarned: Number(monthEarned.toFixed(2)),
      monthUnits,
      yearEarned: Number(yearEarned.toFixed(2)),
      yearUnits,
      logs,
    };
  }, [profiles, currentUser, workLogs]);

  // Export Payroll CSV for direct bank disbursement
  const exportPayrollCSV = useCallback(() => {
    const customers = profiles.filter(p => p.role === 'customer');
    const rows = [
      ['Worker Full Name', 'Malaysian IC / OKU Card', 'Phone', 'Month-to-Date Cards', 'MTD Disbursable Amount (MYR)'],
    ];

    customers.forEach(c => {
      const stats = getArtisanStats(c.id);
      rows.push([
        `"${c.full_name}"`,
        `"${c.ic_or_oku_number}"`,
        `"${c.phone}"`,
        stats.monthUnits.toString(),
        `"RM ${stats.monthEarned.toFixed(2)}"`,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const today = getTodayDateString();
    link.setAttribute('download', `BeautifulGate_Artisan_Payroll_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [profiles, getArtisanStats]);

  const value = useMemo(() => ({
    currentUser,
    profiles,
    products,
    bookings,
    workLogs,
    isLoaded,
    isSupabaseLive,
    switchRole,
    login,
    signup,
    logout,
    createBooking,
    updateBookingStatus,
    approveBooking,
    declineBooking,
    rateBooking,
    recordDonation,
    verifyDonation,
    exportDonationsCSV,
    addWorkLog,
    overrideWorkLog,
    getArtisanStats,
    exportPayrollCSV,
    updateProfile,
    deleteProfile,
    approveDriverAccount,
    rejectDriverAccount,
    vehicles,
    updateVehicle,
    updateProduct,
    addProduct,
    deleteProduct,
    driverLeaves,
    requestDriverLeave,
    approveDriverLeave,
    rejectDriverLeave,
    isDateBlockedByLeave,
  }), [
    currentUser,
    profiles,
    products,
    bookings,
    workLogs,
    isLoaded,
    isSupabaseLive,
    switchRole,
    login,
    signup,
    logout,
    createBooking,
    updateBookingStatus,
    approveBooking,
    declineBooking,
    rateBooking,
    recordDonation,
    verifyDonation,
    exportDonationsCSV,
    addWorkLog,
    overrideWorkLog,
    getArtisanStats,
    exportPayrollCSV,
    updateProfile,
    deleteProfile,
    approveDriverAccount,
    rejectDriverAccount,
    vehicles,
    updateVehicle,
    updateProduct,
    addProduct,
    deleteProduct,
    driverLeaves,
    requestDriverLeave,
    approveDriverLeave,
    rejectDriverLeave,
    isDateBlockedByLeave,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
