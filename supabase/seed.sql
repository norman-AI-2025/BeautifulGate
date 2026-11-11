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
alter table public.profiles add column if not exists beneficiary_type text default 'resident';

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
  null,
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


-- ==============================================================================
-- 4. OFFICIAL FLEET VEHICLE: Toyota HiAce Commuter (WVV 4108)
-- ==============================================================================
create table if not exists public.vehicles (
  id text primary key,
  plate text not null unique,
  brand text not null,
  model text not null,
  color text not null,
  seats text not null,
  image_url text,
  status text not null default 'active' check (status in ('active', 'maintenance', 'standby')),
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

insert into public.vehicles (
  id,
  plate,
  brand,
  model,
  color,
  seats,
  image_url,
  status,
  notes,
  created_at,
  updated_at
) values (
  'veh-hiace-wvv4108',
  'WVV 4108',
  'Toyota',
  'HiAce High-Roof Commuter',
  'Pearl White',
  '7 Passengers (Row 1: Driver + 1 Pax | Row 2: 4 Regular Seats | Row 3: 2 Wheelchair Bays)',
  '/images/toyota-hiace-van.jpg',
  'active',
  'Fitted with rear hydraulic boarding lift and floor clamps',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
) on conflict (id) do update set
  plate = excluded.plate,
  brand = excluded.brand,
  model = excluded.model,
  color = excluded.color,
  seats = excluded.seats,
  image_url = excluded.image_url,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = timezone('utc'::text, now());

-- ==============================================================================
-- 5. DRIVER LEAVES TABLE (Leave Requests & Approvals)
-- ==============================================================================
create table if not exists public.driver_leaves (
  id text primary key,
  driver_id text not null,
  driver_name text not null,
  date text not null,
  leave_date text,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.driver_leaves add column if not exists date text;
alter table public.driver_leaves add column if not exists leave_date text;
alter table public.driver_leaves add column if not exists approved_by text;
alter table public.driver_leaves add column if not exists reason text;
alter table public.driver_leaves add column if not exists status text default 'pending';

-- RLS Policies
alter table public.vehicles enable row level security;
alter table public.driver_leaves enable row level security;

drop policy if exists "Allow public select on vehicles" on public.vehicles;
drop policy if exists "Allow public insert on vehicles" on public.vehicles;
drop policy if exists "Allow public update on vehicles" on public.vehicles;
drop policy if exists "Allow public delete on vehicles" on public.vehicles;
create policy "Allow public select on vehicles" on public.vehicles for select using (true);
create policy "Allow public insert on vehicles" on public.vehicles for insert with check (true);
create policy "Allow public update on vehicles" on public.vehicles for update using (true);
create policy "Allow public delete on vehicles" on public.vehicles for delete using (true);

drop policy if exists "Allow public select on driver_leaves" on public.driver_leaves;
drop policy if exists "Allow public insert on driver_leaves" on public.driver_leaves;
drop policy if exists "Allow public update on driver_leaves" on public.driver_leaves;
drop policy if exists "Allow public delete on driver_leaves" on public.driver_leaves;
create policy "Allow public select on driver_leaves" on public.driver_leaves for select using (true);
create policy "Allow public insert on driver_leaves" on public.driver_leaves for insert with check (true);
create policy "Allow public update on driver_leaves" on public.driver_leaves for update using (true);
create policy "Allow public delete on driver_leaves" on public.driver_leaves for delete using (true);

-- Realtime setup
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'vehicles'
  ) then
    alter publication supabase_realtime add table public.vehicles;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'driver_leaves'
  ) then
    alter publication supabase_realtime add table public.driver_leaves;
  end if;
exception when others then
  null;
end $$;
