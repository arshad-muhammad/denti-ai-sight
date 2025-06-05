import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Brain, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Activity,
  Target,
  TrendingUp,
  Calendar,
  User,
  Camera,
  Stethoscope,
  Award,
  RefreshCw,
  Info,
  AlertCircle,
  Shield,
  Heart,
  Loader2,
  AlertOctagon,
  ArrowRight,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/AuthContext";
import dentalCaseService from "@/lib/services/dentalCaseService";
import { AIService } from '@/lib/services/aiService';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { useToast } from "@/components/ui/use-toast";
import { AIAnalysisResult } from '@/lib/services/aiService';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getEnhancedAnalysis } from '../services/geminiService';
import { EditCaseDialog } from "@/components/EditCaseDialog";
import { generatePDFReport } from "@/services/reportService";
import { Finding } from "@/types/analysis";
import { PageHeader } from "@/components/layout/PageHeader";
import { RadioGraphAnalysis } from "@/components/RadioGraphAnalysis";
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { BoPAssessmentForm } from "@/components/BoPAssessmentForm";
import { DiseaseProgressionRiskForm } from "@/components/DiseaseProgressionRiskForm";
import { EnhancedAnalysis, Prognosis, Severity, PeriodontalStageResult } from '@/types/analysis';
import { RealtimeChannel } from '@supabase/supabase-js';

interface AnalysisResult {
  timestamp: string;
  diagnosis: string;
  confidence: number;
  findings: {
    boneLoss?: {
      percentage: number;
      severity: Severity;
      regions: string[];
      measurements: BoneLossMeasurement[];
      confidence: number;
      overlayImage?: string;
    };
    bop?: {
      totalSites: number;
      bleedingSites: number;
      percentage: number;
      probingDepths: number[];
    };
    caries?: {
      detected: boolean;
      locations: string[];
    };
    pathologies?: Array<{
      type: string;
      location: string;
      severity: Severity;
      confidence: number;
      description?: string;
      recommendations?: string[];
    }>;
  };
  recommendations: string[];
  annotations?: Array<{
    type: string;
    location: string;
    severity: Severity;
    bbox?: [number, number, number, number];
    label: string;
  }>;
  severity: Severity;
  periodontal_stage?: PeriodontalStageResult;
}

interface BoneLossMeasurement {
  type: string;
  value: number;
  confidence: number;
}

interface ClinicalFindings {
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
}

// Define proper types for the Supabase response
type SupabasePatientData = {
  id: string;
  full_name: string | null;
  age: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  smoking: boolean | null;
  alcohol: boolean | null;
  diabetes: boolean | null;
  hypertension: boolean | null;
  chief_complaint: string | null;
  medical_history: string | null;
};

type SupabaseClinicalData = {
  toothNumber?: string | null;
  mobility?: boolean | null;
  bleeding?: boolean | null;
  sensitivity?: boolean | null;
  pocketDepth?: string | null;
  additionalNotes?: string | null;
  bopScore?: number | null;
  totalSites?: number | null;
  bleedingSites?: number | null;
  anteriorBleeding?: number | null;
  posteriorBleeding?: number | null;
  deepPocketSites?: number | null;
  averagePocketDepth?: number | null;
  riskScore?: number | null;
  boneLossAgeRatio?: number | null;
  bopFactor?: number | null;
  clinicalAttachmentLoss?: number | null;
  redFlags?: {
    hematologicDisorder?: boolean | null;
    necrotizingPeriodontitis?: boolean | null;
    leukemiaSigns?: boolean | null;
    details?: string | null;
  } | null;
  plaqueCoverage?: number | null;
  smoking?: boolean | null;
  alcohol?: boolean | null;
  diabetes?: boolean | null;
  hypertension?: boolean | null;
};

type SupabaseAnalysisResults = {
  diagnosis?: string | null;
  confidence?: number | null;
  severity?: string | null;
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
    } | null;
    pathologies?: Array<{
      type: string;
      location: string;
      severity: string;
      confidence: number;
    }> | null;
  } | null;
  periodontal_stage?: PeriodontalStageResult | null;
};

type SupabaseCaseResponse = {
  id: string;
  user_id: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  radiograph_url: string | null;
  created_at: string;
  updated_at: string;
  patient_data: SupabasePatientData[];
  clinical_data: SupabaseClinicalData[] | null;
  analysis_results: SupabaseAnalysisResults[] | null;
};

// Update the Case type to properly handle all fields
type Case = {
  id: string;
  user_id: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  radiograph_url: string | null;
  created_at: string;
  updated_at: string;
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
  clinical_data: SupabaseClinicalData;
  analysis_results: {
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
    periodontal_stage?: PeriodontalStageResult;
  };
};

// Helper function to transform Supabase response to Case type
const transformSupabaseCase = (data: SupabaseCaseResponse): Case => {
  const patientData = data.patient_data?.[0];
  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    radiograph_url: data.radiograph_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
    patient_data: {
      fullName: patientData?.full_name || 'Unknown Patient',
      age: patientData?.age || '',
      gender: patientData?.gender || '',
      phone: patientData?.phone || '',
      email: patientData?.email || '',
      address: patientData?.address || '',
      smoking: patientData?.smoking || false,
      alcohol: patientData?.alcohol || false,
      diabetes: patientData?.diabetes || false,
      hypertension: patientData?.hypertension || false,
      chiefComplaint: patientData?.chief_complaint || '',
      medicalHistory: patientData?.medical_history || ''
    },
    clinical_data: data.clinical_data?.[0] || {
      toothNumber: '',
      mobility: false,
      bleeding: false,
      sensitivity: false,
      pocketDepth: '',
      additionalNotes: '',
      bopScore: 0,
      totalSites: 0,
      bleedingSites: 0,
      anteriorBleeding: 0,
      posteriorBleeding: 0,
      deepPocketSites: 0,
      averagePocketDepth: 0,
      riskScore: 0,
      boneLossAgeRatio: 0,
      bopFactor: 0,
      clinicalAttachmentLoss: 0,
      redFlags: {},
      plaqueCoverage: 0,
      smoking: false,
      alcohol: false,
      diabetes: false,
      hypertension: false
    },
    analysis_results: data.analysis_results?.[0] || {
      diagnosis: '',
      confidence: 0,
      severity: '',
      findings: {
        boneLoss: {
          percentage: 0,
          severity: 'mild',
          regions: [],
          measurements: []
        }
      },
      periodontal_stage: {
        stage: '',
        description: '',
        prognosis: 'Fair' as Prognosis
      }
    }
  };
};

// Define component props types
type RadioGraphAnalysisProps = {
  imageUrl: string;
  onMeasurementsChange: (measurements: {
    boneLossPercentage: number;
    cejY: number;
    boneY: number;
    apexY: number;
    periodontalStage: string;
  }) => void;
};

type BoPAssessmentFormProps = {
  initialData: SupabaseClinicalData;
  onUpdate: (data: {
    bopScore: number;
    totalSites: number;
    bleedingSites: number;
    anteriorBleeding: number;
    posteriorBleeding: number;
    deepPocketSites: number;
    averagePocketDepth: number;
  }) => void;
};

type DiseaseProgressionRiskFormProps = {
  initialData: {
    boneLossAgeRatio: number;
    bopFactor: number;
    clinicalAttachmentLoss: number;
    smokingStatus: boolean;
    diabetesStatus: boolean;
  };
  onUpdate: (data: {
    riskScore: number;
    boneLossAgeRatio: number;
    bopFactor: number;
    clinicalAttachmentLoss: number;
    smokingStatus: boolean;
    diabetesStatus: boolean;
  }) => void;
};

type EditCaseDialogProps = {
  caseData: Case;
  onUpdate: (updatedCase: Case) => void;
  trigger: React.ReactNode;
};

// Update the enhanced analysis state type
type EnhancedAnalysisState = {
  loading: boolean;
  data: EnhancedAnalysis | null;
  error: Error | null;
  retryCount: number;
  retryDelay: number;
};

const getPeriodontalStage = (boneLossPercentage: number): PeriodontalStageResult => {
  if (boneLossPercentage <= 15) {
    return {
      stage: 'Stage I',
      description: 'Initial Periodontitis',
      prognosis: 'Good' as Prognosis
    };
  } else if (boneLossPercentage <= 30) {
    return {
      stage: 'Stage II',
      description: 'Moderate Periodontitis',
      prognosis: 'Fair' as Prognosis
    };
  } else if (boneLossPercentage <= 50) {
    return {
      stage: 'Stage III',
      description: 'Severe Periodontitis with potential for tooth loss',
      prognosis: 'Poor' as Prognosis
    };
  } else {
    return {
      stage: 'Stage IV',
      description: 'Advanced Periodontitis with potential for loss of dentition',
      prognosis: 'Questionable' as Prognosis
    };
  }
};

const LoadingIndicator = ({ retryCount, retryDelay }: { retryCount: number; retryDelay: number }) => (
  <div className="flex flex-col items-center space-y-4 p-4">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>
        {retryCount > 0 
          ? `Rate limit reached. Retrying in ${retryDelay}s (Attempt ${retryCount}/3)...` 
          : 'Generating enhanced analysis...'}
      </span>
    </div>
    {retryCount > 0 && (
      <Progress value={(retryDelay / 24) * 100} className="w-[200px]" />
    )}
  </div>
);

const Analysis = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isMounted = useRef(true);
  const { toast } = useToast();
  const [analysisStage, setAnalysisStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const hasShownCompleteToast = useRef(false);  // Use ref instead of let variable
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysisState>({
    loading: false,
    data: null,
    error: null,
    retryCount: 0,
    retryDelay: 0
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Add debounce utility at the top level
  function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Check authentication first
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!caseId || !user) {
      console.log('No caseId or user, returning early', { caseId, user });
      setIsLoading(false);
      return;
    }

    let isSubscribed = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    const setupSubscription = async () => {
      try {
        // Set up real-time subscription for case updates
        const subscription = supabase
          .channel(`case_updates_${caseId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'cases',
              filter: `id=eq.${caseId}`
            },
            async (payload) => {
              console.log('Received real-time update:', payload);
              if (isSubscribed) {
                try {
                  const { data: updatedCase, error: fetchError } = await supabase
                    .from('cases')
                    .select(`
                      *,
                      patient_data!inner (
                        id,
                        full_name,
                        age,
                        gender,
                        phone,
                        email,
                        address,
                        smoking,
                        alcohol,
                        diabetes,
                        hypertension,
                        chief_complaint,
                        medical_history
                      ),
                      clinical_data(*),
                      analysis_results(*)
                    `)
                    .eq('id', caseId)
                    .single();

                  if (fetchError) {
                    console.error('Error fetching updated case:', fetchError);
                    return;
                  }

                  if (updatedCase) {
                    const transformedCase = transformSupabaseCase(updatedCase as SupabaseCaseResponse);
                    setCaseData(transformedCase);
                    
                    if (transformedCase.status === 'completed' && !hasShownCompleteToast.current) {
                      setIsComplete(true);
                      setProgress(100);
                      setIsAnalyzing(false);
                      hasShownCompleteToast.current = true;
                      toast({
                        title: "Analysis Complete",
                        description: "The radiograph analysis has been completed successfully.",
                      });
                    } else if (transformedCase.status === 'error') {
                      setError('Analysis failed. Please try again.');
                      setIsAnalyzing(false);
                    }
                  }
                } catch (error) {
                  console.error('Error processing real-time update:', error);
                  if (isSubscribed) {
                    setError('Failed to process case update');
                    setIsAnalyzing(false);
                  }
                }
              }
            }
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to case updates');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel error occurred');
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Retrying subscription (attempt ${retryCount}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                await setupSubscription();
              } else {
                console.error('Max retry attempts reached');
                toast({
                  title: "Connection Error",
                  description: "Failed to establish real-time connection. Updates may be delayed.",
                  variant: "destructive"
                });
              }
            }
          });

        return subscription;
      } catch (error) {
        console.error('Error setting up subscription:', error);
        return null;
      }
    };

    const fetchCase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching case data for ID:', caseId);
        
        const { data: basicCaseData, error: basicFetchError } = await supabase
          .from('cases')
          .select(`
            *,
            patient_data!inner (
              id,
              full_name,
              age,
              gender,
              phone,
              email,
              address,
              smoking,
              alcohol,
              diabetes,
              hypertension,
              chief_complaint,
              medical_history
            ),
            clinical_data (*),
            analysis_results (*)
          `)
          .eq('id', caseId)
          .single();

        if (basicFetchError) {
          console.error('Error fetching case data:', basicFetchError);
          throw new Error(basicFetchError.message);
        }

        if (!basicCaseData) {
          console.error('No case found with ID:', caseId);
          throw new Error('Case not found');
        }

        // Check if the case belongs to the current user
        if (basicCaseData.user_id !== user.id) {
          console.error('Case does not belong to current user');
          throw new Error('You do not have permission to view this case');
        }

        // Transform the data to match the expected structure
        const transformedCase: Case = {
          id: basicCaseData.id,
          user_id: basicCaseData.user_id,
          status: basicCaseData.status,
          radiograph_url: basicCaseData.radiograph_url,
          created_at: basicCaseData.created_at,
          updated_at: basicCaseData.updated_at,
          patient_data: {
            fullName: basicCaseData.patient_data?.[0]?.full_name || 'Unknown Patient',
            age: basicCaseData.patient_data?.[0]?.age || '',
            gender: basicCaseData.patient_data?.[0]?.gender || '',
            phone: basicCaseData.patient_data?.[0]?.phone || '',
            email: basicCaseData.patient_data?.[0]?.email || '',
            address: basicCaseData.patient_data?.[0]?.address || '',
            smoking: basicCaseData.patient_data?.[0]?.smoking || false,
            alcohol: basicCaseData.patient_data?.[0]?.alcohol || false,
            diabetes: basicCaseData.patient_data?.[0]?.diabetes || false,
            hypertension: basicCaseData.patient_data?.[0]?.hypertension || false,
            chiefComplaint: basicCaseData.patient_data?.[0]?.chief_complaint || '',
            medicalHistory: basicCaseData.patient_data?.[0]?.medical_history || ''
          },
          clinical_data: basicCaseData.clinical_data || {
            toothNumber: '',
            mobility: false,
            bleeding: false,
            sensitivity: false,
            pocketDepth: '',
            additionalNotes: '',
            bopScore: 0,
            totalSites: 0,
            bleedingSites: 0,
            anteriorBleeding: 0,
            posteriorBleeding: 0,
            deepPocketSites: 0,
            averagePocketDepth: 0,
            riskScore: 0,
            boneLossAgeRatio: 0,
            bopFactor: 0,
            clinicalAttachmentLoss: 0,
            redFlags: {},
            plaqueCoverage: 0,
            smoking: false,
            alcohol: false,
            diabetes: false,
            hypertension: false
          },
          analysis_results: basicCaseData.analysis_results || {
            diagnosis: '',
            confidence: 0,
            severity: '',
            findings: {
              boneLoss: {
                percentage: 0,
                severity: 'mild',
                regions: [],
                measurements: []
              }
            },
            periodontal_stage: {
              stage: '',
              description: '',
              prognosis: 'Fair' as Prognosis
            }
          }
        };

        console.log('Transformed case data:', transformedCase);

        if (isSubscribed) {
          setCaseData(transformedCase);
          
          if (transformedCase.status === 'pending' || transformedCase.status === 'analyzing') {
            console.log('Starting analysis for case:', transformedCase.id);
            await startAnalysis(transformedCase);
          } else if (transformedCase.status === 'completed' && !hasShownCompleteToast.current) {
            console.log('Case is already completed');
            setIsComplete(true);
            setProgress(100);
            setIsAnalyzing(false);
            hasShownCompleteToast.current = true;
            toast({
              title: "Analysis Complete",
              description: "The radiograph analysis has been completed successfully.",
            });
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchCase:', error);
        if (isSubscribed) {
          setError(error instanceof Error ? error.message : 'Failed to fetch case data');
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : 'Failed to fetch case data',
            variant: "destructive"
          });
          setIsLoading(false);
          setIsAnalyzing(false);
        }
      }
    };

    // Initial fetch
    fetchCase();

    // Set up subscription
    let subscription: RealtimeChannel | null = null;
    setupSubscription().then(sub => {
      subscription = sub;
    });

    return () => {
      console.log('Cleaning up subscription');
      isSubscribed = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      // Reset the toast flag when component unmounts
      hasShownCompleteToast.current = false;
    };
  }, [caseId, user, toast]);

  const startAnalysis = async (currentCaseData: Case) => {
    if (!currentCaseData.radiograph_url) {
      setError('No radiograph available for analysis');
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setAnalysisStage(0);

    try {
      // Update status to analyzing
      const { error: updateError } = await supabase
        .from('cases')
        .update({ 
          status: 'analyzing',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCaseData.id);

      if (updateError) {
        console.error('Error updating case status:', updateError);
        throw new Error(`Failed to update case status: ${updateError.message}`);
      }

      if (!isMounted.current) return;
      setProgress(20);
      setAnalysisStage(1);
      
      // Fetch the radiograph
      const response = await fetch(currentCaseData.radiograph_url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radiograph: ${response.statusText}`);
      }
      
      if (!isMounted.current) return;
      setProgress(30);
      setAnalysisStage(2);
      
      const blob = await response.blob();
      const file = new File([blob], 'radiograph.jpg', { type: 'image/jpeg' });

      if (!isMounted.current) return;
      setProgress(40);
      setAnalysisStage(3);
      
      // Analyze the image
      const results = await AIService.analyzeImage(file);
      
      if (!isMounted.current) return;
      setProgress(80);
      setAnalysisStage(4);

      // First, insert the analysis results
      const { error: insertError } = await supabase
        .from('analysis_results')
        .insert([{
          case_id: currentCaseData.id,
          diagnosis: results.diagnosis,
          confidence: results.confidence,
          severity: results.severity,
          findings: results.findings,
          periodontal_stage: results.periodontal_stage,
          created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        }]);

      if (insertError) throw new Error(`Failed to insert analysis results: ${insertError.message}`);

      // Then update the case status to completed
      const { error: statusUpdateError } = await supabase
        .from('cases')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCaseData.id);

      if (statusUpdateError) throw new Error(`Failed to update case status: ${statusUpdateError.message}`);

      // Fetch updated case data with all relations
      const { data: updatedCase, error: fetchError } = await supabase
        .from('cases')
        .select(`
          *,
          patient_data!inner (*),
          clinical_data!left (*),
          analysis_results!left (*)
        `)
        .eq('id', currentCaseData.id)
        .single();

      if (fetchError) throw new Error(`Failed to fetch updated case: ${fetchError.message}`);

      if (!isMounted.current) return;
      setCaseData(transformSupabaseCase(updatedCase as SupabaseCaseResponse));
      setProgress(100);
      setIsComplete(true);
      setIsAnalyzing(false);
      setAnalysisStage(5);

      toast({
        title: "Analysis Complete",
        description: "The radiograph analysis has been completed successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      if (!isMounted.current) return;
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete analysis';
      setError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Update case status to error
      if (currentCaseData.id) {
        try {
          await supabase
            .from('cases')
            .update({ 
              status: 'error',
              updated_at: new Date().toISOString()
            })
            .eq('id', currentCaseData.id);
        } catch (updateError) {
          console.error('Failed to update case status to error:', updateError);
        }
      }
      
      setIsAnalyzing(false);
      setProgress(0);
      setAnalysisStage(0);
    }
  };

  const analysisStages = [
    "Initializing AI Model...",
    "Processing Radiograph...",
    "Detecting Bone Loss...",
    "Analyzing Pathologies...",
    "Generating Prognosis...",
    "Finalizing Report..."
  ];

  // Add retry logic for Gemini API calls
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> => {
    let retries = 0;
    let delay = initialDelay;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }

        if (error instanceof Error && error.message.includes('429')) {
          // Rate limit hit - wait longer
          delay *= 2;
          console.log(`Rate limit hit, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    if (isComplete && caseData?.status === 'completed') {
      const fetchEnhancedAnalysis = async () => {
        if (!isSubscribed) return;
        
        setEnhancedAnalysis(state => ({ 
          ...state, 
          loading: true, 
          error: null,
          retryCount: 0,
          retryDelay: 0
        }));

        try {
          // Safely parse medical history or use empty object as fallback
          let medicalHistoryNotes = {};
          if (caseData.patient_data.medicalHistory) {
            try {
              if (typeof caseData.patient_data.medicalHistory === 'string') {
                // Only attempt to parse if it looks like JSON
                if (caseData.patient_data.medicalHistory.trim().startsWith('{')) {
                  medicalHistoryNotes = JSON.parse(caseData.patient_data.medicalHistory);
                } else {
                  // If it's a string but not JSON, use it as a notes field
                  medicalHistoryNotes = { notes: caseData.patient_data.medicalHistory };
                }
              } else {
                // If it's already an object, use it directly
                medicalHistoryNotes = caseData.patient_data.medicalHistory;
              }
            } catch (parseError) {
              console.warn('Failed to parse medical history, using as plain text:', parseError);
              medicalHistoryNotes = { notes: caseData.patient_data.medicalHistory };
            }
          }

          const result = await getEnhancedAnalysis({
            diagnosis: caseData.analysis_results?.diagnosis || '',
            findings: caseData.analysis_results?.findings || {},
            patientData: {
              age: caseData.patient_data.age || '',
              gender: caseData.patient_data.gender || '',
              medicalHistory: medicalHistoryNotes
            }
          });

          if (isSubscribed) {
            setEnhancedAnalysis({
              loading: false,
              data: result,
              error: null,
              retryCount: 0,
              retryDelay: 0
            });
          }
        } catch (error) {
          console.error('Enhanced analysis error:', error);
          const isRateLimit = error instanceof Error && error.message.includes('429');
          
          if (isSubscribed) {
            // Get current state to determine retry behavior
            const currentState = enhancedAnalysis;
            const newRetryCount = isRateLimit ? currentState.retryCount + 1 : 0;
            const newRetryDelay = isRateLimit ? 24 : 0;

            setEnhancedAnalysis({
              ...currentState,
              loading: false,
              error: error as Error,
              retryCount: newRetryCount,
              retryDelay: newRetryDelay
            });

            // If it's a rate limit error and we haven't exceeded retries, try again after delay
            if (isRateLimit && newRetryCount < 3) {
              setTimeout(() => {
                fetchEnhancedAnalysis();
              }, newRetryDelay * 1000);
            }
          }
        }
      };

      fetchEnhancedAnalysis();
    }

    return () => {
      isSubscribed = false;
    };
  }, [isComplete, caseData, enhancedAnalysis]);

  // Update retry function to handle rate limiting
  const retryEnhancedAnalysis = useCallback(async () => {
    setEnhancedAnalysis(state => ({ 
      ...state, 
      loading: true, 
      error: null,
      retryCount: 0,
      retryDelay: 0
    }));

    try {
      // Safely parse medical history or use empty object as fallback
      let medicalHistoryNotes = {};
      if (caseData?.patient_data.medicalHistory) {
        try {
          if (typeof caseData.patient_data.medicalHistory === 'string') {
            // Only attempt to parse if it looks like JSON
            if (caseData.patient_data.medicalHistory.trim().startsWith('{')) {
              medicalHistoryNotes = JSON.parse(caseData.patient_data.medicalHistory);
            } else {
              // If it's a string but not JSON, use it as a notes field
              medicalHistoryNotes = { notes: caseData.patient_data.medicalHistory };
            }
          } else {
            // If it's already an object, use it directly
            medicalHistoryNotes = caseData.patient_data.medicalHistory;
          }
        } catch (parseError) {
          console.warn('Failed to parse medical history in retry, using as plain text:', parseError);
          medicalHistoryNotes = { notes: caseData.patient_data.medicalHistory };
        }
      }

      const result = await getEnhancedAnalysis({
        diagnosis: caseData?.analysis_results?.diagnosis || '',
        findings: caseData?.analysis_results?.findings || {},
        patientData: {
          age: caseData?.patient_data.age || '',
          gender: caseData?.patient_data.gender || '',
          medicalHistory: medicalHistoryNotes
        }
      });

      setEnhancedAnalysis({
        loading: false,
        data: result,
        error: null,
        retryCount: 0,
        retryDelay: 0
      });
    } catch (error) {
      console.error('Enhanced analysis retry error:', error);
      const isRateLimit = error instanceof Error && error.message.includes('429');
      
      setEnhancedAnalysis(currentState => ({
        ...currentState,
        loading: false,
        error: error as Error,
        retryCount: isRateLimit ? currentState.retryCount + 1 : 0,
        retryDelay: isRateLimit ? 24 : 0
      }));
    }
  }, [caseData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "severe":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPrognosisColor = (status?: Prognosis) => {
    if (!status) return 'text-gray-500';
    switch (status) {
      case 'Good':
        return 'text-green-600';
      case 'Fair':
        return 'text-yellow-600';
      case 'Poor':
        return 'text-red-600';
      case 'Questionable':
        return 'text-orange-600';
      default:
        return 'text-gray-500';
    }
  };

  // Update the handleMeasurementsChange function to use the analysis_results table directly
  const handleMeasurementsChange = async (measurements: {
    boneLossPercentage: number;
    cejY: number;
    boneY: number;
    apexY: number;
    periodontalStage: string;
  }) => {
    if (caseId && caseData) {
      try {
        // Get periodontal stage based on bone loss percentage
        const periodontalStaging = getPeriodontalStage(measurements.boneLossPercentage);
        
        // Determine severity based on bone loss percentage
        let severity: Severity = 'mild';
        if (measurements.boneLossPercentage >= 50) {
          severity = 'severe';
        } else if (measurements.boneLossPercentage >= 33) {
          severity = 'moderate';
        }

        // Create the measurements array
        const newMeasurements: Array<{ type: string; value: number; confidence: number }> = [
                  {
                    type: 'CEJ Y',
                    value: measurements.cejY,
                    confidence: 1
                  },
                  {
                    type: 'Bone Y',
                    value: measurements.boneY,
                    confidence: 1
                  },
                  {
                    type: 'Apex Y',
                    value: measurements.apexY,
                    confidence: 1
                  }
        ];

        // First, check if an analysis result exists
        const { data: existingAnalysis, error: fetchError } = await supabase
          .from('analysis_results')
          .select('*')
          .eq('case_id', caseId)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingAnalysis) {
          // Update existing analysis result
          const { error: updateError } = await supabase
            .from('analysis_results')
            .update({
              findings: {
                ...existingAnalysis.findings,
                boneLoss: {
                  measurements: newMeasurements,
                percentage: measurements.boneLossPercentage,
                  severity: severity,
                  regions: existingAnalysis.findings?.boneLoss?.regions || []
                }
              },
              periodontal_stage: periodontalStaging,
              updated_at: new Date().toISOString()
            })
            .eq('case_id', caseId);

        if (updateError) throw updateError;
        } else {
          // Insert new analysis result
          const { error: insertError } = await supabase
            .from('analysis_results')
            .insert([{
              case_id: caseId,
              findings: {
                boneLoss: {
                  measurements: newMeasurements,
                  percentage: measurements.boneLossPercentage,
                  severity: severity,
                  regions: []
                }
              },
              periodontal_stage: periodontalStaging,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);

          if (insertError) throw insertError;
        }

        // Update local state
        setCaseData(currentState => {
          if (!currentState) return null;
          return {
            ...currentState,
            analysis_results: {
              ...currentState.analysis_results,
              findings: {
                ...currentState.analysis_results.findings,
                boneLoss: {
                  ...currentState.analysis_results.findings?.boneLoss,
                  measurements: newMeasurements,
                  percentage: measurements.boneLossPercentage,
                  severity: severity
                }
              },
              periodontal_stage: periodontalStaging
            }
          };
        });

       
      } catch (error) {
        console.error('Error updating measurements:', error);
        toast({
          title: "Error",
          description: "Failed to update measurements",
          variant: "destructive"
        });
      }
    }
  };

  const renderDetailedFindings = () => {
    if (enhancedAnalysis.loading) {
      return (
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <RefreshCw className="w-6 h-6 animate-spin text-medical-600" />
          <span className="text-medical-600">Generating detailed analysis...</span>
        </div>
      );
    }

    if (enhancedAnalysis.error) {
      return (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {enhancedAnalysis.error.message}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={retryEnhancedAnalysis}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Enhanced Analysis
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Primary Condition Section */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="text-lg font-semibold flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Primary Condition Analysis
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-muted-foreground">Diagnosis</h4>
                <p className="text-lg">{caseData.analysis_results.diagnosis}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getSeverityColor(caseData.analysis_results.severity)}>
                    {(caseData.analysis_results.severity || 'unknown').toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    Confidence: {Math.round(caseData.analysis_results.confidence * 100)}%
                  </Badge>
                </div>
              </div>

              {enhancedAnalysis.data?.detailedFindings.primaryCondition && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">Clinical Description</h4>
                  <p className="text-gray-700">
                    {enhancedAnalysis.data.detailedFindings.primaryCondition.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bone Loss Analysis */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-muted/50">
            <h3 className="text-lg font-semibold flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Bone Loss Analysis
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid gap-4">
              {/* Bone Loss Measurements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bone Loss Measurements</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Overall Bone Loss:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          {caseData.analysis_results?.findings?.boneLoss?.percentage?.toFixed(1)}%
                        </span>
                        <Badge
                          className={`text-lg px-3 py-1 ${getSeverityColor(caseData.analysis_results?.findings?.boneLoss?.severity || 'mild')}`}
                        >
                          {(caseData.analysis_results?.findings?.boneLoss?.severity || 'mild').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {caseData.analysis_results?.findings?.boneLoss?.measurements?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {caseData.analysis_results?.findings?.boneLoss?.measurements?.map((measurement, index) => (
                      <div key={index} className="bg-muted p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{measurement.type}</span>
                          <span>{measurement.value.toFixed(1)} mm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {enhancedAnalysis.data?.detailedFindings.riskAssessment && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground">Risk Assessment</h4>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <p>{enhancedAnalysis.data.detailedFindings.riskAssessment.current}</p>
                    <div>
                      <h5 className="font-medium mb-1">Future Risk Projection</h5>
                      <p className="text-sm text-muted-foreground">
                        {enhancedAnalysis.data.detailedFindings.riskAssessment.future}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Findings */}
        {enhancedAnalysis.data?.detailedFindings.secondaryFindings && 
         enhancedAnalysis.data.detailedFindings.secondaryFindings.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/50">
              <h3 className="text-lg font-semibold flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Secondary Findings
              </h3>
            </div>
            <div className="p-4">
              <div className="grid gap-4">
                {enhancedAnalysis.data.detailedFindings.secondaryFindings.map((finding, index) => (
                  <div key={index} className="bg-muted p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{finding.condition}</h4>
                      <Badge variant="outline" className={getSeverityColor(finding.severity)}>
                        {finding.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-700">{finding.description}</p>
                    {finding.implications.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Clinical Implications</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {finding.implications.map((implication, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              {implication}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Risk Mitigation Strategies */}
        {enhancedAnalysis.data?.detailedFindings.riskAssessment?.mitigationStrategies && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/50">
              <h3 className="text-lg font-semibold flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Risk Mitigation Strategies
              </h3>
            </div>
            <div className="p-4">
              <div className="grid gap-3">
                {enhancedAnalysis.data.detailedFindings.riskAssessment.mitigationStrategies.map((strategy, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-gray-700">{strategy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Clinical Recommendations - Remove this section if recommendations don't exist */}
        {caseData.analysis_results.findings?.pathologies && caseData.analysis_results.findings.pathologies.length > 0 && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-muted/50">
              <h3 className="text-lg font-semibold flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                Clinical Recommendations
              </h3>
            </div>
            <div className="p-4">
              <div className="grid gap-3">
                {caseData.analysis_results.findings.pathologies.map((pathology, index) => (
                  <div key={index} className="flex items-start gap-3 bg-muted p-3 rounded-lg">
                    <div className="mt-1">
                      <ArrowRight className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-gray-700">{pathology.type} - {pathology.location}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Update the Detailed Findings Card to use the new render function
  const renderAnalysisResults = () => {
    if (!caseData?.analysis_results) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Primary Diagnosis Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Primary Diagnosis & Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Disease Type */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Disease Type</h4>
                <p className="text-lg font-semibold text-foreground">{caseData.analysis_results.diagnosis || 'Not available'}</p>
              </div>
              
              {/* Bone Loss */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Bone Loss</h4>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {caseData.analysis_results.findings?.boneLoss?.percentage ? 
                      `${caseData.analysis_results.findings?.boneLoss?.percentage.toFixed(1)}%` : 
                      'Not available'
                    }
                  </span>
                  {caseData.analysis_results.severity && (
                    <Badge className={getSeverityColor(caseData.analysis_results.severity)}>
                      {caseData.analysis_results.severity.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Periodontal Stage */}
              {caseData.analysis_results.findings?.boneLoss?.percentage && (
                <div className="p-4 bg-muted rounded-lg col-span-full">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Periodontal Stage</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground">
                        {getPeriodontalStage(caseData.analysis_results.findings?.boneLoss?.percentage).stage}
                      </span>
                      <Badge variant="outline" className={getPrognosisColor(caseData.analysis_results.periodontal_stage?.prognosis)}>
                        Prognosis: {caseData.analysis_results.periodontal_stage?.prognosis}
                      </Badge>
                    </div>
                    {caseData.analysis_results.periodontal_stage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {caseData.analysis_results.periodontal_stage.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Information */}
              <div className="p-4 bg-muted rounded-lg col-span-full">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Name</span>
                    <p className="font-medium">{caseData.patient_data.fullName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Age</span>
                    <p className="font-medium">{caseData.patient_data.age} years</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Gender</span>
                    <p className="font-medium">{caseData.patient_data.gender}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Contact</span>
                    <p className="font-medium">{caseData.patient_data.phone}</p>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="p-4 bg-muted rounded-lg col-span-full">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Medical History</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Smoking</span>
                    <p className={`font-medium ${caseData.patient_data.smoking ? 'text-red-500' : 'text-green-500'}`}>
                      {caseData.patient_data.smoking ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Diabetes</span>
                    <p className={`font-medium ${caseData.patient_data.diabetes ? 'text-red-500' : 'text-green-500'}`}>
                      {caseData.patient_data.diabetes ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Red Flag Alerts Card */}
        {(caseData.clinical_data.redFlags?.hematologicDisorder ||
          caseData.clinical_data.redFlags?.necrotizingPeriodontitis ||
          caseData.clinical_data.redFlags?.leukemiaSigns) && (
          <Card className="border-red-500">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                Red Flag Alerts
              </CardTitle>
              <CardDescription className="text-red-600">
                Urgent attention required for the following conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Hematologic Disorder Alert */}
                {caseData.clinical_data.redFlags?.hematologicDisorder && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertOctagon className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-red-700">Possible Hematologic Disorder</h4>
                      <p className="text-sm text-red-600 mt-1">
                        Severe bleeding ({caseData.clinical_data.bopScore}% BoP) with low plaque coverage ({caseData.clinical_data.plaqueCoverage}%) suggests underlying hematologic condition
                      </p>
                      <p className="text-sm font-medium text-red-700 mt-2">
                        Recommendation: Immediate hematology referral
                      </p>
                    </div>
                  </div>
                )}

                {/* Necrotizing Periodontitis Alert */}
                {caseData.clinical_data.redFlags?.necrotizingPeriodontitis && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertOctagon className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-red-700">Suspected Necrotizing Periodontitis</h4>
                      <p className="text-sm text-red-600 mt-1">
                        Presence of tissue necrosis and/or ulcers indicates possible necrotizing periodontal disease
                      </p>
                      <p className="text-sm font-medium text-red-700 mt-2">
                        Recommendation: Immediate periodontal intervention
                      </p>
                    </div>
                  </div>
                )}

                {/* Leukemia Signs Alert */}
                {caseData.clinical_data.redFlags?.leukemiaSigns && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertOctagon className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-red-700">Possible Leukemia Signs</h4>
                      <p className="text-sm text-red-600 mt-1">
                        Purple gingiva and gingival hyperplasia observed - potential indicators of leukemia
                      </p>
                      <p className="text-sm font-medium text-red-700 mt-2">
                        Recommendation: Urgent oncology referral
                      </p>
                    </div>
                  </div>
                )}

                {caseData.clinical_data.redFlags?.details && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-700 mb-1">Additional Notes</h4>
                    <p className="text-sm text-red-600">
                      {caseData.clinical_data.redFlags.details}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Annotated Radiograph Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Annotated Radiograph
            </CardTitle>
            <CardDescription>
              Interactive bone loss measurement and staging
            </CardDescription>
          </CardHeader>
          <CardContent>
            {caseData.radiograph_url ? (
              <div className="space-y-6">
                <RadioGraphAnalysis
                  imageUrl={caseData.radiograph_url}
                  onMeasurementsChange={handleMeasurementsChange}
                />
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No radiograph available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bleeding on Probing (BoP) Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Bleeding on Probing (BoP) Assessment
            </CardTitle>
            <CardDescription>
              Evaluation of periodontal inflammation and disease activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BoPAssessmentForm
              initialData={caseData.clinical_data}
              onUpdate={async (data) => {
                if (!caseId) return;

                try {
                  // Update clinical_data table directly
                  const { error: updateError } = await supabase
                    .from('clinical_data')
                    .update({
                      bop_score: data.bopScore,
                      total_sites: data.totalSites,
                      bleeding_sites: data.bleedingSites,
                      anterior_bleeding: data.anteriorBleeding,
                      posterior_bleeding: data.posteriorBleeding,
                      deep_pocket_sites: data.deepPocketSites,
                      average_pocket_depth: data.averagePocketDepth,
                      updated_at: new Date().toISOString()
                    })
                    .eq('case_id', caseId);

                  if (updateError) throw updateError;

                  // Update local state
                  setCaseData(currentState => {
                    if (!currentState) return null;
                    return {
                      ...currentState,
                      clinical_data: {
                        ...currentState.clinical_data,
                        bopScore: data.bopScore,
                        totalSites: data.totalSites,
                        bleedingSites: data.bleedingSites,
                        anteriorBleeding: data.anteriorBleeding,
                        posteriorBleeding: data.posteriorBleeding,
                        deepPocketSites: data.deepPocketSites,
                        averagePocketDepth: data.averagePocketDepth
                      }
                    };
                  });

                 
                } catch (error) {
                  console.error('Error updating BoP data:', error);
                  toast({
                    title: "Error",
                    description: "Failed to update BoP assessment data",
                    variant: "destructive"
                  });
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Disease Progression Risk Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Disease Progression Risk Score
            </CardTitle>
            <CardDescription>
              Comprehensive risk assessment based on multiple factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DiseaseProgressionRiskForm
              initialData={{
                boneLossAgeRatio: caseData.analysis_results?.findings?.boneLoss?.percentage 
                  ? caseData.analysis_results.findings?.boneLoss?.percentage / parseInt(caseData.patient_data.age)
                  : 0,
                bopFactor: caseData.clinical_data.bopScore 
                  ? caseData.clinical_data.bopScore / 100 
                  : 0,
                clinicalAttachmentLoss: caseData.clinical_data.clinicalAttachmentLoss || 0,
                smokingStatus: caseData.clinical_data.smoking || false,
                diabetesStatus: caseData.clinical_data.diabetes || false
              }}
              onUpdate={async (data) => {
                if (!caseId) return;

                try {
                  // Update clinical_data table directly
                  const { error: updateError } = await supabase
                    .from('clinical_data')
                    .update({
                      risk_score: data.riskScore,
                      bone_loss_age_ratio: data.boneLossAgeRatio,
                      bop_factor: data.bopFactor,
                      clinical_attachment_loss: data.clinicalAttachmentLoss,
                      smoking: data.smokingStatus,
                      diabetes: data.diabetesStatus,
                      updated_at: new Date().toISOString()
                    })
                    .eq('case_id', caseId);

                  if (updateError) throw updateError;

                  // Update local state
                  setCaseData(currentState => {
                    if (!currentState) return null;
                    return {
                      ...currentState,
                      clinical_data: {
                        ...currentState.clinical_data,
                        riskScore: data.riskScore,
                        boneLossAgeRatio: data.boneLossAgeRatio,
                        bopFactor: data.bopFactor,
                        clinicalAttachmentLoss: data.clinicalAttachmentLoss,
                        smoking: data.smokingStatus,
                        diabetes: data.diabetesStatus
                      }
                    };
                  });

                
                } catch (error) {
                  console.error('Error updating risk assessment data:', error);
                  toast({
                    title: "Error",
                    description: "Failed to update risk assessment data",
                    variant: "destructive"
                  });
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Detailed Findings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Detailed Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderDetailedFindings()}
          </CardContent>
        </Card>

        {/* Prognosis and Treatment Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Prognosis & Treatment Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {enhancedAnalysis.loading ? (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="w-6 h-6 animate-spin text-medical-600" />
              </div>
            ) : enhancedAnalysis.data ? (
              <>
                {/* Prognosis Section */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-lg mb-2">Prognosis</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-semibold ${getPrognosisColor(enhancedAnalysis.data.refinedPrognosis.status)}`}>
                          {enhancedAnalysis.data.refinedPrognosis.status}
                        </span>
                        {caseData.clinical_data.additionalNotes && (
                          <Badge variant="outline">Additional Notes: {caseData.clinical_data.additionalNotes}</Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{enhancedAnalysis.data.refinedPrognosis.explanation}</p>
                      <div>
                        <h5 className="font-medium mb-2">Risk Factors:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {enhancedAnalysis.data.refinedPrognosis.riskFactors.map((factor, index) => (
                            <li key={index} className="text-gray-700">{factor}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">Long-term Outlook:</h5>
                        <p className="text-gray-700">{enhancedAnalysis.data.refinedPrognosis.longTermOutlook}</p>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Plan Section */}
                  <div>
                    <h4 className="font-medium text-lg mb-2">Comprehensive Treatment Plan</h4>
                    <div className="space-y-4">
                      {/* Immediate Actions */}
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h5 className="font-medium text-red-800 mb-2">Immediate Actions</h5>
                        <ul className="space-y-2">
                          {enhancedAnalysis.data.detailedTreatmentPlan.immediate.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500 mt-1" />
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Short-term Plan */}
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h5 className="font-medium text-yellow-800 mb-2">Short-term Plan</h5>
                        <ul className="space-y-2">
                          {enhancedAnalysis.data.detailedTreatmentPlan.shortTerm.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Clock className="w-4 h-4 text-yellow-500 mt-1" />
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Long-term Plan */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">Long-term Plan</h5>
                        <ul className="space-y-2">
                          {enhancedAnalysis.data.detailedTreatmentPlan.longTerm.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-green-500 mt-1" />
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Preventive Measures */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">Preventive Measures</h5>
                        <ul className="space-y-2">
                          {enhancedAnalysis.data.detailedTreatmentPlan.preventiveMeasures.map((measure, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Shield className="w-4 h-4 text-blue-500 mt-1" />
                              <span className="text-gray-700">{measure}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Lifestyle Recommendations */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h5 className="font-medium text-purple-800 mb-2">Lifestyle Recommendations</h5>
                        <ul className="space-y-2">
                          {enhancedAnalysis.data.detailedTreatmentPlan.lifestyle.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Heart className="w-4 h-4 text-purple-500 mt-1" />
                              <span className="text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h4 className="font-medium mb-2">Prognosis</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-semibold ${getPrognosisColor(getPeriodontalStage(caseData.analysis_results?.findings?.boneLoss?.percentage || 0).prognosis)}`}>
                      {getPeriodontalStage(caseData.analysis_results?.findings?.boneLoss?.percentage || 0).prognosis}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Treatment Plan</h4>
                  {caseData.clinical_data.additionalNotes && (
                    <p className="text-gray-500">{caseData.clinical_data.additionalNotes}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader 
          title="Case Analysis"
          description="Loading case data..."
        />
        <div className="container py-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <span className="ml-2">Loading case data...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Case Not Found</h2>
              <p className="text-muted-foreground mb-4">The case you're looking for doesn't exist or you don't have permission to view it.</p>
              <Button onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isComplete) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader 
          title={`AI Analysis - Case ${caseId}`}
          description={caseData?.status === 'error' ? "Analysis failed" : "Processing your dental radiograph"}
        />

        <div className="container py-6">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center space-y-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                {caseData?.status === 'error' ? (
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                ) : (
                <Brain className="w-12 h-12 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">
                  {caseData?.status === 'error' ? 'Analysis Failed' : 'AI Analysis in Progress'}
                </CardTitle>
                <CardDescription>
                  {caseData?.status === 'error' 
                    ? 'The analysis encountered an error. You can try running it again.'
                    : 'Our advanced AI is analyzing your dental radiograph'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {caseData?.status === 'error' ? (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {error || 'An error occurred during analysis. Please try again.'}
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => {
                        if (caseData) {
                          startAnalysis(caseData);
                        }
                      }}
                      className="w-full max-w-sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${((analysisStage + 1) / analysisStages.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{analysisStages[analysisStage]}</span>
                  <span>{Math.round(((analysisStage + 1) / analysisStages.length) * 100)}%</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {analysisStages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {index < analysisStage ? (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ) : index === analysisStage ? (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className={`text-sm ${
                      index <= analysisStage ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Analysis typically takes 30-60 seconds. Please do not refresh the page.
                </AlertDescription>
              </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {isGeneratingReport && (
          <LoadingOverlay message="Generating comprehensive report... This may take a few moments." />
        )}
        <PageHeader 
          title="Case Analysis"
          description="AI-powered dental radiograph analysis"
          extra={
            <div className="flex items-center space-x-2">
              <EditCaseDialog
                caseData={caseData}
                onUpdate={(updatedCase) => {
                  setCaseData(prevCase => {
                    if (!prevCase) return null;
                    return {
                      ...prevCase,
                      patient_data: {
                        ...prevCase.patient_data,
                        ...updatedCase.patient_data
                      }
                    };
                  });
                  toast({
                    title: "Success",
                    description: "Case details have been updated successfully.",
                  });
                }}
                trigger={
                  <Button variant="outline" disabled={!caseData}>
                    <FileText className="w-4 h-4 mr-2" />
                    Edit Case
                  </Button>
                }
              />
              <Button 
                onClick={async () => {
                  try {
                    setIsGeneratingReport(true);
                    // Wait for next render cycle to ensure canvas is updated
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await generatePDFReport(caseData, enhancedAnalysis.data);
                    toast({
                      title: "Success",
                      description: "Report has been downloaded successfully.",
                    });
                  } catch (error) {
                    console.error('Error generating report:', error);
                    toast({
                      title: "Error",
                      description: "Failed to generate report. Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setIsGeneratingReport(false);
                  }
                }}
                disabled={!caseData}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          }
        />

        <div className="container py-6">
          {/* Success Alert */}
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Analysis Complete!</strong> AI analysis has been completed successfully.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Analysis Results */}
            <div className="lg:col-span-2 space-y-6">
                {renderAnalysisResults()}
            </div>

            {/* Patient Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                        <p className="text-foreground font-medium">{caseData.patient_data.fullName || 'Not provided'}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Age</h4>
                        <p className="text-foreground">{caseData.patient_data.age ? `${caseData.patient_data.age} years` : 'Not provided'}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Gender</h4>
                        <p className="text-foreground">{caseData.patient_data.gender || 'Not provided'}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <p className="text-foreground">{caseData.patient_data.phone || 'No phone number'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <p className="text-foreground">{caseData.patient_data.email || 'No email'}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                          <p className="text-foreground">{caseData.patient_data.address || 'No address'}</p>
                        </div>
                      </div>
                    </div>
                    {caseData.patient_data.chiefComplaint && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Chief Complaint</h4>
                          <p className="text-foreground">{caseData.patient_data.chiefComplaint}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="w-5 h-5 mr-2" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="font-medium mb-1">Smoking</div>
                        <Badge variant={caseData.patient_data.smoking ? "destructive" : "secondary"}>
                          {caseData.patient_data.smoking ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="font-medium mb-1">Alcohol</div>
                        <Badge variant={caseData.patient_data.alcohol ? "destructive" : "secondary"}>
                          {caseData.patient_data.alcohol ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="font-medium mb-1">Diabetes</div>
                        <Badge variant={caseData.patient_data.diabetes ? "destructive" : "secondary"}>
                          {caseData.patient_data.diabetes ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="font-medium mb-1">Hypertension</div>
                        <Badge variant={caseData.patient_data.hypertension ? "destructive" : "secondary"}>
                          {caseData.patient_data.hypertension ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                    {typeof caseData.patient_data.medicalHistory === 'string' && caseData.patient_data.medicalHistory && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Additional Notes</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {caseData.patient_data.medicalHistory}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Analysis;








