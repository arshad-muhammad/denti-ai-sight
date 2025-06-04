import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, AlertCircle, AlertTriangle, Stethoscope } from "lucide-react";

interface BoPAssessmentFormProps {
  onUpdate: (data: {
    bopScore: number;
    totalSites: number;
    bleedingSites: number;
    anteriorBleeding: number;
    posteriorBleeding: number;
    deepPocketSites: number;
    averagePocketDepth: number;
  }) => void;
  initialData?: {
    bopScore?: number;
    totalSites?: number;
    bleedingSites?: number;
    anteriorBleeding?: number;
    posteriorBleeding?: number;
    deepPocketSites?: number;
    averagePocketDepth?: number;
  };
}

export const BoPAssessmentForm = ({ onUpdate, initialData }: BoPAssessmentFormProps) => {
  const [formData, setFormData] = useState({
    totalSites: initialData?.totalSites || 0,
    bleedingSites: initialData?.bleedingSites || 0,
    anteriorBleedingSites: 0,
    posteriorBleedingSites: 0,
    deepPocketSites: initialData?.deepPocketSites || 0,
    totalPocketDepth: 0,
    numberOfMeasurements: 0,
  });

  useEffect(() => {
    // Calculate scores
    const bopScore = (formData.bleedingSites / formData.totalSites) * 100 || 0;
    const anteriorBleeding = (formData.anteriorBleedingSites / (formData.totalSites / 2)) * 100 || 0;
    const posteriorBleeding = (formData.posteriorBleedingSites / (formData.totalSites / 2)) * 100 || 0;
    const averagePocketDepth = formData.numberOfMeasurements > 0 
      ? formData.totalPocketDepth / formData.numberOfMeasurements 
      : 0;

    onUpdate({
      bopScore: Number(bopScore.toFixed(1)),
      totalSites: formData.totalSites,
      bleedingSites: formData.bleedingSites,
      anteriorBleeding: Number(anteriorBleeding.toFixed(1)),
      posteriorBleeding: Number(posteriorBleeding.toFixed(1)),
      deepPocketSites: formData.deepPocketSites,
      averagePocketDepth: Number(averagePocketDepth.toFixed(1))
    });
  }, [formData, onUpdate]);

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Validate bleeding sites cannot exceed total sites
      if (field === 'totalSites') {
        return {
          ...updated,
          bleedingSites: Math.min(updated.bleedingSites, value),
          anteriorBleedingSites: Math.min(updated.anteriorBleedingSites, Math.floor(value / 2)),
          posteriorBleedingSites: Math.min(updated.posteriorBleedingSites, Math.floor(value / 2))
        };
      }
      
      // Validate anterior + posterior bleeding sites cannot exceed total bleeding sites
      if (field === 'bleedingSites') {
        return {
          ...updated,
          anteriorBleedingSites: Math.min(updated.anteriorBleedingSites, value),
          posteriorBleedingSites: Math.min(updated.posteriorBleedingSites, value)
        };
      }
      
      return updated;
    });
  };

  const bopScore = (formData.bleedingSites / formData.totalSites) * 100 || 0;
  const anteriorBleeding = (formData.anteriorBleedingSites / (formData.totalSites / 2)) * 100 || 0;
  const posteriorBleeding = (formData.posteriorBleedingSites / (formData.totalSites / 2)) * 100 || 0;
  const averagePocketDepth = formData.numberOfMeasurements > 0 
    ? formData.totalPocketDepth / formData.numberOfMeasurements 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Bleeding on Probing (BoP) Assessment
        </CardTitle>
        <CardDescription>
          Enter the clinical measurements to calculate periodontal status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Basic Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSites">Total Sites Examined</Label>
              <Input
                id="totalSites"
                type="number"
                min="0"
                value={formData.totalSites || ''}
                onChange={handleInputChange('totalSites')}
                placeholder="Enter total sites"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bleedingSites">Bleeding Sites</Label>
              <Input
                id="bleedingSites"
                type="number"
                min="0"
                max={formData.totalSites}
                value={formData.bleedingSites || ''}
                onChange={handleInputChange('bleedingSites')}
                placeholder="Enter bleeding sites"
              />
            </div>
          </div>

          {/* Regional Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anteriorBleedingSites">Anterior Bleeding Sites</Label>
              <Input
                id="anteriorBleedingSites"
                type="number"
                min="0"
                max={formData.bleedingSites}
                value={formData.anteriorBleedingSites || ''}
                onChange={handleInputChange('anteriorBleedingSites')}
                placeholder="Enter anterior bleeding sites"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posteriorBleedingSites">Posterior Bleeding Sites</Label>
              <Input
                id="posteriorBleedingSites"
                type="number"
                min="0"
                max={formData.bleedingSites}
                value={formData.posteriorBleedingSites || ''}
                onChange={handleInputChange('posteriorBleedingSites')}
                placeholder="Enter posterior bleeding sites"
              />
            </div>
          </div>

          {/* Probing Depth Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deepPocketSites">Sites with PPD &gt; 4mm</Label>
              <Input
                id="deepPocketSites"
                type="number"
                min="0"
                max={formData.totalSites}
                value={formData.deepPocketSites || ''}
                onChange={handleInputChange('deepPocketSites')}
                placeholder="Enter sites with deep pockets"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPocketDepth">Total Pocket Depth (mm)</Label>
              <Input
                id="totalPocketDepth"
                type="number"
                min="0"
                value={formData.totalPocketDepth || ''}
                onChange={handleInputChange('totalPocketDepth')}
                placeholder="Sum of all pocket depths"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfMeasurements">Number of Measurements</Label>
              <Input
                id="numberOfMeasurements"
                type="number"
                min="0"
                value={formData.numberOfMeasurements || ''}
                onChange={handleInputChange('numberOfMeasurements')}
                placeholder="Total measurement points"
              />
            </div>
          </div>

          {/* Results Display */}
          <div className="space-y-6">
            {/* BoP Score */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Overall BoP Score</h4>
                <Badge variant={bopScore >= 10 ? "destructive" : "success"}>
                  {bopScore >= 10 ? "Gingivitis" : "Healthy/Subclinical"}
                </Badge>
              </div>
              <Progress 
                value={bopScore} 
                className="h-2"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-muted-foreground">
                  {bopScore.toFixed(1)}% of sites show bleeding
                </p>
                <span className="text-sm font-medium">
                  {formData.bleedingSites}/{formData.totalSites} sites
                </span>
              </div>
            </div>

            {/* Regional Distribution */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Anterior Region</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {anteriorBleeding.toFixed(1)}%
                    </span>
                    <Badge variant="outline" className={
                      anteriorBleeding >= 10
                        ? "text-red-500 bg-red-50"
                        : "text-green-500 bg-green-50"
                    }>
                      {anteriorBleeding >= 10 ? "Active" : "Stable"}
                    </Badge>
                  </div>
                  <Progress value={anteriorBleeding} className="h-1" />
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Posterior Region</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {posteriorBleeding.toFixed(1)}%
                    </span>
                    <Badge variant="outline" className={
                      posteriorBleeding >= 10
                        ? "text-red-500 bg-red-50"
                        : "text-green-500 bg-green-50"
                    }>
                      {posteriorBleeding >= 10 ? "Active" : "Stable"}
                    </Badge>
                  </div>
                  <Progress value={posteriorBleeding} className="h-1" />
                </div>
              </div>
            </div>

            {/* Clinical Assessment */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Clinical Assessment</h4>
              <div className="space-y-3">
                {/* Periodontal Status */}
                <div className="flex items-start gap-2">
                  <AlertCircle className={`w-4 h-4 mt-1 ${
                    bopScore >= 10 || formData.deepPocketSites > 0
                      ? "text-red-500"
                      : "text-green-500"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Periodontal Status</p>
                    <p className="text-sm text-muted-foreground">
                      {bopScore >= 10
                        ? "Active gingival inflammation present"
                        : "Stable periodontal condition"}
                      {formData.deepPocketSites > 0
                        ? ", with signs of periodontitis"
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Risk Level */}
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 mt-1 ${
                    bopScore >= 20 || formData.deepPocketSites >= 5
                      ? "text-red-500"
                      : bopScore >= 10
                      ? "text-yellow-500"
                      : "text-green-500"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Risk Level</p>
                    <p className="text-sm text-muted-foreground">
                      {bopScore >= 20
                        ? "High risk - Immediate intervention required"
                        : bopScore >= 10
                        ? "Moderate risk - Close monitoring needed"
                        : "Low risk - Maintain current oral hygiene"}
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="flex items-start gap-2">
                  <Stethoscope className="w-4 h-4 mt-1 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recommendations</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {bopScore >= 10 ? (
                        <>
                          <li>Professional cleaning recommended</li>
                          <li>Improve oral hygiene in affected areas</li>
                          <li>Follow-up in 3 months</li>
                        </>
                      ) : (
                        <>
                          <li>Maintain current oral hygiene routine</li>
                          <li>Regular 6-month check-ups</li>
                        </>
                      )}
                      {formData.deepPocketSites > 0 && (
                        <li>Periodontal therapy evaluation needed</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 