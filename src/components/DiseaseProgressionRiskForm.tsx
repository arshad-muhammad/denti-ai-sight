import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Clock, Heart, Shield, Stethoscope } from "lucide-react";

interface DiseaseProgressionRiskFormProps {
  onUpdate: (data: {
    riskScore: number;
    boneLossAgeRatio: number;
    bopFactor: number;
    clinicalAttachmentLoss: number;
    smokingStatus: boolean;
    diabetesStatus: boolean;
  }) => void;
  initialData?: {
    riskScore?: number;
    boneLossAgeRatio?: number;
    bopFactor?: number;
    clinicalAttachmentLoss?: number;
    smokingStatus?: boolean;
    diabetesStatus?: boolean;
  };
}

export const DiseaseProgressionRiskForm = ({ onUpdate, initialData }: DiseaseProgressionRiskFormProps) => {
  const [formData, setFormData] = useState({
    boneLoss: initialData?.boneLossAgeRatio ? initialData.boneLossAgeRatio * 100 : 0,
    patientAge: 0,
    bopScore: initialData?.bopFactor ? initialData.bopFactor * 100 : 0,
    clinicalAttachmentLoss: initialData?.clinicalAttachmentLoss || 0,
    smokingStatus: initialData?.smokingStatus || false,
    diabetesStatus: initialData?.diabetesStatus || false,
  });

  useEffect(() => {
    // Calculate risk score
    const boneLossAgeRatio = formData.boneLoss / formData.patientAge;
    const bopFactor = formData.bopScore / 100;
    
    // Base risk score calculation
    let riskScore = 0;
    
    // Bone loss to age ratio contribution (0-2 points)
    if (boneLossAgeRatio > 1.0) riskScore += 2;
    else if (boneLossAgeRatio > 0.5) riskScore += 1;
    
    // BoP contribution (0-1 point)
    if (bopFactor >= 0.25) riskScore += 1;
    
    // Clinical Attachment Loss contribution (0-1 point)
    if (formData.clinicalAttachmentLoss > 4) riskScore += 1;
    
    // Risk factors contribution
    if (formData.smokingStatus) riskScore += 1;
    if (formData.diabetesStatus) riskScore += 1;

    onUpdate({
      riskScore,
      boneLossAgeRatio,
      bopFactor,
      clinicalAttachmentLoss: formData.clinicalAttachmentLoss,
      smokingStatus: formData.smokingStatus,
      diabetesStatus: formData.diabetesStatus
    });
  }, [formData, onUpdate]);

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement> | boolean
  ) => {
    const value = typeof e === 'boolean' ? e : Math.max(0, parseFloat(e.target.value) || 0);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const riskScore = (() => {
    const boneLossAgeRatio = formData.boneLoss / formData.patientAge;
    const bopFactor = formData.bopScore / 100;
    
    let score = 0;
    if (boneLossAgeRatio > 1.0) score += 2;
    else if (boneLossAgeRatio > 0.5) score += 1;
    if (bopFactor >= 0.25) score += 1;
    if (formData.clinicalAttachmentLoss > 4) score += 1;
    if (formData.smokingStatus) score += 1;
    if (formData.diabetesStatus) score += 1;
    
    return score;
  })();

  return (
    <div className="space-y-6">
      {/* Risk Score Display */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Overall Risk Score</h4>
          <Badge variant={
            riskScore > 3.5
              ? "destructive"
              : riskScore >= 2.0
              ? "warning"
              : "success"
          }>
            {riskScore.toFixed(1)} / 5.0
          </Badge>
        </div>
        <Progress 
          value={riskScore * 20} 
          className={`h-2 ${
            riskScore > 3.5
              ? "bg-red-500"
              : riskScore >= 2.0
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
        />
        <p className="text-sm text-muted-foreground mt-2">
          {riskScore > 3.5
            ? "High Risk – Aggressive treatment recommended"
            : riskScore >= 2.0
            ? "Medium Risk – Close monitoring required"
            : "Low Risk – Standard care protocol"}
        </p>
      </div>

      {/* Risk Factors Input */}
      <div className="grid gap-4">
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Risk Factor Analysis</h4>
          <div className="space-y-4">
            {/* Bone Loss and Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="boneLoss">Bone Loss (%)</Label>
                <Input
                  id="boneLoss"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.boneLoss || ''}
                  onChange={e => handleInputChange('boneLoss')(e)}
                  placeholder="Enter bone loss percentage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientAge">Patient Age</Label>
                <Input
                  id="patientAge"
                  type="number"
                  min="0"
                  value={formData.patientAge || ''}
                  onChange={e => handleInputChange('patientAge')(e)}
                  placeholder="Enter patient age"
                />
              </div>
            </div>

            {/* BoP Score */}
            <div className="space-y-2">
              <Label htmlFor="bopScore">Bleeding on Probing Score (%)</Label>
              <Input
                id="bopScore"
                type="number"
                min="0"
                max="100"
                value={formData.bopScore || ''}
                onChange={e => handleInputChange('bopScore')(e)}
                placeholder="Enter BoP score"
              />
            </div>

            {/* Clinical Attachment Loss */}
            <div className="space-y-2">
              <Label htmlFor="clinicalAttachmentLoss">Clinical Attachment Loss (mm)</Label>
              <Input
                id="clinicalAttachmentLoss"
                type="number"
                min="0"
                step="0.1"
                value={formData.clinicalAttachmentLoss || ''}
                onChange={e => handleInputChange('clinicalAttachmentLoss')(e)}
                placeholder="Enter CAL in mm"
              />
            </div>

            {/* Risk Factors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="smokingStatus">Smoking Status</Label>
                  <p className="text-sm text-muted-foreground">Patient is a current smoker</p>
                </div>
                <Switch
                  id="smokingStatus"
                  checked={formData.smokingStatus}
                  onCheckedChange={value => handleInputChange('smokingStatus')(value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="diabetesStatus">Diabetes Status</Label>
                  <p className="text-sm text-muted-foreground">Patient has diabetes</p>
                </div>
                <Switch
                  id="diabetesStatus"
                  checked={formData.diabetesStatus}
                  onCheckedChange={value => handleInputChange('diabetesStatus')(value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Assessment */}
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Clinical Assessment</h4>
          <div className="space-y-3">
            {/* Risk Level */}
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 mt-1 ${
                riskScore > 3.5
                  ? "text-red-500"
                  : riskScore >= 2.0
                  ? "text-yellow-500"
                  : "text-green-500"
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium">Risk Level</p>
                <p className="text-sm text-muted-foreground">
                  {riskScore > 3.5
                    ? "High risk - Immediate intervention required"
                    : riskScore >= 2.0
                    ? "Moderate risk - Close monitoring needed"
                    : "Low risk - Maintain current protocol"}
                </p>
              </div>
            </div>

            {/* Recommendations */}
            <div className="flex items-start gap-2">
              <Stethoscope className="w-4 h-4 mt-1 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Recommendations</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {riskScore > 3.5 ? (
                    <>
                      <li>Immediate aggressive periodontal therapy</li>
                      <li>3-month recall interval</li>
                      <li>Consider systemic antibiotic therapy</li>
                    </>
                  ) : riskScore >= 2.0 ? (
                    <>
                      <li>Enhanced periodontal maintenance</li>
                      <li>4-month recall interval</li>
                      <li>Risk factor modification essential</li>
                    </>
                  ) : (
                    <>
                      <li>Regular periodontal maintenance</li>
                      <li>6-month recall interval</li>
                      <li>Continue preventive care</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Treatment Timeline */}
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-1 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Treatment Timeline</p>
                <p className="text-sm text-muted-foreground">
                  {riskScore > 3.5
                    ? "Begin intensive treatment within 1-2 weeks"
                    : riskScore >= 2.0
                    ? "Schedule treatment within 1 month"
                    : "Maintain regular check-up schedule"}
                </p>
              </div>
            </div>

            {/* Preventive Measures */}
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-1 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Preventive Measures</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Professional cleaning at recommended intervals</li>
                  <li>Daily interdental cleaning</li>
                  {formData.smokingStatus && <li>Smoking cessation counseling</li>}
                  {formData.diabetesStatus && <li>Glycemic control monitoring</li>}
                </ul>
              </div>
            </div>

            {/* Lifestyle Modifications */}
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 mt-1 text-pink-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Lifestyle Modifications</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  {formData.smokingStatus && <li>Quit smoking program referral</li>}
                  {formData.diabetesStatus && <li>Diabetes management consultation</li>}
                  <li>Stress management if applicable</li>
                  <li>Dietary counseling if needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 