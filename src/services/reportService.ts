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
  autoTable: (options: UserOptions) => void;
  lastAutoTable: {
    finalY: number;
  };
  internal: {
    pageSize: {
      width: number;
      height: number;
      getWidth: () => number;
      getHeight: () => number;
    };
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

// Helper function to update currentY after autoTable
const updateCurrentY = (doc: jsPDFWithAutoTable): number => {
  return doc.lastAutoTable.finalY + 10;
};

// Helper function to check and add new page if needed
const checkAndAddNewPage = (doc: jsPDFWithAutoTable, currentY: number, minSpaceNeeded: number = 40): number => {
  if (currentY > doc.internal.pageSize.getHeight() - minSpaceNeeded) {
    doc.addPage();
    return 20;
  }
  return currentY;
};

export const generatePDFReport = async (
  caseData: Case,
  enhancedAnalysis: EnhancedAnalysis | null
) => {
  console.log('Starting PDF generation with data:', { caseData, enhancedAnalysis });
  try {
    console.log('Starting PDF generation...');
    const doc = new jsPDF() as jsPDFWithAutoTable;
    let currentY = 10;

    // Add header with logo and clinic info
    doc.setFontSize(20);
    doc.setTextColor(0, 102, 204);
    doc.text('PerioVision AI Report', 105, currentY, { align: 'center' });
    currentY += 15;

    // Add report date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${format(new Date(), 'PPpp')}`, 105, currentY, { align: 'center' });
    currentY += 10;

    // Patient Information Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Patient Information', 14, currentY);
    currentY += 5;

    const patientInfo = [
      ['Full Name', caseData.patient_data.fullName],
      ['Age', caseData.patient_data.age],
      ['Gender', caseData.patient_data.gender],
      ['Phone', caseData.patient_data.phone],
      ['Email', caseData.patient_data.email],
      ['Address', caseData.patient_data.address]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [],
      body: patientInfo,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      }
    });
    currentY = updateCurrentY(doc);

    // Medical History Section
    doc.setFontSize(14);
    doc.text('Medical History', 14, currentY);
    currentY += 5;

    const medicalHistory = [
      ['Smoking', caseData.patient_data.smoking ? 'Yes' : 'No'],
      ['Alcohol', caseData.patient_data.alcohol ? 'Yes' : 'No'],
      ['Diabetes', caseData.patient_data.diabetes ? 'Yes' : 'No'],
      ['Hypertension', caseData.patient_data.hypertension ? 'Yes' : 'No'],
      ['Chief Complaint', caseData.patient_data.chiefComplaint || 'None reported'],
      ['Additional Notes', caseData.patient_data.medicalHistory || 'None']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [],
      body: medicalHistory,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      }
    });
    currentY = updateCurrentY(doc);

    // Primary Analysis Results
    doc.setFontSize(14);
    doc.text('Primary Analysis Results', 14, currentY);
    currentY += 5;

    const primaryAnalysis = [
      ['Diagnosis', caseData.analysis_results?.diagnosis || 'Not available'],
      ['Confidence', caseData.analysis_results?.confidence ? `${Math.round(caseData.analysis_results.confidence * 100)}%` : 'N/A'],
      ['Severity', caseData.analysis_results?.severity?.toUpperCase() || 'Not determined'],
      ['Bone Loss', caseData.analysis_results?.findings?.boneLoss?.percentage 
        ? `${caseData.analysis_results.findings.boneLoss.percentage.toFixed(1)}% (${caseData.analysis_results.findings.boneLoss.severity})` 
        : 'Not measured'],
      ['Affected Regions', caseData.analysis_results?.findings?.boneLoss?.regions?.join(', ') || 'None specified'],
      ['Periodontal Stage', `${caseData.analysis_results?.periodontal_stage?.stage || 'Not determined'}`],
      ['Stage Description', caseData.analysis_results?.periodontal_stage?.description || 'Not available']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [],
      body: primaryAnalysis,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      }
    });
    currentY = updateCurrentY(doc);

    // Enhanced Analysis Section (if available)
    if (enhancedAnalysis) {
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text('Enhanced Analysis', 14, currentY);
      currentY += 5;

      // Primary Condition Details
      const primaryCondition = [
        ['Description', enhancedAnalysis.detailedFindings.primaryCondition.description],
        ['Severity', enhancedAnalysis.detailedFindings.primaryCondition.severity.toUpperCase()],
        ['Clinical Implications', enhancedAnalysis.detailedFindings.primaryCondition.implications.join('\n')]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Primary Condition Details']],
        body: primaryCondition,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' }
        }
      });
      currentY = updateCurrentY(doc);

      // Risk Assessment
      if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      }

      const riskAssessment = [
        ['Current Risk', enhancedAnalysis.detailedFindings.riskAssessment.current],
        ['Future Projection', enhancedAnalysis.detailedFindings.riskAssessment.future],
        ['Mitigation Strategies', enhancedAnalysis.detailedFindings.riskAssessment.mitigationStrategies.join('\n')]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['Risk Assessment']],
        body: riskAssessment,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' }
        }
      });
      currentY = updateCurrentY(doc);

      // Secondary Findings
      if (enhancedAnalysis.detailedFindings.secondaryFindings.length > 0) {
        if (currentY > doc.internal.pageSize.height - 60) {
          doc.addPage();
          currentY = 20;
        }

        const secondaryFindings = enhancedAnalysis.detailedFindings.secondaryFindings.map(finding => [
          finding.condition,
          finding.description,
          finding.severity.toUpperCase(),
          finding.implications.join('\n')
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Condition', 'Description', 'Severity', 'Implications']],
          body: secondaryFindings,
          theme: 'striped',
          styles: { fontSize: 10, cellPadding: 2 }
        });
        currentY = updateCurrentY(doc);
      }

      // Treatment Plan
      if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text('Treatment Plan', 14, currentY);
      currentY += 5;

      const treatmentPlan = [
        ['Immediate Actions', enhancedAnalysis.detailedTreatmentPlan.immediate.join('\n')],
        ['Short-term Plan', enhancedAnalysis.detailedTreatmentPlan.shortTerm.join('\n')],
        ['Long-term Plan', enhancedAnalysis.detailedTreatmentPlan.longTerm.join('\n')],
        ['Preventive Measures', enhancedAnalysis.detailedTreatmentPlan.preventiveMeasures.join('\n')],
        ['Lifestyle Recommendations', enhancedAnalysis.detailedTreatmentPlan.lifestyle.join('\n')]
      ];

      autoTable(doc, {
        startY: currentY,
        head: [],
        body: treatmentPlan,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 'auto' }
        }
      });
      currentY = updateCurrentY(doc);
    }

    // Clinical Measurements
    if (currentY > doc.internal.pageSize.height - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.text('Clinical Measurements', 14, currentY);
    currentY += 5;

    const clinicalData = [
      ['BoP Score', caseData.clinical_data?.bopScore ? `${caseData.clinical_data.bopScore.toFixed(1)}%` : 'Not measured'],
      ['Total Sites', caseData.clinical_data?.totalSites?.toString() || 'Not recorded'],
      ['Bleeding Sites', caseData.clinical_data?.bleedingSites?.toString() || 'Not recorded'],
      ['Deep Pocket Sites', caseData.clinical_data?.deepPocketSites?.toString() || 'Not recorded'],
      ['Average Pocket Depth', caseData.clinical_data?.averagePocketDepth ? `${caseData.clinical_data.averagePocketDepth.toFixed(1)} mm` : 'Not measured'],
      ['Clinical Attachment Loss', caseData.clinical_data?.clinicalAttachmentLoss ? `${caseData.clinical_data.clinicalAttachmentLoss.toFixed(1)} mm` : 'Not measured']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [],
      body: clinicalData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' }
      }
    });

    // Add radiograph if available
    if (caseData.radiograph_url) {
      doc.addPage();
      try {
        const img = await loadAndVerifyImage(caseData.radiograph_url);
        
        // Calculate dimensions to fit the page while maintaining aspect ratio
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxWidth = pageWidth - (2 * margin);
        const maxHeight = pageHeight - (2 * margin);
        
        let imgWidth = img.width;
        let imgHeight = img.height;
        
        // Scale down if necessary
        if (imgWidth > maxWidth) {
          const ratio = maxWidth / imgWidth;
          imgWidth = maxWidth;
          imgHeight = imgHeight * ratio;
        }
        
        if (imgHeight > maxHeight) {
          const ratio = maxHeight / imgHeight;
          imgHeight = maxHeight;
          imgWidth = imgWidth * ratio;
        }
        
        // Center the image
        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;
        
        doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
        
        // Add caption
        doc.setFontSize(12);
        doc.text('Dental Radiograph', pageWidth / 2, y + imgHeight + 10, { align: 'center' });
        
      } catch (error) {
        console.error('Error adding radiograph to PDF:', error);
        doc.text('Error: Could not load radiograph image', 14, currentY);
      }
    }

    // Save the PDF
    doc.save(`PerioVision_Report_${caseData.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    console.log('PDF generation completed successfully');

  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}; 