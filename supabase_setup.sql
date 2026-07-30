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
-- 1. Shared helpers
--
-- The app stores no per-user tables: the wishlist is client-side (localStorage),
-- and the cart/checkout/orders feature was removed. User identity lives entirely
-- in Supabase Auth (auth.users) — there is no profiles table.
-- ============================================================================

-- Shared trigger function that stamps updated_at on write. Used by cars,
-- contact_info, team_members, and banners.
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

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
-- 4c. Team members (admin-editable)
--
-- The "Meet our team" cards on the About section. Everyone can read them; only
-- admins can add/edit/remove. Photos live in the same car-images bucket.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Seed the current team (only if the table is empty)
INSERT INTO public.team_members (name, role, image, sort_order)
SELECT * FROM (VALUES
  ('សុវណ្ណ ចេន', 'ស្ថាបនិក និង CEO', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face', 1),
  ('តារា គឹម', 'អ្នកគ្រប់គ្រងផ្នែកលក់', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', 2),
  ('ស្រីមុំ ផាន់', 'អ្នកឯកទេសហិរញ្ញវត្ថុ', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face', 3),
  ('វីរៈ ហេង', 'អ្នកគ្រប់គ្រងសេវាកម្ម', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face', 4)
) AS seed(name, role, image, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.team_members);

DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can delete team members" ON public.team_members;

CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Admins can insert team members" ON public.team_members FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update team members" ON public.team_members FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete team members" ON public.team_members FOR DELETE USING (public.is_admin(auth.uid()));

CREATE OR REPLACE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4d. Hero banners (admin-editable)
--
-- The rotating banner images at the top of the home page. Everyone can read
-- them; only admins can add/remove/reorder. Images live in the car-images
-- bucket. If this table is empty the site shows its built-in default slides.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Seed the default banner slides (only if the table is empty) so admins can
-- edit/reorder/replace them. These files live in /public/slides, so their URLs
-- are stable and always resolve.
INSERT INTO public.banners (image, sort_order)
SELECT * FROM (VALUES
  ('/slides/slide-1-christmas.jpg', 1),
  ('/slides/slide-2-newyear.jpg', 2),
  ('/slides/slide-3-showroom.jpg', 3),
  ('/slides/slide-4-coupon.jpg', 4),
  ('/slides/slide-5-service.jpg', 5)
) AS seed(image, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.banners);

DROP POLICY IF EXISTS "Anyone can view banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can update banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can delete banners" ON public.banners;

CREATE POLICY "Anyone can view banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admins can insert banners" ON public.banners FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update banners" ON public.banners FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete banners" ON public.banners FOR DELETE USING (public.is_admin(auth.uid()));

CREATE OR REPLACE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4e. Orders (sales) & order items
--
-- Records a car sale. Orders can be created two ways: a logged-in customer
-- placing one (user_id = their id), or an admin recording a walk-in sale
-- (user_id NULL, customer_name filled). Admins manage everything; customers
-- see only their own. Sales reports aggregate from these tables.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','delivered','completed','cancelled')),
  total_amount NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  car_id TEXT,
  car_name TEXT,
  price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "View order items of accessible orders" ON public.order_items;
DROP POLICY IF EXISTS "Admins manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users create their order items" ON public.order_items;

CREATE POLICY "View order items of accessible orders" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id
                 AND (o.user_id = auth.uid() OR public.is_admin(auth.uid()))));
CREATE POLICY "Users create their order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Indexes
--
-- Every one of these backs a query the app actually runs. Without them each
-- lookup is a sequential scan over the whole table.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cars_is_active        ON public.cars(is_active);
CREATE INDEX IF NOT EXISTS idx_cars_status           ON public.cars(status);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id   ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_sort      ON public.team_members(sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_sort           ON public.banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user_id         ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status          ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON public.order_items(order_id);

-- ============================================================================
-- 6. Upgrades for databases created before this script
--
-- CREATE TABLE IF NOT EXISTS skips existing tables, so these bring an older
-- database in line. All are safe no-ops on a fresh setup.
--
-- The DELETE statement removes rows that would violate the new constraint
-- (orphaned admin rows). On a fresh database it matches nothing.
-- ============================================================================

DO $$
BEGIN
  -- admin_users.user_id: was missing its foreign key, leaving orphan rows behind
  -- when a user was deleted
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_user_id_fkey') THEN
    DELETE FROM public.admin_users WHERE user_id NOT IN (SELECT id FROM auth.users);
    ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
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
