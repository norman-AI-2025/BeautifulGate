-- ==============================================================================
-- Beautiful Gate Foundation - Official Accounts Seed Script
-- Includes:
--   1. Administrator: Tan Bee Chian (陳美珍)
--   2. Van Driver: Wong Kok Fu
-- Execute in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Ensure all required columns exist on the profiles table (idempotent migrations)
alter table public.profiles add column if not exists is_approved boolean default true;
alter table public.profiles add column if not exists driver_status text default 'active';
alter table public.profiles add column if not exists driver_license text;
alter table public.profiles add column if not exists assigned_vehicle_plate text;
alter table public.profiles add column if not exists notes text;
alter table public.profiles add column if not exists chinese_name text;
alter table public.profiles add column if not exists epf_number text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bank_name text;
alter table public.profiles add column if not exists bank_account_number text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists emergency_contact text;
alter table public.profiles add column if not exists emergency_phone text;
alter table public.profiles add column if not exists mobility_type text default 'None';

-- Ensure all required columns exist on transit_bookings
alter table public.transit_bookings add column if not exists is_approved boolean default true;
alter table public.transit_bookings add column if not exists destination_lat double precision;
alter table public.transit_bookings add column if not exists destination_lon double precision;
alter table public.transit_bookings add column if not exists destination_verified boolean default false;
alter table public.transit_bookings add column if not exists rating integer;
alter table public.transit_bookings add column if not exists feedback text;
alter table public.transit_bookings add column if not exists donation_amount numeric(10,2);
alter table public.transit_bookings add column if not exists donation_method text;
alter table public.transit_bookings add column if not exists donation_verified boolean default false;
alter table public.transit_bookings add column if not exists donation_verified_at timestamptz;

-- ==============================================================================
-- 2. ADMINISTRATOR ACCOUNT: Tan Bee Chian (陳美珍)
-- Role: Administrator with permissions across Van Transit, Workshop, & Directory
-- ==============================================================================
insert into public.profiles (
  id,
  full_name,
  chinese_name,
  ic_or_oku_number,
  phone,
  email,
  role,
  mobility_type,
  address,
  bank_name,
  bank_account_number,
  avatar_url,
  emergency_contact,
  emergency_phone,
  driver_license,
  assigned_vehicle_plate,
  driver_status,
  is_approved,
  epf_number,
  notes,
  created_at,
  updated_at
) values (
  'user-admin-tanbeechian',
  'Tan Bee Chian',
  '陳美珍',
  '730922-05-5206',
  '+60 12-252 3642',
  'tan.beechian@beautifulgate.org.my',
  'admin',
  'None',
  '370, Lrg S2 F7/1 Garden Homes, S''ban 2, 70300 S''ban, N. Sembilan',
  'Public Bank',
  '3198 0000 0000',
  '/images/staff-tanbeechian.jpg',
  'Spouse / Family Contact',
  '+60 12-252 3642',
  'Class D',
  null,
  'active',
  true,
  '12343664',
  'Chinese Name: 陳美珍 | DOB: 1973-09-22 | Place of Birth: Seremban, Negeri Sembilan | Nationality: Malaysian | Gender: Female | Marital Status: Married | Race: Chinese | Religion: Christian | Driving License: Class D | EPF No: 12343664 | Height: 162 cm | Weight: 70 kg | Position: Administrator | Date Available: 01-09-2021 | Expected Salary: RM 1,800.00 | Permissions: Van Transport Dispatch, Workshop Earnings & Payroll, Beneficiary Tracking Directory',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
) on conflict (id) do update set
  full_name = excluded.full_name,
  chinese_name = excluded.chinese_name,
  ic_or_oku_number = excluded.ic_or_oku_number,
  phone = excluded.phone,
  email = excluded.email,
  role = excluded.role,
  address = excluded.address,
  driver_license = excluded.driver_license,
  epf_number = excluded.epf_number,
  is_approved = excluded.is_approved,
  notes = excluded.notes,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 3. VAN DRIVER ACCOUNT: Wong Kok Fu
-- Role: Van Driver (Standby / Pending Administrator Onboarding)
-- ==============================================================================
insert into public.profiles (
  id,
  full_name,
  chinese_name,
  ic_or_oku_number,
  phone,
  email,
  role,
  mobility_type,
  address,
  bank_name,
  bank_account_number,
  avatar_url,
  emergency_contact,
  emergency_phone,
  driver_license,
  assigned_vehicle_plate,
  driver_status,
  is_approved,
  epf_number,
  notes,
  created_at,
  updated_at
) values (
  'user-driver-wongkokfu',
  'Wong Kok Fu',
  null,
  '670519-05-5319',
  '+60 16-975 9883',
  'wong.kokfu@beautifulgate.org.my',
  'driver',
  'None',
  '134, Taman Harapan Baru, 70300 Seremban, Negeri Sembilan',
  'Maybank',
  '1140 0000 0000',
  '/images/driver-johan.jpg',
  'Next of Kin (Pending Registration)',
  '+60 16-975 9883',
  'D / GDL Public Service License',
  'WVV 4108',
  'standby',
  false,
  null,
  'DOB: 1967-05-19 | Place of Birth: Seremban, Negeri Sembilan | Gender: Male | Nationality: Malaysian | Race: Chinese | Dialect: Cantonese | Religion: Buddhist | Marital Status: Single | Height: 168 cm | Weight: 85 kg | Position Applied: Van Driver | Available: 01-03-2020 | Expected Salary: RM 2,800.00 (Negotiable) | Status: Pending Administrator Onboarding Approval',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
) on conflict (id) do update set
  full_name = excluded.full_name,
  ic_or_oku_number = excluded.ic_or_oku_number,
  phone = excluded.phone,
  email = excluded.email,
  address = excluded.address,
  notes = excluded.notes,
  is_approved = excluded.is_approved,
  updated_at = timezone('utc'::text, now());
