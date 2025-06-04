import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Upload, FileText, Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientData, ClinicalData, Step } from "@/types/newCase";
import StepNavigation from "@/components/NewCase/StepNavigation";
import PatientInformationStep from "@/components/NewCase/PatientInformationStep";
import RadiographUploadStep from "@/components/NewCase/RadiographUploadStep";
import ClinicalExaminationStep from "@/components/NewCase/ClinicalExaminationStep";
import ReviewSubmitStep from "@/components/NewCase/ReviewSubmitStep";
import NavigationButtons from "@/components/NewCase/NavigationButtons";
import { useAuth } from "@/lib/AuthContext";
import { dentalCaseService } from "@/lib/services/dentalCase";
import { useToast } from "@/components/ui/use-toast";

const NewCase = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 4;
  const { user } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);

  const [patientData, setPatientData] = useState<PatientData>({
    fullName: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    smoking: false,
    alcohol: false,
    diabetes: false,
    hypertension: false,
    chiefComplaint: "",
    medicalHistory: ""
  });

  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [clinicalData, setClinicalData] = useState<ClinicalData>({
    toothNumber: "",
    mobility: false,
    bleeding: false,
    sensitivity: false,
    pocketDepth: "",
    additionalNotes: ""
  });

  const steps: Step[] = [
    { 
      number: 1, 
      title: "Patient Information", 
      icon: User,
      description: "Basic patient details and contact information"
    },
    { 
      number: 2, 
      title: "Upload Radiograph", 
      icon: Upload,
      description: "Upload dental X-ray images for analysis"
    },
    { 
      number: 3, 
      title: "Clinical Examination", 
      icon: FileText,
      description: "Clinical findings and examination details"
    },
    { 
      number: 4, 
      title: "Review & Submit", 
      icon: Brain,
      description: "Review all information before AI analysis"
    }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCase = async () => {
    if (!xrayFile || !user) {
      setError('Please upload a radiograph first');
      return;
    }
    
    setLoading(true);
    console.log('Starting case creation...');

    try {
      // Create the case with minimal required data
      console.log('Creating case document...');
      const caseId = await dentalCaseService.create({
        userId: user.uid,
        patientData: {
          ...patientData,
          fullName: patientData.fullName || "Anonymous Patient"
        },
        clinicalData: {
          ...clinicalData,
          additionalNotes: clinicalData.additionalNotes || ""
        },
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      console.log('Case document created successfully with ID:', caseId);

      // Upload the radiograph
      console.log('Starting radiograph upload...', {
        fileSize: xrayFile.size,
        fileType: xrayFile.type,
        fileName: xrayFile.name
      });
      await dentalCaseService.uploadRadiograph(caseId, xrayFile);
      console.log('Radiograph uploaded successfully');

      // Wait for the radiograph URL to be set with exponential backoff
      let updatedCase = null;
      let retries = 0;
      const maxRetries = 5;
      let retryDelay = 1000; // Start with 1 second

      while (retries < maxRetries) {
        console.log(`Verifying radiograph URL (attempt ${retries + 1}/${maxRetries})...`);
        updatedCase = await dentalCaseService.getById(caseId);
        
        if (updatedCase?.radiographUrl) {
          console.log('Radiograph URL verified successfully');
          break;
        }

        console.log(`Radiograph URL not set yet, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
        retries++;
      }

      if (!updatedCase?.radiographUrl) {
        throw new Error('Radiograph URL was not set properly after multiple attempts');
      }

      toast({
        title: "Success",
        description: "Case created successfully. Starting analysis...",
      });

      // Navigate to analysis page
      console.log('Navigating to analysis page...');
      navigate(`/analysis/${caseId}`);
    } catch (error) {
      console.error("Error creating case:", error);
      let errorMessage = 'Failed to create case. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('upload')) {
          errorMessage = 'Failed to upload radiograph. Please try again.';
        } else if (error.message.includes('create')) {
          errorMessage = 'Failed to create case. Please check your connection and try again.';
        } else if (error.message.includes('URL was not set')) {
          errorMessage = 'Failed to save radiograph URL. Please try again.';
        }
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = () => {
    if (!xrayFile) {
      setError('Please upload a radiograph first');
      return;
    }
    
    // Create case and navigate
    handleCreateCase();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PatientInformationStep
            patientData={patientData}
            setPatientData={setPatientData}
          />
        );
      case 2:
        return (
          <RadiographUploadStep
            onFileSelect={setXrayFile}
            selectedFile={xrayFile}
            error={error}
          />
        );
      case 3:
        return (
          <ClinicalExaminationStep
            clinicalData={clinicalData}
            setClinicalData={setClinicalData}
          />
        );
      case 4:
        return (
          <ReviewSubmitStep
            patientData={patientData}
            xrayFile={xrayFile}
            clinicalData={clinicalData}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return Boolean(
          patientData.fullName.trim() && 
          patientData.age.trim() && 
          patientData.gender.trim()
        );
      case 2:
        return xrayFile !== null;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <span className="text-gray-400">|</span>
          <h1 className="text-xl font-semibold text-gray-900">New Case</h1>
        </div>
      </header>

      {transitionLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-medical-600 animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Preparing Analysis</h3>
            <p className="text-gray-600">Please wait while we prepare your case...</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Case</CardTitle>
            <CardDescription>
              Fill in the required information to start AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <StepNavigation
              currentStep={currentStep}
              totalSteps={totalSteps}
              steps={steps}
            />

            {renderStepContent()}

            <NavigationButtons
              currentStep={currentStep}
              totalSteps={totalSteps}
              canProceed={canProceed()}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleStartAnalysis}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCase;
