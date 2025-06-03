
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Cigarette, Wine, Activity, AlertTriangle } from "lucide-react";
import { PatientData } from "@/types/newCase";

interface PatientInformationStepProps {
  patientData: PatientData;
  setPatientData: (data: PatientData) => void;
}

const PatientInformationStep: React.FC<PatientInformationStepProps> = ({
  patientData,
  setPatientData,
}) => {
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
};

export default PatientInformationStep;
