
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, User, Upload, FileText, CheckCircle, Zap } from "lucide-react";
import { PatientData, ClinicalData } from "@/types/newCase";

interface ReviewSubmitStepProps {
  patientData: PatientData;
  xrayFile: File | null;
  clinicalData: ClinicalData;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  patientData,
  xrayFile,
  clinicalData,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="w-16 h-16 text-medical-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for AI Analysis</h3>
        <p className="text-gray-600">Review the information below and submit for AI diagnosis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Name:</span> {patientData.fullName || "Not provided"}</div>
            <div><span className="font-medium">Age:</span> {patientData.age || "Not provided"}</div>
            <div><span className="font-medium">Gender:</span> {patientData.gender || "Not provided"}</div>
            <div><span className="font-medium">Phone:</span> {patientData.phone || "Not provided"}</div>
          </div>
          {patientData.chiefComplaint && (
            <div className="pt-2">
              <span className="font-medium">Chief Complaint:</span>
              <p className="text-gray-600 mt-1">{patientData.chiefComplaint}</p>
            </div>
          )}
          <div className="pt-2">
            <span className="font-medium">Risk Factors:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {patientData.smoking && <Badge variant="outline">Smoking</Badge>}
              {patientData.alcohol && <Badge variant="outline">Alcohol</Badge>}
              {patientData.diabetes && <Badge variant="outline">Diabetes</Badge>}
              {patientData.hypertension && <Badge variant="outline">Hypertension</Badge>}
              {!patientData.smoking && !patientData.alcohol && !patientData.diabetes && !patientData.hypertension && (
                <Badge variant="outline">None reported</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Radiograph
          </CardTitle>
        </CardHeader>
        <CardContent>
          {xrayFile ? (
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-medium">{xrayFile.name}</p>
                <p className="text-sm text-gray-600">{(xrayFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ) : (
            <div className="text-red-600">No radiograph uploaded</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Clinical Findings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Tooth:</span> {clinicalData.toothNumber || "Not specified"}</div>
            <div><span className="font-medium">Pocket Depth:</span> {clinicalData.pocketDepth || "Not measured"} mm</div>
          </div>
          <div>
            <span className="font-medium">Clinical Signs:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {clinicalData.mobility && <Badge variant="outline">Mobility</Badge>}
              {clinicalData.bleeding && <Badge variant="outline">Bleeding</Badge>}
              {clinicalData.sensitivity && <Badge variant="outline">Sensitivity</Badge>}
              {!clinicalData.mobility && !clinicalData.bleeding && !clinicalData.sensitivity && (
                <Badge variant="outline">None reported</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-medical-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Zap className="w-5 h-5 text-medical-600 mt-0.5" />
          <div className="text-sm text-medical-800">
            <p className="font-semibold">What happens next?</p>
            <ul className="mt-1 space-y-1">
              <li>• AI will analyze the radiograph for bone loss patterns</li>
              <li>• Clinical data will be integrated for comprehensive assessment</li>
              <li>• Diagnosis and treatment recommendations will be generated</li>
              <li>• Professional report will be available for download</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmitStep;
