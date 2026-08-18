-- ============================================================
-- Car Plus — Sold out (លក់អស់)
-- Paste this into Supabase → SQL Editor → Run
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS is_sold boolean NOT NULL DEFAULT false;

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

CREATE OR REPLACE FUNCTION public.refresh_car_sold_flag(p_car_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_car_id IS NULL OR p_car_id = 'walk-in' THEN
    RETURN;
  END IF;

  UPDATE public.cars
  SET is_sold = EXISTS (
    SELECT 1
    FROM public.order_items oi
    INNER JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.car_id::text = p_car_id
      AND COALESCE(o.status, '') <> 'cancelled'
  )
  WHERE id::text = p_car_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_mark_car_sold_from_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_car_sold_flag(COALESCE(NEW.car_id, OLD.car_id)::text);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_car_sold_from_item ON public.order_items;
CREATE TRIGGER trg_mark_car_sold_from_item
  AFTER INSERT OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_mark_car_sold_from_item();

CREATE OR REPLACE FUNCTION public.trg_mark_car_sold_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_car text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  FOR item_car IN
    SELECT oi.car_id::text FROM public.order_items oi WHERE oi.order_id = COALESCE(NEW.id, OLD.id)
  LOOP
    PERFORM public.refresh_car_sold_flag(item_car);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_car_sold_from_order ON public.orders;
CREATE TRIGGER trg_mark_car_sold_from_order
  AFTER UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_mark_car_sold_from_order();

-- Mark cars that already have an active order
UPDATE public.cars c
SET is_sold = true
WHERE EXISTS (
  SELECT 1
  FROM public.order_items oi
  INNER JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.car_id::text = c.id::text
    AND COALESCE(o.status, '') <> 'cancelled'
);

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

  SELECT * INTO car_row FROM public.cars WHERE id::text = NEW.car_id LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Car not found or not available'; END IF;
  IF car_row.is_active IS NOT TRUE THEN RAISE EXCEPTION 'Car is not available'; END IF;
  NEW.price := car_row.price;
  UPDATE public.orders SET total_amount = car_row.price, updated_at = now() WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_item_from_car ON public.order_items;
CREATE TRIGGER trg_enforce_order_item_from_car
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_item_from_car();
