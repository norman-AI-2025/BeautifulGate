import { Profile, TransitBooking, CardProduct, CardWorkLog, VehicleSpec, Vehicle, DriverLeave } from '@/types';

export const DEFAULT_VEHICLE: VehicleSpec = {
  plate: 'NDC 9751',
  brand: 'Toyota',
  model: 'HiAce High-Roof Commuter',
  color: 'Pearl White',
  configuration: 'Row 1: Driver + 1 Pax | Row 2: 4 Pax | Row 3: 2 Wheelchairs',
};

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-hiace-ndc9751',
    plate: 'NDC 9751',
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

export const INITIAL_PRODUCTS: CardProduct[] = [
  {
    id: 'prod-pangkor-hornbill',
    name: 'Pangkor Hornbill Note Card',
    resort_client: 'Pangkor Laut Resort',
    piece_rate: 1.75,
  },
  {
    id: 'prod-datai-botanical',
    name: 'Botanical Welcome Card',
    resort_client: 'The Datai Langkawi',
    piece_rate: 1.50,
  },
  {
    id: 'prod-eo-batik',
    name: 'Heritage Batik Greeting Card',
    resort_client: 'Eastern & Oriental Penang',
    piece_rate: 1.80,
  },
  {
    id: 'prod-banjaran-rainforest',
    name: 'Rainforest Thank You Card',
    resort_client: 'The Banjaran Hotsprings',
    piece_rate: 2.00,
  },
  {
    id: 'prod-oneonly-orchid',
    name: 'Coastal Orchid Gift Card',
    resort_client: 'One&Only Desaru Coast',
    piece_rate: 2.20,
  },
];

// Today's date reference helper
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const INITIAL_WORK_LOGS: CardWorkLog[] = [];

export const INITIAL_TRANSIT_BOOKINGS: TransitBooking[] = [];
