-- Beautiful Gate Foundation for the Disabled
-- Assisted Mobility & Artisan Workshop Platform Database Schema
-- Compatible with Supabase PostgreSQL & Row Level Security (RLS)

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin');
CREATE TYPE mobility_type_enum AS ENUM (
  'Motorized Wheelchair',
  'Manual Wheelchair',
  'Assisted Walk',
  'None',
  'None / Escort'
);
CREATE TYPE assigned_space_enum AS ENUM (
  'Row 1: Front Passenger Seat',
  'Row 2: Passenger Seat 1',
  'Row 2: Passenger Seat 2',
  'Row 2: Passenger Seat 3',
  'Row 2: Passenger Seat 4',
  'Row 3: Wheelchair Bay 1',
  'Row 3: Wheelchair Bay 2'
);
CREATE TYPE transit_status_enum AS ENUM (
  'pending',
  'approved',
  'en_route_pickup',
  'picked_up',
  'en_route_hospital',
  'dropped_off',
  'en_route_next',
  'declined'
);

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  ic_or_oku_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  mobility_type mobility_type_enum NOT NULL DEFAULT 'Manual Wheelchair',
  bank_name TEXT,
  bank_account_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TRANSIT BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.transit_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  oku_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  clinic_department TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  mobility_type mobility_type_enum NOT NULL,
  assigned_space assigned_space_enum NOT NULL,
  assigned_driver TEXT NOT NULL DEFAULT 'Johan bin Ariffin',
  assigned_vehicle JSONB NOT NULL DEFAULT '{
    "plate": "WVV 4108",
    "brand": "Toyota",
    "model": "HiAce High-Roof Commuter",
    "color": "Pearl White",
    "configuration": "Row 1: Driver + 1 Pax | Row 2: 4 Pax | Row 3: 2 Wheelchairs"
  }'::jsonb,
  status transit_status_enum NOT NULL DEFAULT 'pending',
  timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. DIY CARD PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.card_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  resort_client TEXT NOT NULL,
  piece_rate NUMERIC(10, 2) NOT NULL CHECK (piece_rate > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. DAILY WORK LOGS TABLE
CREATE TABLE IF NOT EXISTS public.card_work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.card_products(id) ON DELETE RESTRICT,
  units_completed INTEGER NOT NULL CHECK (units_completed >= 0),
  piece_rate_snapshot NUMERIC(10, 2) NOT NULL CHECK (piece_rate_snapshot >= 0),
  total_earned NUMERIC(10, 2) GENERATED ALWAYS AS (units_completed * piece_rate_snapshot) STORED,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_work_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile; admins can view and edit all
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Transit Bookings: Customers can view/create own bookings; drivers & admins can view all
CREATE POLICY "Customers can view and insert own transit bookings"
ON public.transit_bookings FOR ALL
USING (
  passenger_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('driver', 'admin'))
);

-- Products: Everyone can read
CREATE POLICY "Public read card products"
ON public.card_products FOR SELECT
USING (true);

-- Work logs: Artisans can view and add own; admins can manage all
CREATE POLICY "Artisans manage own work logs"
ON public.card_work_logs FOR ALL
USING (
  worker_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. INITIAL SEED DATA FOR DEMO PURPOSES
INSERT INTO public.card_products (id, name, resort_client, piece_rate) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Botanical Welcome Card', 'The Datai Langkawi', 1.50),
  ('c2222222-2222-2222-2222-222222222222', 'Heritage Batik Greeting Card', 'Eastern & Oriental Penang', 1.80),
  ('c3333333-3333-3333-3333-333333333333', 'Rainforest Thank You Card', 'The Banjaran Hotsprings Retreat', 2.00),
  ('c4444444-4444-4444-4444-444444444444', 'Coastal Orchid Gift Card', 'One&Only Desaru Coast', 2.20),
  ('c5555555-5555-5555-5555-555555555555', 'Pangkor Hornbill Note Card', 'Pangkor Laut Resort', 1.75)
ON CONFLICT (id) DO NOTHING;

