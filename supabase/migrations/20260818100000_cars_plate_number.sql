-- Separate license plate from tax-paper car code.
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS plate_number TEXT;

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'local';

CREATE INDEX IF NOT EXISTS idx_cars_plate_number
  ON public.cars (plate_number);
