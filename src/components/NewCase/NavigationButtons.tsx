
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Brain } from "lucide-react";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  return (
    <div className="flex justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Previous
      </Button>

      {currentStep === totalSteps ? (
        <Button
          onClick={onSubmit}
          disabled={!canProceed}
          className="bg-medical-600 hover:bg-medical-700"
        >
          <Brain className="w-4 h-4 mr-2" />
          Start AI Analysis
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-medical-600 hover:bg-medical-700"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};

export default NavigationButtons;
