export interface AnalysisResult {
  confidence: number;
  findings: Finding[];
  metadata: AnalysisMetadata;
}

export interface Finding {
  id: string;
  type: FindingType;
  location: string;
  confidence: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendations?: string[];
}

export type FindingType = 
  | 'cavity'
  | 'periodontal_disease'
  | 'root_canal'
  | 'abscess'
  | 'bone_loss'
  | 'impacted_tooth'
  | 'other';

export interface AnalysisMetadata {
  timestamp: string;
  imageQuality: {
    score: number;
    issues?: string[];
  };
  processingTime: number;
  modelVersion: string;
}