-- Beautiful Gate Foundation Platform - Complete Supabase Database Schema
-- Includes RLS policies, multi-language support, profiles with avatars, transit bookings, and realtime subscriptions

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
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

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

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.transit_bookings enable row level security;
alter table public.card_products enable row level security;
alter table public.card_work_logs enable row level security;

-- Policies for Profiles
drop policy if exists "Allow public select on profiles" on public.profiles;
drop policy if exists "Allow public insert on profiles" on public.profiles;
drop policy if exists "Allow public update on profiles" on public.profiles;
drop policy if exists "Allow public delete on profiles" on public.profiles;

create policy "Allow public select on profiles" on public.profiles for select using (true);
create policy "Allow public insert on profiles" on public.profiles for insert with check (true);
create policy "Allow public update on profiles" on public.profiles for update using (true);
create policy "Allow public delete on profiles" on public.profiles for delete using (true);

-- Policies for Transit Bookings
drop policy if exists "Allow public select on transit_bookings" on public.transit_bookings;
drop policy if exists "Allow public insert on transit_bookings" on public.transit_bookings;
drop policy if exists "Allow public update on transit_bookings" on public.transit_bookings;
drop policy if exists "Allow public delete on transit_bookings" on public.transit_bookings;

create policy "Allow public select on transit_bookings" on public.transit_bookings for select using (true);
create policy "Allow public insert on transit_bookings" on public.transit_bookings for insert with check (true);
create policy "Allow public update on transit_bookings" on public.transit_bookings for update using (true);
create policy "Allow public delete on transit_bookings" on public.transit_bookings for delete using (true);

-- Policies for Card Products
drop policy if exists "Allow public select on card_products" on public.card_products;
drop policy if exists "Allow public insert on card_products" on public.card_products;
drop policy if exists "Allow public update on card_products" on public.card_products;
drop policy if exists "Allow public delete on card_products" on public.card_products;

create policy "Allow public select on card_products" on public.card_products for select using (true);
create policy "Allow public insert on card_products" on public.card_products for insert with check (true);
create policy "Allow public update on card_products" on public.card_products for update using (true);
create policy "Allow public delete on card_products" on public.card_products for delete using (true);

-- Policies for Card Work Logs
drop policy if exists "Allow public select on card_work_logs" on public.card_work_logs;
drop policy if exists "Allow public insert on card_work_logs" on public.card_work_logs;
drop policy if exists "Allow public update on card_work_logs" on public.card_work_logs;
drop policy if exists "Allow public delete on card_work_logs" on public.card_work_logs;

create policy "Allow public select on card_work_logs" on public.card_work_logs for select using (true);
create policy "Allow public insert on card_work_logs" on public.card_work_logs for insert with check (true);
create policy "Allow public update on card_work_logs" on public.card_work_logs for update using (true);
create policy "Allow public delete on card_work_logs" on public.card_work_logs for delete using (true);

-- Enable Realtime
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.profiles, 
    public.transit_bookings, 
    public.card_products, 
    public.card_work_logs;
commit;
