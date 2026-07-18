-- Drop triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_cars_updated_at ON public.cars;

-- 1. Profiles & Orders
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

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
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
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL,
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
  price DECIMAL(12,2) NOT NULL,
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

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Wishlist
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
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

-- 3. Cars and Admin
CREATE TABLE IF NOT EXISTS public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL,
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
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON public.cars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fixed Admin Policies
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
