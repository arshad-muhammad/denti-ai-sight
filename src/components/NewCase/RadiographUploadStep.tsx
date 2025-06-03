import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, ZoomIn, RotateCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface RadiographUploadStepProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  error?: string;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/dicom'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const RadiographUploadStep = ({
  onFileSelect,
  selectedFile,
  error
}: RadiographUploadStepProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);

  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, or DICOM)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File size should be less than 10MB');
      return;
    }

    onFileSelect(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleRemove = () => {
    onFileSelect(null);
    setPreview(null);
    setRotation(0);
    setZoom(100);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card
        className={cn(
          "border-2 border-dashed relative",
          isDragging ? "border-medical-500 bg-medical-50" : "border-gray-200",
          selectedFile ? "border-solid" : "border-dashed"
        )}
      >
        <CardContent className="p-6">
          {!selectedFile ? (
            <div
              className="flex flex-col items-center justify-center py-8"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 bg-medical-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-medical-600" />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your radiograph here, or
              </p>
              <div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Browse Files
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: JPEG, PNG, DICOM (max 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute top-2 right-2 space-x-2 z-10">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleRotate}
                    type="button"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomIn}
                    type="button"
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleRemove}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg bg-gray-100">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Radiograph preview"
                      className="w-full transition-transform duration-200 ease-in-out"
                      style={{
                        transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                        maxHeight: '400px',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{selectedFile.name}</span>
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RadiographUploadStep;
