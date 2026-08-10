-- Profile extras: photo + contact prefs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_time TEXT;

-- Realtime so Profile page updates live after save / other tabs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
