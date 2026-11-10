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
  MobilityType
} from '@/types';
import { 
  INITIAL_PROFILES, 
  INITIAL_PRODUCTS, 
  INITIAL_WORK_LOGS, 
  INITIAL_TRANSIT_BOOKINGS, 
  DEFAULT_VEHICLE,
  getTodayDateString 
} from '@/lib/mockData';

interface AppContextType {
  currentUser: Profile | null;
  profiles: Profile[];
  products: CardProduct[];
  bookings: TransitBooking[];
  workLogs: CardWorkLog[];
  isLoaded: boolean;
  switchRole: (role: UserRole, userId?: string) => void;
  login: (email: string, role?: UserRole) => boolean;
  signup: (userData: {
    full_name: string;
    ic_or_oku_number: string;
    phone: string;
    email: string;
    role: UserRole;
    mobility_type: MobilityType;
  }) => Profile;
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
  }) => TransitBooking;
  updateBookingStatus: (bookingId: string, newStatus: TransitStatus) => void;
  approveBooking: (bookingId: string) => void;
  declineBooking: (bookingId: string) => void;
  rateBooking: (bookingId: string, rating: number, feedback?: string) => void;
  recordDonation: (bookingId: string, amount: number, method: 'cash' | 'qr') => void;
  // Work log actions
  addWorkLog: (units: number, cardId: string, workerId?: string) => CardWorkLog;
  overrideWorkLog: (logId: string, units: number) => void;
  // Stats helpers
  getArtisanStats: (workerId: string) => ArtisanSummary;
  exportPayrollCSV: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'bg_current_user',
  BOOKINGS: 'bg_transit_bookings',
  WORK_LOGS: 'bg_work_logs',
  PROFILES: 'bg_profiles',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [bookings, setBookings] = useState<TransitBooking[]>(INITIAL_TRANSIT_BOOKINGS);
  const [workLogs, setWorkLogs] = useState<CardWorkLog[]>(INITIAL_WORK_LOGS);
  const products = INITIAL_PRODUCTS;

  // Initialize from LocalStorage or seed defaults
  useEffect(() => {
    try {
      const storedProfiles = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (storedProfiles) {
        setProfiles(JSON.parse(storedProfiles));
      } else {
        localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
      }

      const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_TRANSIT_BOOKINGS));
      }

      const storedLogs = localStorage.getItem(STORAGE_KEYS.WORK_LOGS);
      if (storedLogs) {
        setWorkLogs(JSON.parse(storedLogs));
      } else {
        localStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(INITIAL_WORK_LOGS));
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        // Default to Siti Nurhaliza as beneficiary
        const defaultUser = INITIAL_PROFILES[0];
        setCurrentUser(defaultUser);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
      }
    } catch (e) {
      console.warn('LocalStorage error, using memory defaults', e);
      setCurrentUser(INITIAL_PROFILES[0]);
    }
    setIsLoaded(true);
  }, []);

  // Multi-tab storage listener for real-time synchronization
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

  const login = useCallback((email: string, role?: UserRole): boolean => {
    let match = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!match && role) {
      match = profiles.find(p => p.role === role);
    }
    if (match) {
      saveCurrentUser(match);
      return true;
    }
    // If not found, create a temporary profile with customer role
    const newUser: Profile = {
      id: `user-${Date.now()}`,
      full_name: email.split('@')[0],
      ic_or_oku_number: 'OKU-NEW-01',
      phone: '+60 12-000 0000',
      email,
      role: role || 'customer',
      mobility_type: 'Manual Wheelchair',
    };
    const updatedProfiles = [...profiles, newUser];
    setProfiles(updatedProfiles);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updatedProfiles));
    } catch (e) {
      console.warn(e);
    }
    saveCurrentUser(newUser);
    return true;
  }, [profiles, saveCurrentUser]);

  const signup = useCallback((userData: {
    full_name: string;
    ic_or_oku_number: string;
    phone: string;
    email: string;
    role: UserRole;
    mobility_type: MobilityType;
  }): Profile => {
    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      ...userData,
      bank_name: userData.role === 'customer' ? 'Maybank' : undefined,
      bank_account_number: userData.role === 'customer' ? '1140 9988 7766' : undefined,
    };
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    saveCurrentUser(newProfile);
    return newProfile;
  }, [profiles, saveCurrentUser]);

  const logout = useCallback(() => {
    saveCurrentUser(null);
  }, [saveCurrentUser]);

  // Create Transit Booking
  const createBooking = useCallback((data: {
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
  }): TransitBooking => {
    const user = currentUser || profiles[0];
    const newBooking: TransitBooking = {
      id: `bk-${Date.now()}`,
      passenger_id: user.id,
      passenger_name: data.passenger_name || user.full_name,
      oku_id: data.oku_id || user.ic_or_oku_number,
      phone: data.phone || user.phone,
      pickup_address: data.pickup_address,
      hospital_name: data.hospital_name,
      clinic_department: data.clinic_department,
      appointment_time: data.appointment_time,
      mobility_type: data.mobility_type || user.mobility_type,
      assigned_space: data.assigned_space,
      assigned_driver: 'Johan bin Ariffin',
      assigned_vehicle: DEFAULT_VEHICLE,
      status: 'pending',
      date: data.date || 'Tuesday, 10 Nov 2026',
      destination_coordinates: data.destination_coordinates || { lat: 2.7167, lon: 101.9422 },
      destination_verified: data.destination_verified ?? true,
      timestamps: {
        requested: new Date().toISOString(),
      },
    };
    const updated = [newBooking, ...bookings];
    saveBookings(updated);
    return newBooking;
  }, [currentUser, profiles, bookings, saveBookings]);

  // Update Booking Status (Driver taps, etc.)
  const updateBookingStatus = useCallback((bookingId: string, newStatus: TransitStatus) => {
    const nowIso = new Date().toISOString();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: newStatus,
          timestamps: {
            ...b.timestamps,
            [newStatus]: nowIso,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
  }, [bookings, saveBookings]);

  const approveBooking = useCallback((bookingId: string) => {
    const nowIso = new Date().toISOString();
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'approved' as TransitStatus,
          assigned_driver: 'Johan bin Ariffin',
          assigned_vehicle: DEFAULT_VEHICLE,
          timestamps: {
            ...b.timestamps,
            approved: nowIso,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
  }, [bookings, saveBookings]);

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
            status: 'paid' as const,
            timestamp: nowIso,
          },
        };
      }
      return b;
    });
    saveBookings(updated);
  }, [bookings, saveBookings]);

  // Add work log
  const addWorkLog = useCallback((units: number, cardId: string, workerId?: string): CardWorkLog => {
    const targetWorkerId = workerId || currentUser?.id || profiles[0].id;
    const worker = profiles.find(p => p.id === targetWorkerId) || profiles[0];
    const product = products.find(p => p.id === cardId) || products[0];
    const earned = Number((units * product.piece_rate).toFixed(2));
    
    const newLog: CardWorkLog = {
      id: `log-${Date.now()}`,
      worker_id: targetWorkerId,
      worker_name: worker.full_name,
      card_id: product.id,
      card_name: product.name,
      units_completed: units,
      piece_rate_snapshot: product.piece_rate,
      total_earned: earned,
      logged_date: getTodayDateString(),
    };

    const updated = [newLog, ...workLogs];
    saveWorkLogs(updated);
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
    const worker = profiles.find(p => p.id === workerId) || profiles[0];
    const logs = workLogs.filter(l => l.worker_id === workerId);
    const todayStr = getTodayDateString();

    const now = new Date('2026-11-10T12:00:00Z');
    // Start of week (Monday)
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 is Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

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
      const isThisWeek = logDate >= startOfWeek;
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
  }, [profiles, workLogs]);

  // Export Payroll CSV for direct bank disbursement
  const exportPayrollCSV = useCallback(() => {
    const customers = profiles.filter(p => p.role === 'customer');
    const rows = [
      ['Worker Full Name', 'Malaysian IC / OKU Card', 'Phone', 'Bank Name', 'Account Number', 'Month-to-Date Cards', 'MTD Disbursable Amount (MYR)'],
    ];

    customers.forEach(c => {
      const stats = getArtisanStats(c.id);
      rows.push([
        `"${c.full_name}"`,
        `"${c.ic_or_oku_number}"`,
        `"${c.phone}"`,
        `"${c.bank_name || 'Maybank'}"`,
        `"${c.bank_account_number || '1140 0000 0000'}"`,
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
    addWorkLog,
    overrideWorkLog,
    getArtisanStats,
    exportPayrollCSV,
  }), [
    currentUser,
    profiles,
    products,
    bookings,
    workLogs,
    isLoaded,
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
    addWorkLog,
    overrideWorkLog,
    getArtisanStats,
    exportPayrollCSV,
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
