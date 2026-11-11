-- ==============================================================================
-- Beautiful Gate Foundation Platform - Complete Supabase Database Schema
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. PROFILES TABLE (Beneficiaries, Drivers, Supervisors)
create table if not exists public.profiles (
  id text primary key,
  full_name text not null,
  ic_or_oku_number text not null,
  phone text not null,
  email text not null unique,
  role text not null check (role in ('customer', 'driver', 'admin')),
  mobility_type text not null default 'None',
  address text,
  bank_name text,
  bank_account_number text,
  avatar_url text,
  emergency_contact text,
  emergency_phone text,
  driver_license text,
  assigned_vehicle_plate text,
  driver_status text default 'active' check (driver_status in ('active', 'on_leave', 'standby')),
  is_approved boolean default true,
  notes text,
  chinese_name text,
  epf_number text,
  beneficiary_type text default 'resident' check (beneficiary_type in ('resident', 'daycare', 'non_resident')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Idempotent migrations for existing profiles table
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

-- 2. TRANSIT BOOKINGS TABLE (Assisted Transport System)
create table if not exists public.transit_bookings (
  id text primary key,
  passenger_name text not null,
  oku_id text not null,
  phone text not null,
  mobility_type text not null,
  pickup_address text not null,
  hospital_name text not null,
  clinic_department text default 'General Outpatient / Clinic',
  date text not null,
  appointment_time text not null,
  status text not null check (status in ('pending', 'approved', 'declined', 'in_progress', 'completed')),
  assigned_space text not null,
  assigned_driver text,
  vehicle_plate text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_color text,
  driver_avatar text,
  rating integer,
  rating_feedback text,
  donation_amount numeric,
  donation_method text check (donation_method in ('cash', 'qr')),
  donation_status text check (donation_status in ('pending_verification', 'verified')),
  donation_recorded_at text,
  destination_lat numeric,
  destination_lon numeric,
  destination_verified boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Idempotent migrations for existing transit_bookings table
alter table public.transit_bookings add column if not exists is_approved boolean default true;
alter table public.transit_bookings add column if not exists destination_lat numeric;
alter table public.transit_bookings add column if not exists destination_lon numeric;
alter table public.transit_bookings add column if not exists destination_verified boolean default false;
alter table public.transit_bookings add column if not exists rating integer;
alter table public.transit_bookings add column if not exists rating_feedback text;
alter table public.transit_bookings add column if not exists donation_amount numeric;
alter table public.transit_bookings add column if not exists donation_method text;
alter table public.transit_bookings add column if not exists donation_status text;
alter table public.transit_bookings add column if not exists donation_recorded_at text;

-- 3. CARD PRODUCTS TABLE (Artisan Craft Workshop)
create table if not exists public.card_products (
  id text primary key,
  name text not null,
  resort_client text not null,
  piece_rate numeric not null default 0.00,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. CARD WORK LOGS TABLE (Worker Production & Payroll)
create table if not exists public.card_work_logs (
  id text primary key,
  worker_id text not null,
  card_id text not null,
  date text not null,
  units_completed integer not null default 0,
  total_payout numeric not null default 0.00,
  status text not null check (status in ('logged', 'verified', 'paid')),
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. VEHICLES TABLE (Fleet Profile & Specifications)
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

-- 6. DRIVER LEAVES TABLE (Driver Leave Request & Admin Approval)
create table if not exists public.driver_leaves (
  id text primary key,
  driver_id text not null,
  driver_name text not null,
  date text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.transit_bookings enable row level security;
alter table public.card_products enable row level security;
alter table public.card_work_logs enable row level security;
alter table public.vehicles enable row level security;
alter table public.driver_leaves enable row level security;

-- Profiles RLS
drop policy if exists "Allow public select on profiles" on public.profiles;
drop policy if exists "Allow public insert on profiles" on public.profiles;
drop policy if exists "Allow public update on profiles" on public.profiles;
drop policy if exists "Allow public delete on profiles" on public.profiles;
create policy "Allow public select on profiles" on public.profiles for select using (true);
create policy "Allow public insert on profiles" on public.profiles for insert with check (true);
create policy "Allow public update on profiles" on public.profiles for update using (true);
create policy "Allow public delete on profiles" on public.profiles for delete using (true);

-- Transit Bookings RLS
drop policy if exists "Allow public select on transit_bookings" on public.transit_bookings;
drop policy if exists "Allow public insert on transit_bookings" on public.transit_bookings;
drop policy if exists "Allow public update on transit_bookings" on public.transit_bookings;
drop policy if exists "Allow public delete on transit_bookings" on public.transit_bookings;
create policy "Allow public select on transit_bookings" on public.transit_bookings for select using (true);
create policy "Allow public insert on transit_bookings" on public.transit_bookings for insert with check (true);
create policy "Allow public update on transit_bookings" on public.transit_bookings for update using (true);
create policy "Allow public delete on transit_bookings" on public.transit_bookings for delete using (true);

-- Card Products RLS
drop policy if exists "Allow public select on card_products" on public.card_products;
drop policy if exists "Allow public insert on card_products" on public.card_products;
drop policy if exists "Allow public update on card_products" on public.card_products;
drop policy if exists "Allow public delete on card_products" on public.card_products;
create policy "Allow public select on card_products" on public.card_products for select using (true);
create policy "Allow public insert on card_products" on public.card_products for insert with check (true);
create policy "Allow public update on card_products" on public.card_products for update using (true);
create policy "Allow public delete on card_products" on public.card_products for delete using (true);

-- Card Work Logs RLS
drop policy if exists "Allow public select on card_work_logs" on public.card_work_logs;
drop policy if exists "Allow public insert on card_work_logs" on public.card_work_logs;
drop policy if exists "Allow public update on card_work_logs" on public.card_work_logs;
drop policy if exists "Allow public delete on card_work_logs" on public.card_work_logs;
create policy "Allow public select on card_work_logs" on public.card_work_logs for select using (true);
create policy "Allow public insert on card_work_logs" on public.card_work_logs for insert with check (true);
create policy "Allow public update on card_work_logs" on public.card_work_logs for update using (true);
create policy "Allow public delete on card_work_logs" on public.card_work_logs for delete using (true);

-- Vehicles RLS
drop policy if exists "Allow public select on vehicles" on public.vehicles;
drop policy if exists "Allow public insert on vehicles" on public.vehicles;
drop policy if exists "Allow public update on vehicles" on public.vehicles;
drop policy if exists "Allow public delete on vehicles" on public.vehicles;
create policy "Allow public select on vehicles" on public.vehicles for select using (true);
create policy "Allow public insert on vehicles" on public.vehicles for insert with check (true);
create policy "Allow public update on vehicles" on public.vehicles for update using (true);
create policy "Allow public delete on vehicles" on public.vehicles for delete using (true);

-- Driver Leaves RLS
drop policy if exists "Allow public select on driver_leaves" on public.driver_leaves;
drop policy if exists "Allow public insert on driver_leaves" on public.driver_leaves;
drop policy if exists "Allow public update on driver_leaves" on public.driver_leaves;
drop policy if exists "Allow public delete on driver_leaves" on public.driver_leaves;
create policy "Allow public select on driver_leaves" on public.driver_leaves for select using (true);
create policy "Allow public insert on driver_leaves" on public.driver_leaves for insert with check (true);
create policy "Allow public update on driver_leaves" on public.driver_leaves for update using (true);
create policy "Allow public delete on driver_leaves" on public.driver_leaves for delete using (true);

-- ==============================================================================
-- REALTIME REPLICATION (For live dispatch & notifications across devices)
-- ==============================================================================
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.profiles, 
    public.transit_bookings, 
    public.card_products, 
    public.card_work_logs,
    public.vehicles,
    public.driver_leaves;
commit;
