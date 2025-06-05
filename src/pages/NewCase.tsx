import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Upload, FileText, Brain, Loader2, Check } from "lucide-react";
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
import dentalCaseService from "@/lib/services/dentalCaseService";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";

const steps: Step[] = [
  {
    title: "Patient Information",
    description: "Enter patient details and medical history",
    icon: User
  },
  {
    title: "Upload Radiograph",
    description: "Upload your dental X-ray image",
    icon: Upload
  },
  {
    title: "Review & Submit",
    description: "Review case details and submit for analysis",
    icon: FileText
  }
];

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

  const handleCreateCase = async (data: { userId: string; patientData: PatientData; clinicalData: ClinicalData; radiograph?: File; status: string }) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Starting case creation...', data);
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Create the case first without the radiograph
      const caseId = await dentalCaseService.create({
        userId: user.id,
        patientData: data.patientData,
        clinicalData: data.clinicalData,
        status: 'pending'
      });

      console.log('Case document created successfully with ID:', caseId);

      if (data.radiograph) {
        console.log('Starting radiograph upload...', data.radiograph);
        
        // Upload the radiograph and get the URL
        const radiographUrl = await dentalCaseService.uploadRadiograph(caseId, data.radiograph);
        console.log('Radiograph uploaded successfully with URL:', radiographUrl);

        // Update the case with the radiograph URL
        await dentalCaseService.update(caseId, {
          radiograph_url: radiographUrl,
          status: 'analyzing'
        });
      }

      toast({
        title: "Success",
        description: "Case created successfully. Starting analysis...",
      });

      // Navigate to the analysis page
      navigate(`/analysis/${caseId}`);
    } catch (error) {
      console.error('Error creating case:', error);
      console.log('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error
      });
      setError(error instanceof Error ? error.message : 'Failed to create case');
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create case'
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
    handleCreateCase({
      userId: user?.id || "",
      patientData,
      clinicalData,
      radiograph: xrayFile,
      status: 'pending'
    });
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
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="New Case Analysis"
        description="Upload X-ray images for AI analysis"
      />

      <div className="container py-6">
        {transitionLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card p-8 rounded-lg shadow-xl flex flex-col items-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Preparing Analysis</h3>
              <p className="text-muted-foreground">Please wait while we prepare your case...</p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>New Case</CardTitle>
            <CardDescription>Create a new case for AI analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step Navigation */}
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center ${
                    index + 1 === currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      index + 1 === currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : index + 1 < currentStep
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground bg-background text-muted-foreground'
                    }`}
                  >
                    {index + 1 < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="ml-2 font-medium">{step.title}</span>
                  {index !== steps.length - 1 && (
                    <div className="w-12 h-px bg-border mx-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="mt-6">
              {renderStepContent()}
            </div>

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
