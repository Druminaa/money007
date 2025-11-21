-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "User Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "User Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "User Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');