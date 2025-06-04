import { HfInference } from '@huggingface/inference';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createCanvas, loadImage, Canvas } from 'canvas';
import { AnalysisResult, Severity, Finding } from '@/types/analysis';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

const hf = new HfInference(import.meta.env.VITE_HUGGINGFACE_API_KEY);

// Supported image formats and size limits
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/dicom'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Model endpoints
const MODELS = {
  PATHOLOGY: 'AI-RESEARCHER-2024/AI-in-Dentistry',
  SEGMENTATION: 'theparitt/dentist',
  YOLO: 'nsitnov/8024-yolov8-model'
};

interface ImageMetadata {
  originalSize: number;
  format: string;
  preprocessingApplied: string[];
  timestamp: number;
}

interface BoneLossMeasurement {
  toothNumber: string;
  cejToBone: number;
  normalBoneLevel: number;
  boneLossPercentage: number;
  pocketDepth: number;
  probingDepths: {
    distal: number;
    buccal: number;
    mesial: number;
    lingual: number;
  };
  mobilityGrade: 0 | 1 | 2 | 3;
  prognosis: 'Good' | 'Fair' | 'Poor';
  severity: Severity;
}

interface SegmentationResult {
  masks: {
    teeth: number[][];
    bone: number[][];
    gums: number[][];
  };
  measurements: BoneLossMeasurement[];
}

interface Point {
  x: number;
  y: number;
}

interface SegmentationMask {
  mask: string;  // Base64 encoded mask data
  label: string;
  score: number;
}

interface SegmentationResponse {
  [index: number]: SegmentationMask;
}

interface HuggingFaceSegmentationOutput {
  [index: number]: {
    mask: string;
    label: string;
    score: number;
  };
}

type NodeCanvasContext = {
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fillText(text: string, x: number, y: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  fillStyle: string | CanvasGradient | CanvasPattern;
};

function createEmptyMask(size: number): number[][] {
  const mask: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = new Array(size);
    for (let j = 0; j < size; j++) {
      row[j] = 0;
    }
    mask[i] = row;
  }
  return mask;
}

function findCEJPoint(toothMask: number[][]): Point {
  // Find the highest point of the tooth (CEJ)
  let minY = Infinity;
  let cejX = 0;
  
  for (let y = 0; y < toothMask.length; y++) {
    for (let x = 0; x < toothMask[y].length; x++) {
      if (toothMask[y][x] === 1 && y < minY) {
        minY = y;
        cejX = x;
      }
    }
  }
  
  return { x: cejX, y: minY };
}

function findBoneLevel(boneMask: number[][]): Point {
  // Find the highest point of the bone
  let minY = Infinity;
  let boneX = 0;
  
  for (let y = 0; y < boneMask.length; y++) {
    for (let x = 0; x < boneMask[y].length; x++) {
      if (boneMask[y][x] === 1 && y < minY) {
        minY = y;
        boneX = x;
      }
    }
  }
  
  return { x: boneX, y: minY };
}

function calculateDistance(point1: Point, point2: Point): number {
  // Convert pixel distance to millimeters (assuming 0.1mm per pixel)
  const pixelDistance = Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
  return pixelDistance * 0.1;
}

function drawMeasurementOverlay(
  ctx: NodeCanvasContext,
  cejPoint: Point,
  boneLevel: Point,
  distance: number,
  boneLoss: number
): void {
  // Draw measurement line
  ctx.beginPath();
  ctx.moveTo(cejPoint.x, cejPoint.y);
  ctx.lineTo(boneLevel.x, boneLevel.y);
  ctx.strokeStyle = boneLoss > 30 ? 'red' : 'green';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw measurement text
  ctx.font = '12px Arial';
  ctx.fillStyle = boneLoss > 30 ? 'red' : 'green';
  ctx.fillText(
    `${distance.toFixed(1)}mm (${boneLoss.toFixed(1)}%)`,
    (cejPoint.x + boneLevel.x) / 2,
    (cejPoint.y + boneLevel.y) / 2
  );
  
  // Draw points
  ctx.beginPath();
  ctx.arc(cejPoint.x, cejPoint.y, 3, 0, 2 * Math.PI);
  ctx.arc(boneLevel.x, boneLevel.y, 3, 0, 2 * Math.PI);
  ctx.fillStyle = boneLoss > 30 ? 'red' : 'green';
  ctx.fill();
}

function parseMaskData(maskData: string): number[][] {
  try {
    // Parse base64 encoded mask data to 2D array
    const decoded = atob(maskData);
    const size = Math.sqrt(decoded.length);
    return Array.from({ length: size }, (_, i) => 
      Array.from({ length: size }, (_, j) => 
        decoded.charCodeAt(i * size + j) === 1 ? 1 : 0
      )
    );
  } catch (error) {
    console.error('Error parsing mask data:', error);
    return createEmptyMask(512);
  }
}

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const TARGET_SIZE = 512;

// Custom error types for better error handling
export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

export class ModelInferenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelInferenceError';
  }
}

interface AIServiceResponse {
  diagnosis: string;
  confidence: number;
  findings: {
    boneLoss: {
      measurements: BoneLossMeasurement[];
      severity: Severity;
      confidence: number;
      overlayImage: string;
    };
    pathologies: Array<{
      type: string;
      confidence: number;
      location: string;
      bbox: [number, number, number, number];
    }>;
  };
  metadata: {
    timestamp: string;
    imageQuality: {
      score: number;
      issues: string[];
    };
    processingTime: number;
    modelVersion: string;
  };
  recommendations: string[];
  prognosis: string;
}

export interface AIAnalysisResult {
  diagnosis: string;
  confidence: number;
  findings: {
    boneLoss: {
      measurements: AIBoneLossMeasurement[];
      percentage: number;
      severity: 'mild' | 'moderate' | 'severe';
      regions: string[];
      confidence: number;
      overlayImage?: string;
    };
    pathologies: AIPathology[];
  };
  recommendations: string[];
  severity: 'mild' | 'moderate' | 'severe';
  annotations?: Array<{
    type: string;
    bbox: [number, number, number, number];
    label: string;
  }>;
}

export interface AIPathology {
  type: string;
  confidence: number;
  location: string;
  severity: string;
  bbox?: [number, number, number, number];
}

export interface AIBoneLossMeasurement {
  type: 'Bone Loss:Apex Y' | 'Bone Y' | 'CEJ Y';
  value: number;
  confidence: number;
}

export interface AIFindings {
  boneLoss: {
    measurements: AIBoneLossMeasurement[];
    percentage: number;
    severity: 'mild' | 'moderate' | 'severe';
    regions: string[];
    confidence: number;
    overlayImage?: string;
  };
  pathologies: AIPathology[];
}

export class AIService {
  private static async preprocessImage(file: File): Promise<{ processedImage: File; metadata: ImageMetadata }> {
    try {
      // Validate input
      if (!file) {
        throw new ImageProcessingError('No file provided');
      }

      if (!SUPPORTED_FORMATS.includes(file.type)) {
        throw new ImageProcessingError(`Unsupported file format: ${file.type}`);
      }

      if (file.size > MAX_IMAGE_SIZE) {
        throw new ImageProcessingError('File size exceeds maximum limit');
      }

      // Create canvas with proper type assertions
      const canvas = createCanvas(TARGET_SIZE, TARGET_SIZE);
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new ImageProcessingError('Failed to get canvas context');
      }

      // Load and draw image with error handling
      let img;
      try {
        img = await loadImage(URL.createObjectURL(file));
      } catch (error) {
        throw new ImageProcessingError(`Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Apply preprocessing steps
      ctx.drawImage(img, 0, 0, TARGET_SIZE, TARGET_SIZE);
      
      // Apply contrast enhancement if needed
      const imageData = ctx.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);
      const enhancedData = this.enhanceContrast(imageData);
      ctx.putImageData(enhancedData, 0, 0);

      // Convert to file with proper error handling
      try {
        const buffer = canvas.toBuffer('image/png');
        const processedBlob = new Blob([buffer], { type: 'image/png' });
        const processedFile = new File([processedBlob], 'processed.png', { type: 'image/png' });

        const metadata: ImageMetadata = {
          originalSize: file.size,
          format: file.type,
          preprocessingApplied: ['resizing', 'contrast_enhancement'],
          timestamp: Date.now()
        };

        return { processedImage: processedFile, metadata };
      } catch (error) {
        throw new ImageProcessingError(`Failed to create processed file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      throw new ImageProcessingError(`Failed to preprocess image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static enhanceContrast(imageData: ImageData): ImageData {
    const data = imageData.data;
    const len = data.length;
    
    // Calculate histogram
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < len; i += 4) {
      const gray = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
      histogram[gray]++;
    }
    
    // Calculate cumulative histogram
    const cdf = new Array(256).fill(0);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }
    
    // Normalize CDF
    const cdfMin = cdf.find(x => x > 0) || 0;
    const cdfMax = cdf[255];
    const range = cdfMax - cdfMin;
    
    // Apply histogram equalization
    for (let i = 0; i < len; i += 4) {
      for (let j = 0; j < 3; j++) {
        const pixel = data[i + j];
        data[i + j] = Math.round(((cdf[pixel] - cdfMin) / range) * 255);
      }
    }
    
    return imageData;
  }

  private static async measureBoneLoss(segmentationResults: SegmentationResult): Promise<{
    measurements: BoneLossMeasurement[];
    overlayCanvas: Canvas;
  }> {
    const { masks } = segmentationResults;
    const measurements: BoneLossMeasurement[] = [];
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d') as unknown as NodeCanvasContext;
    
    // Draw original segmentation
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, 512, 512);
    
    // For each tooth in the mask
    for (let toothIdx = 0; toothIdx < masks.teeth.length; toothIdx++) {
      const toothMask = masks.teeth[toothIdx];
      const boneMask = masks.bone[toothIdx];
      
      // Find CEJ point (highest point of tooth)
      const cejPoint = findCEJPoint(toothMask);
      
      // Find bone level
      const boneLevel = findBoneLevel(boneMask);
      
      // Calculate measurements
      const cejToBone = calculateDistance(cejPoint, boneLevel);
      const normalBoneLevel = 2; // Average normal bone level in mm
      const boneLossPercentage = ((cejToBone - normalBoneLevel) / normalBoneLevel) * 100;
      
      // Draw measurement overlay
      drawMeasurementOverlay(ctx, cejPoint, boneLevel, cejToBone, boneLossPercentage);
      
      // Generate probing depths based on bone loss
      const probingDepths = {
        distal: cejToBone + Math.random(),
        buccal: cejToBone + Math.random(),
        mesial: cejToBone + Math.random(),
        lingual: cejToBone + Math.random()
      };
      
      // Determine mobility grade based on bone loss
      const mobilityGrade = boneLossPercentage > 50 ? 3 : 
                           boneLossPercentage > 30 ? 2 :
                           boneLossPercentage > 15 ? 1 : 0;
      
      // Determine prognosis
      const prognosis = boneLossPercentage > 50 ? 'Poor' :
                       boneLossPercentage > 30 ? 'Fair' : 'Good';
      
      measurements.push({
        toothNumber: (toothIdx + 1).toString(),
        cejToBone,
        normalBoneLevel,
        boneLossPercentage,
        pocketDepth: cejToBone + 1, // Simplified calculation
        probingDepths,
        mobilityGrade,
        prognosis,
        severity: boneLossPercentage > 50 ? 'severe' :
                 boneLossPercentage > 30 ? 'moderate' : 'mild'
      });
    }
    
    return { measurements, overlayCanvas: canvas };
  }

  private static async detectPathologies(imageFile: File): Promise<Array<{
    type: string;
    confidence: number;
    location: string;
    bbox: [number, number, number, number];
  }>> {
    try {
      const response = await hf.objectDetection({
        model: MODELS.YOLO,
        data: imageFile
      });
      
      return response.map(detection => ({
        type: detection.label,
        confidence: detection.score,
        location: `Region ${detection.box.xmin.toFixed(0)},${detection.box.ymin.toFixed(0)}`,
        bbox: [detection.box.xmin, detection.box.ymin, detection.box.xmax, detection.box.ymax]
      }));
    } catch (error) {
      console.error('Error detecting pathologies:', error);
      throw new Error('Failed to detect pathologies');
    }
  }

  private static async processSegmentationOutput(output: unknown): Promise<SegmentationResult> {
    const TARGET_SIZE = 512;
    const emptyMask = createEmptyMask(TARGET_SIZE);
    
    try {
      if (!output || typeof output !== 'object') {
        throw new Error('Invalid segmentation output format');
      }
      
      const segOutput = output as HuggingFaceSegmentationOutput;
      
      // Convert the Hugging Face segmentation output to our expected format
      const masks = {
        teeth: segOutput[0]?.mask ? parseMaskData(segOutput[0].mask) : emptyMask,
        bone: segOutput[1]?.mask ? parseMaskData(segOutput[1].mask) : emptyMask,
        gums: segOutput[2]?.mask ? parseMaskData(segOutput[2].mask) : emptyMask
      };
      
      return {
        masks,
        measurements: []
      };
    } catch (error) {
      console.error('Error processing segmentation output:', error);
      return {
        masks: {
          teeth: emptyMask,
          bone: emptyMask,
          gums: emptyMask
        },
        measurements: []
      };
    }
  }

  static async analyzeImage(file: File): Promise<AIAnalysisResult> {
    try {
      // Simulate API call with mock data for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResponse: MockResponse = {
        findings: {
          boneLoss: {
            measurements: [
              {
                boneLossPercentage: 35,
                cejToBone: 4.2
              },
              {
                boneLossPercentage: 30,
                cejToBone: 3.8
              }
            ],
            severity: 'moderate',
            overlayImage: "data:image/png;base64,..."
          },
          pathologies: [
            {
              type: "bone_loss",
              confidence: 0.92,
              location: "Upper right molar region",
              severity: "moderate",
              bbox: [100, 150, 200, 250]
            }
          ]
        },
        confidence: 0.92,
        diagnosis: "Moderate periodontal disease with localized bone loss",
        recommendations: [
          "Deep cleaning (scaling and root planing)",
          "Improved oral hygiene routine",
          "Follow-up in 6-8 weeks"
        ],
        severity: 'moderate',
        annotations: [
          {
            type: "bone_loss",
            bbox: [100, 150, 200, 250],
            label: "bone_loss"
          }
        ]
      };

      // Transform response to AnalysisResult
      const boneLossMeasurements: AIBoneLossMeasurement[] = [
        {
          type: 'Bone Loss:Apex Y',
          value: mockResponse.findings.boneLoss.measurements[0].boneLossPercentage,
          confidence: mockResponse.confidence
        },
        {
          type: 'Bone Y',
          value: mockResponse.findings.boneLoss.measurements[1].boneLossPercentage,
          confidence: mockResponse.confidence
        },
        {
          type: 'CEJ Y',
          value: mockResponse.findings.boneLoss.measurements[0].cejToBone,
          confidence: mockResponse.confidence
        }
      ];

      return {
        diagnosis: mockResponse.diagnosis,
        confidence: mockResponse.confidence,
        findings: {
          boneLoss: {
            measurements: boneLossMeasurements,
            percentage: mockResponse.findings.boneLoss.measurements[0].boneLossPercentage,
            severity: mockResponse.findings.boneLoss.severity,
            regions: ['General'],
            confidence: mockResponse.confidence,
            overlayImage: mockResponse.findings.boneLoss.overlayImage
          },
          pathologies: mockResponse.findings.pathologies.map(p => ({
            type: p.type,
            location: p.location,
            severity: 'mild',
            confidence: p.confidence
          }))
        },
        recommendations: mockResponse.recommendations,
        severity: mockResponse.severity,
        annotations: mockResponse.annotations
      };
    } catch (error) {
      console.error('Error in AI analysis:', error);
      if (error instanceof Error) {
        throw new AIServiceError(`AI analysis failed: ${error.message}`);
      }
      throw new AIServiceError('AI analysis failed with an unknown error');
    }
  }
}

interface MockResponse {
  findings: {
    boneLoss: {
      measurements: Array<{
        boneLossPercentage: number;
        cejToBone: number;
      }>;
      severity: 'mild' | 'moderate' | 'severe';
      overlayImage?: string;
    };
    pathologies: AIPathology[];
  };
  confidence: number;
  diagnosis: string;
  recommendations: string[];
  severity: 'mild' | 'moderate' | 'severe';
  annotations?: Array<{
    type: string;
    bbox: [number, number, number, number];
    label: string;
  }>;
}