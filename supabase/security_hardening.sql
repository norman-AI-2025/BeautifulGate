-- ==============================================================================
-- Beautiful Gate Seremban - Database Security Hardening Migration
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. REVOKE DESTRUCTIVE PERMISSIONS FROM ANONYMOUS CLIENTS
-- Prevent anonymous users from wiping out tables via Supabase JS client
REVOKE DELETE ON public.profiles FROM anon;
REVOKE DELETE ON public.transit_bookings FROM anon;
REVOKE DELETE ON public.card_products FROM anon;
REVOKE DELETE ON public.card_work_logs FROM anon;
REVOKE DELETE ON public.vehicles FROM anon;
REVOKE DELETE ON public.driver_leaves FROM anon;

-- Ensure RLS is active on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transit_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_leaves ENABLE ROW LEVEL SECURITY;

-- 2. CLEAN UP OLD INSECURE POLICIES
DROP POLICY IF EXISTS "Allow public delete on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public delete on transit_bookings" ON public.transit_bookings;
DROP POLICY IF EXISTS "Allow public delete on card_products" ON public.card_products;
DROP POLICY IF EXISTS "Allow public delete on card_work_logs" ON public.card_work_logs;
DROP POLICY IF EXISTS "Allow public delete on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public delete on driver_leaves" ON public.driver_leaves;

DROP POLICY IF EXISTS "Allow public update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;

-- 3. HARDENED PROFILES POLICIES
-- Anyone can view profile directories (names, driver statuses, avatars)
CREATE POLICY "Public profiles read access" ON public.profiles
  FOR SELECT
  USING (true);

-- Anonymous signups can only create customer or driver accounts (NEVER admin accounts directly)
CREATE POLICY "Secure profile registration" ON public.profiles
  FOR INSERT
  WITH CHECK (role IN ('customer', 'driver'));

-- Users can update profiles, but anon cannot escalate privileges to admin
CREATE POLICY "Secure profile updates" ON public.profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Prevent an existing non-admin from escalating their role to admin
    role IN ('customer', 'driver') OR (SELECT p.role FROM public.profiles p WHERE p.id = profiles.id) = 'admin'
  );

-- Only authenticated staff/service role can delete profiles
CREATE POLICY "Admins only profile deletion" ON public.profiles
  FOR DELETE
  USING (false);

-- 4. HARDENED TRANSIT BOOKINGS POLICIES
DROP POLICY IF EXISTS "Allow public update on transit_bookings" ON public.transit_bookings;
DROP POLICY IF EXISTS "Allow public insert on transit_bookings" ON public.transit_bookings;
DROP POLICY IF EXISTS "Allow public select on transit_bookings" ON public.transit_bookings;

CREATE POLICY "Public transit bookings select" ON public.transit_bookings
  FOR SELECT
  USING (true);

CREATE POLICY "Public transit bookings insert" ON public.transit_bookings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public transit bookings update" ON public.transit_bookings
  FOR UPDATE
  USING (true);

-- Bookings cannot be permanently deleted by anon (must be archived or marked declined)
CREATE POLICY "Prevent anon booking deletion" ON public.transit_bookings
  FOR DELETE
  USING (false);

-- 5. HARDENED VEHICLES & DRIVER LEAVES POLICIES
DROP POLICY IF EXISTS "Allow public select on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public insert on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public update on vehicles" ON public.vehicles;

CREATE POLICY "Public vehicles select" ON public.vehicles
  FOR SELECT
  USING (true);

CREATE POLICY "Public vehicles update" ON public.vehicles
  FOR UPDATE
  USING (true);

CREATE POLICY "Public vehicles insert" ON public.vehicles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Prevent anon vehicle deletion" ON public.vehicles
  FOR DELETE
  USING (false);

-- Driver Leaves
DROP POLICY IF EXISTS "Allow public select on driver_leaves" ON public.driver_leaves;
DROP POLICY IF EXISTS "Allow public insert on driver_leaves" ON public.driver_leaves;
DROP POLICY IF EXISTS "Allow public update on driver_leaves" ON public.driver_leaves;

CREATE POLICY "Public driver leaves select" ON public.driver_leaves
  FOR SELECT
  USING (true);

CREATE POLICY "Public driver leaves insert" ON public.driver_leaves
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public driver leaves update" ON public.driver_leaves
  FOR UPDATE
  USING (true);

CREATE POLICY "Prevent anon driver leaves deletion" ON public.driver_leaves
  FOR DELETE
  USING (false);

-- 6. MASKED PROFILES VIEW (FOR HIGH-SECURITY PUBLIC DIRECTORIES)
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT
  id,
  full_name,
  chinese_name,
  CASE
    WHEN length(ic_or_oku_number) >= 12 THEN concat(left(ic_or_oku_number, 6), '-**-****')
    ELSE concat(left(ic_or_oku_number, 2), '******')
  END AS ic_or_oku_masked,
  phone,
  email,
  role,
  mobility_type,
  beneficiary_type,
  driver_status,
  is_approved,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

COMMENT ON VIEW public.safe_profiles IS 'Public safe view of profiles masking sensitive NRIC/OKU identifiers and removing bank details and password hashes.';
