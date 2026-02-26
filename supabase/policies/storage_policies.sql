-- supabase/policies/storage_policies.sql
-- Supabase Storage policies for TelStudy
-- Manages access to the question-sets bucket
-- File paths follow pattern: question-sets/{userId}/{setId}.json

-- =============================================
-- STORAGE BUCKET POLICIES
-- =============================================
-- Enable RLS on storage.objects (done automatically by Supabase)
-- Note: Create bucket manually in dashboard if not exists:
-- - Name: question-sets
-- - Private: true (non-public)

CREATE POLICY "Users can upload own question sets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'question-sets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own question sets" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'question-sets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own question sets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'question-sets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
