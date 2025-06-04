import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Get the API key from Vite's environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined in environment variables. Please add it to your .env file.');
}

// Initialize the Gemini API with safety settings
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Configure the model with optimized settings for dental diagnosis
const modelConfig = {
  model: "gemini-1.0-pro",
  generationConfig: {
    temperature: 0.3, // Lower temperature for more focused and consistent outputs
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
};

// Define confidence thresholds
const CONFIDENCE_THRESHOLDS = {
  MINIMUM_ACCEPTABLE: 0.75,
  HIGH_CONFIDENCE: 0.85,
  VERY_HIGH_CONFIDENCE: 0.92
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

interface GeminiAnalysisResult {
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
  diagnosticConfidence?: {
    overall: number;
    details: string[];
    timestamp: string;
    modelVersion: string;
  };
}

// Add validation helper functions
const validateResponse = (parsedResult: GeminiAnalysisResult) => {
  // Ensure detailed descriptions
  if (parsedResult.detailedFindings.primaryCondition.description.length < 50) {
    return false;
  }

  // Verify measurement inclusions
  if (!parsedResult.detailedFindings.primaryCondition.description.match(/\d+/)) {
    return false;
  }

  // Check for specific terminology
  const requiredTerms = ['periodontal', 'radiographic', 'clinical'];
  if (!requiredTerms.some(term => 
    parsedResult.detailedFindings.primaryCondition.description.toLowerCase().includes(term))) {
    return false;
  }

  return true;
};

const validateDiagnosticCriteria = (findings: AIFindings) => {
  const validations = [];
  let confidenceScore = 0;

  // Validate bone loss measurements
  if (findings.boneLoss) {
    const { percentage, severity } = findings.boneLoss;
    const criteria = SEVERITY_CRITERIA.boneLoss[severity as keyof typeof SEVERITY_CRITERIA.boneLoss];
    if (criteria && percentage >= criteria.min && percentage <= criteria.max) {
      confidenceScore += 0.3;
      validations.push('Bone loss measurements consistent with severity assessment');
    }
  }

  // Validate pathology findings
  if (findings.pathologies && findings.pathologies.length > 0) {
    const validPathologies = findings.pathologies.filter(p => p.confidence > 0.8);
    if (validPathologies.length > 0) {
      confidenceScore += 0.3 * (validPathologies.length / findings.pathologies.length);
      validations.push('High confidence pathology detections present');
    }
  }

  // Add base confidence
  confidenceScore += 0.4; // Base confidence for the model

  return {
    confidenceScore: Math.min(confidenceScore, 1),
    validations
  };
};

export const getEnhancedAnalysis = async (input: GeminiAnalysisInput): Promise<GeminiAnalysisResult> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  // Validate input findings and calculate initial confidence
  const { confidenceScore, validations } = validateDiagnosticCriteria(input.findings);
  
  if (confidenceScore < CONFIDENCE_THRESHOLDS.MINIMUM_ACCEPTABLE) {
    console.warn('Low confidence in diagnostic criteria:', confidenceScore);
  }

  const basePrompt = `You are an advanced dental AI diagnostic system with expertise in periodontal and radiographic analysis. 
Provide a high-confidence diagnostic assessment based on the following case data.

DIAGNOSTIC CRITERIA:
- Initial confidence score: ${(confidenceScore * 100).toFixed(1)}%
- Validation points: ${validations.join(', ')}

CASE DETAILS:
Primary Diagnosis: ${input.diagnosis}
Clinical Findings: ${JSON.stringify(input.findings, null, 2)}

Patient Profile:
- Age: ${input.patientData.age}
- Gender: ${input.patientData.gender}
- Medical History: ${JSON.stringify(input.patientData.medicalHistory, null, 2)}

ANALYSIS REQUIREMENTS:
1. Focus on evidence-based findings with clear measurements
2. Correlate radiographic findings with clinical data
3. Consider patient-specific risk factors and modifiers
4. Provide confidence levels for each major finding
5. Include differential diagnoses where applicable
6. Specify measurement methods and diagnostic criteria used

DIAGNOSTIC GUIDELINES:
1. Bone Loss Assessment:
   - Mild: 0-30% bone loss
   - Moderate: 31-50% bone loss
   - Severe: >50% bone loss

2. Periodontal Assessment:
   - Pocket depths and their locations
   - Furcation involvement grades
   - Mobility patterns
   - Gingival recession measurements

3. Risk Factor Analysis:
   - Systemic conditions impact
   - Lifestyle factors
   - Age-related considerations
   - Genetic predisposition indicators`;

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await model.generateContent(basePrompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text;
        
        try {
          const parsedResult = JSON.parse(jsonString);
          
          if (!parsedResult.refinedPrognosis || !parsedResult.detailedTreatmentPlan || !parsedResult.detailedFindings) {
            throw new Error('Invalid response structure');
          }

          // Enhanced validation
          if (!validateResponse(parsedResult)) {
            throw new Error('Response lacks required detail or measurements');
          }

          // Add confidence metrics to the response
          parsedResult.diagnosticConfidence = {
            overall: confidenceScore,
            details: validations,
            timestamp: new Date().toISOString(),
            modelVersion: "1.0"
          };

          // Ensure status is one of the allowed values
          if (!['Good', 'Fair', 'Poor'].includes(parsedResult.refinedPrognosis.status)) {
            parsedResult.refinedPrognosis.status = 'Fair';
          }

          return parsedResult as GeminiAnalysisResult;
        } catch (parseError) {
          console.warn('Validation failed:', parseError);
        }
      } catch (generateError) {
        console.warn(`Attempt ${attempts + 1} failed:`, generateError);
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        modelConfig.generationConfig.temperature = Math.max(0.2, 0.3 - attempts * 0.05);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    throw new Error('Failed to generate valid analysis after multiple attempts');
  } catch (error) {
    console.error('Error getting enhanced analysis from Gemini:', error);
    
    // Return fallback response with confidence metrics
    const fallbackResponse: GeminiAnalysisResult = {
      refinedPrognosis: {
        status: input.findings.boneLoss?.severity === 'severe' ? 'Poor' :
               input.findings.boneLoss?.severity === 'moderate' ? 'Fair' : 'Good' as 'Good' | 'Fair' | 'Poor',
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

    return fallbackResponse;
  }
}; 