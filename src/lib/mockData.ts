import { Profile, TransitBooking, CardProduct, CardWorkLog, VehicleSpec, Vehicle, DriverLeave } from '@/types';

// Zero mock data - 100% database-driven from Supabase
export const DEFAULT_VEHICLE: VehicleSpec = {
  plate: '',
  brand: '',
  model: '',
  color: '',
  configuration: '',
};

export const INITIAL_VEHICLES: Vehicle[] = [];
export const INITIAL_DRIVER_LEAVES: DriverLeave[] = [];
export const INITIAL_PROFILES: Profile[] = [];
export const INITIAL_PRODUCTS: CardProduct[] = [];
export const INITIAL_WORK_LOGS: CardWorkLog[] = [];
export const INITIAL_TRANSIT_BOOKINGS: TransitBooking[] = [];

// Today's date reference helper
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};
