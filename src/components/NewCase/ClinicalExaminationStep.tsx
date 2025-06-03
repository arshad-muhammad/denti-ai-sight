
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { ClinicalData } from "@/types/newCase";

interface ClinicalExaminationStepProps {
  clinicalData: ClinicalData;
  setClinicalData: (data: ClinicalData) => void;
}

const ClinicalExaminationStep: React.FC<ClinicalExaminationStepProps> = ({
  clinicalData,
  setClinicalData,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="toothNumber">Tooth Number/Quadrant</Label>
          <Input
            id="toothNumber"
            placeholder="e.g., 14, UL6, etc."
            value={clinicalData.toothNumber}
            onChange={(e) => setClinicalData({ ...clinicalData, toothNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pocketDepth">Pocket Depth (mm)</Label>
          <Input
            id="pocketDepth"
            type="number"
            placeholder="3"
            value={clinicalData.pocketDepth}
            onChange={(e) => setClinicalData({ ...clinicalData, pocketDepth: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Clinical Findings</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mobility"
              checked={clinicalData.mobility}
              onCheckedChange={(checked) => setClinicalData({ ...clinicalData, mobility: checked as boolean })}
            />
            <Label htmlFor="mobility">Tooth Mobility</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bleeding"
              checked={clinicalData.bleeding}
              onCheckedChange={(checked) => setClinicalData({ ...clinicalData, bleeding: checked as boolean })}
            />
            <Label htmlFor="bleeding">Bleeding on Probing</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sensitivity"
              checked={clinicalData.sensitivity}
              onCheckedChange={(checked) => setClinicalData({ ...clinicalData, sensitivity: checked as boolean })}
            />
            <Label htmlFor="sensitivity">Temperature Sensitivity</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Additional Clinical Notes</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Any additional clinical observations, notes, or relevant findings..."
          value={clinicalData.additionalNotes}
          onChange={(e) => setClinicalData({ ...clinicalData, additionalNotes: e.target.value })}
          rows={4}
        />
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">Clinical Documentation:</p>
            <p className="mt-1">Accurate clinical findings help improve AI analysis accuracy and provide comprehensive patient records.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicalExaminationStep;
