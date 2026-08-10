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
