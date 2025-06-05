import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { EnhancedAnalysis } from "@/types/analysis";

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 14, // Keep below the 15 limit
  RETRY_ATTEMPTS: 3,
  MIN_RETRY_DELAY: 24000, // 24 seconds as suggested by the API
  MAX_RETRY_DELAY: 60000, // 1 minute max delay
};

// Request tracking
let requestTimestamps: number[] = [];

const clearOldRequests = () => {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < 60000 // Remove requests older than 1 minute
  );
};

const canMakeRequest = (): boolean => {
  clearOldRequests();
  return requestTimestamps.length < RATE_LIMIT.MAX_REQUESTS_PER_MINUTE;
};

const waitForNextAvailableSlot = async (): Promise<void> => {
  clearOldRequests();
  if (canMakeRequest()) return;

  const oldestRequest = Math.min(...requestTimestamps);
  const waitTime = 60000 - (Date.now() - oldestRequest);
  await new Promise(resolve => setTimeout(resolve, waitTime));
};

const addRequest = () => {
  clearOldRequests();
  requestTimestamps.push(Date.now());
};

const exponentialBackoff = (attempt: number): number => {
  const delay = Math.min(
    RATE_LIMIT.MIN_RETRY_DELAY * Math.pow(2, attempt),
    RATE_LIMIT.MAX_RETRY_DELAY
  );
  return delay;
};

// Get the API key from Vite's environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined in environment variables. Please add it to your .env file.');
}

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Get the model with configuration
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  generationConfig: {
    temperature: 0.3,
    topK: 20,
    topP: 0.85,
    maxOutputTokens: 2048,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ],
});

// Define confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  MINIMUM_ACCEPTABLE: 0.65,
  HIGH_CONFIDENCE: 0.80,
  VERY_HIGH_CONFIDENCE: 0.90
};

// Define severity criteria based on clinical parameters
const SEVERITY_CRITERIA = {
  boneLoss: {
    mild: { min: 0, max: 30 },
    moderate: { min: 31, max: 50 },
    severe: { min: 51, max: 100 }
  },
  pocketDepth: {
    mild: { min: 0, max: 4 },
    moderate: { min: 5, max: 6 },
    severe: { min: 7, max: Infinity }
  }
};

// Define proper types for the findings to fix the 'any' type issue
interface AIFindings {
  boneLoss?: {
    percentage: number;
    severity: string;
    regions: string[];
  };
  pathologies?: Array<{
    type: string;
    location: string;
    severity: string;
    confidence: number;
  }>;
}

export interface GeminiAnalysisInput {
  diagnosis: string;
  findings: {
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
  patientData: {
    age: string | number;
    gender: string;
    medicalHistory: {
      smoking?: boolean;
      diabetes?: boolean;
      notes?: string;
      hypertension?: boolean;
      alcohol?: boolean;
      [key: string]: boolean | string | undefined;
    };
  };
}

interface GeminiAnalysisResult extends EnhancedAnalysis {
  diagnosticConfidence?: {
    overall: number;
    details: string[];
    timestamp: string;
    modelVersion: string;
  };
}

const validateResponse = (parsedResult: GeminiAnalysisResult) => {
  try {
    // Check for required top-level properties
    const requiredProperties = ['refinedPrognosis', 'detailedFindings', 'detailedTreatmentPlan'];
    for (const prop of requiredProperties) {
      if (!parsedResult[prop]) {
        throw new Error(`Missing required property: ${prop}`);
      }
    }

    // Validate detailed findings structure
    const { detailedFindings } = parsedResult;
    
    // Validate primary condition
    if (!detailedFindings.primaryCondition?.description) {
      throw new Error('Missing primary condition description');
    }
    if (!['mild', 'moderate', 'severe'].includes(detailedFindings.primaryCondition.severity)) {
      throw new Error('Invalid primary condition severity');
    }
    if (!Array.isArray(detailedFindings.primaryCondition.implications) || 
        detailedFindings.primaryCondition.implications.length === 0) {
      throw new Error('Primary condition implications must be a non-empty array');
    }

    // Validate secondary findings
    if (!Array.isArray(detailedFindings.secondaryFindings)) {
      throw new Error('Secondary findings must be an array');
    }
    for (const finding of detailedFindings.secondaryFindings) {
      if (!finding.condition || !finding.description || !finding.severity || !Array.isArray(finding.implications)) {
        throw new Error('Invalid secondary finding structure');
      }
      if (!['mild', 'moderate', 'severe'].includes(finding.severity)) {
        throw new Error('Invalid secondary finding severity');
      }
      if (finding.implications.length === 0) {
        throw new Error('Secondary finding implications must be non-empty');
      }
    }

    // Validate risk assessment
    const { riskAssessment } = detailedFindings;
    if (!riskAssessment?.current || !riskAssessment?.future || !Array.isArray(riskAssessment?.mitigationStrategies)) {
      throw new Error('Invalid risk assessment structure');
    }
    if (riskAssessment.mitigationStrategies.length === 0) {
      throw new Error('Risk mitigation strategies must be non-empty');
    }

    // Validate refined prognosis
    const { refinedPrognosis } = parsedResult;
    if (!['Good', 'Fair', 'Poor', 'Questionable'].includes(refinedPrognosis.status)) {
      throw new Error('Invalid prognosis status');
    }
    if (!refinedPrognosis.explanation || !refinedPrognosis.longTermOutlook || 
        !Array.isArray(refinedPrognosis.riskFactors) || refinedPrognosis.riskFactors.length === 0) {
      throw new Error('Invalid refined prognosis structure');
    }

    // Validate treatment plan
    const { detailedTreatmentPlan } = parsedResult;
    const treatmentSections = ['immediate', 'shortTerm', 'longTerm', 'preventiveMeasures', 'lifestyle'];
    for (const section of treatmentSections) {
      if (!Array.isArray(detailedTreatmentPlan[section]) || detailedTreatmentPlan[section].length === 0) {
        throw new Error(`Invalid treatment plan section: ${section}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
};

const validateDiagnosticCriteria = (findings: AIFindings) => {
  const validations = [];
  let confidenceScore = 0;

  // Validate bone loss measurements
  if (findings.boneLoss) {
    const { percentage, severity } = findings.boneLoss;
    const criteria = SEVERITY_CRITERIA.boneLoss[severity as keyof typeof SEVERITY_CRITERIA.boneLoss];
    if (criteria && percentage >= criteria.min && percentage <= criteria.max) {
      confidenceScore += 0.35;
      validations.push('Bone loss measurements consistent with severity assessment');
    }
  }

  // Validate pathology findings
  if (findings.pathologies && findings.pathologies.length > 0) {
    const validPathologies = findings.pathologies.filter(p => p.confidence > 0.75);
    if (validPathologies.length > 0) {
      confidenceScore += 0.35 * (validPathologies.length / findings.pathologies.length);
      validations.push('High confidence pathology detections present');
    }
  }

  // Add base confidence
  confidenceScore += 0.45;

  return {
    confidenceScore: Math.min(confidenceScore, 1),
    validations
  };
};

export const getEnhancedAnalysis = async (input: GeminiAnalysisInput): Promise<GeminiAnalysisResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  if (!input || !input.diagnosis || !input.findings) {
    throw new Error('Invalid input: Missing required fields');
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < RATE_LIMIT.RETRY_ATTEMPTS; attempt++) {
    try {
      // Wait for available request slot
      await waitForNextAvailableSlot();

      // Validate diagnostic criteria
      const { confidenceScore, validations } = validateDiagnosticCriteria(input.findings);
      
      if (confidenceScore < CONFIDENCE_THRESHOLDS.MINIMUM_ACCEPTABLE) {
        console.warn('Low confidence score, using fallback response');
        return getFallbackResponse(input, confidenceScore, validations);
      }

      // Track this request
      addRequest();

      // Construct the prompt
      const prompt = `You are a dental analysis AI assistant. Analyze the following dental case and provide a detailed assessment.
Your response must be a valid JSON object that exactly matches the required structure.

Input Data:
Diagnosis: ${input.diagnosis}
Findings: ${JSON.stringify(input.findings, null, 2)}
Patient Data: ${JSON.stringify(input.patientData, null, 2)}

Instructions:
1. Your entire response must be a single JSON object
2. Do not include any explanatory text outside the JSON
3. Do not use markdown formatting
4. All string values must be descriptive and clinically relevant
5. All arrays must have at least one item
6. Severity must be one of: "mild", "moderate", "severe"
7. All text fields should be detailed and professionally written
8. Include specific measurements and clinical terms where relevant

Required JSON Structure:
{
  "refinedPrognosis": {
    "status": "Good" | "Fair" | "Poor" | "Questionable",
    "explanation": "Detailed clinical explanation",
    "riskFactors": ["Specific risk factors"],
    "longTermOutlook": "Long-term prognosis explanation"
  },
  "detailedFindings": {
    "primaryCondition": {
      "description": "Detailed clinical description",
      "severity": "mild" | "moderate" | "severe",
      "implications": ["Clinical implications"]
    },
    "secondaryFindings": [
      {
        "condition": "Name of condition",
        "description": "Detailed description",
        "severity": "mild" | "moderate" | "severe",
        "implications": ["Clinical implications"]
      }
    ],
    "riskAssessment": {
      "current": "Current risk status description",
      "future": "Future risk projection",
      "mitigationStrategies": ["Specific mitigation strategies"]
    }
  },
  "detailedTreatmentPlan": {
    "immediate": ["Immediate actions needed"],
    "shortTerm": ["Short-term treatment steps"],
    "longTerm": ["Long-term management steps"],
    "preventiveMeasures": ["Preventive actions"],
    "lifestyle": ["Lifestyle recommendations"]
  }
}

Example severity descriptions:
- mild: "Early stage with minimal tissue involvement"
- moderate: "Progressive condition requiring intervention"
- severe: "Advanced stage with significant impact"

Base your analysis on the provided diagnosis, findings, and patient data. Ensure all descriptions are clinically accurate and professionally written.`;

      // Generate the analysis
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      
      // Detailed logging
      console.log('=== Gemini API Response Debug ===');
      console.log('Response type:', typeof text);
      console.log('Response length:', text.length);
      console.log('Raw response:', text);
      console.log('Response starts with:', text.substring(0, 100));
      console.log('Response ends with:', text.substring(text.length - 100));
      console.log('================================');
      
      // Clean and prepare the response text
      const cleanedText = text
        // Remove any markdown code blocks
        .replace(/```json\n|\n```|```/g, '')
        // Remove any leading/trailing whitespace
        .trim()
        // Remove any potential explanatory text before or after the JSON
        .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1')
        // Ensure proper JSON structure
        .replace(/,(\s*[}\]])/g, '$1');
      
      console.log('=== Cleaned Response Debug ===');
      console.log('Cleaned type:', typeof cleanedText);
      console.log('Cleaned length:', cleanedText.length);
      console.log('Cleaned response:', cleanedText);
      console.log('Cleaned starts with:', cleanedText.substring(0, 100));
      console.log('Cleaned ends with:', cleanedText.substring(cleanedText.length - 100));
      console.log('============================');
      
      // Parse and validate the response
      try {
        if (!cleanedText) {
          console.warn('Empty response, using fallback');
          return getFallbackResponse(input, 0.5, ['Empty response from API']);
        }
        
        let parsedResult;
        try {
          parsedResult = JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // Try to fix common JSON issues
          const fixedJson = cleanedText
            // Fix missing quotes around property names
            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
            // Fix single quotes
            .replace(/'/g, '"')
            // Remove trailing commas
            .replace(/,(\s*[}\]])/g, '$1');
          
          try {
            parsedResult = JSON.parse(fixedJson);
          } catch (secondError) {
            console.warn('Failed to fix JSON, using fallback');
            return getFallbackResponse(input, 0.5, ['Invalid JSON format']);
          }
        }

        if (!parsedResult || typeof parsedResult !== 'object') {
          console.warn('Invalid response structure, using fallback');
          return getFallbackResponse(input, 0.5, ['Invalid response structure']);
        }
        
        try {
          validateResponse(parsedResult);
          return parsedResult;
        } catch (validationError) {
          console.warn('Validation failed, using fallback:', validationError.message);
          return getFallbackResponse(input, 0.5, ['Failed validation: ' + validationError.message]);
        }
      } catch (error) {
        console.error('Error handling Gemini response:', error);
        console.error('Raw response:', text);
        console.error('Cleaned response:', cleanedText);
        return getFallbackResponse(input, 0.5, ['Error: ' + error.message]);
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error as Error;

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes('429')) {
        const retryDelay = exponentialBackoff(attempt);
        console.log(`Rate limit hit, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // If we've exhausted all retries
  throw lastError || new Error('Failed to get enhanced analysis after multiple retries');
};

const getFallbackResponse = (
  input: GeminiAnalysisInput,
  confidenceScore: number,
  validations: string[]
): GeminiAnalysisResult => {
  const medicalHistory = input.patientData.medicalHistory || {};
  
  return {
      refinedPrognosis: {
        status: input.findings.boneLoss?.severity === 'severe' ? 'Poor' :
             input.findings.boneLoss?.severity === 'moderate' ? 'Fair' : 'Good',
        explanation: `Based on the ${input.diagnosis}, a thorough professional evaluation is recommended for accurate prognosis.`,
        riskFactors: [
          medicalHistory.smoking ? 'Active smoker - increased risk of periodontal disease' : 'Non-smoker',
          medicalHistory.diabetes ? 'Diabetes - may affect healing and treatment response' : 'No diabetes',
          input.findings.boneLoss ? `Bone loss detected: ${input.findings.boneLoss.percentage}%` : 'Bone loss assessment needed',
          ...Object.entries(medicalHistory)
            .filter(([key, value]) => value && key !== 'notes')
            .map(([key]) => `${key.charAt(0).toUpperCase() + key.slice(1)} - requires consideration in treatment planning`)
        ],
        longTermOutlook: 'Prognosis depends on early intervention and patient compliance with recommended treatment plan.'
      },
      detailedTreatmentPlan: {
        immediate: [
          'Comprehensive periodontal examination',
          'Full mouth radiographic assessment',
          'Professional dental cleaning',
          input.findings.boneLoss ? 'Periodontal scaling and root planing' : 'Dental prophylaxis'
        ],
        shortTerm: [
          'Follow-up periodontal evaluation',
          'Assess healing and treatment response',
          'Adjust treatment plan based on response'
        ],
        longTerm: [
          'Regular periodontal maintenance every 3-4 months',
          'Annual comprehensive periodontal evaluation',
          'Regular radiographic assessment'
        ],
        preventiveMeasures: [
          'Enhanced daily oral hygiene routine',
          'Use of prescribed oral care products',
          'Regular professional dental cleanings'
        ],
        lifestyle: [
          medicalHistory.smoking ? 'Smoking cessation advised' : 'Maintain smoke-free lifestyle',
          'Balanced diet low in sugary foods',
          'Regular exercise and stress management',
          'Adequate hydration'
        ]
      },
      detailedFindings: {
        primaryCondition: {
          description: input.diagnosis,
          severity: input.findings.boneLoss?.severity || 'Requires professional evaluation',
          implications: [
            'May affect long-term tooth retention',
            'Could impact overall oral health',
            'May require ongoing periodontal maintenance'
          ]
        },
        secondaryFindings: input.findings.pathologies?.map(p => ({
          condition: p.type,
          description: `Found in ${p.location}`,
          severity: p.severity,
          implications: ['May affect treatment planning', 'Requires monitoring']
        })) || [],
        riskAssessment: {
          current: `Current risk level based on findings and medical history: ${
            medicalHistory.smoking || medicalHistory.diabetes ? 'High' : 'Moderate'
          }`,
          future: 'Long-term prognosis dependent on treatment compliance and risk factor management',
          mitigationStrategies: [
            'Regular professional dental care',
            'Optimal home care routine',
            'Management of systemic conditions',
            'Regular monitoring and assessment'
          ]
        }
      },
      diagnosticConfidence: {
        overall: confidenceScore,
        details: validations,
        timestamp: new Date().toISOString(),
        modelVersion: "1.0"
      }
    };
}; 