import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Upload, FileText, Brain } from "lucide-react";
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

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a case.",
      });
      return;
    }

    if (!xrayFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please upload a radiograph.",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the case
      const caseId = await dentalCaseService.create({
        userId: user.uid,
        patientData,
        clinicalData,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // Upload the radiograph
      await dentalCaseService.uploadRadiograph(caseId, xrayFile);

      toast({
        title: "Success",
        description: "Case created successfully. Starting analysis...",
      });

      // Navigate to analysis page
      navigate(`/analysis/${caseId}`);
    } catch (error) {
      console.error("Error creating case:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create case. Please try again.",
      });
    } finally {
      setLoading(false);
    }
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return patientData.fullName && patientData.age && patientData.gender;
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
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewCase;
