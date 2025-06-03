import { Timestamp } from "firebase/firestore";

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
  severity: "mild" | "moderate" | "severe";
  location: string;
}

export interface FirebaseDentalCase {
  id?: string;
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
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
} 