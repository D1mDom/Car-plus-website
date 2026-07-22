-- ============================================================================
-- Car Plus — full database setup
--
-- Run this once against a NEW Supabase project:
--   Dashboard -> SQL Editor -> paste -> Run
--
-- Safe to re-run: every statement is idempotent. Note that CREATE TABLE IF NOT
-- EXISTS will NOT add new columns or constraints to a table that already
-- exists, so on an existing database the ALTER statements in section 6 are
-- what bring it up to date.
--
-- After running, see "BOOTSTRAP" at the end to grant yourself admin access.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Triggers below use CREATE OR REPLACE TRIGGER so this script is re-runnable.
-- (A plain "DROP TRIGGER IF EXISTS ... ON public.<table>" would error on a
-- fresh database, because IF EXISTS forgives a missing trigger but still
-- requires the table to already exist.)

-- ============================================================================
-- 1. Profiles & Orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- car_id is TEXT (not a UUID foreign key) on purpose: the app falls back to
-- the static catalogue in src/data/cars.ts, whose ids are plain strings
-- ("1", "2", ...). Making this a FK to public.cars would break that fallback.
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, car_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add to their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

CREATE POLICY "Users can view their own cart items" ON public.cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cart items" ON public.cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cart items" ON public.cart_items FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  shipping_address TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "Users can create order items for their orders" ON public.order_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. Wishlist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, car_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON public.wishlist;

CREATE POLICY "Users can view their own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own wishlist" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their own wishlist" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Cars and Admin
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL CHECK (status IN ('ready', 'onroad', 'luxury', 'plate')),
  viewers INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  body_type TEXT NOT NULL,
  tax_status TEXT NOT NULL,
  condition TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active cars" ON public.cars;
CREATE POLICY "Anyone can view active cars" ON public.cars FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin policies.
-- is_admin() is SECURITY DEFINER so it can read admin_users without tripping
-- that table's own RLS (which would otherwise recurse).
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id)
$$;

DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can update cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON public.cars;

CREATE POLICY "Admins can view admin list" ON public.admin_users FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all cars" ON public.cars FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert cars" ON public.cars FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update cars" ON public.cars FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete cars" ON public.cars FOR DELETE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.is_admin(auth.uid()));

-- Note: admin_users has no INSERT/UPDATE/DELETE policy on purpose. Admins are
-- granted only from the dashboard or by the service role, so nobody can
-- promote themselves through the public API. See BOOTSTRAP below.

-- ============================================================================
-- 4. Storage for car images
--
-- Without this bucket the admin form has nowhere to put uploads and falls back
-- to embedding base64 data URLs in cars.image, which bloats every row and
-- forces very small photos.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-images',
  'car-images',
  true,
  52428800, -- 50 MB, matches the client-side check in CarFormDialog.tsx.
            -- This is Supabase's default project-wide ceiling; going higher
            -- also requires raising it in Project Settings -> Storage.
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Anyone can view car images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload car images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update car images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete car images" ON storage.objects;

CREATE POLICY "Anyone can view car images" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');
CREATE POLICY "Admins can upload car images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'car-images' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can update car images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'car-images' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete car images" ON storage.objects
  FOR DELETE USING (bucket_id = 'car-images' AND public.is_admin(auth.uid()));

-- ============================================================================
-- 4b. Contact info (single-row, admin-editable)
--
-- One row holds the site's contact details. Everyone can read it (the footer
-- shows it); only admins can update it. The CHECK keeps it to a single row.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contact_info (
  id INTEGER PRIMARY KEY DEFAULT 1,
  phone TEXT,
  telegram TEXT,
  facebook TEXT,
  address TEXT,
  email TEXT,
  map_link TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT contact_info_single_row CHECK (id = 1)
);

ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;

-- Seed the single row with the current hardcoded values (only if empty)
INSERT INTO public.contact_info (id, phone, telegram, facebook, address, email, map_link)
VALUES (1, '+855 12 345 678', '@Carplus777', 'https://facebook.com/CarPlus', 'ភ្នំពេញ, កម្ពុជា', '', '')
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view contact info" ON public.contact_info;
DROP POLICY IF EXISTS "Admins can update contact info" ON public.contact_info;

CREATE POLICY "Anyone can view contact info" ON public.contact_info FOR SELECT USING (true);
CREATE POLICY "Admins can update contact info" ON public.contact_info FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE OR REPLACE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON public.contact_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Indexes
--
-- Every one of these backs a query the app actually runs. Without them each
-- lookup is a sequential scan over the whole table.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id      ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id    ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id      ON  public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_cars_is_active        ON public.cars(is_active);
CREATE INDEX IF NOT EXISTS idx_cars_status           ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id   ON public.admin_users(user_id);

-- ============================================================================
-- 6. Upgrades for databases created before this script
--
-- CREATE TABLE IF NOT EXISTS skips existing tables, so these bring an older
-- database in line. All are safe no-ops on a fresh setup.
--
-- The DELETE statements remove rows that would violate the new constraints
-- (orphaned wishlist/admin rows, duplicate cart entries). On a fresh database
-- they match nothing. On an existing one, review before running.
-- ============================================================================

DO $$
BEGIN
  -- orders.status: constrain to the values the app actually uses
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'));
  END IF;

  -- wishlist.user_id: was missing its foreign key, leaving orphan rows behind
  -- when a user was deleted
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_user_id_fkey') THEN
    DELETE FROM public.wishlist WHERE user_id NOT IN (SELECT id FROM auth.users);
    ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- admin_users.user_id: same problem
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_user_id_fkey') THEN
    DELETE FROM public.admin_users WHERE user_id NOT IN (SELECT id FROM auth.users);
    ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- cart_items: prevent the same car being added twice
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_user_id_car_id_key') THEN
    DELETE FROM public.cart_items a USING public.cart_items b
      WHERE a.id > b.id AND a.user_id = b.user_id AND a.car_id = b.car_id;
    ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_user_id_car_id_key
      UNIQUE (user_id, car_id);
  END IF;
END $$;

-- ============================================================================
-- BOOTSTRAP — grant the first admin
--
-- admin_users cannot be written through the public API by design, so the first
-- admin has to be added here. Sign up through the site first, then run:
--
--   INSERT INTO public.admin_users (user_id)
--   SELECT id FROM auth.users WHERE email = 'you@example.com'
--   ON CONFLICT (user_id) DO NOTHING;
--
-- Verify with:  SELECT public.is_admin(id) FROM auth.users WHERE email = '...';
--
-- Note: src/hooks/useAdmin.tsx now calls the is_admin() RPC (the old
-- "always true" bypass was removed), so admin access depends on a row existing
-- in admin_users for your user. Add yourself with the INSERT above.
-- ============================================================================
