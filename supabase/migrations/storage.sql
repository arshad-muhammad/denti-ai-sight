-- First, ensure the storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Drop existing bucket if it exists
DROP TABLE IF EXISTS storage.objects;
DROP TABLE IF EXISTS storage.buckets;

-- Create the buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
    id text PRIMARY KEY,
    name text NOT NULL,
    owner uuid,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    public boolean DEFAULT FALSE,
    avif_autodetection boolean DEFAULT FALSE,
    file_size_limit bigint,
    allowed_mime_types text[]
);

-- Create the objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),
    last_accessed_at timestamptz DEFAULT NOW(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
    CONSTRAINT objects_bucketid_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets (id)
);

-- Create the radiographs bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES (
    'radiographs',
    'radiographs',
    true,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can upload radiographs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view radiographs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own radiographs" ON storage.objects;

CREATE POLICY "Users can upload radiographs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'radiographs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view radiographs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'radiographs');

CREATE POLICY "Users can delete their own radiographs"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'radiographs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Bucket policies
DROP POLICY IF EXISTS "Users can create radiograph bucket" ON storage.buckets;
DROP POLICY IF EXISTS "Users can view radiograph bucket" ON storage.buckets;

CREATE POLICY "Users can create radiograph bucket"
ON storage.buckets FOR INSERT
TO authenticated
WITH CHECK (id = 'radiographs');

CREATE POLICY "Users can view radiograph bucket"
ON storage.buckets FOR SELECT
TO authenticated
USING (id = 'radiographs'); 