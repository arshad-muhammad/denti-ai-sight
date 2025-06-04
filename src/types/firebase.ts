import { Timestamp } from "firebase/firestore";
import { AnalysisResult } from "./analysis";
import { Severity, Prognosis, BoneLossAssessment, Finding, Annotation } from './analysis';

export interface PatientContact {
  phone: string;
  email: string;
  address: string;
}

export interface MedicalHistory {
  smoking: boolean;
  alcohol: boolean;
  diabetes: boolean;
  hypertension: boolean;
  notes: string;
}

export interface ClinicalFindings {
  toothNumber: string;
  mobility: boolean;
  bleeding: boolean;
  sensitivity: boolean;
  pocketDepth: string;
  notes: string;
}

export interface Pathology {
  name: string;
  severity: Severity;
  location: string;
}

export interface FirebaseDentalCase {
  id: string;
  userId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientContact: PatientContact;
  medicalHistory: MedicalHistory;
  clinicalFindings: ClinicalFindings;
  symptoms: string[];
  radiographUrl: string | null;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  analysisResults?: {
    timestamp: Timestamp;
    diagnosis: string;
    confidence: number;
    findings: {
      boneLoss?: BoneLossAssessment;
      pathologies?: Finding[];
    };
    recommendations: string[];
    severity: Severity;
    annotations?: Annotation[];
    periodontalStage?: {
      stage: string;
      description: string;
      implications: string[];
    };
    implantPrognosis?: {
      status: Prognosis;
      measurements: {
        boneLossApexY?: number;
        boneY?: number;
        cejY?: number;
      };
    };
  } | null;
  diagnosis: string | null;
  boneLoss: number | null;
  severity: Severity | null;
  confidence: number | null;
  pathologies: Pathology[];
  treatmentPlan: string[];
  prognosis: Prognosis | null;
  followUp: string | null;
} 