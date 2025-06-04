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

const NavigationButtons = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onSubmit,
}: NavigationButtonsProps) => {
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
          className="relative text-foreground dark:text-foreground bg-background dark:bg-background hover:bg-accent hover:dark:bg-accent/10 transition-all duration-300 border-0 before:absolute before:inset-0 before:p-[2px] before:rounded-lg before:bg-gradient-to-r before:from-blue-400 before:to-blue-600 before:-z-10 before:content-[''] after:absolute after:inset-[2px] after:rounded-[6px] after:bg-background after:dark:bg-background after:-z-10 after:content-[''] disabled:before:from-gray-300 disabled:before:to-gray-400 disabled:opacity-50"
        >
          <Brain className="w-4 h-4 mr-2" />
          Start AI Analysis
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="relative text-foreground dark:text-foreground bg-background dark:bg-background hover:bg-accent hover:dark:bg-accent/10 transition-all duration-300 border-0 before:absolute before:inset-0 before:p-[2px] before:rounded-lg before:bg-gradient-to-r before:from-blue-400 before:to-blue-600 before:-z-10 before:content-[''] after:absolute after:inset-[2px] after:rounded-[6px] after:bg-background after:dark:bg-background after:-z-10 after:content-[''] disabled:before:from-gray-300 disabled:before:to-gray-400 disabled:opacity-50"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );
};

export default NavigationButtons;
