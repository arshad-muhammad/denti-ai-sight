import { Timestamp } from 'firebase/firestore';

export type ToothPosition = 'upper-right' | 'upper-left' | 'lower-right' | 'lower-left';
export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';

export interface Point2D {
  x: number;
  y: number;
}

export interface ToothLandmark {
  position: Point2D;
  type: 'cej' | 'bone' | 'apex';
  confidence?: number;
}

export interface ToothMeasurement {
  id: number;
  quadrant: number;
  position: number;
  type: ToothType;
  landmarks: {
    cej: Point2D;
    bone: Point2D;
    apex: Point2D;
  };
  measurements: {
    rootLength: number;
    boneLoss: number;
    boneLossPercentage: number;
  };
  analysis: {
    stage: string;
    prognosis: string;
    confidence: number;
  };
  metadata: {
    timestamp: Timestamp;
    modifiedBy: string;
    validated: boolean;
  };
}

export interface PeriodontalMeasurements {
  teeth: ToothMeasurement[];
  overallAssessment: {
    averageBoneLoss: number;
    maxBoneLoss: number;
    stage: string;
    prognosis: string;
    confidence: number;
  };
  metadata: {
    timestamp: Timestamp;
    imageQuality: number;
    notes: string;
  };
}

export interface AIAnalysisResult {
  landmarks: {
    suggestions: ToothLandmark[];
    confidence: number;
  };
  measurements: PeriodontalMeasurements;
  warnings: {
    type: 'quality' | 'alignment' | 'artifact';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
}

export const PERIODONTAL_STAGES = {
  STAGE_I: {
    range: { min: 0, max: 15 },
    label: 'Stage I - Initial Periodontitis',
    prognosis: 'Good',
    description: 'Early stage periodontal disease with minimal bone loss.',
    recommendations: [
      'Improved oral hygiene',
      'Regular professional cleaning',
      'Monitoring at 6-month intervals'
    ]
  },
  STAGE_II: {
    range: { min: 15, max: 33 },
    label: 'Stage II - Moderate Periodontitis',
    prognosis: 'Fair',
    description: 'Established periodontal disease with moderate bone loss.',
    recommendations: [
      'Deep cleaning (SRP)',
      'More frequent recalls',
      'Possible localized therapy'
    ]
  },
  STAGE_III: {
    range: { min: 33, max: 50 },
    label: 'Stage III - Severe Periodontitis',
    prognosis: 'Questionable',
    description: 'Advanced periodontal disease with significant bone loss.',
    recommendations: [
      'Comprehensive periodontal therapy',
      'Possible surgical intervention',
      'Frequent maintenance'
    ]
  },
  STAGE_IV: {
    range: { min: 50, max: 100 },
    label: 'Stage IV - Advanced Periodontitis',
    prognosis: 'Poor',
    description: 'Severe periodontal disease with risk of tooth loss.',
    recommendations: [
      'Advanced periodontal surgery',
      'Possible extraction consideration',
      'Intensive maintenance protocol'
    ]
  }
} as const; 