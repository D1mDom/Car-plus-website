-- Create cars table
CREATE TABLE public.cars (
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

-- Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can view active cars)
CREATE POLICY "Anyone can view active cars" 
ON public.cars 
FOR SELECT 
USING (is_active = true);

-- Create admin_users table to track admins
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin list
CREATE POLICY "Admins can view admin list" 
ON public.admin_users 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Admin policies for cars management
CREATE POLICY "Admins can insert cars" 
ON public.cars 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Admins can update cars" 
ON public.cars 
FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

CREATE POLICY "Admins can delete cars" 
ON public.cars 
FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Admins can view all cars (including inactive)
CREATE POLICY "Admins can view all cars" 
ON public.cars 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Create trigger for updated_at
CREATE TRIGGER update_cars_updated_at
BEFORE UPDATE ON public.cars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();