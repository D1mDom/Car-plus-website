-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view all cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can insert cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can update cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can delete cars" ON public.cars;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
  )
$$;

-- Recreate admin_users policies using the function
CREATE POLICY "Admins can view admin list" 
ON public.admin_users 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Recreate cars policies using the function
CREATE POLICY "Admins can view all cars" 
ON public.cars 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert cars" 
ON public.cars 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update cars" 
ON public.cars 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete cars" 
ON public.cars 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Recreate orders policies using the function  
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Recreate order_items policies using the function
CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (public.is_admin(auth.uid()));