export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      cases: {
        Row: {
          id: string;
          user_id: string;
          patient_data: {
            fullName: string;
            age: string;
            gender: string;
            phone: string;
            email: string;
            address: string;
            smoking: boolean;
            alcohol: boolean;
            diabetes: boolean;
            hypertension: boolean;
            chiefComplaint: string;
            medicalHistory: string;
          };
          clinical_data: {
            toothNumber: string;
            mobility: boolean;
            bleeding: boolean;
            sensitivity: boolean;
            pocketDepth: string;
            additionalNotes: string;
          };
          radiograph_url: string | null;
          status: 'pending' | 'analyzing' | 'completed' | 'error';
          created_at: string;
          updated_at: string;
          analysis_results: {
            diagnosis: string;
            confidence: number;
            findings: {
              boneLoss?: {
                percentage: number;
                severity: string;
                regions: string[];
              };
              pathologies?: Array<{
                type: string;
                location: string;
                severity: string;
                confidence: number;
              }>;
            };
            recommendations: string[];
            severity: string;
          } | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          patient_data: any;
          clinical_data: any;
          radiograph_url?: string | null;
          status: 'pending' | 'analyzing' | 'completed' | 'error';
          created_at?: string;
          updated_at?: string;
          analysis_results?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          patient_data?: any;
          clinical_data?: any;
          radiograph_url?: string | null;
          status?: 'pending' | 'analyzing' | 'completed' | 'error';
          created_at?: string;
          updated_at?: string;
          analysis_results?: any;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      severity: 'low' | 'moderate' | 'high' | 'severe';
      prognosis: 'good' | 'fair' | 'poor' | 'questionable';
      status: 'pending' | 'analyzing' | 'completed' | 'error';
    };
  };
}

export interface Case {
  id: string;
  user_id: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  radiograph_url: string | null;
  patient_data: {
    fullName: string;
    age: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    smoking: boolean;
    alcohol: boolean;
    diabetes: boolean;
    hypertension: boolean;
    chiefComplaint?: string;
    medicalHistory?: string;
  };
  clinical_data?: {
    toothNumber?: string;
    mobility?: boolean;
    bleeding?: boolean;
    sensitivity?: boolean;
    pocketDepth?: string;
    additionalNotes?: string;
    bopScore?: number;
    totalSites?: number;
    bleedingSites?: number;
    anteriorBleeding?: number;
    posteriorBleeding?: number;
    deepPocketSites?: number;
    averagePocketDepth?: number;
    riskScore?: number;
    boneLossAgeRatio?: number;
    bopFactor?: number;
    clinicalAttachmentLoss?: number;
    redFlags?: {
      hematologicDisorder?: boolean;
      necrotizingPeriodontitis?: boolean;
      leukemiaSigns?: boolean;
      details?: string;
    };
    plaqueCoverage?: number;
    smoking?: boolean;
    alcohol?: boolean;
    diabetes?: boolean;
    hypertension?: boolean;
  };
  analysis_results?: {
    diagnosis?: string;
    confidence?: number;
    severity?: string;
    findings?: {
      boneLoss?: {
        percentage: number;
        severity: string;
        regions: string[];
      };
      pathologies?: Array<{
        type: string;
        location: string;
        severity: string;
        confidence: number;
      }>;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface GeminiAnalysisInput {
  diagnosis: string;
  findings: Record<string, any>;
  patientData: {
    age: string | number;
    gender: string;
    medicalHistory: {
      smoking?: boolean;
      diabetes?: boolean;
      notes?: string;
      [key: string]: any;
    };
  };
} 