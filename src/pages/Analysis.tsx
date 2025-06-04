import { useState, useEffect, useRef } from "react";
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
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/AuthContext";
import { dentalCaseService } from "@/lib/services/dentalCase";
import { FirebaseDentalCase, Pathology } from "@/types/firebase";
import { AnalysisResult, Severity } from "@/types/analysis";
import { useToast } from "@/components/ui/use-toast";
import { AIService, AIServiceError, ImageProcessingError, ModelInferenceError, AIAnalysisResult } from '@/lib/services/aiService';
import { doc, onSnapshot, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, DocumentReference, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getEnhancedAnalysis } from '../services/geminiService';
import { EditCaseDialog } from "@/components/EditCaseDialog";
import { generatePDFReport } from "@/services/reportService";

// Add these interfaces at the top of the file
interface AIPathology {
  type: string;
  confidence: number;
  location: string;
  bbox: [number, number, number, number];
}

interface AIBoneLossMeasurement {
  cejToBone: number;
  severity: 'mild' | 'moderate' | 'severe';
}

interface AIFindings {
  boneLoss: {
    measurements: AIBoneLossMeasurement[];
    severity: 'mild' | 'moderate' | 'severe';
    confidence: number;
    overlayImage: string;
  };
  pathologies: AIPathology[];
}

interface AIServiceResult {
  diagnosis: string;
  confidence: number;
  findings: AIFindings;
  recommendations: string[];
  prognosis: string;
  metadata: {
    timestamp: string;
    imageQuality: {
      score: number;
      issues: string[];
    };
    processingTime: number;
    modelVersion: string;
  };
}

interface EnhancedAnalysisState {
  loading: boolean;
  data: Awaited<ReturnType<typeof getEnhancedAnalysis>> | null;
  error: Error | null;
}

const Analysis = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [analysisStage, setAnalysisStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<FirebaseDentalCase | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AIAnalysisResult | null>(null);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedAnalysisState>({
    loading: false,
    data: null,
    error: null
  });

  // Add a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Separate effect for initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      if (!caseId || !user) {
        console.log('Missing caseId or user, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        console.log('Loading initial data for case:', caseId);
        
        // Try to get case from both locations
        const mainCaseRef = doc(db, 'cases', caseId);
        const userCaseRef = doc(db, `cases/${user.uid}/cases/${caseId}`);
        
        const [mainCaseSnap, userCaseSnap] = await Promise.all([
          getDoc(mainCaseRef),
          getDoc(userCaseRef)
        ]);
        
        // Use user's subcollection data if it exists, otherwise use main collection
        const caseSnap = userCaseSnap.exists() ? userCaseSnap : mainCaseSnap;
        
        if (!caseSnap.exists()) {
          console.error('Case not found in either location');
          toast({
            title: "Error",
            description: "Case not found. Please check the case ID and try again.",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }

        const data = caseSnap.data();
        console.log('Raw case data:', data);

        if (!data) {
          throw new Error('Case data is empty');
        }

        // Transform to FirebaseDentalCase with strict type checking
        const caseData: FirebaseDentalCase = {
          id: caseId,
          userId: data.userId || user.uid,
          patientName: data.patientName || 'Anonymous',
          patientAge: typeof data.patientAge === 'number' ? data.patientAge : 0,
          patientGender: data.patientGender || 'Not Specified',
          patientContact: {
            phone: data.patientContact?.phone || '',
            email: data.patientContact?.email || '',
            address: data.patientContact?.address || ''
          },
          medicalHistory: {
            smoking: Boolean(data.medicalHistory?.smoking),
            alcohol: Boolean(data.medicalHistory?.alcohol),
            diabetes: Boolean(data.medicalHistory?.diabetes),
            hypertension: Boolean(data.medicalHistory?.hypertension),
            notes: data.medicalHistory?.notes || ''
          },
          clinicalFindings: {
            toothNumber: data.clinicalFindings?.toothNumber || '',
            mobility: Boolean(data.clinicalFindings?.mobility),
            bleeding: Boolean(data.clinicalFindings?.bleeding),
            sensitivity: Boolean(data.clinicalFindings?.sensitivity),
            pocketDepth: data.clinicalFindings?.pocketDepth || '',
            notes: data.clinicalFindings?.notes || ''
          },
          symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
          radiographUrl: data.radiographUrl || null,
          status: data.status || 'pending',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          analysisResults: data.analysisResults || null,
          diagnosis: data.diagnosis || null,
          boneLoss: typeof data.boneLoss === 'number' ? data.boneLoss : null,
          severity: data.severity || null,
          confidence: typeof data.confidence === 'number' ? data.confidence : null,
          pathologies: Array.isArray(data.pathologies) ? data.pathologies : [],
          treatmentPlan: Array.isArray(data.treatmentPlan) ? data.treatmentPlan : [],
          prognosis: data.prognosis || null,
          followUp: data.followUp || null
        };

        console.log('Transformed case data:', caseData);

        if (isMounted.current) {
          setCaseData(caseData);
          
          if (caseData.analysisResults) {
            console.log('Setting existing analysis results');
            setAnalysisResults(caseData.analysisResults);
            setIsComplete(true);
          } else if (caseData.status === 'pending' && caseData.radiographUrl && !analyzing) {
            console.log('Starting analysis for pending case with radiograph');
            await startAnalysis(caseData);
          }
        }
      } catch (error) {
        console.error('Error loading case data:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load case data",
          variant: "destructive"
        });
        navigate('/dashboard');
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    loadInitialData();
  }, [caseId, user, navigate, toast, analyzing]);

  // Separate effect for real-time updates
  useEffect(() => {
    if (!caseId || !user) return;

    console.log('Setting up real-time listener for case:', caseId);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'cases', caseId),
      (docSnapshot) => {
        if (!isMounted.current) return;

        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as Omit<FirebaseDentalCase, 'id'>;
          console.log('Real-time update received:', {
            id: caseId,
            status: data.status,
            hasRadiograph: !!data.radiographUrl
          });

          const updatedCase: FirebaseDentalCase = {
            id: caseId,
            userId: data.userId,
            patientName: data.patientName || 'Anonymous',
            patientAge: data.patientAge || 0,
            patientGender: data.patientGender || 'Not Specified',
            patientContact: data.patientContact || { phone: '', email: '', address: '' },
            medicalHistory: data.medicalHistory || {
              smoking: false,
              alcohol: false,
              diabetes: false,
              hypertension: false,
              notes: ''
            },
            clinicalFindings: data.clinicalFindings || {
              toothNumber: '',
              mobility: false,
              bleeding: false,
              sensitivity: false,
              pocketDepth: '',
              notes: ''
            },
            symptoms: data.symptoms || [],
            radiographUrl: data.radiographUrl,
            status: data.status || 'pending',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };

          setCaseData(updatedCase);
          setLoading(false);

          // If the case is pending and has a radiograph, start analysis
          if (updatedCase.status === 'pending' && updatedCase.radiographUrl && !analyzing) {
            console.log('Starting analysis for pending case with radiograph');
                startAnalysis(updatedCase);
          }
        } else {
          console.log('Case document does not exist');
          setCaseData(null);
              setLoading(false);
        }
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up real-time listener');
      unsubscribe();
    };
  }, [caseId, user, analyzing]);

  const analysisStages = [
    "Initializing AI Model...",
    "Processing Radiograph...",
    "Detecting Bone Loss...",
    "Analyzing Pathologies...",
    "Generating Prognosis...",
    "Finalizing Report..."
  ];

  useEffect(() => {
    if (!isComplete && caseData && caseData.status !== "completed") {
      const interval = setInterval(() => {
        setAnalysisStage((prev) => {
          if (prev < analysisStages.length - 1) {
            return prev + 1;
          } else {
            setIsComplete(true);
            // Update case status to completed
            if (caseId) {
              dentalCaseService.update(caseId, {
                status: "completed",
                diagnosis: "Moderate Chronic Periodontitis", // This would come from AI
                boneLoss: 35, // This would come from AI
                severity: "moderate", // This would come from AI
                confidence: 94, // This would come from AI
                pathologies: [
                  { name: "Horizontal Bone Loss", severity: "moderate", location: "Generalized" },
                  { name: "Furcation Involvement", severity: "mild", location: "Molars 14, 15" },
                  { name: "Widened PDL Space", severity: "mild", location: "Tooth 14" }
                ],
                treatmentPlan: [
                  "Scaling and Root Planing (Full mouth)",
                  "Periodontal Maintenance every 3 months",
                  "Re-evaluation in 6-8 weeks",
                  "Consider surgical intervention if no improvement",
                  "Patient education on oral hygiene"
                ],
                prognosis: "Guarded",
                followUp: "6-8 weeks"
              });
            }
            return prev;
          }
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isComplete, analysisStages.length, caseId, caseData]);

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

  const getPrognosisColor = (prognosis: string) => {
    switch (prognosis.toLowerCase()) {
      case "good":
        return "text-green-600";
      case "guarded":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Helper function to handle analysis errors
  const handleAnalysisError = async (
    error: unknown, 
    caseRef: DocumentReference, 
    userCaseRef: DocumentReference
  ) => {
    console.error('Error in analysis process:', error);
    setProgress(0);
    
    if (!isMounted.current) return;

    let errorMessage = 'An unexpected error occurred during analysis';
    
    if (error instanceof ImageProcessingError) {
      errorMessage = `Image processing error: ${error.message}`;
    } else if (error instanceof ModelInferenceError) {
      errorMessage = `AI model error: ${error.message}`;
    } else if (error instanceof AIServiceError) {
      errorMessage = `AI service error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Update case status to error in both locations
    const errorData = {
      status: 'error' as const,
      updatedAt: serverTimestamp()
    };

    await Promise.all([
      updateDoc(caseRef, errorData).catch(() => null),
      updateDoc(userCaseRef, errorData).catch(() => null)
    ]);

    // Update local state
    setCaseData(prev => {
      if (!prev) return null;
      const updated: FirebaseDentalCase = {
        ...prev,
        status: 'error' as const,
        updatedAt: Timestamp.now()
      };
      console.log('Updated case data after error:', updated);
      return updated;
    });

    toast({
      title: "Analysis Failed",
      description: errorMessage,
      variant: "destructive"
    });
  };

  // Transform results to match FirebaseDentalCase structure
  const prepareUpdateData = (results: AIAnalysisResult): { [K in keyof FirebaseDentalCase]?: FirebaseDentalCase[K] } & { updatedAt: Timestamp } => {
    const baseData: Omit<Partial<FirebaseDentalCase>, 'updatedAt'> = {
      status: 'completed' as const,
      analysisResults: {
        timestamp: Timestamp.now(),
        diagnosis: results.diagnosis,
        confidence: results.confidence,
        severity: results.severity,
        findings: {
          boneLoss: {
            percentage: results.findings.boneLoss?.percentage || 0,
            severity: results.findings.boneLoss?.severity || 'mild' as const,
            regions: results.findings.boneLoss?.regions || ['General']
          },
          pathologies: results.findings.pathologies?.map((p: Finding) => ({
            type: p.type,
            location: p.location,
            severity: p.severity,
            confidence: p.confidence
          })) || []
        },
        recommendations: results.recommendations,
        annotations: results.annotations || []
      },
      diagnosis: results.diagnosis,
      boneLoss: results.findings.boneLoss?.percentage || null,
      severity: results.severity || null,
      confidence: results.confidence,
      pathologies: results.findings.pathologies?.map((p: Finding) => ({
        name: p.type,
        severity: p.severity,
        location: p.location
      })) || [],
      treatmentPlan: results.recommendations,
      prognosis: results.severity === 'severe' ? 'Poor' as const :
                results.severity === 'moderate' ? 'Fair' as const : 'Good' as const,
      followUp: '6-8 weeks'
    };

    return {
      ...baseData,
      updatedAt: Timestamp.now()
    };
  };

  const startAnalysis = async (currentCaseData: FirebaseDentalCase) => {
    console.log('Starting analysis with case data:', currentCaseData);

    if (!currentCaseData.radiographUrl) {
      console.error('No radiograph URL available');
      toast({
        title: "Error",
        description: "No radiograph available for analysis",
        variant: "destructive"
      });
      return;
    }

    try {
      setAnalyzing(true);
      setProgress(10);

      // Update case status to analyzing
      const caseRef = doc(db, 'cases', currentCaseData.id);
      const userCaseRef = doc(db, `cases/${user?.uid}/cases/${currentCaseData.id}`);
      
      await Promise.all([
        updateDoc(caseRef, {
          status: 'analyzing' as const,
          updatedAt: serverTimestamp()
        }).catch(() => null),
        updateDoc(userCaseRef, {
          status: 'analyzing' as const,
          updatedAt: serverTimestamp()
        }).catch(() => null)
      ]);

      setProgress(20);
      console.log('Fetching radiograph from URL:', currentCaseData.radiographUrl);
      const response = await fetch(currentCaseData.radiographUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch radiograph: ${response.statusText}`);
      }
      
      setProgress(30);
      const blob = await response.blob();
      console.log('Radiograph fetched successfully, size:', blob.size, 'bytes');
      
      const file = new File([blob], 'radiograph.jpg', { type: 'image/jpeg' });
      console.log('Created File object for analysis');

      setProgress(40);
      console.log('Starting AI analysis...');
      
      try {
        const results = await AIService.analyzeImage(file);
        console.log('AI analysis completed. Results:', results);
        
        if (!isMounted.current) {
          console.log('Component unmounted, stopping analysis');
          return;
        }

        setProgress(80);
        console.log('Updating case with analysis results...');
        
        const updateDataWithTimestamp = prepareUpdateData(results);
        console.log('Update data prepared:', updateDataWithTimestamp);

        // Convert Timestamp to FieldValue for Firestore update
        const firestoreUpdate = {
          ...updateDataWithTimestamp,
          updatedAt: serverTimestamp()
        };

        await Promise.all([
          updateDoc(caseRef, firestoreUpdate).catch((error) => {
            console.error('Failed to update main case document:', error);
            return null;
          }),
          updateDoc(userCaseRef, firestoreUpdate).catch((error) => {
            console.error('Failed to update user case document:', error);
            return null;
          })
        ]);

        setProgress(100);
        console.log('Database update completed');
        
        // Update local state with Timestamp instead of FieldValue
        setCaseData(prev => {
          if (!prev) return null;
          const updated: FirebaseDentalCase = {
            ...prev,
            ...updateDataWithTimestamp,
            status: 'completed' as const,
            updatedAt: Timestamp.now()
          };
          console.log('Updated case data:', updated);
          return updated;
        });
        
        setAnalysisResults(results);
        setIsComplete(true);

        console.log('Analysis process completed successfully');
        toast({
          title: "Analysis Complete",
          description: "The dental radiograph analysis has been completed successfully.",
        });
      } catch (error) {
        handleAnalysisError(error, caseRef, userCaseRef);
      }
    } catch (error) {
      handleAnalysisError(error, doc(db, 'cases', currentCaseData.id), doc(db, `cases/${user?.uid}/cases/${currentCaseData.id}`));
    } finally {
      if (isMounted.current) {
        setAnalyzing(false);
      }
    }
  };

  // Add this effect to get enhanced analysis when analysis is complete
  useEffect(() => {
    if (isComplete && caseData && !enhancedAnalysis.data && !enhancedAnalysis.loading) {
      const fetchEnhancedAnalysis = async () => {
        setEnhancedAnalysis(prev => ({ ...prev, loading: true }));
        try {
          const result = await getEnhancedAnalysis({
            diagnosis: caseData.diagnosis || '',
            findings: caseData.analysisResults?.findings || {},
            patientData: {
              age: caseData.patientAge,
              gender: caseData.patientGender,
              medicalHistory: caseData.medicalHistory
            }
          });
          setEnhancedAnalysis({ loading: false, data: result, error: null });
        } catch (error) {
          setEnhancedAnalysis({ loading: false, data: null, error: error as Error });
          console.error('Error fetching enhanced analysis:', error);
        }
      };

      fetchEnhancedAnalysis();
    }
  }, [isComplete, caseData, enhancedAnalysis.data, enhancedAnalysis.loading]);

  const renderAnalysisResults = () => {
    console.log('Rendering analysis results:', {
      caseData,
      analysisResults: caseData?.analysisResults,
      diagnosis: caseData?.diagnosis,
      boneLoss: caseData?.boneLoss,
      severity: caseData?.severity,
      pathologies: caseData?.pathologies
    });

    if (!caseData?.analysisResults && !caseData?.diagnosis) {
      console.log('No analysis results to display');
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Primary Diagnosis Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Primary Diagnosis
            </CardTitle>
            <CardDescription>
              AI-powered analysis results with {caseData.confidence}% confidence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Disease Type */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Disease Type</h4>
                <p className="text-lg font-semibold text-medical-600">{caseData.diagnosis || 'Not available'}</p>
              </div>
              
              {/* Bone Loss */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Bone Loss</h4>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-medical-600">
                    {caseData.boneLoss ? `${caseData.boneLoss}%` : 'Not available'}
                  </span>
                  {caseData.severity && (
                    <Badge className={getSeverityColor(caseData.severity)}>
                      {caseData.severity.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pathologies Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Detailed Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enhancedAnalysis.loading ? (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="w-6 h-6 animate-spin text-medical-600" />
              </div>
            ) : enhancedAnalysis.data ? (
              <div className="space-y-6">
                {/* Primary Condition */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-lg mb-3">Primary Condition</h4>
                  <div className="space-y-3">
                    <p className="text-gray-700">{enhancedAnalysis.data.detailedFindings.primaryCondition.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Severity:</span>
                      <Badge variant="outline" className={getSeverityColor(enhancedAnalysis.data.detailedFindings.primaryCondition.severity)}>
                        {enhancedAnalysis.data.detailedFindings.primaryCondition.severity}
                      </Badge>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Clinical Implications:</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {enhancedAnalysis.data.detailedFindings.primaryCondition.implications.map((imp, index) => (
                          <li key={index} className="text-gray-700">{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Secondary Findings */}
                {enhancedAnalysis.data.detailedFindings.secondaryFindings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-lg mb-3">Secondary Findings</h4>
                    <div className="space-y-4">
                      {enhancedAnalysis.data.detailedFindings.secondaryFindings.map((finding, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium mb-2">{finding.condition}</h5>
                          <div className="space-y-3">
                            <p className="text-gray-700">{finding.description}</p>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Severity:</span>
                              <Badge variant="outline" className={getSeverityColor(finding.severity)}>
                                {finding.severity}
                              </Badge>
                            </div>
                            <div>
                              <h6 className="font-medium mb-1">Implications:</h6>
                              <ul className="list-disc list-inside space-y-1">
                                {finding.implications.map((imp, index) => (
                                  <li key={index} className="text-gray-700">{imp}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-lg mb-3">Risk Assessment</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Current Risk Status</h5>
                      <p className="text-gray-700">{enhancedAnalysis.data.detailedFindings.riskAssessment.current}</p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Future Risk Projection</h5>
                      <p className="text-gray-700">{enhancedAnalysis.data.detailedFindings.riskAssessment.future}</p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Risk Mitigation Strategies</h5>
                      <ul className="list-disc list-inside space-y-1">
                        {enhancedAnalysis.data.detailedFindings.riskAssessment.mitigationStrategies.map((strategy, index) => (
                          <li key={index} className="text-gray-700">{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {caseData.pathologies && caseData.pathologies.length > 0 ? (
                  caseData.pathologies.map((pathology, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{pathology.name}</h4>
                        <p className="text-sm text-gray-500">Location: {pathology.location}</p>
                      </div>
                      <Badge className={getSeverityColor(pathology.severity)}>
                        {pathology.severity.toUpperCase()}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No pathologies detected</p>
                )}
              </div>
            )}
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
                        {caseData.followUp && (
                          <Badge variant="outline">Follow-up: {caseData.followUp}</Badge>
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
                    <span className={`text-lg font-semibold ${getPrognosisColor(caseData.prognosis || 'unknown')}`}>
                      {caseData.prognosis}
                    </span>
                    {caseData.followUp && (
                      <Badge variant="outline">Follow-up: {caseData.followUp}</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Treatment Plan</h4>
                  {caseData.treatmentPlan && caseData.treatmentPlan.length > 0 ? (
                    <ul className="space-y-2">
                      {caseData.treatmentPlan.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No treatment plan available</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Annotated Radiograph Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Annotated Radiograph
            </CardTitle>
            <CardDescription>
              AI annotations highlighting detected pathologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {caseData.radiographUrl ? (
              <div className="relative">
                <img
                  src={caseData.radiographUrl}
                  alt="Annotated Dental Radiograph"
                  className="w-full rounded-lg"
                />
                {caseData.analysisResults?.annotations && (
                  <div className="absolute inset-0">
                    {/* Add SVG overlay for annotations */}
                    <svg className="absolute inset-0 w-full h-full">
                      {caseData.pathologies?.map((pathology, index) => (
                        <g key={index}>
                          {/* Example annotation - you'll need to adjust based on your actual data */}
                          <circle
                            cx={`${50 + index * 10}%`}
                            cy="50%"
                            r="20"
                            fill="none"
                            stroke={pathology.severity === 'severe' ? 'red' : 
                                   pathology.severity === 'moderate' ? 'yellow' : 'green'}
                            strokeWidth="2"
                            opacity="0.6"
                          />
                          <text
                            x={`${50 + index * 10}%`}
                            y="50%"
                            textAnchor="middle"
                            fill="white"
                            fontSize="12"
                            className="font-medium"
                          >
                            {pathology.name}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No radiograph available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center space-y-6">
            <div className="w-20 h-20 bg-medical-100 rounded-full flex items-center justify-center mx-auto">
              <Brain className="w-10 h-10 text-medical-600 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-2">Loading Case Data</CardTitle>
              <CardDescription>Please wait while we retrieve your case information...</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-medical-600 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: `${Math.floor(Math.random() * 30) + 60}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Connecting to database...</span>
                <span>Please wait</span>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-500 mt-4">
              <p>This may take a few moments. Thank you for your patience.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Case Not Found</h2>
              <p className="text-gray-600 mb-4">The case you're looking for doesn't exist or you don't have permission to view it.</p>
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <span className="text-gray-400">|</span>
            <h1 className="text-xl font-semibold text-gray-900">AI Analysis - Case {caseId}</h1>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[80vh] p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center space-y-6">
              <div className="w-24 h-24 bg-medical-100 rounded-full flex items-center justify-center mx-auto">
                <Brain className="w-12 h-12 text-medical-600 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">AI Analysis in Progress</CardTitle>
                <CardDescription>Our advanced AI is analyzing your dental radiograph</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-medical-600 rounded-full transition-all duration-500 ease-in-out"
                    style={{ width: `${((analysisStage + 1) / analysisStages.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
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
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-medical-100 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-medical-600 animate-spin" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <span className={`text-sm ${
                      index <= analysisStage ? 'text-gray-900 font-medium' : 'text-gray-400'
                    }`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Analysis typically takes 30-60 seconds. Please do not refresh the page.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <span className="text-gray-400">|</span>
            <h1 className="text-xl font-semibold text-gray-900">AI Analysis Results - Case {caseId}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <EditCaseDialog
              caseData={caseData}
              onUpdate={(updatedCase) => {
                setCaseData(updatedCase);
                toast({
                  title: "Success",
                  description: "Case details have been updated successfully.",
                });
              }}
              trigger={
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Case
                </Button>
              }
            />
            <Button 
              className="bg-medical-600 hover:bg-medical-700"
              onClick={() => {
                try {
                  generatePDFReport(caseData, enhancedAnalysis.data);
                  toast({
                    title: "Success",
                    description: "Report has been downloaded successfully.",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to generate report. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Success Alert */}
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
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
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                    <p className="text-gray-900">{caseData.patientName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Age</h4>
                    <p className="text-gray-900">{caseData.patientAge} years</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Gender</h4>
                    <p className="text-gray-900">{caseData.patientGender}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                    <div className="space-y-2 mt-2">
                      <p className="text-gray-900">{caseData.patientContact?.phone}</p>
                      <p className="text-gray-900">{caseData.patientContact?.email}</p>
                      <p className="text-gray-900">{caseData.patientContact?.address}</p>
                    </div>
                  </div>
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
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-medium">Smoking</div>
                      <div className={caseData.medicalHistory?.smoking ? "text-red-600" : "text-green-600"}>
                        {caseData.medicalHistory?.smoking ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-medium">Alcohol</div>
                      <div className={caseData.medicalHistory?.alcohol ? "text-red-600" : "text-green-600"}>
                        {caseData.medicalHistory?.alcohol ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-medium">Diabetes</div>
                      <div className={caseData.medicalHistory?.diabetes ? "text-red-600" : "text-green-600"}>
                        {caseData.medicalHistory?.diabetes ? "Yes" : "No"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-medium">Hypertension</div>
                      <div className={caseData.medicalHistory?.hypertension ? "text-red-600" : "text-green-600"}>
                        {caseData.medicalHistory?.hypertension ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>

                  {caseData.medicalHistory?.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Additional Notes</h4>
                      <p className="text-gray-900">{caseData.medicalHistory.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Radiograph
                </CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.radiographUrl ? (
                  <img
                    src={caseData.radiographUrl}
                    alt="Dental Radiograph"
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No radiograph available</p>
                  </div>
                )}
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








