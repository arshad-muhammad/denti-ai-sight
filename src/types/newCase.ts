
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
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}
