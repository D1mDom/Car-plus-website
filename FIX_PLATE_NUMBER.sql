-- ============================================================
-- Car Plus — License plate number (ស្លាកលេខឡាន)
-- Paste this into Supabase → SQL Editor → Run
-- Safe to run more than once.
-- ============================================================

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS plate_number TEXT;

ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'local';

CREATE INDEX IF NOT EXISTS idx_cars_plate_number
  ON public.cars (plate_number);

NOTIFY pgrst, 'reload schema';
