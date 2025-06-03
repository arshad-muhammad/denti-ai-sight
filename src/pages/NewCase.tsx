
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

const NewCase = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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

  const handleSubmit = () => {
    const caseId = `C-${Date.now().toString().slice(-3)}`;
    console.log("Submitting case:", { patientData, xrayFile, clinicalData });
    navigate(`/analysis/${caseId}`);
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
            xrayFile={xrayFile}
            setXrayFile={setXrayFile}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <span className="text-gray-400">|</span>
            <h1 className="text-xl font-semibold text-gray-900">New Case</h1>
          </div>
          
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <StepNavigation
          currentStep={currentStep}
          totalSteps={totalSteps}
          steps={steps}
        />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 mr-2" })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        <NavigationButtons
          currentStep={currentStep}
          totalSteps={totalSteps}
          canProceed={canProceed()}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default NewCase;
