-- Thai import / origin category
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'local';
