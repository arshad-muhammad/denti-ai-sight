
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Step } from "@/types/newCase";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  steps: Step[];
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  return (
    <div className="mb-8">
      <Progress value={(currentStep / totalSteps) * 100} className="mb-4" />
      <div className="grid grid-cols-4 gap-4">
        {steps.map((step) => (
          <div 
            key={step.number}
            className={`text-center ${currentStep >= step.number ? 'text-medical-600' : 'text-gray-400'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
              currentStep >= step.number ? 'bg-medical-600 text-white' : 'bg-gray-200'
            }`}>
              <step.icon className="w-5 h-5" />
            </div>
            <div className="text-sm font-medium">{step.title}</div>
            <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepNavigation;
