import { useState, useEffect } from "react";
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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/AuthContext";
import { dentalCaseService, type DentalCase } from "@/lib/services/dentalCase";
import { useToast } from "@/components/ui/use-toast";
import { AIService } from '@/lib/services/aiService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const Analysis = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [analysisStage, setAnalysisStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<DentalCase | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const analysisStages = [
    "Initializing AI Model...",
    "Processing Radiograph...",
    "Detecting Bone Loss...",
    "Analyzing Pathologies...",
    "Generating Prognosis...",
    "Finalizing Report..."
  ];

  useEffect(() => {
    const loadCase = async () => {
      if (!caseId || !user) {
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const data = await dentalCaseService.getById(caseId);

        if (!data) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Case not found.',
          });
          navigate('/dashboard');
          return;
        }

        if (data.userId !== user.uid) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You don\'t have permission to view this case.',
          });
          navigate('/dashboard');
          return;
        }

        setCaseData(data);
        
        if (data.status === 'pending') {
          startAnalysis();
        }
      } catch (error) {
        console.error('Error loading case:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load case data.',
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId, user, navigate, toast]);

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

  useEffect(() => {
    if (!user || !caseId) return;

    // Set up real-time listener for case updates
    const unsubscribe = onSnapshot(
      doc(db, 'cases', user.uid, 'cases', caseId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCaseData(data);
          setAnalysisResults(data.analysis);
          setLoading(false);
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Case not found"
          });
          navigate('/dashboard');
        }
      },
      (error) => {
        console.error("Error fetching case:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load case data"
        });
      }
    );

    return () => unsubscribe();
  }, [user, caseId]);

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

  const startAnalysis = async () => {
    if (!caseId || !caseData) return;

    try {
      setAnalyzing(true);
      // Start progress simulation
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 1000);

      // TODO: Implement actual AI analysis
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Update case status
      await dentalCaseService.update(caseId, {
        status: 'completed',
        analysisResults: {
          // Mock results
          findings: [],
          confidence: 0.95,
          recommendations: []
        }
      });

      clearInterval(interval);
      setProgress(100);
      
      // Reload case data
      const updatedCase = await dentalCaseService.getById(caseId);
      if (updatedCase) {
        setCaseData(updatedCase);
      }

      toast({
        title: 'Analysis Complete',
        description: 'Your radiograph has been successfully analyzed.',
      });
    } catch (error) {
      console.error('Error during analysis:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to analyze radiograph.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const renderAnalysisResults = () => {
    if (!analysisResults) return null;

    const { diagnosis, confidence, findings, recommendations } = analysisResults;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Primary Diagnosis
            </CardTitle>
            <CardDescription>
              AI-powered analysis results with {(confidence * 100).toFixed(1)}% confidence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-medical-600">{diagnosis}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Detailed Findings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {findings.boneLoss && (
              <div>
                <h4 className="font-semibold mb-2">Bone Loss Assessment</h4>
                <Badge variant={
                  findings.boneLoss.severity === 'severe' ? 'destructive' :
                  findings.boneLoss.severity === 'moderate' ? 'warning' : 'default'
                }>
                  {findings.boneLoss.severity.toUpperCase()}
                </Badge>
                <p className="mt-2 text-sm text-gray-600">
                  Affected regions: {findings.boneLoss.regions.join(', ')}
                </p>
              </div>
            )}

            {findings.caries && (
              <div>
                <h4 className="font-semibold mb-2">Caries Detection</h4>
                {findings.caries.detected ? (
                  <>
                    <Badge variant="destructive">DETECTED</Badge>
                    <p className="mt-2 text-sm text-gray-600">
                      Locations: {findings.caries.locations.join(', ')}
                    </p>
                  </>
                ) : (
                  <Badge variant="default">NONE DETECTED</Badge>
                )}
              </div>
            )}

            {findings.pathologies && findings.pathologies.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Other Pathologies</h4>
                <ul className="space-y-2">
                  {findings.pathologies.map((pathology, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span>{pathology.type} - {pathology.location}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-4 space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
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
                <div className="h-full bg-medical-600 rounded-full w-1/2 animate-[loader_1s_ease-in-out_infinite]" />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Loading case data...</span>
                <span>50%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 rounded-lg bg-gray-100 animate-pulse" />
              <div className="h-24 rounded-lg bg-gray-100 animate-pulse" />
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
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Edit Case
            </Button>
            <Button className="bg-medical-600 hover:bg-medical-700">
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
            <strong>Analysis Complete!</strong> AI diagnosis has been generated with {caseData.confidence}% confidence.
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
