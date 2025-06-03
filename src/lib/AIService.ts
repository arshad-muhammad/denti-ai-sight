import { useState } from 'react';
import { AnalysisResult, Finding, FindingType } from '@/types/analysis';

const API_URL = 'https://api-inference.huggingface.co/models/nsitnov/8024-yolov8-model';
const API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY;

interface YOLOPrediction {
  label: string;
  confidence: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  points?: number[][];  // For segmentation mask
}

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

const mapYOLOLabelToFindingType = (label: string): FindingType => {
  const mappings: Record<string, FindingType> = {
    'Caries': 'cavity',
    'Periapical-lesion': 'abscess',
    'Missing-tooth-between': 'bone_loss',
    'Root-Canal-Treatment': 'root_canal',
    'Root Piece': 'other',
    'Crown': 'other',
    'Filling': 'other',
    'Implant': 'other'
  };
  return mappings[label] || 'other';
};

const getSeverityFromConfidence = (confidence: number): 'low' | 'medium' | 'high' => {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
};

const getDescriptionForFinding = (label: string, confidence: number): string => {
  const confidencePercent = Math.round(confidence * 100);
  const descriptions: Record<string, string> = {
    'Caries': `Detected dental cavity with ${confidencePercent}% confidence`,
    'Periapical-lesion': `Identified periapical lesion with ${confidencePercent}% confidence`,
    'Missing-tooth-between': `Detected missing tooth/bone loss with ${confidencePercent}% confidence`,
    'Root-Canal-Treatment': `Previous root canal treatment identified with ${confidencePercent}% confidence`,
    'Root Piece': `Root piece detected with ${confidencePercent}% confidence`,
    'Crown': `Dental crown identified with ${confidencePercent}% confidence`,
    'Filling': `Dental filling detected with ${confidencePercent}% confidence`,
    'Implant': `Dental implant identified with ${confidencePercent}% confidence`
  };
  return descriptions[label] || `${label} detected with ${confidencePercent}% confidence`;
};

const getRecommendationsForFinding = (label: string, confidence: number): string[] => {
  const recommendations: Record<string, string[]> = {
    'Caries': [
      'Schedule immediate dental examination',
      'Consider restoration treatment',
      'Implement better oral hygiene practices'
    ],
    'Periapical-lesion': [
      'Urgent dental consultation required',
      'Possible need for endodontic treatment',
      'Monitor for signs of infection'
    ],
    'Missing-tooth-between': [
      'Consider dental implant or bridge',
      'Evaluate surrounding bone structure',
      'Discuss replacement options with dentist'
    ],
    'Root-Canal-Treatment': [
      'Monitor for any signs of failure',
      'Regular check-ups recommended',
      'Consider crown if not already present'
    ],
    'Root Piece': [
      'Extraction may be necessary',
      'Evaluate for possible complications',
      'Consider immediate dental consultation'
    ],
    'Crown': [
      'Regular maintenance check recommended',
      'Monitor crown margins',
      'Check for any wear or damage'
    ],
    'Filling': [
      'Monitor filling condition',
      'Check for secondary decay',
      'Regular dental check-ups recommended'
    ],
    'Implant': [
      'Regular implant maintenance required',
      'Monitor bone integration',
      'Check for signs of peri-implantitis'
    ]
  };
  return recommendations[label] || ['Consult with dental professional for detailed evaluation'];
};

export const useAIService = () => {
  const [isLoading, setIsLoading] = useState(false);

  const analyzeImage = async (file: File): Promise<AnalysisResult> => {
    try {
      setIsLoading(true);

      if (!API_KEY) {
        throw new AIServiceError('API configuration is missing. Please check your environment variables.');
      }

      // Convert file to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: base64Image,
          options: {
            wait_for_model: true
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new AIServiceError(
          errorData?.error || `API request failed with status ${response.status}`
        );
      }

      const predictions = await response.json() as YOLOPrediction[];
      
      // Transform YOLO predictions to our AnalysisResult format
      const findings: Finding[] = predictions.map((pred, index) => ({
        id: `finding-${index}`,
        type: mapYOLOLabelToFindingType(pred.label),
        location: `Region ${index + 1}`,
        confidence: pred.confidence,
        description: getDescriptionForFinding(pred.label, pred.confidence),
        severity: getSeverityFromConfidence(pred.confidence),
        recommendations: getRecommendationsForFinding(pred.label, pred.confidence)
      }));

      // Calculate overall confidence as average of individual findings
      const overallConfidence = findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length;

      const result: AnalysisResult = {
        confidence: overallConfidence,
        findings,
        metadata: {
          timestamp: new Date().toISOString(),
          imageQuality: {
            score: 0.9, // This would ideally come from an image quality assessment
            issues: []
          },
          processingTime: 0, // This would be calculated from actual processing time
          modelVersion: '8024-yolov8-model'
        }
      };

      return result;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new AIServiceError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyzeImage,
    isLoading,
  };
}; 