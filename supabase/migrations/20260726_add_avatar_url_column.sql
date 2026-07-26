-- Add avatar_url column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'avatars');

-- Allow authenticated users to select avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');
