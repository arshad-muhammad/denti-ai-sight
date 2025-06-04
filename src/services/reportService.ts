import { FirebaseDentalCase } from "@/types/firebase";
import { jsPDF } from "jspdf";
import { UserOptions } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { getProxiedImageUrl } from '@/lib/services/imageProxy';
import { Prognosis } from '@/types/analysis';

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
  caseData: FirebaseDentalCase,
  enhancedAnalysis: EnhancedAnalysis | null
) => {
  // Debug logging for raw data
  console.log('Raw Analysis Results:', {
    analysisResults: caseData.analysisResults,
    radiographUrl: caseData.radiographUrl
  });

  // Debug logging
  console.log('Report Generation - Case Data:', {
    hasAnalysisResults: !!caseData.analysisResults,
    annotations: caseData.analysisResults?.annotations,
    pathologies: caseData.pathologies
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

  // Add radiograph image if available
  if (caseData.radiographUrl) {
    try {
      console.log('Starting radiograph processing for PDF...');
      
      // Add new page for the radiograph
      doc.addPage();
      const radiographPage = doc.getNumberOfPages();
      
      // Get proxied URL to handle CORS
      console.log('Getting proxied URL for:', caseData.radiographUrl);
      const proxiedUrl = await getProxiedImageUrl(caseData.radiographUrl);
      console.log('Proxied URL obtained:', proxiedUrl);

      // Load and verify the image
      const img = await loadAndVerifyImage(proxiedUrl);
      console.log('Image loaded and verified');

      // Create a canvas with specific dimensions
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Draw the image with error handling
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log('Image drawn to canvas successfully');
      } catch (drawError) {
        console.error('Error drawing image to canvas:', drawError);
        throw new Error('Failed to draw image to canvas');
      }

      // Convert to base64 with error handling
      let imgData: string;
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.95);
        console.log('Canvas converted to data URL successfully');
        
        if (!imgData.startsWith('data:image/jpeg;base64,')) {
          throw new Error('Invalid data URL format');
        }
      } catch (dataUrlError) {
        console.error('Error converting canvas to data URL:', dataUrlError);
        throw new Error('Failed to convert image to proper format');
      }

      // Clean up the blob URL
      URL.revokeObjectURL(proxiedUrl);

      // Calculate dimensions to fit in PDF
      const pdfWidth = doc.internal.pageSize.getWidth() - (2 * margin);
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add image to PDF with error handling
      try {
        doc.setPage(radiographPage);
        doc.addImage(imgData, 'JPEG', margin, margin, pdfWidth, pdfHeight);
        console.log('Image added to PDF successfully');
      } catch (pdfError) {
        console.error('Error adding image to PDF:', pdfError);
        throw new Error('Failed to add image to PDF document');
      }

      // Add caption
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Dental Radiograph', pageWidth / 2, margin + pdfHeight + 10, { align: 'center' });

      // Return to first page
      doc.setPage(1);
      
    } catch (error) {
      console.error('Error processing radiograph for PDF:', error);
      // Add detailed error message to PDF
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      yPos = checkAndAddNewPage(doc, yPos, 20);
      doc.text(`* Radiograph image could not be loaded: ${errorMessage}`, margin, yPos);
      yPos += 10;
    }
  }

  // Before adding any section, check if we need a new page
  yPos = checkAndAddNewPage(doc, yPos, 40);

  // Patient Information Section
  doc.setFontSize(14);
  doc.setTextColor(0, 83, 155);
  doc.text("Patient Information", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(0);
  const patientInfo = [
    ["Name:", caseData.patientName],
    ["Age:", `${caseData.patientAge} years`],
    ["Gender:", caseData.patientGender],
    ["Contact:", `${caseData.patientContact?.phone || 'N/A'}`],
    ["Email:", `${caseData.patientContact?.email || 'N/A'}`]
  ];

  const tableOptions: UserOptions = {
    startY: yPos,
    head: [],
    body: patientInfo,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 100 }
    }
  };

  autoTable(doc, tableOptions);
  yPos = doc.lastAutoTable.finalY + 10;

  // Primary Diagnosis Section
  doc.setFontSize(14);
  doc.setTextColor(0, 83, 155);
  doc.text("Primary Diagnosis & Measurements", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(0);
  const diagnosisInfo = [
    ["Diagnosis:", caseData.diagnosis || 'N/A'],
    ["Confidence:", `${caseData.confidence}%`],
    ["Severity:", caseData.severity || 'N/A'],
    ["Bone Loss:", caseData.boneLoss ? `${caseData.boneLoss}%` : 'N/A'],
    ["Periodontal Stage:", caseData.analysisResults?.periodontalStage?.stage || 'N/A'],
    ["Prognosis:", caseData.prognosis || 'N/A']
  ];

  autoTable(doc, {
    ...tableOptions,
    startY: yPos,
    body: diagnosisInfo
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Add bone measurements if available
  if (caseData.analysisResults?.findings?.boneLoss?.measurements) {
    doc.setFontSize(12);
    doc.setTextColor(0, 83, 155);
    doc.text("Detailed Measurements", margin, yPos);
    yPos += 10;

    // Create measurements table data
    const measurements = caseData.analysisResults.findings.boneLoss.measurements;
    const cejY = measurements.find(m => m.type === 'CEJ Y')?.value;
    const boneY = measurements.find(m => m.type === 'Bone Y')?.value;
    const apexY = measurements.find(m => m.type === 'Bone Loss:Apex Y')?.value;

    const measurementData = [
      ["CEJ Position", cejY?.toFixed(1) || 'N/A', 'mm'],
      ["Bone Level", boneY?.toFixed(1) || 'N/A', 'mm'],
      ["Apex Position", apexY?.toFixed(1) || 'N/A', 'mm'],
      ["Root Length", (cejY !== undefined && apexY !== undefined) ? 
        (apexY - cejY).toFixed(1) : 'N/A', 'mm'],
      ["CEJ to Bone", (cejY !== undefined && boneY !== undefined) ?
        (boneY - cejY).toFixed(1) : 'N/A', 'mm'],
      ["Bone Loss", `${caseData.boneLoss || 'N/A'}`, '%'],
      ["Periodontal Stage", caseData.analysisResults.periodontalStage?.stage || 'N/A', '']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [["Measurement", "Value", "Unit"]],
      body: measurementData,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Annotated Radiograph section
  if (caseData.radiographUrl) {
    try {
      // Add new page for the radiograph
      doc.addPage();
      yPos = 20;

      // Add section header
      doc.setFontSize(14);
      doc.setTextColor(0, 83, 155);
      doc.text("Annotated Radiograph", margin, yPos);
      yPos += 10;

      // Add description
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("AI annotations highlighting detected pathologies", margin, yPos);
      yPos += 15;

      // Get the annotated radiograph element
      const annotatedRadiograph = document.getElementById('annotated-radiograph');
      if (!annotatedRadiograph) {
        throw new Error('Could not find annotated radiograph element');
      }

      // Capture the element with annotations using html2canvas
      const canvas = await html2canvas(annotatedRadiograph, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      // Convert canvas to image data
      const imageData = canvas.toDataURL('image/jpeg', 1.0);

      // Calculate dimensions to fit the page while maintaining aspect ratio
      const maxWidth = pageWidth - (2 * margin);
      const maxHeight = doc.internal.pageSize.getHeight() - yPos - (margin * 2); // Leave space for legend

      let imgWidth = canvas.width;
      let imgHeight = canvas.height;

      // Scale image to fit page
      if (imgWidth > maxWidth) {
        const ratio = maxWidth / imgWidth;
        imgWidth = maxWidth;
        imgHeight *= ratio;
      }
      if (imgHeight > maxHeight) {
        const ratio = maxHeight / imgHeight;
        imgHeight = maxHeight;
        imgWidth *= ratio;
      }

      // Calculate x position to center the image
      const xPos = margin + (maxWidth - imgWidth) / 2;

      // Add the captured image to the PDF
      doc.addImage(imageData, 'JPEG', xPos, yPos, imgWidth, imgHeight);

      yPos += imgHeight + 15;

      // Add legend
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text("Legend:", margin, yPos);
      yPos += 5;

      const legendItems = [
        { color: [0, 255, 0], text: "Mild" },
        { color: [255, 165, 0], text: "Moderate" },
        { color: [255, 0, 0], text: "Severe" }
      ];

      legendItems.forEach((item, index) => {
        const x = margin + (index * 60);
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.circle(x, yPos, 3, 'F');
        doc.setTextColor(0);
        doc.text(item.text, x + 7, yPos + 1);
      });

      yPos += 15;

      // Add pathology list
      if (caseData.pathologies && caseData.pathologies.length > 0) {
        yPos += 10;
        doc.setFontSize(12);
        doc.setTextColor(0, 83, 155);
        doc.text("Detected Pathologies:", margin, yPos);
        yPos += 10;

        const pathologyInfo = caseData.pathologies.map(pathology => [
          pathology.name,
          pathology.location,
          pathology.severity.toUpperCase()
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Pathology", "Location", "Severity"]],
          body: pathologyInfo,
          theme: 'plain',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 60 },
            2: { cellWidth: 40 }
          }
        });

        yPos = doc.lastAutoTable.finalY + 10;
      }

    } catch (error) {
      console.error('Error adding radiograph to report:', error);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text("Error: Could not load radiograph image", margin, yPos);
    }
  }

  // Enhanced Analysis Section (if available)
  if (enhancedAnalysis) {
    // Add new page for detailed findings
    doc.addPage();
    yPos = 20;
    
    // Detailed Findings
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Detailed Findings", margin, yPos);
    yPos += 10;

    // Primary Condition
    doc.setFontSize(12);
    doc.setTextColor(0, 83, 155);
    doc.text("Primary Condition", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0);
    yPos = addWrappedText(
      enhancedAnalysis.detailedFindings.primaryCondition.description,
      margin,
      yPos,
      pageWidth - (2 * margin)
    ) + 10;

    // Clinical Implications
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Clinical Implications:", margin, yPos);
    yPos += 10;

    enhancedAnalysis.detailedFindings.primaryCondition.implications.forEach(imp => {
      yPos = addWrappedText(
        `• ${imp}`,
        margin + 10,
        yPos,
        pageWidth - (2 * margin) - 10
      ) + 5;
    });
    yPos += 10;

    // Secondary Findings
    if (enhancedAnalysis.detailedFindings.secondaryFindings.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 83, 155);
      doc.text("Secondary Findings", margin, yPos);
      yPos += 10;

      enhancedAnalysis.detailedFindings.secondaryFindings.forEach(finding => {
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(finding.condition, margin, yPos);
        yPos += 7;

        yPos = addWrappedText(
          finding.description,
          margin + 10,
          yPos,
          pageWidth - (2 * margin) - 10
        ) + 5;

        doc.text("Implications:", margin + 10, yPos);
        yPos += 7;

        finding.implications.forEach(imp => {
          yPos = addWrappedText(
            `• ${imp}`,
            margin + 20,
            yPos,
            pageWidth - (2 * margin) - 20
          ) + 5;
        });
        yPos += 5;
      });
    }

    // Add new page if needed
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Risk Assessment
    doc.setFontSize(12);
    doc.setTextColor(0, 83, 155);
    doc.text("Risk Assessment", margin, yPos);
    yPos += 10;

    const riskAssessment = [
      ["Current Risk:", enhancedAnalysis.detailedFindings.riskAssessment.current],
      ["Future Risk:", enhancedAnalysis.detailedFindings.riskAssessment.future]
    ];

    autoTable(doc, {
      ...tableOptions,
      startY: yPos,
      body: riskAssessment
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Mitigation Strategies
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Risk Mitigation Strategies:", margin, yPos);
    yPos += 7;

    enhancedAnalysis.detailedFindings.riskAssessment.mitigationStrategies.forEach(strategy => {
      yPos = addWrappedText(
        `• ${strategy}`,
        margin + 10,
        yPos,
        pageWidth - (2 * margin) - 10
      ) + 5;
    });
    yPos += 10;

    // Treatment Plan
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Comprehensive Treatment Plan", margin, yPos);
    yPos += 10;

    // Immediate Actions
    if (enhancedAnalysis.detailedTreatmentPlan.immediate.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 83, 155);
      doc.text("Immediate Actions", margin, yPos);
      yPos += 7;

      enhancedAnalysis.detailedTreatmentPlan.immediate.forEach(action => {
        yPos = addWrappedText(
          `• ${action}`,
          margin + 10,
          yPos,
          pageWidth - (2 * margin) - 10
        ) + 5;
      });
      yPos += 5;
    }

    // Short-term Plan
    if (enhancedAnalysis.detailedTreatmentPlan.shortTerm.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 83, 155);
      doc.text("Short-term Plan", margin, yPos);
      yPos += 7;

      enhancedAnalysis.detailedTreatmentPlan.shortTerm.forEach(action => {
        yPos = addWrappedText(
          `• ${action}`,
          margin + 10,
          yPos,
          pageWidth - (2 * margin) - 10
        ) + 5;
      });
      yPos += 5;
    }

    // Long-term Plan
    if (enhancedAnalysis.detailedTreatmentPlan.longTerm.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 83, 155);
      doc.text("Long-term Plan", margin, yPos);
      yPos += 7;

      enhancedAnalysis.detailedTreatmentPlan.longTerm.forEach(action => {
        yPos = addWrappedText(
          `• ${action}`,
          margin + 10,
          yPos,
          pageWidth - (2 * margin) - 10
        ) + 5;
      });
      yPos += 5;
    }

    // Preventive Measures
    if (enhancedAnalysis.detailedTreatmentPlan.preventiveMeasures.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 83, 155);
      doc.text("Preventive Measures", margin, yPos);
      yPos += 7;

      enhancedAnalysis.detailedTreatmentPlan.preventiveMeasures.forEach(measure => {
        yPos = addWrappedText(
          `• ${measure}`,
          margin + 10,
          yPos,
          pageWidth - (2 * margin) - 10
        ) + 5;
      });
      yPos += 5;
    }

    // Lifestyle Recommendations
    if (enhancedAnalysis.detailedTreatmentPlan.lifestyle.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 83, 155);
      doc.text("Lifestyle Recommendations", margin, yPos);
      yPos += 7;

      enhancedAnalysis.detailedTreatmentPlan.lifestyle.forEach(rec => {
        yPos = addWrappedText(
          `• ${rec}`,
          margin + 10,
          yPos,
          pageWidth - (2 * margin) - 10
        ) + 5;
      });
    }
  }

  // Before saving, ensure all content fits
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }

  // Save the PDF
  const fileName = `dental_report_${caseData.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}; 