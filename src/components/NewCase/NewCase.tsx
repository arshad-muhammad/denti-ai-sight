import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RadiographUploadStep from './RadiographUploadStep';
import { Analysis } from '@/components/Analysis/Analysis';
import { AnalysisResult } from '@/types/analysis';

interface NewCaseFormData {
  patientName: string;
  patientAge: number;
  patientGender: string;
  clinicalNotes: string;
}

export const NewCase = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze'>('upload');
  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);

  const handleFileSelect = (file: File | null) => {
    setXrayFile(file);
    setError(null);
  };

  const handleStartAnalysis = () => {
    if (!xrayFile) {
      setError('Please upload a radiograph first');
      return;
    }
    setCurrentStep('analyze');
  };

  const handleAnalysisComplete = (results: AnalysisResult) => {
    setAnalysisResults(results);
  };

  const handleAnalysisError = (error: Error) => {
    setError(error.message);
    setCurrentStep('upload');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>New Case Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} className="space-y-4">
            <TabsList>
              <TabsTrigger value="upload" disabled={currentStep === 'analyze'}>
                Upload X-ray
              </TabsTrigger>
              <TabsTrigger value="analyze" disabled={!xrayFile || currentStep === 'upload'}>
                Analyze
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <RadiographUploadStep
                onFileSelect={handleFileSelect}
                selectedFile={xrayFile}
                error={error}
              />
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button onClick={handleStartAnalysis} disabled={!xrayFile}>
                  Start Analysis
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analyze">
              {currentStep === 'analyze' && xrayFile && (
                <Analysis
                  imageFile={xrayFile}
                  onComplete={handleAnalysisComplete}
                  onError={handleAnalysisError}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 