import { LucideIcon } from 'lucide-react';

export interface PatientData {
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
}

export interface ClinicalData {
  toothNumber: string;
  mobility: boolean;
  bleeding: boolean;
  sensitivity: boolean;
  pocketDepth: string;
  additionalNotes: string;
}

export interface Step {
  number: number;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface Finding {
  type: 'caries' | 'crown' | 'filling' | 'implant' | 'missing' | 'periapical' | 'root_piece' | 'root_canal';
  confidence: number;
  location: {
    toothNumber: string;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  severity?: 'low' | 'medium' | 'high';
}

export interface AnalysisResults {
  findings: Finding[];
  confidence: number;
  recommendations: string[];
  imageQuality?: {
    score: number;
    issues?: string[];
  };
}

export interface DentalCase {
  id: string;
  userId: string;
  patientData: PatientData;
  clinicalData: ClinicalData;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt?: string;
  radiographUrl?: string;
  analysisResults?: AnalysisResults;
}
