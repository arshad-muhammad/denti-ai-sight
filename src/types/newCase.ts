import { LucideIcon } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { AnalysisResult } from './analysis';
import { PatientContact, MedicalHistory, ClinicalFindings, Pathology } from './firebase';

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
  title: string;
  description: string;
  icon: LucideIcon;
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

export interface DentalCase {
  id: string;
  userId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientContact: PatientContact;
  medicalHistory: MedicalHistory;
  clinicalFindings: ClinicalFindings;
  symptoms: string[];
  radiographUrl?: string;
  diagnosis?: string;
  boneLoss?: number;
  severity?: "mild" | "moderate" | "severe";
  confidence?: number;
  pathologies?: Pathology[];
  treatmentPlan?: string[];
  prognosis?: string;
  followUp?: string;
  status: "pending" | "analyzing" | "completed" | "error";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  analysisResults?: AnalysisResult;
}
