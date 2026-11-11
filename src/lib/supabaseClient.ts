import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, TransitBooking, CardProduct, CardWorkLog, Vehicle, DriverLeave, LeaveStatus } from '@/types';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
};

// Singleton client instance (only initialized if credentials exist)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// PROFILES API
// ==============================================================================
export async function dbFetchProfiles(): Promise<Profile[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchProfiles error:', error);
    return null;
  }
  return data as Profile[];
}

export async function dbUpsertProfile(profile: Partial<Profile> & { id: string }): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('profiles')
    .upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Supabase upsertProfile error:', error);
    return false;
  }
  return true;
}

// ==============================================================================
// TRANSIT BOOKINGS API
// ==============================================================================
export async function dbFetchBookings(): Promise<TransitBooking[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('transit_bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchBookings error:', error);
    return null;
  }

  // Parse fields back into domain TransitBooking format
  return (data || []).map((row: any): TransitBooking => ({
    id: row.id,
    passenger_id: row.passenger_id || row.id,
    passenger_name: row.passenger_name,
    oku_id: row.oku_id,
    phone: row.phone,
    mobility_type: row.mobility_type,
    pickup_address: row.pickup_address,
    hospital_name: row.hospital_name,
    clinic_department: row.clinic_department || 'General Outpatient / Clinic',
    date: row.date,
    appointment_time: row.appointment_time,
    status: row.status,
    assigned_space: row.assigned_space,
    assigned_driver: row.assigned_driver || 'Assigned Driver',
    assigned_vehicle: {
      plate: row.vehicle_plate || 'WVV 4108',
      brand: row.vehicle_brand || 'Toyota',
      model: row.vehicle_model || 'HiAce Commuter',
      color: row.vehicle_color || 'Pearl White',
      configuration: 'Row 1: Driver + 1 Pax | Row 2: 4 Pax | Row 3: 2 Wheelchairs',
    },
    rating: row.rating ?? undefined,
    feedback: row.rating_feedback ?? undefined,
    donation: row.donation_amount ? {
      amount: Number(row.donation_amount),
      method: (row.donation_method as 'cash' | 'qr') || 'cash',
      status: row.donation_status === 'verified' ? 'paid' : 'pledged',
      timestamp: row.donation_recorded_at || row.created_at || new Date().toISOString(),
    } : undefined,
    destination_coordinates: (row.destination_lat && row.destination_lon) ? {
      lat: Number(row.destination_lat),
      lon: Number(row.destination_lon),
    } : undefined,
    destination_verified: Boolean(row.destination_verified),
    timestamps: {
      requested: row.created_at || new Date().toISOString(),
      approved: row.status === 'approved' ? row.updated_at : undefined,
    },
  }));
}

export async function dbInsertBooking(booking: TransitBooking): Promise<boolean> {
  if (!supabase) return false;
  const payload = {
    id: booking.id,
    passenger_name: booking.passenger_name,
    oku_id: booking.oku_id,
    phone: booking.phone,
    mobility_type: booking.mobility_type,
    pickup_address: booking.pickup_address,
    hospital_name: booking.hospital_name,
    clinic_department: booking.clinic_department || 'General Outpatient / Clinic',
    date: booking.date || 'Today',
    appointment_time: booking.appointment_time,
    status: booking.status,
    assigned_space: booking.assigned_space,
    assigned_driver: booking.assigned_driver || null,
    vehicle_plate: booking.assigned_vehicle?.plate || null,
    vehicle_brand: booking.assigned_vehicle?.brand || null,
    vehicle_model: booking.assigned_vehicle?.model || null,
    vehicle_color: booking.assigned_vehicle?.color || null,
    driver_avatar: null,
    rating: booking.rating ?? null,
    rating_feedback: booking.feedback ?? null,
    donation_amount: booking.donation?.amount ?? null,
    donation_method: booking.donation?.method ?? null,
    donation_status: booking.donation?.status === 'paid' ? 'verified' : 'pending_verification',
    donation_recorded_at: booking.donation?.timestamp ?? null,
    destination_lat: booking.destination_coordinates?.lat ?? null,
    destination_lon: booking.destination_coordinates?.lon ?? null,
    destination_verified: Boolean(booking.destination_verified),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('transit_bookings').insert(payload);
  if (error) {
    console.error('Supabase insertBooking error:', error);
    return false;
  }
  return true;
}

export async function dbUpdateBooking(id: string, updates: Record<string, any>): Promise<boolean> {
  if (!supabase) return false;
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.assigned_driver !== undefined) payload.assigned_driver = updates.assigned_driver;
  if (updates.driver_avatar !== undefined) payload.driver_avatar = updates.driver_avatar;
  if (updates.rating !== undefined) payload.rating = updates.rating;
  if (updates.rating_feedback !== undefined) payload.rating_feedback = updates.rating_feedback;
  if (updates.donation_amount !== undefined) payload.donation_amount = updates.donation_amount;
  if (updates.donation_method !== undefined) payload.donation_method = updates.donation_method;
  if (updates.donation_status !== undefined) payload.donation_status = updates.donation_status;
  if (updates.donation_recorded_at !== undefined) payload.donation_recorded_at = updates.donation_recorded_at;

  const { error } = await supabase.from('transit_bookings').update(payload).eq('id', id);
  if (error) {
    console.error('Supabase updateBooking error:', error);
    return false;
  }
  return true;
}

// ==============================================================================
// CRAFT WORKSHOP API
// ==============================================================================
export async function dbFetchProducts(): Promise<CardProduct[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('card_products').select('*');
  if (error) {
    console.error('Supabase fetchProducts error:', error);
    return null;
  }
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    resort_client: p.resort_client,
    piece_rate: Number(p.piece_rate),
  }));
}

export async function dbFetchWorkLogs(): Promise<CardWorkLog[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('card_work_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetchWorkLogs error:', error);
    return null;
  }
  return (data || []).map((w: any) => ({
    id: w.id,
    worker_id: w.worker_id,
    worker_name: w.worker_name || 'Worker',
    card_id: w.card_id,
    card_name: w.card_name || 'Greeting Card',
    units_completed: Number(w.units_completed || 0),
    piece_rate_snapshot: Number(w.piece_rate_snapshot || 1.50),
    total_earned: Number(w.total_payout || w.total_earned || 0),
    logged_date: w.date || w.logged_date || new Date().toISOString().split('T')[0],
  }));
}

export async function dbInsertWorkLog(log: CardWorkLog): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('card_work_logs').insert({
    id: log.id,
    worker_id: log.worker_id,
    card_id: log.card_id,
    date: log.logged_date,
    units_completed: log.units_completed,
    total_payout: log.total_earned,
    status: 'logged',
  });
  if (error) {
    console.error('Supabase insertWorkLog error:', error);
    return false;
  }
  return true;
}

// ==============================================================================
// VEHICLES API
// ==============================================================================
export async function dbFetchVehicles(): Promise<Vehicle[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Supabase fetchVehicles error:', error);
    return null;
  }
  return (data || []).map((v: any): Vehicle => ({
    id: v.id,
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    color: v.color,
    seats: v.seats,
    image_url: v.image_url || '/images/toyota-hiace-van.jpg',
    status: v.status || 'active',
    notes: v.notes || '',
    created_at: v.created_at,
    updated_at: v.updated_at,
  }));
}

export async function dbUpsertVehicle(vehicle: Vehicle): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('vehicles')
    .upsert({
      ...vehicle,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Supabase upsertVehicle error:', error);
    return false;
  }
  return true;
}

// ==============================================================================
// DRIVER LEAVES API
// ==============================================================================
export async function dbFetchDriverLeaves(): Promise<DriverLeave[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('driver_leaves')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.warn('Supabase fetchDriverLeaves error:', error);
    return null;
  }
  return (data || []).map((l: any): DriverLeave => ({
    id: l.id,
    driver_id: l.driver_id,
    driver_name: l.driver_name,
    date: l.date,
    reason: l.reason || '',
    status: l.status || 'pending',
    approved_by: l.approved_by || '',
    created_at: l.created_at,
    updated_at: l.updated_at,
  }));
}

export async function dbInsertDriverLeave(leave: DriverLeave): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('driver_leaves')
    .insert({
      id: leave.id,
      driver_id: leave.driver_id,
      driver_name: leave.driver_name,
      date: leave.date,
      reason: leave.reason || '',
      status: leave.status || 'pending',
      approved_by: leave.approved_by || null,
      created_at: leave.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Supabase insertDriverLeave error:', error);
    return false;
  }
  return true;
}

export async function dbUpdateDriverLeaveStatus(id: string, status: LeaveStatus, approvedBy?: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('driver_leaves')
    .update({
      status,
      approved_by: approvedBy || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Supabase updateDriverLeaveStatus error:', error);
    return false;
  }
  return true;
}
