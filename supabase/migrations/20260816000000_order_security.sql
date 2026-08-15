-- Secure customer orders: server-side price, locked fields, pending-only delete.

CREATE OR REPLACE FUNCTION public.enforce_customer_order_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot create orders for another user';
  END IF;

  NEW.status := 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_order_insert ON public.orders;
CREATE TRIGGER trg_enforce_customer_order_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_order_insert();

CREATE OR REPLACE FUNCTION public.enforce_customer_order_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Only pending orders can be updated';
  END IF;

  NEW.status := OLD.status;
  NEW.total_amount := OLD.total_amount;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_order_update ON public.orders;
CREATE TRIGGER trg_enforce_customer_order_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_order_update();

CREATE OR REPLACE FUNCTION public.enforce_order_item_from_car()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  car_row public.cars%ROWTYPE;
BEGIN
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO car_row
  FROM public.cars
  WHERE id::text = NEW.car_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Car not found or not available';
  END IF;

  IF car_row.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Car is not available';
  END IF;

  NEW.price := car_row.price;

  UPDATE public.orders
  SET total_amount = car_row.price, updated_at = now()
  WHERE id = NEW.order_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_item_from_car ON public.order_items;
CREATE TRIGGER trg_enforce_order_item_from_car
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_item_from_car();

DROP POLICY IF EXISTS "Users can delete their own orders" ON public.orders;
CREATE POLICY "Users can delete their own orders" ON public.orders FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');
