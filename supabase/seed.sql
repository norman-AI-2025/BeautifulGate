-- ==============================================================================
-- Beautiful Gate Foundation - Driver Account Seed: Wong Kok Fu
-- Execute in Supabase SQL Editor to insert the new driver record
-- ==============================================================================

insert into public.profiles (
  id,
  full_name,
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
  notes,
  created_at,
  updated_at
) values (
  'user-driver-wongkokfu',
  'Wong Kok Fu',
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
  updated_at = timezone('utc'::text, now());
