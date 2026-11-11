import { Profile, TransitBooking, CardProduct, CardWorkLog, VehicleSpec } from '@/types';

export const DEFAULT_VEHICLE: VehicleSpec = {
  plate: 'WVV 4108',
  brand: 'Toyota',
  model: 'HiAce High-Roof Commuter',
  color: 'Pearl White',
  configuration: 'Row 1: Driver + 1 Pax | Row 2: 4 Pax | Row 3: 2 Wheelchairs',
};

// Clean production state - zero mock data
export const INITIAL_PROFILES: Profile[] = [];

export const INITIAL_PRODUCTS: CardProduct[] = [];

// Today's date reference helper
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const INITIAL_WORK_LOGS: CardWorkLog[] = [];

export const INITIAL_TRANSIT_BOOKINGS: TransitBooking[] = [];
