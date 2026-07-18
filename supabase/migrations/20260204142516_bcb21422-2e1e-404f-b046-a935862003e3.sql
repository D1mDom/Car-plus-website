-- Add policy for admins to view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Add policy for admins to update orders
CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Add policy for admins to view all order items
CREATE POLICY "Admins can view all order items" 
ON public.order_items 
FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));