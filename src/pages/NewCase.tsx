import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  User, 
  FileText, 
  Brain,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Cigarette,
  Wine,
  Activity,
  AlertTriangle,
  CheckCircle,
  Camera,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const NewCase = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [patientData, setPatientData] = useState({
    fullName: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    smoking: false,
    alcohol: false,
    diabetes: false,
    hypertension: false,
    chiefComplaint: "",
    medicalHistory: ""
  });

  const [xrayFile, setXrayFile] = useState<File | null>(null);
  const [clinicalData, setClinicalData] = useState({
    toothNumber: "",
    mobility: false,
    bleeding: false,
    sensitivity: false,
    pocketDepth: "",
    additionalNotes: ""
  });

  const steps = [
    { 
      number: 1, 
      title: "Patient Information", 
      icon: User,
      description: "Basic patient details and contact information"
    },
    { 
      number: 2, 
      title: "Upload Radiograph", 
      icon: Upload,
      description: "Upload dental X-ray images for analysis"
    },
    { 
      number: 3, 
      title: "Clinical Examination", 
      icon: FileText,
      description: "Clinical findings and examination details"
    },
    { 
      number: 4, 
      title: "Review & Submit", 
      icon: Brain,
      description: "Review all information before AI analysis"
    }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Generate a case ID and navigate to analysis
    const caseId = `C-${Date.now().toString().slice(-3)}`;
    console.log("Submitting case:", { patientData, xrayFile, clinicalData });
    navigate(`/analysis/${caseId}`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setXrayFile(file);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={patientData.fullName}
                  onChange={(e) => setPatientData({ ...patientData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="45"
                  value={patientData.age}
                  onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <RadioGroup 
                value={patientData.gender} 
                onValueChange={(value) => setPatientData({ ...patientData, gender: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    placeholder="+1 (555) 123-4567"
                    value={patientData.phone}
                    onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={patientData.email}
                    onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  placeholder="123 Main St, City, State 12345"
                  value={patientData.address}
                  onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Medical History & Risk Factors</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smoking"
                    checked={patientData.smoking}
                    onCheckedChange={(checked) => setPatientData({ ...patientData, smoking: checked as boolean })}
                  />
                  <Label htmlFor="smoking" className="flex items-center">
                    <Cigarette className="w-4 h-4 mr-2" />
                    Smoking
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alcohol"
                    checked={patientData.alcohol}
                    onCheckedChange={(checked) => setPatientData({ ...patientData, alcohol: checked as boolean })}
                  />
                  <Label htmlFor="alcohol" className="flex items-center">
                    <Wine className="w-4 h-4 mr-2" />
                    Alcohol Use
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diabetes"
                    checked={patientData.diabetes}
                    onCheckedChange={(checked) => setPatientData({ ...patientData, diabetes: checked as boolean })}
                  />
                  <Label htmlFor="diabetes" className="flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Diabetes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hypertension"
                    checked={patientData.hypertension}
                    onCheckedChange={(checked) => setPatientData({ ...patientData, hypertension: checked as boolean })}
                  />
                  <Label htmlFor="hypertension" className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Hypertension
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Chief Complaint</Label>
              <Textarea
                id="chiefComplaint"
                placeholder="Patient's main concern or reason for visit..."
                value={patientData.chiefComplaint}
                onChange={(e) => setPatientData({ ...patientData, chiefComplaint: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Additional Medical History</Label>
              <Textarea
                id="medicalHistory"
                placeholder="Any additional relevant medical history, medications, allergies..."
                value={patientData.medicalHistory}
                onChange={(e) => setPatientData({ ...patientData, medicalHistory: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
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

      case 3:
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

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Brain className="w-16 h-16 text-medical-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for AI Analysis</h3>
              <p className="text-gray-600">Review the information below and submit for AI diagnosis</p>
            </div>

            {/* Patient Summary */}
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

            {/* Radiograph Summary */}
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

            {/* Clinical Summary */}
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

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return patientData.fullName && patientData.age && patientData.gender;
      case 2:
        return xrayFile !== null;
      case 3:
        return true; // Clinical data is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <span className="text-gray-400">|</span>
            <h1 className="text-xl font-semibold text-gray-900">New Case</h1>
          </div>
          
          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Bar */}
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

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 mr-2" })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep === totalSteps ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="bg-medical-600 hover:bg-medical-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              Start AI Analysis
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-medical-600 hover:bg-medical-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewCase;
