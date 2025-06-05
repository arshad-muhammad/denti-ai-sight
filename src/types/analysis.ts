import { Timestamp } from "firebase/firestore";

export type FindingType = 
  | 'cavity'
  | 'periodontal_disease'
  | 'root_canal'
  | 'abscess'
  | 'bone_loss'
  | 'impacted_tooth'
  | 'other';

export type Severity = 'mild' | 'moderate' | 'severe';
export type BoPSeverity = 'healthy' | 'moderate' | 'severe';
export type Prognosis = 'Good' | 'Fair' | 'Poor' | 'Questionable';
export type MobilityGrade = 0 | 1 | 2 | 3;

export interface ProbingDepths {
  distal: number;
  buccal: number;
  mesial: number;
  lingual: number;
}

export interface ToothMeasurement {
  toothNumber: string;
  probingDepths: ProbingDepths;
  mobilityGrade: MobilityGrade;
  prognosis: Prognosis;
}

export interface BoneLossFindings {
  severity: Severity;
  confidence: number;
  regions: string[];
  percentage: number;
  measurements: ToothMeasurement[];
}

export interface PatientData {
  age: number;
  smoking: boolean;
  diabetes: boolean;
}

export interface Finding {
  type: string;
  location: string;
  severity: Severity;
  confidence: number;
  description?: string;
  recommendations?: string[];
}

export interface Annotation {
  type: string;
  location: string;
  severity: Severity;
  bbox?: [number, number, number, number];
  label: string;
}

export interface BoneLossMeasurement {
  type: 'Bone Loss:Apex Y' | 'Bone Y' | 'CEJ Y';
  value: number;
  confidence: number;
}

export interface BoPData {
  totalSites: number;
  bleedingSites: number;
  percentage: number;
  probingDepths: number[];
}

export interface BoneLossAssessment {
  percentage: number;
  severity: Severity;
  regions: string[];
  measurements: BoneLossMeasurement[];
  confidence: number;
  overlayImage?: string;
}

export interface AnalysisResult {
  timestamp: Timestamp;
  diagnosis: string;
  confidence: number;
  findings: {
    boneLoss?: BoneLossAssessment;
    bop?: BoPData;
    caries?: {
      detected: boolean;
      locations: string[];
    };
    pathologies?: Finding[];
  };
  recommendations: string[];
  annotations?: Annotation[];
  severity: Severity;
  patientData?: {
    age: number;
    gender: string;
    riskFactors: string[];
    smoking?: boolean;
    diabetes?: boolean;
  };
}

export interface AnalysisMetadata {
  timestamp: string;
  imageQuality: {
    score: number;
    issues?: string[];
  };
  processingTime: number;
  modelVersion: string;
}

export interface PeriodontalStageResult {
  stage: string;
  description: string;
  prognosis: Prognosis;
}

export interface EnhancedAnalysis {
  refinedPrognosis: {
    status: Prognosis;
    explanation: string;
    riskFactors: string[];
    longTermOutlook: string;
    periodontalStage?: PeriodontalStageResult;
  };
  detailedFindings: {
    primaryCondition: {
      description: string;
      severity: string;
      implications: string[];
    };
    riskAssessment: {
      current: string;
      future: string;
      mitigationStrategies: string[];
    };
    secondaryFindings: Array<{
      condition: string;
      severity: string;
      description: string;
      implications: string[];
    }>;
  };
  detailedTreatmentPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    preventiveMeasures: string[];
    lifestyle: string[];
  };
}