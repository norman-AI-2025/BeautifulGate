export type UserRole = 'customer' | 'driver' | 'admin';

export type MobilityType = 
  | 'Motorized Wheelchair' 
  | 'Manual Wheelchair' 
  | 'Assisted Walk' 
  | 'None' 
  | 'None / Escort';

export type AssignedSpace =
  | 'Row 1: Front Passenger Seat'
  | 'Row 2: Passenger Seat 1'
  | 'Row 2: Passenger Seat 2'
  | 'Row 2: Passenger Seat 3'
  | 'Row 2: Passenger Seat 4'
  | 'Row 3: Wheelchair Bay 1'
  | 'Row 3: Wheelchair Bay 2';

export type TransitStatus =
  | 'pending'
  | 'approved'
  | 'en_route_pickup'
  | 'picked_up'
  | 'en_route_hospital'
  | 'dropped_off'
  | 'en_route_next'
  | 'declined';

export interface VehicleSpec {
  plate: string;
  brand: string;
  model: string;
  color: string;
  configuration: string;
}

export interface Profile {
  id: string;
  full_name: string;
  ic_or_oku_number: string;
  phone: string;
  email: string;
  role: UserRole;
  mobility_type: MobilityType;
  address?: string;
  bank_name?: string;
  bank_account_number?: string;
}

export interface TransitBooking {
  id: string;
  passenger_id: string;
  passenger_name: string;
  oku_id: string;
  phone: string;
  pickup_address: string;
  hospital_name: string;
  clinic_department: string;
  appointment_time: string; // e.g. "09:30 AM" or ISO timestamp
  mobility_type: MobilityType;
  assigned_space: AssignedSpace | string;
  assigned_driver: string;
  assigned_vehicle: VehicleSpec;
  status: TransitStatus;
  date?: string; // e.g. "2026-11-10" or "Tuesday, 10 Nov 2026"
  destination_coordinates?: { lat: number; lon: number };
  destination_verified?: boolean;
  rating?: number; // 1 to 5 stars
  feedback?: string;
  rated_at?: string;
  donation?: {
    amount: number;
    method: 'cash' | 'qr';
    status: 'paid' | 'pledged';
    timestamp: string;
  };
  timestamps: {
    requested: string;
    approved?: string;
    en_route_pickup?: string;
    picked_up?: string;
    en_route_hospital?: string;
    dropped_off?: string;
    en_route_next?: string;
    declined?: string;
    [key: string]: string | undefined;
  };
}

export interface CardProduct {
  id: string;
  name: string;
  resort_client: string;
  piece_rate: number;
}

export interface CardWorkLog {
  id: string;
  worker_id: string;
  worker_name?: string;
  card_id: string;
  card_name?: string;
  units_completed: number;
  piece_rate_snapshot: number;
  total_earned: number;
  logged_date: string; // YYYY-MM-DD
}

export interface ArtisanSummary {
  profile: Profile;
  todayEarned: number;
  todayUnits: number;
  weekEarned: number;
  weekUnits: number;
  monthEarned: number;
  monthUnits: number;
  yearEarned: number;
  yearUnits: number;
  logs: CardWorkLog[];
}

