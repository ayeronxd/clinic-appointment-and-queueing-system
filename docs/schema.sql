-- ==============================================================================
-- Clinic Appointment and Queueing System (CAQS)
-- Database Schema for Supabase PostgreSQL
-- Matches SRS Section 7.3 and Functional Requirements
-- ==============================================================================

-- Custom ENUM Types for Supabase Studio UI dropdowns
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('patient', 'staff', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. PROFILES TABLE (Stores user information linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  mobile_no TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'patient',
  address_psgc_code TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatic Profile Creation Trigger on auth.users (Supabase Best Practice)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, mobile_no, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'mobile_no', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'patient'::public.user_role),
    true
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      mobile_no = EXCLUDED.mobile_no;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Secure RPC function to set a user's role (callable by admins)
CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_email TEXT, new_role public.user_role)
RETURNS JSON AS $$
DECLARE
  v_caller_role TEXT;
  v_updated_user public.profiles%ROWTYPE;
BEGIN
  SELECT role::TEXT INTO v_caller_role FROM public.profiles WHERE user_id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: only clinic administrators can assign staff or admin roles.';
  END IF;

  UPDATE public.profiles
  SET role = new_role,
      is_active = true
  WHERE LOWER(TRIM(email)) = LOWER(TRIM(target_email))
  RETURNING * INTO v_updated_user;

  IF v_updated_user.user_id IS NULL THEN
    RAISE EXCEPTION 'User profile with email % not found.', target_email;
  END IF;

  RETURN json_build_object('success', true, 'user_id', v_updated_user.user_id, 'role', v_updated_user.role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check email existence and confirmation status safely
CREATE OR REPLACE FUNCTION public.check_email_status(lookup_email TEXT)
RETURNS JSON AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM auth.users WHERE LOWER(email) = LOWER(TRIM(lookup_email)) LIMIT 1;
  IF v_user.id IS NULL THEN
    RETURN json_build_object('exists', false);
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_user.id LIMIT 1;

  RETURN json_build_object(
    'exists', true,
    'confirmed', (v_user.email_confirmed_at IS NOT NULL),
    'is_active', COALESCE(v_profile.is_active, true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS public.doctors (
  doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(doctor_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. APPOINTMENT NUMBER SEQUENCE
CREATE SEQUENCE IF NOT EXISTS appointment_no_seq START WITH 1;

-- Function to generate appointment_no format: CA-YYYY-00001
CREATE OR REPLACE FUNCTION generate_appointment_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appointment_no IS NULL THEN
    NEW.appointment_no := 'CA-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(NEXTVAL('appointment_no_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_no TEXT UNIQUE,
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(doctor_id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES public.schedules(schedule_id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Booked', 'Checked-in', 'Now Serving', 'Completed', 'Cancelled', 'No-show')),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_generate_appointment_no ON public.appointments;
CREATE TRIGGER trg_generate_appointment_no
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION generate_appointment_no();

-- CONCURRENCY PROTECTION 1: Prevent double-booking race condition (ACID Barrier)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_slot_booking
ON public.appointments (schedule_id)
WHERE schedule_id IS NOT NULL AND status IN ('Booked', 'Checked-in', 'Now Serving', 'Completed');

-- 6. QUEUE ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.queue_entries (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(appointment_id) ON DELETE SET NULL,
  queue_no INTEGER NOT NULL,
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('Waiting', 'Now Serving', 'Completed', 'No-show')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONCURRENCY PROTECTION 2: Prevent duplicate check-in tickets on the same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_today_queue_appointment
ON public.queue_entries (appointment_id, queue_date)
WHERE appointment_id IS NOT NULL;

-- 7. SMS LOGS TABLE
CREATE TABLE IF NOT EXISTS public.sms_logs (
  sms_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(appointment_id) ON DELETE SET NULL,
  mobile_no TEXT NOT NULL,
  message TEXT NOT NULL,
  provider_status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES (NFR-05)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Profiles policies
DROP POLICY IF EXISTS "Users can read own profile or staff/admin read all" ON public.profiles;
CREATE POLICY "Users can read own profile or staff/admin read all"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR current_user_role() = 'admin');

DROP POLICY IF EXISTS "Anyone can insert profile" ON public.profiles;
CREATE POLICY "Anyone can insert profile"
ON public.profiles FOR INSERT
WITH CHECK (true);

-- Doctors policies
DROP POLICY IF EXISTS "Anyone can view active doctors" ON public.doctors;
CREATE POLICY "Anyone can view active doctors"
ON public.doctors FOR SELECT
USING (is_active = true OR current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Admin can modify doctors" ON public.doctors;
CREATE POLICY "Admin can modify doctors"
ON public.doctors FOR ALL
USING (current_user_role() = 'admin');

-- Schedules policies
DROP POLICY IF EXISTS "Anyone can view schedules" ON public.schedules;
CREATE POLICY "Anyone can view schedules"
ON public.schedules FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admin can modify schedules" ON public.schedules;
CREATE POLICY "Admin can modify schedules"
ON public.schedules FOR ALL
USING (current_user_role() = 'admin');

-- Appointments policies
DROP POLICY IF EXISTS "Patients view own appointments; staff/admin view all" ON public.appointments;
CREATE POLICY "Patients view own appointments; staff/admin view all"
ON public.appointments FOR SELECT
USING (patient_id = auth.uid() OR current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Patients can insert appointments" ON public.appointments;
CREATE POLICY "Patients can insert appointments"
ON public.appointments FOR INSERT
WITH CHECK (patient_id = auth.uid() OR current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "Patients modify own booked; staff/admin update any" ON public.appointments;
CREATE POLICY "Patients modify own booked; staff/admin update any"
ON public.appointments FOR UPDATE
USING (patient_id = auth.uid() OR current_user_role() IN ('staff', 'admin'));

-- Queue policies
DROP POLICY IF EXISTS "Anyone can view queue entries" ON public.queue_entries;
CREATE POLICY "Anyone can view queue entries"
ON public.queue_entries FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Staff and admin can manage queue" ON public.queue_entries;
CREATE POLICY "Staff and admin can manage queue"
ON public.queue_entries FOR ALL
USING (current_user_role() IN ('staff', 'admin'));

-- SMS Logs policies
DROP POLICY IF EXISTS "Staff and admin can view SMS logs" ON public.sms_logs;
CREATE POLICY "Staff and admin can view SMS logs"
ON public.sms_logs FOR SELECT
USING (current_user_role() IN ('staff', 'admin'));

DROP POLICY IF EXISTS "System and users can insert SMS logs" ON public.sms_logs;
CREATE POLICY "System and users can insert SMS logs"
ON public.sms_logs FOR INSERT
WITH CHECK (true);

-- ==============================================================================
-- ENABLE SUPABASE REALTIME
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;

-- ==============================================================================
-- 7. CLINIC SETTINGS TABLE (Operating Hours / Manual Staff Overrides)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read clinic settings" ON public.clinic_settings;
CREATE POLICY "Anyone can read clinic settings" ON public.clinic_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin can modify clinic settings" ON public.clinic_settings;
CREATE POLICY "Staff and admin can modify clinic settings" ON public.clinic_settings FOR ALL USING (current_user_role() IN ('staff', 'admin'));
