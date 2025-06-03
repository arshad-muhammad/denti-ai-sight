
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
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Analysis = () => {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [analysisStage, setAnalysisStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const analysisStages = [
    "Initializing AI Model...",
    "Processing Radiograph...",
    "Detecting Bone Loss...",
    "Analyzing Pathologies...",
    "Generating Prognosis...",
    "Finalizing Report..."
  ];

  useEffect(() => {
    if (!isComplete) {
      const interval = setInterval(() => {
        setAnalysisStage((prev) => {
          if (prev < analysisStages.length - 1) {
            return prev + 1;
          } else {
            setIsComplete(true);
            return prev;
          }
        });
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [isComplete, analysisStages.length]);

  // Mock analysis results
  const analysisResults = {
    boneLoss: 35,
    diagnosis: "Moderate Chronic Periodontitis",
    severity: "moderate",
    prognosis: "Guarded",
    confidence: 94,
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
    followUp: "6-8 weeks"
  };

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

        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-medical-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-medical-600 animate-pulse" />
              </div>
              <CardTitle>AI Analysis in Progress</CardTitle>
              <CardDescription>
                Our advanced AI is analyzing your radiograph
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(((analysisStage + 1) / analysisStages.length) * 100)}%</span>
                </div>
                <Progress value={((analysisStage + 1) / analysisStages.length) * 100} />
              </div>
              
              <div className="space-y-2">
                {analysisStages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {index < analysisStage ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : index === analysisStage ? (
                      <RefreshCw className="w-4 h-4 text-medical-600 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={`text-sm ${
                      index <= analysisStage ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
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
            <strong>Analysis Complete!</strong> AI diagnosis has been generated with {analysisResults.confidence}% confidence.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diagnosis Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI Diagnosis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{analysisResults.diagnosis}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className={getSeverityColor(analysisResults.severity)}>
                          {analysisResults.severity} severity
                        </Badge>
                        <Badge variant="outline">
                          <Award className="w-3 h-3 mr-1" />
                          {analysisResults.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{analysisResults.boneLoss}%</div>
                      <div className="text-sm text-red-800">Bone Loss Detected</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className={`text-2xl font-bold ${getPrognosisColor(analysisResults.prognosis)}`}>
                        {analysisResults.prognosis}
                      </div>
                      <div className="text-sm text-gray-600">Prognosis</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Findings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Detailed Pathology Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResults.pathologies.map((pathology, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{pathology.name}</div>
                        <div className="text-sm text-gray-600">{pathology.location}</div>
                      </div>
                      <Badge variant="secondary" className={getSeverityColor(pathology.severity)}>
                        {pathology.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Treatment Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Recommended Treatment Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResults.treatmentPlan.map((treatment, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-medical-100 rounded-full flex items-center justify-center text-medical-600 text-sm font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900">{treatment}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Recommended Follow-up:</span>
                    <span className="text-blue-700">{analysisResults.followUp}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Patient Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Patient Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">John Doe</div>
                  <div className="text-gray-600">Age 45, Male</div>
                </div>
                <Separator />
                <div className="text-sm">
                  <div className="font-medium mb-1">Risk Factors:</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">Smoking</Badge>
                    <Badge variant="outline" className="text-xs">Diabetes</Badge>
                  </div>
                </div>
                <Separator />
                <div className="text-sm">
                  <div className="font-medium mb-1">Chief Complaint:</div>
                  <p className="text-gray-600">Bleeding gums and loose teeth</p>
                </div>
              </CardContent>
            </Card>

            {/* Radiograph Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Radiograph Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center text-gray-600">
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">X-ray with AI Overlay</p>
                    <p className="text-xs">Bone loss highlighted</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Image Quality:</span>
                    <Badge variant="outline" className="text-green-600">Excellent</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Analysis Time:</span>
                    <span className="text-gray-600">45 seconds</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Clinical Correlation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium mb-1">Clinical Findings:</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Pocket Depth:</span>
                      <span className="text-red-600 font-medium">6mm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bleeding:</span>
                      <CheckCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Mobility:</span>
                      <CheckCircle className="w-4 h-4 text-yellow-500" />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="text-sm">
                  <div className="font-medium mb-1">AI-Clinical Match:</div>
                  <div className="flex items-center space-x-2">
                    <Progress value={92} className="flex-1" />
                    <span className="text-green-600 font-medium">92%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Medical Disclaimer:</strong> This AI analysis is for diagnostic assistance only. 
                Final clinical decisions should always be made by qualified dental professionals.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
