import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAIService } from '@/lib/AIService';
import { useToast } from '@/components/ui/use-toast';
import { AnalysisResult } from '@/types/analysis';
import { AnalysisResults } from './AnalysisResults';

interface AnalysisProps {
  imageFile: File;
  onComplete: (results: AnalysisResult) => void;
  onError: (error: Error) => void;
}

export const Analysis = ({ imageFile, onComplete, onError }: AnalysisProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'analyzing' | 'complete' | 'error'>('preparing');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { analyzeImage } = useAIService();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        setStatus('preparing');
        setProgress(10);

        // Validate file
        if (!imageFile) {
          throw new Error('No image file provided');
        }

        if (!['image/jpeg', 'image/png', 'image/dicom'].includes(imageFile.type)) {
          throw new Error('Invalid file type. Please upload a JPEG, PNG, or DICOM file.');
        }

        if (imageFile.size > 10 * 1024 * 1024) {
          throw new Error('File size too large. Maximum size is 10MB.');
        }

        // Create image preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(imageFile);

        setProgress(20);
        setStatus('analyzing');

        // Simulate progress while analysis is running
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 1000);

        // Run the actual analysis
        const analysisResults = await analyzeImage(imageFile);

        clearInterval(progressInterval);
        setProgress(100);
        setStatus('complete');
        setResults(analysisResults);
        
        toast({
          title: "Analysis Complete",
          description: "Your dental radiograph has been successfully analyzed.",
        });

        onComplete(analysisResults);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        onError(err instanceof Error ? err : new Error('An unexpected error occurred'));
        
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: err instanceof Error ? err.message : 'An unexpected error occurred',
        });
      }
    };

    runAnalysis();
  }, [imageFile, analyzeImage, onComplete, onError, toast]);

  const renderContent = () => {
    switch (status) {
      case 'preparing':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-medical-600 mx-auto" />
            <h3 className="text-lg font-semibold">Preparing Analysis</h3>
            <p className="text-gray-600">Validating and preparing your image for analysis...</p>
          </div>
        );

      case 'analyzing':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-medical-600 mx-auto" />
            <h3 className="text-lg font-semibold">Analyzing Radiograph</h3>
            <p className="text-gray-600">Our AI is examining your dental radiograph...</p>
            <div className="w-full max-w-xs mx-auto">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
            </div>
          </div>
        );

      case 'complete':
        if (!results || !imagePreview) return null;
        return <AnalysisResults result={results} originalImage={imagePreview} />;

      case 'error':
        return (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Dental Radiograph Analysis</CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}; 