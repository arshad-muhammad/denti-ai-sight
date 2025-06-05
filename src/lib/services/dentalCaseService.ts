import { supabase } from '@/lib/supabase';
import type { Case } from '@/types/supabase';
import type { PatientData, ClinicalData } from '@/types/newCase';

const dentalCaseService = {
  async create(data: { userId: string; patientData: PatientData; clinicalData: ClinicalData; status: 'pending' | 'analyzing' | 'completed' | 'error' }) {
    try {
      // Start a Supabase transaction
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert([{
          user_id: data.userId,
          status: data.status,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (caseError) throw caseError;
      if (!newCase) throw new Error('Failed to create case');

      // Transform patient data to match database column names
      const transformedPatientData = {
        case_id: newCase.id,
        full_name: data.patientData.fullName || 'Unknown Patient',
        age: data.patientData.age || '',
        gender: data.patientData.gender || '',
        phone: data.patientData.phone || '',
        email: data.patientData.email || '',
        address: data.patientData.address || '',
        smoking: data.patientData.smoking || false,
        alcohol: data.patientData.alcohol || false,
        diabetes: data.patientData.diabetes || false,
        hypertension: data.patientData.hypertension || false,
        chief_complaint: data.patientData.chiefComplaint || '',
        medical_history: data.patientData.medicalHistory || ''
      };

      // Insert patient data
      const { error: patientError } = await supabase
        .from('patient_data')
        .insert([transformedPatientData]);

      if (patientError) {
        // Rollback by deleting the case
        await supabase.from('cases').delete().eq('id', newCase.id);
        throw patientError;
      }

      // Transform clinical data to match database column names
      const transformedClinicalData = {
        case_id: newCase.id,
        tooth_number: data.clinicalData.toothNumber || '',
        mobility: data.clinicalData.mobility || false,
        bleeding: data.clinicalData.bleeding || false,
        sensitivity: data.clinicalData.sensitivity || false,
        pocket_depth: data.clinicalData.pocketDepth || '',
        additional_notes: data.clinicalData.additionalNotes || ''
      };

      // Insert clinical data
      const { error: clinicalError } = await supabase
        .from('clinical_data')
        .insert([transformedClinicalData]);

      if (clinicalError) {
        // Rollback by deleting the case and patient data
        await supabase.from('cases').delete().eq('id', newCase.id);
        throw clinicalError;
      }

      return newCase.id;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  },

  async uploadRadiograph(caseId: string, file: File) {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Create a unique file path including user ID and case ID
      const filePath = `${user.id}/${caseId}/${file.name}`;

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('radiographs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('radiographs')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      // Update the case with the radiograph URL
      const { error: updateError } = await supabase
        .from('cases')
        .update({ 
          radiograph_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseId)
        .select()
        .single();

      if (updateError) {
        // If update fails, try to clean up the uploaded file
        await supabase.storage
          .from('radiographs')
          .remove([filePath]);
        throw updateError;
      }

      // Verify the URL was set
      const { data: verifyData, error: verifyError } = await supabase
        .from('cases')
        .select('radiograph_url')
        .eq('id', caseId)
        .single();

      if (verifyError || !verifyData?.radiograph_url) {
        throw new Error('Failed to verify radiograph URL update');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading radiograph:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<Case> {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          *,
          patient_data:patient_data(*),
          clinical_data:clinical_data(*),
          analysis_results:analysis_results(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Case not found');

      // Transform the data to match the Case type
      const transformedCase: Case = {
        id: data.id,
        user_id: data.user_id,
        status: data.status,
        radiograph_url: data.radiograph_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        patient_data: {
          fullName: data.patient_data?.[0]?.full_name || 'Unknown Patient',
          age: data.patient_data?.[0]?.age || '',
          gender: data.patient_data?.[0]?.gender || '',
          phone: data.patient_data?.[0]?.phone || '',
          email: data.patient_data?.[0]?.email || '',
          address: data.patient_data?.[0]?.address || '',
          smoking: data.patient_data?.[0]?.smoking || false,
          alcohol: data.patient_data?.[0]?.alcohol || false,
          diabetes: data.patient_data?.[0]?.diabetes || false,
          hypertension: data.patient_data?.[0]?.hypertension || false,
          chiefComplaint: data.patient_data?.[0]?.chief_complaint,
          medicalHistory: data.patient_data?.[0]?.medical_history
        },
        clinical_data: data?.clinical_data?.[0] ? {
          toothNumber: data.clinical_data[0].tooth_number,
          mobility: data.clinical_data[0].mobility,
          bleeding: data.clinical_data[0].bleeding,
          sensitivity: data.clinical_data[0].sensitivity,
          pocketDepth: data.clinical_data[0].pocket_depth,
          additionalNotes: data.clinical_data[0].additional_notes,
          bopScore: data.clinical_data[0].bop_score,
          totalSites: data.clinical_data[0].total_sites,
          bleedingSites: data.clinical_data[0].bleeding_sites,
          anteriorBleeding: data.clinical_data[0].anterior_bleeding,
          posteriorBleeding: data.clinical_data[0].posterior_bleeding,
          deepPocketSites: data.clinical_data[0].deep_pocket_sites,
          averagePocketDepth: data.clinical_data[0].average_pocket_depth,
          riskScore: data.clinical_data[0].risk_score,
          boneLossAgeRatio: data.clinical_data[0].bone_loss_age_ratio,
          bopFactor: data.clinical_data[0].bop_factor,
          clinicalAttachmentLoss: data.clinical_data[0].clinical_attachment_loss,
          redFlags: data.clinical_data[0].red_flags,
          plaqueCoverage: data.clinical_data[0].plaque_coverage,
          smoking: data.clinical_data[0].smoking,
          alcohol: data.clinical_data[0].alcohol,
          diabetes: data.clinical_data[0].diabetes,
          hypertension: data.clinical_data[0].hypertension
        } : undefined,
        analysis_results: data?.analysis_results?.[0] ? {
          diagnosis: data.analysis_results[0].diagnosis,
          confidence: data.analysis_results[0].confidence,
          severity: data.analysis_results[0].severity,
          findings: data.analysis_results[0].findings
        } : undefined
      };
      
      return transformedCase;
    } catch (error) {
      console.error('Error getting case:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Case>) {
    try {
      // Extract data for each table
      const {
        patient_data,
        clinical_data,
        analysis_results,
        ...caseData
      } = data;

      // Update the main case
      if (Object.keys(caseData).length > 0) {
        const { error: caseError } = await supabase
          .from('cases')
          .update(caseData)
          .eq('id', id);

        if (caseError) throw caseError;
      }

      // Update patient data if provided
      if (patient_data) {
        const { error: patientError } = await supabase
          .from('patient_data')
          .update(patient_data)
          .eq('case_id', id);

        if (patientError) throw patientError;
      }

      // Update clinical data if provided
      if (clinical_data) {
        const { error: clinicalError } = await supabase
          .from('clinical_data')
          .update(clinical_data)
          .eq('case_id', id);

        if (clinicalError) throw clinicalError;
      }

      // Update analysis results if provided
      if (analysis_results) {
        const { error: analysisError } = await supabase
          .from('analysis_results')
          .update(analysis_results)
          .eq('case_id', id);

        if (analysisError) throw analysisError;
      }
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      // Delete the radiograph from storage first
      const { data: caseData } = await supabase
        .from('cases')
        .select('radiograph_url')
        .eq('id', id)
        .single();

      if (caseData?.radiograph_url) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const filePath = `${user.id}/${id}`;
          await supabase.storage
            .from('radiographs')
            .remove([filePath]);
        }
      }

      // Then delete the case record
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting case:', error);
      throw error;
    }
  },

  async getByUserId(userId: string): Promise<Case[]> {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          user_id,
          status,
          radiograph_url,
          created_at,
          updated_at,
          patient_data:patient_data(*),
          clinical_data:clinical_data(*),
          analysis_results:analysis_results(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the Case type
      const transformedCases: Case[] = (data || []).map(case_ => ({
        id: case_.id,
        user_id: case_.user_id,
        status: case_.status,
        radiograph_url: case_.radiograph_url,
        created_at: case_.created_at,
        updated_at: case_.updated_at,
        patient_data: {
          fullName: case_?.patient_data?.[0]?.full_name || 'Unknown Patient',
          age: case_?.patient_data?.[0]?.age || '',
          gender: case_?.patient_data?.[0]?.gender || '',
          phone: case_?.patient_data?.[0]?.phone || '',
          email: case_?.patient_data?.[0]?.email || '',
          address: case_?.patient_data?.[0]?.address || '',
          smoking: case_?.patient_data?.[0]?.smoking || false,
          alcohol: case_?.patient_data?.[0]?.alcohol || false,
          diabetes: case_?.patient_data?.[0]?.diabetes || false,
          hypertension: case_?.patient_data?.[0]?.hypertension || false,
          chiefComplaint: case_?.patient_data?.[0]?.chief_complaint,
          medicalHistory: case_?.patient_data?.[0]?.medical_history
        },
        clinical_data: case_?.clinical_data?.[0] ? {
          toothNumber: case_.clinical_data[0].tooth_number,
          mobility: case_.clinical_data[0].mobility,
          bleeding: case_.clinical_data[0].bleeding,
          sensitivity: case_.clinical_data[0].sensitivity,
          pocketDepth: case_.clinical_data[0].pocket_depth,
          additionalNotes: case_.clinical_data[0].additional_notes,
          bopScore: case_.clinical_data[0].bop_score,
          totalSites: case_.clinical_data[0].total_sites,
          bleedingSites: case_.clinical_data[0].bleeding_sites,
          anteriorBleeding: case_.clinical_data[0].anterior_bleeding,
          posteriorBleeding: case_.clinical_data[0].posterior_bleeding,
          deepPocketSites: case_.clinical_data[0].deep_pocket_sites,
          averagePocketDepth: case_.clinical_data[0].average_pocket_depth,
          riskScore: case_.clinical_data[0].risk_score,
          boneLossAgeRatio: case_.clinical_data[0].bone_loss_age_ratio,
          bopFactor: case_.clinical_data[0].bop_factor,
          clinicalAttachmentLoss: case_.clinical_data[0].clinical_attachment_loss,
          redFlags: case_.clinical_data[0].red_flags,
          plaqueCoverage: case_.clinical_data[0].plaque_coverage,
          smoking: case_.clinical_data[0].smoking,
          alcohol: case_.clinical_data[0].alcohol,
          diabetes: case_.clinical_data[0].diabetes,
          hypertension: case_.clinical_data[0].hypertension
        } : undefined,
        analysis_results: case_?.analysis_results?.[0] ? {
          diagnosis: case_.analysis_results[0].diagnosis,
          confidence: case_.analysis_results[0].confidence,
          severity: case_.analysis_results[0].severity,
          findings: case_.analysis_results[0].findings
        } : undefined
      }));

      return transformedCases;
    } catch (error) {
      console.error('Error getting user cases:', error);
      throw error;
    }
  }
};

export default dentalCaseService; 
