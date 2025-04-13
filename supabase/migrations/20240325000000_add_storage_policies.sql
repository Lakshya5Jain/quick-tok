-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'uploads' AND
  auth.role() = 'authenticated'
); 