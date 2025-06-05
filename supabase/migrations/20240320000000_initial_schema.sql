-- Create custom types
CREATE TYPE severity AS ENUM ('low', 'moderate', 'high', 'severe');
CREATE TYPE prognosis AS ENUM ('good', 'fair', 'poor', 'questionable');
CREATE TYPE status AS ENUM ('pending', 'analyzing', 'completed', 'error');

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cases table
CREATE TABLE cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    patient_data JSONB NOT NULL,
    clinical_data JSONB NOT NULL,
    radiograph_url TEXT,
    analysis_results JSONB,
    status status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX cases_user_id_idx ON cases(user_id);
CREATE INDEX cases_status_idx ON cases(status);
CREATE INDEX cases_created_at_idx ON cases(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert their own cases"
ON cases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own cases"
ON cases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
ON cases FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
ON cases FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create storage bucket for radiographs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('radiographs', 'radiographs', true);

-- Create storage policies
CREATE POLICY "Users can upload radiographs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'radiographs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view radiographs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'radiographs');

CREATE POLICY "Users can delete their own radiographs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'radiographs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 