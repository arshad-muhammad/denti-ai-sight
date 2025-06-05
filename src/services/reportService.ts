import { Database } from "@/types/supabase";
import { jsPDF } from "jspdf";
import { UserOptions } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { getProxiedImageUrl } from '@/lib/services/imageProxy';
import { Prognosis } from '@/types/analysis';

type Case = {
  id: string;
  user_id: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  radiograph_url: string | null;
  patient_data: {
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
  };
  clinical_data: {
    toothNumber?: string;
    mobility?: boolean;
    bleeding?: boolean;
    sensitivity?: boolean;
    pocketDepth?: string;
    additionalNotes?: string;
    bopScore?: number;
    totalSites?: number;
    bleedingSites?: number;
    anteriorBleeding?: number;
    posteriorBleeding?: number;
    deepPocketSites?: number;
    averagePocketDepth?: number;
    riskScore?: number;
    boneLossAgeRatio?: number;
    bopFactor?: number;
    clinicalAttachmentLoss?: number;
    redFlags?: {
      hematologicDisorder?: boolean;
      necrotizingPeriodontitis?: boolean;
      leukemiaSigns?: boolean;
      details?: string;
    };
    plaqueCoverage?: number;
    smoking?: boolean;
    alcohol?: boolean;
    diabetes?: boolean;
    hypertension?: boolean;
  };
  analysis_results?: {
    diagnosis?: string;
    confidence?: number;
    severity?: string;
    findings?: {
      boneLoss?: {
        percentage: number;
        severity: string;
        regions: string[];
        measurements?: Array<{
          type: string;
          value: number;
          confidence: number;
        }>;
      };
      pathologies?: Array<{
        type: string;
        location: string;
        severity: string;
        confidence: number;
      }>;
    };
    periodontal_stage?: {
      stage: string;
      description: string;
    };
  };
  created_at: string;
  updated_at: string;
};

interface EnhancedAnalysis {
  refinedPrognosis: {
    status: Prognosis;
    explanation: string;
    riskFactors: string[];
    longTermOutlook: string;
  };
  detailedTreatmentPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    preventiveMeasures: string[];
    lifestyle: string[];
  };
  detailedFindings: {
    primaryCondition: {
      description: string;
      severity: string;
      implications: string[];
    };
    secondaryFindings: Array<{
      condition: string;
      description: string;
      severity: string;
      implications: string[];
    }>;
    riskAssessment: {
      current: string;
      future: string;
      mitigationStrategies: string[];
    };
  };
}

// Define type for jsPDF instance with AutoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Helper function to load and verify image
const loadAndVerifyImage = async (url: string): Promise<HTMLImageElement> => {
  console.log('Loading image from URL:', url);
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      console.log('Image loaded successfully:', {
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      });
      
      // Verify image has actual dimensions
      if (img.width === 0 || img.height === 0) {
        reject(new Error('Loaded image has no dimensions'));
        return;
      }
      
      resolve(img);
    };

    img.onerror = (e) => {
      console.error('Image load error:', e);
      reject(new Error('Failed to load image'));
    };

    // Set src after setting up event handlers
    img.src = url;
  });
};

// Helper function to draw annotations
const drawAnnotations = (
  doc: jsPDF,
  pathologies: Array<{ name: string; location: string; severity: string }>,
  imageX: number,
  imageY: number,
  imageWidth: number,
  imageHeight: number,
  annotations?: Array<{
    type: string;
    location: { x: number; y: number; width: number; height: number };
    severity: string;
    label: string;
  }>
) => {
  // Log raw annotation data
  console.log('Raw Annotations Data:', annotations);

  // Set up colors for different severities
  const severityColors = {
    mild: [0, 255, 0],    // Green
    moderate: [255, 165, 0], // Orange
    severe: [255, 0, 0]    // Red
  };

  // Save the current graphics state
  doc.saveGraphicsState();

  // Set up drawing styles
  doc.setLineWidth(0.5);

  // If we have precise annotations, use those
  if (annotations && annotations.length > 0) {
    console.log('Using precise annotations');
    annotations.forEach((annotation, index) => {
      // Log raw location data
      console.log('Raw Location Data:', {
        index,
        location: annotation.location
      });

      // Ensure coordinates are between 0 and 1 (assuming they're percentages)
      const normalizedX = annotation.location.x / 100;
      const normalizedY = annotation.location.y / 100;
      const normalizedWidth = annotation.location.width / 100;
      const normalizedHeight = annotation.location.height / 100;

      // Log normalized values
      console.log('Normalized Values:', {
        x: normalizedX,
        y: normalizedY,
        width: normalizedWidth,
        height: normalizedHeight
      });

      // Convert normalized coordinates to PDF coordinates
      const x = imageX + (normalizedX * imageWidth);
      const y = imageY + (normalizedY * imageHeight);
      const width = normalizedWidth * imageWidth;
      const height = normalizedHeight * imageHeight;

      // Log final coordinates
      console.log('Final PDF Coordinates:', {
        x,
        y,
        width,
        height,
        pageWidth: doc.internal.pageSize.getWidth(),
        pageHeight: doc.internal.pageSize.getHeight()
      });

      // Get color based on severity
      const color = severityColors[annotation.severity.toLowerCase() as keyof typeof severityColors] || severityColors.moderate;
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setFillColor(color[0], color[1], color[2]);

      // Draw bounding box with thicker lines for visibility
      doc.setLineWidth(1);
      doc.rect(x, y, width, height, 'S');

      // Add label with white background for better visibility
      doc.setFillColor(255, 255, 255);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.setFontSize(8);
      
      // Add background rectangle for text
      const label = `${annotation.type} (${annotation.severity})`;
      const textWidth = doc.getTextWidth(label);
      doc.rect(x, y - 10, textWidth + 4, 8, 'F');
      
      // Add text
      doc.text(label, x + 2, y - 4);
    });
  } else {
    console.log('Falling back to location-based annotations');
    // Fallback to the old method if no precise annotations are available
    pathologies.forEach((pathology, index) => {
      // Calculate position based on location description
      let x = imageX;
      let y = imageY;
      
      // Adjust position based on location keywords
      if (pathology.location.toLowerCase().includes('upper')) {
        y = imageY;
      } else if (pathology.location.toLowerCase().includes('lower')) {
        y = imageY + imageHeight - (imageHeight / 3);
      } else {
        y = imageY + (imageHeight / 2) - (imageHeight / 6);
      }

      if (pathology.location.toLowerCase().includes('right')) {
        x = imageX;
      } else if (pathology.location.toLowerCase().includes('left')) {
        x = imageX + imageWidth - (imageWidth / 3);
      } else {
        x = imageX + (imageWidth / 2) - (imageWidth / 6);
      }

      // Get color based on severity
      const color = severityColors[pathology.severity.toLowerCase() as keyof typeof severityColors] || severityColors.moderate;
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setFillColor(color[0], color[1], color[2]);

      // Draw marker
      const markerSize = 10;
      doc.circle(x + (imageWidth/6), y + (imageHeight/6), markerSize, 'S');

      // Add label
      doc.setFontSize(8);
      doc.setTextColor(color[0], color[1], color[2]);
      const label = `${index + 1}. ${pathology.name}`;
      doc.text(label, x + (imageWidth/6), y + (imageHeight/6) - markerSize - 2, { align: 'center' });
    });
  }

  // Draw bone loss indicators if available
  if (pathologies.some(p => p.name.toLowerCase().includes('bone loss'))) {
    doc.setDrawColor(255, 0, 0);
    doc.setLineWidth(0.3);
    
    // Draw vertical lines indicating bone loss
    const numLines = 5;
    const spacing = imageWidth / (numLines + 1);
    for (let i = 1; i <= numLines; i++) {
      const x = imageX + (spacing * i);
      doc.line(x, imageY, x, imageY + imageHeight);
    }
  }

  // Restore the graphics state
  doc.restoreGraphicsState();
};

// Helper function to check if we need a new page
const checkAndAddNewPage = (doc: jsPDFWithAutoTable, yPos: number, minSpaceNeeded: number = 40) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (yPos + minSpaceNeeded > pageHeight - 20) {
    doc.addPage();
    return 20; // Reset yPos to top of new page with margin
  }
  return yPos;
};

export const generatePDFReport = async (
  caseData: Case,
  enhancedAnalysis: EnhancedAnalysis | null
) => {
  // Debug logging for raw data
  console.log('Raw Analysis Results:', {
    analysisResults: caseData.analysis_results,
    radiographUrl: caseData.radiograph_url
  });

  // Debug logging
  console.log('Report Generation - Case Data:', {
    hasAnalysisResults: !!caseData.analysis_results,
    findings: caseData.analysis_results?.findings,
    severity: caseData.analysis_results?.severity
  });

  // Initialize PDF document
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper function for text wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    y = checkAndAddNewPage(doc, y, lines.length * 7);
    doc.text(lines, x, y);
    return y + (lines.length * 7);
  };

  // Add Header
  doc.setFontSize(20);
  doc.setTextColor(0, 83, 155);
  doc.text("Dental Analysis Report", margin, yPos);
  yPos += 15;

  // Add Report Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Generated: ${format(new Date(), 'PPpp')}`, margin, yPos);
  yPos += 10;

  // Add Patient Information
  doc.setFontSize(14);
  doc.setTextColor(0, 83, 155);
  doc.text("Patient Information", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(60);
  yPos = addWrappedText(`Name: ${caseData.patient_data.fullName}`, margin, yPos, pageWidth - 2 * margin);
  yPos = addWrappedText(`Age: ${caseData.patient_data.age}`, margin, yPos, pageWidth - 2 * margin);
  yPos = addWrappedText(`Gender: ${caseData.patient_data.gender}`, margin, yPos, pageWidth - 2 * margin);
  yPos += 10;

  // Add Analysis Results
  if (caseData.analysis_results) {
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Analysis Results", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(60);
    yPos = addWrappedText(`Diagnosis: ${caseData.analysis_results.diagnosis}`, margin, yPos, pageWidth - 2 * margin);
    yPos = addWrappedText(`Confidence: ${caseData.analysis_results.confidence}%`, margin, yPos, pageWidth - 2 * margin);
    yPos = addWrappedText(`Severity: ${caseData.analysis_results.severity}`, margin, yPos, pageWidth - 2 * margin);
    yPos += 10;

    // Add Findings
    if (caseData.analysis_results.findings?.pathologies?.length) {
      doc.setFontSize(12);
      doc.setTextColor(0, 83, 155);
      doc.text("Pathological Findings", margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(60);
      caseData.analysis_results.findings.pathologies.forEach(finding => {
        yPos = addWrappedText(`• ${finding.type} (${finding.severity}) - ${finding.location}`, margin, yPos, pageWidth - 2 * margin);
      });
      yPos += 10;
    }
  }

  // Add Enhanced Analysis if available
  if (enhancedAnalysis) {
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Detailed Analysis", margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 83, 155);
    doc.text("Primary Condition", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(60);
    yPos = addWrappedText(enhancedAnalysis.detailedFindings.primaryCondition.description, margin, yPos, pageWidth - 2 * margin);
    yPos += 10;

    // Add Treatment Plan
    doc.setFontSize(12);
    doc.setTextColor(0, 83, 155);
    doc.text("Treatment Plan", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(60);
    enhancedAnalysis.detailedTreatmentPlan.immediate.forEach(step => {
      yPos = addWrappedText(`• ${step}`, margin, yPos, pageWidth - 2 * margin);
    });
  }

  // Save the PDF
  doc.save(`dental-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}; 