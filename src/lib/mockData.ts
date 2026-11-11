import { Profile, TransitBooking, CardProduct, CardWorkLog, VehicleSpec, Vehicle, DriverLeave } from '@/types';

export const DEFAULT_VEHICLE: VehicleSpec = {
  plate: 'WVV 4108',
  brand: 'Toyota',
  model: 'HiAce High-Roof Commuter',
  color: 'Pearl White',
  configuration: 'Row 1: Driver + 1 Pax | Row 2: 4 Pax | Row 3: 2 Wheelchairs',
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-hiace-wvv4108',
    plate: 'WVV 4108',
    brand: 'Toyota',
    model: 'HiAce High-Roof Commuter',
    color: 'Pearl White',
    seats: '7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)',
    image_url: '/images/toyota-hiace-van.jpg',
    status: 'active',
    notes: 'Fitted with rear hydraulic boarding lift and floor clamps',
  }
];

export const INITIAL_DRIVER_LEAVES: DriverLeave[] = [];

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
