import { useState, forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Database } from "@/types/supabase";
import dentalCaseService from "@/lib/services/dentalCaseService";
import { useToast } from "@/components/ui/use-toast";

type Case = Database['public']['Tables']['cases']['Row'];

interface EditCaseDialogProps {
  caseData: {
    id: string;
    user_id: string;
    patient_data: {
      fullName: string;
      age: string;
      gender: string;
      phone: string;
      email: string;
      address: string;
      smoking: boolean;
      alcohol: boolean;
      diabetes: boolean;
      hypertension: boolean;
      chiefComplaint: string;
      medicalHistory: string;
    };
    clinical_data: {
      toothNumber?: string;
      mobility?: boolean;
      bleeding?: boolean;
      sensitivity?: boolean;
      pocketDepth?: string;
      additionalNotes?: string;
      bopScore?: number;
      totalSites?: number;
      bleedingSites?: number;
      anteriorBleeding?: number;
      posteriorBleeding?: number;
      deepPocketSites?: number;
      averagePocketDepth?: number;
      riskScore?: number;
      boneLossAgeRatio?: number;
      bopFactor?: number;
      clinicalAttachmentLoss?: number;
      redFlags?: {
        hematologicDisorder?: boolean;
        necrotizingPeriodontitis?: boolean;
        leukemiaSigns?: boolean;
        details?: string;
      };
      plaqueCoverage?: number;
      smoking?: boolean;
      alcohol?: boolean;
      diabetes?: boolean;
      hypertension?: boolean;
    };
    analysis_results?: {
      diagnosis?: string;
      confidence?: number;
      severity?: string;
      findings?: {
        boneLoss?: {
          percentage: number;
          severity: string;
          regions: string[];
          measurements?: Array<{
            type: string;
            value: number;
            confidence: number;
          }>;
        };
        pathologies?: Array<{
          type: string;
          location: string;
          severity: string;
          confidence: number;
        }>;
      };
      periodontal_stage?: {
        stage: string;
        description: string;
      };
    };
  };
  onUpdate: (updatedCase: EditCaseDialogProps['caseData']) => void;
  trigger?: React.ReactNode;
}

export const EditCaseDialog = forwardRef<HTMLDivElement, EditCaseDialogProps>(
  ({ caseData, onUpdate, trigger }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
      fullName: caseData.patient_data.fullName,
      age: caseData.patient_data.age,
      gender: caseData.patient_data.gender,
      phone: caseData.patient_data.phone,
      email: caseData.patient_data.email,
      address: caseData.patient_data.address,
      medicalHistory: caseData.patient_data.medicalHistory
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // Transform form data to match Case structure
        const updateData = {
          patient_data: {
            ...caseData.patient_data,
            fullName: formData.fullName,
            age: formData.age,
            gender: formData.gender,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            medicalHistory: formData.medicalHistory
          }
        };

        await dentalCaseService.update(caseData.id, updateData);
        onUpdate({
          ...caseData,
          patient_data: {
            ...caseData.patient_data,
            ...updateData.patient_data
          }
        });
        setIsOpen(false);
        toast({
          title: "Success",
          description: "Case details updated successfully.",
        });
      } catch (error) {
        console.error('Error updating case:', error);
        toast({
          title: "Error",
          description: "Failed to update case details. Please try again.",
          variant: "destructive",
        });
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Case Details</DialogTitle>
            <DialogDescription>
              Make changes to the case information here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="fullName">Patient Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
); 