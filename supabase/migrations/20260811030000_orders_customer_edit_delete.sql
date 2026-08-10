-- Allow customers to edit / delete their own pending orders on My orders page.

DROP POLICY IF EXISTS "Users can update their own pending orders" ON public.orders;
CREATE POLICY "Users can update their own pending orders" ON public.orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
CREATE POLICY "Users can delete their own orders" ON public.orders FOR DELETE
  USING (auth.uid() = user_id);
