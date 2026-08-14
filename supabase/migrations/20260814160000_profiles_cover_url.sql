-- Profile cover banner image URL
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Allow signed-in users to upload cover photos under covers/{user_id}/
DROP POLICY IF EXISTS "Users can upload own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own cover" ON storage.objects;

CREATE POLICY "Users can upload own cover"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND name LIKE ('covers/' || auth.uid()::text || '/%')
  );

CREATE POLICY "Users can update own cover"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND name LIKE ('covers/' || auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'car-images'
    AND name LIKE ('covers/' || auth.uid()::text || '/%')
  );

CREATE POLICY "Users can delete own cover"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND name LIKE ('covers/' || auth.uid()::text || '/%')
  );
