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
import { FirebaseDentalCase } from "@/types/firebase";
import { dentalCaseService } from "@/lib/services/dentalCase";
import { useToast } from "@/components/ui/use-toast";

interface EditCaseDialogProps {
  caseData: FirebaseDentalCase;
  onUpdate: (updatedCase: FirebaseDentalCase) => void;
  trigger?: React.ReactNode;
}

export const EditCaseDialog = forwardRef<HTMLDivElement, EditCaseDialogProps>(
  ({ caseData, onUpdate, trigger }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
      patientName: caseData.patientName,
      patientAge: caseData.patientAge,
      patientGender: caseData.patientGender,
      patientContact: {
        phone: caseData.patientContact?.phone || "",
        email: caseData.patientContact?.email || "",
        address: caseData.patientContact?.address || "",
      },
      medicalHistory: {
        smoking: caseData.medicalHistory?.smoking || false,
        alcohol: caseData.medicalHistory?.alcohol || false,
        diabetes: caseData.medicalHistory?.diabetes || false,
        hypertension: caseData.medicalHistory?.hypertension || false,
        notes: caseData.medicalHistory?.notes || "",
      },
      clinicalFindings: {
        toothNumber: caseData.clinicalFindings?.toothNumber || "",
        mobility: caseData.clinicalFindings?.mobility || false,
        bleeding: caseData.clinicalFindings?.bleeding || false,
        sensitivity: caseData.clinicalFindings?.sensitivity || false,
        pocketDepth: caseData.clinicalFindings?.pocketDepth || "",
        notes: caseData.clinicalFindings?.notes || "",
      },
    });

    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // Transform form data to match FirebaseDentalCase structure
        const updateData: Partial<FirebaseDentalCase> = {
          patientName: formData.patientName,
          patientAge: formData.patientAge,
          patientGender: formData.patientGender,
          patientContact: formData.patientContact,
          medicalHistory: formData.medicalHistory,
          clinicalFindings: formData.clinicalFindings
        };

        const updatedCase = await dentalCaseService.update(caseData.id, updateData);
        onUpdate(updatedCase);
        setIsOpen(false);
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
          <div ref={ref} onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}>
            {trigger || <Button variant="outline">Edit Case</Button>}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Case Details</DialogTitle>
            <DialogDescription>
              Update patient information and medical history
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Name</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        patientName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientAge">Age</Label>
                  <Input
                    id="patientAge"
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        patientAge: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientGender">Gender</Label>
                  <Input
                    id="patientGender"
                    value={formData.patientGender}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        patientGender: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.patientContact.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        patientContact: {
                          ...prev.patientContact,
                          phone: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.patientContact.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        patientContact: {
                          ...prev.patientContact,
                          email: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.patientContact.address}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        patientContact: {
                          ...prev.patientContact,
                          address: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Medical History</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="smoking">Smoking</Label>
                  <Switch
                    id="smoking"
                    checked={formData.medicalHistory.smoking}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalHistory: {
                          ...prev.medicalHistory,
                          smoking: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="alcohol">Alcohol</Label>
                  <Switch
                    id="alcohol"
                    checked={formData.medicalHistory.alcohol}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalHistory: {
                          ...prev.medicalHistory,
                          alcohol: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="diabetes">Diabetes</Label>
                  <Switch
                    id="diabetes"
                    checked={formData.medicalHistory.diabetes}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalHistory: {
                          ...prev.medicalHistory,
                          diabetes: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hypertension">Hypertension</Label>
                  <Switch
                    id="hypertension"
                    checked={formData.medicalHistory.hypertension}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalHistory: {
                          ...prev.medicalHistory,
                          hypertension: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="medicalNotes">Medical Notes</Label>
                  <Textarea
                    id="medicalNotes"
                    value={formData.medicalHistory.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        medicalHistory: {
                          ...prev.medicalHistory,
                          notes: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Clinical Findings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Clinical Findings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="toothNumber">Tooth Number</Label>
                  <Input
                    id="toothNumber"
                    value={formData.clinicalFindings.toothNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clinicalFindings: {
                          ...prev.clinicalFindings,
                          toothNumber: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pocketDepth">Pocket Depth</Label>
                  <Input
                    id="pocketDepth"
                    value={formData.clinicalFindings.pocketDepth}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clinicalFindings: {
                          ...prev.clinicalFindings,
                          pocketDepth: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobility">Mobility</Label>
                  <Switch
                    id="mobility"
                    checked={formData.clinicalFindings.mobility}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        clinicalFindings: {
                          ...prev.clinicalFindings,
                          mobility: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="bleeding">Bleeding</Label>
                  <Switch
                    id="bleeding"
                    checked={formData.clinicalFindings.bleeding}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        clinicalFindings: {
                          ...prev.clinicalFindings,
                          bleeding: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sensitivity">Sensitivity</Label>
                  <Switch
                    id="sensitivity"
                    checked={formData.clinicalFindings.sensitivity}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        clinicalFindings: {
                          ...prev.clinicalFindings,
                          sensitivity: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="clinicalNotes">Clinical Notes</Label>
                  <Textarea
                    id="clinicalNotes"
                    value={formData.clinicalFindings.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        clinicalFindings: {
                          ...prev.clinicalFindings,
                          notes: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }
); 