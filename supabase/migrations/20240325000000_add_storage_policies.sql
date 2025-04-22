-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Check for upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload files'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload files"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = 'uploads' AND
          auth.role() = 'authenticated'
        );
    END IF;

    -- Check for read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to read their own files'
    ) THEN
        CREATE POLICY "Allow users to read their own files"
        ON storage.objects
        FOR SELECT
        TO authenticated
        USING (
          bucket_id = 'uploads' AND
          auth.role() = 'authenticated'
        );
    END IF;

    -- Check for update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to update their own files'
    ) THEN
        CREATE POLICY "Allow users to update their own files"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (
          bucket_id = 'uploads' AND
          auth.role() = 'authenticated'
        )
        WITH CHECK (
          bucket_id = 'uploads' AND
          auth.role() = 'authenticated'
        );
    END IF;

    -- Check for delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to delete their own files'
    ) THEN
        CREATE POLICY "Allow users to delete their own files"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
          bucket_id = 'uploads' AND
          auth.role() = 'authenticated'
        );
    END IF;
END
$$; 