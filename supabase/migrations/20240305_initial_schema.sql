-- Drop existing types if they exist
DROP TYPE IF EXISTS severity CASCADE;
DROP TYPE IF EXISTS prognosis CASCADE;
DROP TYPE IF EXISTS case_status CASCADE;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS clinical_data CASCADE;
DROP TABLE IF EXISTS patient_data CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- Create enums
CREATE TYPE severity AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE prognosis AS ENUM ('good', 'fair', 'poor', 'questionable');
CREATE TYPE case_status AS ENUM ('pending', 'analyzing', 'completed', 'error');

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status case_status NOT NULL DEFAULT 'pending',
    radiograph_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create patient_data table
CREATE TABLE IF NOT EXISTS patient_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    full_name TEXT,
    age TEXT,
    gender TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    smoking BOOLEAN DEFAULT false,
    alcohol BOOLEAN DEFAULT false,
    diabetes BOOLEAN DEFAULT false,
    hypertension BOOLEAN DEFAULT false,
    chief_complaint TEXT,
    medical_history TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create clinical_data table
CREATE TABLE IF NOT EXISTS clinical_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    tooth_number TEXT,
    mobility BOOLEAN DEFAULT false,
    bleeding BOOLEAN DEFAULT false,
    sensitivity BOOLEAN DEFAULT false,
    pocket_depth TEXT,
    additional_notes TEXT,
    bop_score NUMERIC,
    total_sites INTEGER,
    bleeding_sites INTEGER,
    anterior_bleeding INTEGER,
    posterior_bleeding INTEGER,
    deep_pocket_sites INTEGER,
    average_pocket_depth NUMERIC,
    risk_score NUMERIC,
    bone_loss_age_ratio NUMERIC,
    bop_factor NUMERIC,
    clinical_attachment_loss NUMERIC,
    red_flags JSONB,
    plaque_coverage NUMERIC,
    smoking BOOLEAN DEFAULT false,
    alcohol BOOLEAN DEFAULT false,
    diabetes BOOLEAN DEFAULT false,
    hypertension BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create analysis_results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    diagnosis TEXT,
    confidence NUMERIC,
    severity TEXT,
    findings JSONB,
    periodontal_stage JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_patient_data_case_id ON patient_data(case_id);
CREATE INDEX idx_clinical_data_case_id ON clinical_data(case_id);
CREATE INDEX idx_analysis_results_case_id ON analysis_results(case_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_data_updated_at
    BEFORE UPDATE ON patient_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_data_updated_at
    BEFORE UPDATE ON clinical_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at
    BEFORE UPDATE ON analysis_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cases"
    ON cases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases"
    ON cases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
    ON cases FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own patient data"
    ON patient_data FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = patient_data.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert patient data for their cases"
    ON patient_data FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = patient_data.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can update patient data for their cases"
    ON patient_data FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = patient_data.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own clinical data"
    ON clinical_data FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = clinical_data.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert clinical data for their cases"
    ON clinical_data FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = clinical_data.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can update clinical data for their cases"
    ON clinical_data FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = clinical_data.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can view their own analysis results"
    ON analysis_results FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = analysis_results.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert analysis results for their cases"
    ON analysis_results FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = analysis_results.case_id
        AND cases.user_id = auth.uid()
    ));

CREATE POLICY "Users can update analysis results for their cases"
    ON analysis_results FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM cases
        WHERE cases.id = analysis_results.case_id
        AND cases.user_id = auth.uid()
    )); 