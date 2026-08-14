-- ============================================================================
-- Car Plus — pending migrations, combined
-- Paste this whole file into Supabase -> SQL Editor -> Run.
-- Safe to re-run: every statement uses IF NOT EXISTS / DROP-then-CREATE.
-- ============================================================================

-- ----- 20260810100000_create_brands_table.sql -----
-- Brands table (Popular brands on home page)
-- Safe to re-run. Until this is applied, the app stores brands via team_members fallback.

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can view all brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can update brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;

CREATE POLICY "Anyone can view active brands" ON public.brands FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all brands" ON public.brands FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE USING (public.is_admin(auth.uid()));

CREATE OR REPLACE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_brands_sort ON public.brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_brands_active ON public.brands(is_active);

NOTIFY pgrst, 'reload schema';

-- ----- 20260811010000_team_members_phone.sql -----
-- Phone + Telegram for team members (Admin → Team).
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS telegram TEXT NOT NULL DEFAULT '';

-- ----- 20260811020000_orders_customer_and_car_name.sql -----
-- Fix place-order failures + enable realtime for orders.
-- App inserts customer_name / car_name; older DBs may not have those columns.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS car_name TEXT;

-- Allow admin walk-in orders (user_id may be null). Safe no-op if already nullable.
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

-- Ensure customers can insert line items for their own orders
DROP POLICY IF EXISTS "Users create their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;
CREATE POLICY "Users create their order items" ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- Allow customers to remove a just-created order if item insert fails (rollback)
DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
CREATE POLICY "Users can delete their own orders" ON public.orders FOR DELETE
  USING (auth.uid() = user_id);

-- Allow customers to edit their own pending orders (phone / contact details)
DROP POLICY IF EXISTS "Users can update their own pending orders" ON public.orders;
CREATE POLICY "Users can update their own pending orders" ON public.orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Realtime: admin dashboard + customer "My orders" update live
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ----- 20260811030000_orders_customer_edit_delete.sql -----
-- Allow customers to edit / delete their own pending orders on My orders page.

DROP POLICY IF EXISTS "Users can update their own pending orders" ON public.orders;
CREATE POLICY "Users can update their own pending orders" ON public.orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
CREATE POLICY "Users can delete their own orders" ON public.orders FOR DELETE
  USING (auth.uid() = user_id);

-- ----- 20260811040000_profiles_avatar_and_contact.sql -----
-- Profile extras: photo + contact prefs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_time TEXT;

-- Realtime so Profile page updates live after save / other tabs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- ----- 20260811050000_profiles_update_policy.sql -----
-- Ensure users can update their own profile name and other fields
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----- 20260811060000_profiles_complete_save.sql -----
-- Complete profile columns + RLS so name & phone save correctly
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_time TEXT;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- ----- 20260811120000_create_receipts_table.sql -----
-- Invoice / receipt table for Car Plus (matches invoice UI)
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  car_name TEXT,
  car_code TEXT,
  year TEXT,
  make TEXT,
  model TEXT,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 1,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  bank_name TEXT,
  account_no TEXT,
  notes TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade existing installs
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS account_no TEXT;

CREATE INDEX IF NOT EXISTS receipts_issued_at_idx ON public.receipts (issued_at DESC);
CREATE INDEX IF NOT EXISTS receipts_order_id_idx ON public.receipts (order_id);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage receipts" ON public.receipts;
CREATE POLICY "Admins manage receipts"
  ON public.receipts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
