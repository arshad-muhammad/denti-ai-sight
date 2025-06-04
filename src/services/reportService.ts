import { FirebaseDentalCase } from "@/types/firebase";
import { jsPDF } from "jspdf";
import { UserOptions } from 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface EnhancedAnalysis {
  refinedPrognosis: {
    status: 'Good' | 'Fair' | 'Poor';
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

// Helper function to load and convert image to base64
const loadImage = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    throw error;
  }
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
  doc.text("Primary Diagnosis", margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(0);
  const diagnosisInfo = [
    ["Diagnosis:", caseData.diagnosis || 'N/A'],
    ["Confidence:", `${caseData.confidence}%`],
    ["Severity:", caseData.severity || 'N/A'],
    ["Bone Loss:", caseData.boneLoss ? `${caseData.boneLoss}%` : 'N/A']
  ];

  autoTable(doc, {
    ...tableOptions,
    startY: yPos,
    body: diagnosisInfo
  });

  yPos = doc.lastAutoTable.finalY + 10;

  // Enhanced Analysis Section (if available)
  if (enhancedAnalysis) {
    // Detailed Findings
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Detailed Findings", margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0);
    yPos = addWrappedText(
      enhancedAnalysis.detailedFindings.primaryCondition.description,
      margin,
      yPos,
      pageWidth - (2 * margin)
    ) + 10;

    // Treatment Plan
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Treatment Plan", margin, yPos);
    yPos += 10;

    const treatmentPlan = [
      ["Immediate:", enhancedAnalysis.detailedTreatmentPlan.immediate.join("\n")],
      ["Short-term:", enhancedAnalysis.detailedTreatmentPlan.shortTerm.join("\n")],
      ["Long-term:", enhancedAnalysis.detailedTreatmentPlan.longTerm.join("\n")],
      ["Preventive:", enhancedAnalysis.detailedTreatmentPlan.preventiveMeasures.join("\n")]
    ];

    autoTable(doc, {
      ...tableOptions,
      startY: yPos,
      body: treatmentPlan,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: pageWidth - margin - 40 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Add new page if needed
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 20;
    }

    // Prognosis
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Prognosis & Risk Assessment", margin, yPos);
    yPos += 10;

    const prognosisInfo = [
      ["Status:", enhancedAnalysis.refinedPrognosis.status],
      ["Outlook:", enhancedAnalysis.refinedPrognosis.longTermOutlook],
      ["Current Risk:", enhancedAnalysis.detailedFindings.riskAssessment.current],
      ["Future Risk:", enhancedAnalysis.detailedFindings.riskAssessment.future]
    ];

    autoTable(doc, {
      ...tableOptions,
      startY: yPos,
      body: prognosisInfo,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: pageWidth - margin - 40 }
      }
    });
  }

  // Add Annotated Radiograph section
  if (caseData.radiographUrl) {
    // Add new page for the radiograph
    doc.addPage();
    yPos = 20;

    // Add section header
    doc.setFontSize(14);
    doc.setTextColor(0, 83, 155);
    doc.text("Annotated Radiograph", margin, yPos);
    yPos += 10;

    try {
      // Load and add the radiograph image
      const imageData = await loadImage(caseData.radiographUrl);
      
      // Calculate image dimensions to fit the page while maintaining aspect ratio
      const maxWidth = pageWidth - (2 * margin);
      const maxHeight = doc.internal.pageSize.getHeight() - yPos - margin;
      
      // Create a temporary image to get dimensions
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageData;
      });
      
      let imgWidth = img.width;
      let imgHeight = img.height;
      
      // Log original image dimensions
      console.log('Original Image Dimensions:', {
        width: imgWidth,
        height: imgHeight,
        maxWidth,
        maxHeight
      });
      
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

      // Log scaled dimensions
      console.log('Scaled Image Dimensions:', {
        width: imgWidth,
        height: imgHeight,
        xPos,
        yPos
      });

      // Add the image to the PDF
      doc.addImage(imageData, 'JPEG', xPos, yPos, imgWidth, imgHeight);

      // Add annotations if pathologies exist
      if (caseData.pathologies && caseData.pathologies.length > 0) {
        drawAnnotations(
          doc, 
          caseData.pathologies, 
          xPos, 
          yPos, 
          imgWidth, 
          imgHeight,
          caseData.analysisResults?.annotations
        );
      }

      yPos += imgHeight + 10;

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

      // Add pathology annotations if available
      if (caseData.pathologies && caseData.pathologies.length > 0) {
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
          ...tableOptions,
          startY: yPos,
          head: [["Pathology", "Location", "Severity"]],
          body: pathologyInfo,
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 60 },
            2: { cellWidth: 40 }
          }
        });
      }

      // Add bone loss measurements if available
      if (caseData.boneLoss) {
        yPos = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setTextColor(0, 83, 155);
        doc.text("Bone Loss Measurements:", margin, yPos);
        yPos += 10;

        const boneLossInfo = [
          ["Overall Bone Loss:", `${caseData.boneLoss}%`],
          ["Severity:", caseData.severity || 'N/A']
        ];

        autoTable(doc, {
          ...tableOptions,
          startY: yPos,
          body: boneLossInfo,
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 40 }
          }
        });
      }

    } catch (error) {
      console.error('Error adding radiograph to report:', error);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text("Error: Could not load radiograph image", margin, yPos);
    }
  }

  // Add footer with page numbers
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