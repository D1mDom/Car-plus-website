-- Profile photos: allow signed-in users to upload under avatars/{user_id}/
-- (car-images bucket was admin-only for INSERT before this migration)

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  )
  WITH CHECK (
    bucket_id = 'car-images'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND name LIKE ('avatars/' || auth.uid()::text || '/%')
  );
