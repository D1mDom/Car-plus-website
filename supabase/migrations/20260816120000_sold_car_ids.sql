-- Sold-out cars: public can see which listings already have an active order.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.get_sold_car_ids()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT oi.car_id::text
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE COALESCE(o.status, '') <> 'cancelled'
    AND oi.car_id IS NOT NULL
    AND oi.car_id::text <> 'walk-in';
$$;

REVOKE ALL ON FUNCTION public.get_sold_car_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sold_car_ids() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_order_item_from_car()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  car_row public.cars%ROWTYPE;
  already_sold boolean;
BEGIN
  IF NEW.car_id IS NULL OR NEW.car_id::text = 'walk-in' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    INNER JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.car_id::text = NEW.car_id::text
      AND COALESCE(o.status, '') <> 'cancelled'
  ) INTO already_sold;

  IF already_sold THEN
    RAISE EXCEPTION 'Car is already sold';
  END IF;

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
