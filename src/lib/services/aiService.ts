import { HfInference } from '@huggingface/inference';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);

// Supported image formats and size limits
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/dicom'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageMetadata {
  originalSize: number;
  format: string;
  preprocessingApplied: string[];
}

interface AnalysisResult {
  diagnosis: string;
  confidence: number;
  findings: {
    boneLoss?: {
      severity: 'mild' | 'moderate' | 'severe';
      confidence: number;
      regions: string[];
    };
    caries?: {
      detected: boolean;
      confidence: number;
      locations: string[];
    };
    pathologies?: {
      type: string;
      confidence: number;
      location: string;
    }[];
  };
  recommendations: string[];
  timestamp: Date;
}

export class AIService {
  private static async preprocessImage(file: File): Promise<{ processedImage: File; metadata: ImageMetadata }> {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      throw new Error('Unsupported image format. Please upload JPEG, PNG, or DICOM files.');
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('Image size too large. Maximum size is 10MB.');
    }

    // TODO: Add image preprocessing steps like:
    // - Contrast enhancement
    // - Noise reduction
    // - Standardization
    // For now, we'll return the original file
    return {
      processedImage: file,
      metadata: {
        originalSize: file.size,
        format: file.type,
        preprocessingApplied: ['none']
      }
    };
  }

  private static validateResults(results: unknown): AnalysisResult {
    // Implement validation logic
    if (!results || typeof results !== 'object') {
      throw new Error('Invalid analysis results received from AI model');
    }

    // Add more validation as needed
    return results as AnalysisResult;
  }

  static async analyzeImage(file: File): Promise<AnalysisResult> {
    try {
      // Preprocess the image
      const { processedImage, metadata } = await this.preprocessImage(file);

      // Upload to Firebase Storage for temporary access
      const storageRef = ref(storage, `temp/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, processedImage);
      const imageUrl = await getDownloadURL(storageRef);

      // Call Hugging Face API for analysis
      // Replace 'dental-xray-analysis' with your actual model ID
      const response = await hf.imageClassification({
        model: 'dental-xray-analysis',
        data: await fetch(imageUrl).then(r => r.blob())
      });

      // Process and validate results
      // This is a placeholder transformation - adjust based on your model's output
      const results: AnalysisResult = {
        diagnosis: response[0]?.label || 'Unknown',
        confidence: response[0]?.score || 0,
        findings: {
          boneLoss: {
            severity: 'moderate',
            confidence: 0.85,
            regions: ['distal', 'mesial']
          },
          caries: {
            detected: true,
            confidence: 0.92,
            locations: ['tooth_18']
          },
          pathologies: []
        },
        recommendations: [
          'Further clinical examination recommended',
          'Consider periodontal treatment'
        ],
        timestamp: new Date()
      };

      // Validate results
      return this.validateResults(results);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze image. Please try again.');
    }
  }

  static async getModelConfidence(results: AnalysisResult): Promise<number> {
    // Calculate overall confidence score
    const confidenceScores = [
      results.confidence,
      results.findings.boneLoss?.confidence || 0,
      results.findings.caries?.confidence || 0,
      ...(results.findings.pathologies?.map(p => p.confidence) || [])
    ];

    return confidenceScores.reduce((acc, score) => acc + score, 0) / confidenceScores.length;
  }
}