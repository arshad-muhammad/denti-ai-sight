
import React from "react";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Camera, AlertTriangle } from "lucide-react";

interface RadiographUploadStepProps {
  xrayFile: File | null;
  setXrayFile: (file: File | null) => void;
}

const RadiographUploadStep: React.FC<RadiographUploadStepProps> = ({
  xrayFile,
  setXrayFile,
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setXrayFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-medical-500 transition-colors">
          {xrayFile ? (
            <div className="space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">File Uploaded Successfully</h3>
                <p className="text-gray-600">{xrayFile.name}</p>
                <p className="text-sm text-gray-500">{(xrayFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button variant="outline" onClick={() => setXrayFile(null)}>
                Upload Different File
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Camera className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Dental Radiograph</h3>
                <p className="text-gray-600">Drag and drop your X-ray image here, or click to browse</p>
                <p className="text-sm text-gray-500">Supports: JPEG, PNG, DICOM (Max 10MB)</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.dicom,.dcm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {xrayFile && (
        <div className="bg-medical-50 p-4 rounded-lg">
          <h4 className="font-semibold text-medical-800 mb-2">Image Preview & Tools</h4>
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-600">
                <Camera className="w-12 h-12 mx-auto mb-2" />
                <p>X-ray Preview</p>
                <p className="text-sm">Zoom and contrast tools will be available here</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Zoom In</Button>
              <Button variant="outline" size="sm">Zoom Out</Button>
              <Button variant="outline" size="sm">Adjust Contrast</Button>
              <Button variant="outline" size="sm">Reset View</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Image Quality Tips:</p>
            <ul className="mt-1 space-y-1">
              <li>• Ensure good contrast and brightness</li>
              <li>• Image should be properly oriented</li>
              <li>• Avoid excessive noise or artifacts</li>
              <li>• Higher resolution images provide better analysis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiographUploadStep;
