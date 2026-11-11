import { Profile, TransitBooking, CardProduct, CardWorkLog, VehicleSpec } from '@/types';

export const DEFAULT_VEHICLE: VehicleSpec = {
  plate: 'WVV 4108',
  brand: 'Toyota',
  model: 'HiAce High-Roof Commuter',
  color: 'Pearl White',
  configuration: 'Row 1: Driver + 1 Pax | Row 2: 4 Pax | Row 3: 2 Wheelchairs',
};

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-cust-1',
    full_name: 'Siti Nurhaliza binti Mansor',
    ic_or_oku_number: 'DE0502198901',
    phone: '+60 12-491 8832',
    email: 'siti.mansor@example.com',
    role: 'customer',
    mobility_type: 'Motorized Wheelchair',
    address: 'No. 18, Jalan SS 2/19, 47300 Petaling Jaya, Selangor',
    bank_name: 'Maybank',
    bank_account_number: '1140 1234 5678',
  },
  {
    id: 'user-cust-2',
    full_name: 'Tan Ah Seng',
    ic_or_oku_number: 'DE1204197502',
    phone: '+60 16-728 1190',
    email: 'ahseng.tan@example.com',
    role: 'customer',
    mobility_type: 'Manual Wheelchair',
    address: 'Block C-04-12, PPR Taman Medan, 46000 Petaling Jaya, Selangor',
    bank_name: 'CIMB Bank',
    bank_account_number: '7021 9876 5432',
  },
  {
    id: 'user-cust-3',
    full_name: 'Muthusamy a/l Raman',
    ic_or_oku_number: 'DE0308198203',
    phone: '+60 17-644 2099',
    email: 'muthu.raman@example.com',
    role: 'customer',
    mobility_type: 'Assisted Walk',
    address: 'No. 45, Lorong Maarof, Bangsar, 59000 Kuala Lumpur',
    bank_name: 'Public Bank',
    bank_account_number: '4488 2391 0021',
  },
  {
    id: 'user-cust-4',
    full_name: 'Nur Aishah binti Razak',
    ic_or_oku_number: 'DE1109199304',
    phone: '+60 13-882 1435',
    email: 'aishah.razak@example.com',
    role: 'customer',
    mobility_type: 'Manual Wheelchair',
    address: '22, Jalan Bukit Segambut, 51200 Kuala Lumpur',
    bank_name: 'RHB Bank',
    bank_account_number: '2120 4455 6677',
  },
  {
    id: 'user-driver-1',
    full_name: 'Johan bin Ariffin',
    ic_or_oku_number: 'STF-DRV-01',
    phone: '+60 12-384 9201',
    email: 'johan.driver@beautifulgate.org.my',
    role: 'driver',
    mobility_type: 'None',
  },
  {
    id: 'user-admin-1',
    full_name: 'Faridah binti Hashim',
    ic_or_oku_number: 'ADM-SUP-01',
    phone: '+60 19-223 8810',
    email: 'faridah.hashim@beautifulgate.org.my',
    role: 'admin',
    mobility_type: 'None',
  },
];

export const INITIAL_PRODUCTS: CardProduct[] = [
  {
    id: 'card-prod-1',
    name: 'Botanical Welcome Card',
    resort_client: 'The Datai Langkawi',
    piece_rate: 1.50,
  },
  {
    id: 'card-prod-2',
    name: 'Heritage Batik Greeting Card',
    resort_client: 'Eastern & Oriental Penang',
    piece_rate: 1.80,
  },
  {
    id: 'card-prod-3',
    name: 'Rainforest Thank You Card',
    resort_client: 'The Banjaran Hotsprings Retreat',
    piece_rate: 2.00,
  },
  {
    id: 'card-prod-4',
    name: 'Coastal Orchid Gift Card',
    resort_client: 'One&Only Desaru Coast',
    piece_rate: 2.20,
  },
  {
    id: 'card-prod-5',
    name: 'Pangkor Hornbill Note Card',
    resort_client: 'Pangkor Laut Resort',
    piece_rate: 1.75,
  },
];

// Today's date reference helper
export const getTodayDateString = (): string => '2026-11-10';

// Live production collections - clean initial state
export const INITIAL_WORK_LOGS: CardWorkLog[] = [];

export const INITIAL_TRANSIT_BOOKINGS: TransitBooking[] = [];
