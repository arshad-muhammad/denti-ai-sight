import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { EnhancedAnalysis } from "@/types/analysis";

// Get the API key from Vite's environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined in environment variables. Please add it to your .env file.');
}

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Get the model with configuration
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
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

interface GeminiAnalysisInput {
  diagnosis: string;
  findings: AIFindings;
  patientData: {
    age: number;
    gender: string;
    medicalHistory: {
      smoking: boolean;
      alcohol: boolean;
      diabetes: boolean;
      hypertension: boolean;
      notes: string;
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
    const requiredProperties = ['refinedPrognosis', 'detailedTreatmentPlan', 'detailedFindings'];
    for (const prop of requiredProperties) {
      if (!parsedResult[prop]) {
        console.warn(`Missing required property: ${prop}`);
        return false;
      }
    }

    // Validate detailed findings
    const { detailedFindings } = parsedResult;
    if (!detailedFindings.primaryCondition?.description) {
      console.warn('Missing primary condition description');
      return false;
    }

    // Check for minimum description length and content quality
    const description = detailedFindings.primaryCondition.description;
    if (description.length < 50) {
      console.warn('Primary condition description too short');
    return false;
  }

  // Verify measurement inclusions
    if (!description.match(/\d+(?:\.\d+)?(?:\s*%|\s*mm)/)) {
      console.warn('Missing numerical measurements in description');
    return false;
  }

    // Check for required clinical terminology
  const requiredTerms = ['periodontal', 'radiographic', 'clinical'];
    const hasRequiredTerms = requiredTerms.some(term => 
      description.toLowerCase().includes(term)
    );
    if (!hasRequiredTerms) {
      console.warn('Missing required clinical terminology');
      return false;
    }

    // Validate treatment plan
    const { detailedTreatmentPlan } = parsedResult;
    if (!detailedTreatmentPlan.immediate?.length || !detailedTreatmentPlan.longTerm?.length) {
      console.warn('Missing treatment plan details');
      return false;
    }

    // Validate prognosis
    const { refinedPrognosis } = parsedResult;
    if (!['Good', 'Fair', 'Poor', 'Questionable'].includes(refinedPrognosis.status)) {
      console.warn('Invalid prognosis status');
    return false;
  }

  return true;
  } catch (error) {
    console.error('Error during response validation:', error);
    return false;
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
    console.error('Missing Gemini API key. Environment:', {
      hasKey: !!GEMINI_API_KEY,
      envVars: Object.keys(import.meta.env).filter(key => key.includes('GEMINI'))
    });
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  // Add error handling for input validation
  if (!input || !input.diagnosis || !input.findings) {
    throw new Error('Invalid input: Missing required fields');
  }

  // Validate input findings and calculate initial confidence
  const { confidenceScore, validations } = validateDiagnosticCriteria(input.findings);
  
  if (confidenceScore < CONFIDENCE_THRESHOLDS.MINIMUM_ACCEPTABLE) {
    console.warn('Low confidence in diagnostic criteria:', confidenceScore);
  }

  const basePrompt = `You are an advanced dental AI diagnostic system with expertise in periodontal and radiographic analysis. 
Analyze the following case and provide a detailed response in JSON format.

CASE DETAILS:
Primary Diagnosis: ${input.diagnosis}
Clinical Findings: ${JSON.stringify(input.findings, null, 2)}

Patient Profile:
- Age: ${input.patientData.age}
- Gender: ${input.patientData.gender}
- Medical History: ${JSON.stringify(input.patientData.medicalHistory, null, 2)}

IMPORTANT: Your response MUST:
1. Include specific measurements (in mm or %)
2. Use clinical terminology
3. Provide detailed descriptions (minimum 50 words)
4. Follow the exact JSON structure below
5. Include all required fields

Required JSON format:
{
  "refinedPrognosis": {
    "status": "Good|Fair|Poor|Questionable",
    "explanation": "string",
    "riskFactors": ["string"],
    "longTermOutlook": "string"
  },
  "detailedTreatmentPlan": {
    "immediate": ["string"],
    "shortTerm": ["string"],
    "longTerm": ["string"],
    "preventiveMeasures": ["string"],
    "lifestyle": ["string"]
  },
  "detailedFindings": {
    "primaryCondition": {
      "description": "string (min 50 words, include measurements)",
      "severity": "string",
      "implications": ["string"]
    },
    "secondaryFindings": [
      {
        "condition": "string",
        "description": "string",
        "severity": "string",
        "implications": ["string"]
      }
    ],
    "riskAssessment": {
      "current": "string",
      "future": "string",
      "mitigationStrategies": ["string"]
    }
  }
}`;

  try {
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (attempts < maxAttempts) {
      try {
        const result = await model.generateContent(basePrompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }

        const parsedResult = JSON.parse(jsonMatch[0]);
        
        // Validate the response
          if (!validateResponse(parsedResult)) {
          throw new Error('Response validation failed');
        }

        // Add confidence metrics
        return {
          ...parsedResult,
          diagnosticConfidence: {
            overall: confidenceScore,
            details: validations,
            timestamp: new Date().toISOString(),
            modelVersion: "gemini-1.5-flash"
          }
        };
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempts + 1} failed:`, error);
        attempts++;
        
        // Add delay between retries
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    // If all attempts fail, throw the last error
    throw new Error(`Failed to generate valid analysis after ${maxAttempts} attempts: ${lastError?.message}`);
  } catch (error) {
    console.error('Error in getEnhancedAnalysis:', error);
    throw error;
  }
};

const getFallbackResponse = (
  input: GeminiAnalysisInput,
  confidenceScore: number,
  validations: string[]
): GeminiAnalysisResult => {
  return {
      refinedPrognosis: {
        status: input.findings.boneLoss?.severity === 'severe' ? 'Poor' :
             input.findings.boneLoss?.severity === 'moderate' ? 'Fair' : 'Good',
        explanation: `Based on the ${input.diagnosis}, a thorough professional evaluation is recommended for accurate prognosis.`,
        riskFactors: [
          input.patientData.medicalHistory.smoking ? 'Active smoker - increased risk of periodontal disease' : 'Non-smoker',
          input.patientData.medicalHistory.diabetes ? 'Diabetes - may affect healing and treatment response' : 'No diabetes',
          input.findings.boneLoss ? `Bone loss detected: ${input.findings.boneLoss.percentage}%` : 'Bone loss assessment needed',
          ...Object.entries(input.patientData.medicalHistory)
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
          input.patientData.medicalHistory.smoking ? 'Smoking cessation advised' : 'Maintain smoke-free lifestyle',
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
            input.patientData.medicalHistory.smoking || input.patientData.medicalHistory.diabetes ? 'High' : 'Moderate'
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