import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, FileText, Download, Stethoscope, RefreshCw, Clock, Info, AlertTriangle, CheckCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { supabase } from "@/lib/supabase";
import type { Profile as ProfileType } from "@/lib/types";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut, updateUserProfile, updateUserEmail, updateUserPassword, deleteUserAccount } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    email: user?.email || "",
    practice: "",
    specialty: "general",
    photoURL: ""
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // First try to get the existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: user?.id,
                display_name: user?.user_metadata?.full_name || '',
                practice: '',
                specialty: 'general'
              }
            ])
            .select()
            .single();

          if (createError) throw createError;

          setProfile(newProfile);
          setFormData(prev => ({
            ...prev,
            displayName: newProfile.display_name || "",
            practice: newProfile.practice || "",
            specialty: newProfile.specialty || "general",
            photoURL: user?.user_metadata?.avatar_url || ""
          }));
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        setFormData(prev => ({
          ...prev,
          displayName: data.display_name || "",
          practice: data.practice || "",
          specialty: data.specialty || "general",
          photoURL: user?.user_metadata?.avatar_url || ""
        }));
      }
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data. Please try refreshing the page.",
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update auth user metadata
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.displayName,
          avatar_url: formData.photoURL
        }
      });

      if (updateUserError) throw updateUserError;

      // Update profile in database
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          display_name: formData.displayName,
          practice: formData.practice,
          specialty: formData.specialty,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateProfileError) throw updateProfileError;

      // Refresh the profile data
      await fetchProfile();

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image size should be less than 2MB');
      }

      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete old avatar if exists
      if (formData.photoURL) {
        try {
          const oldFilePath = formData.photoURL.split('/').pop();
          if (oldFilePath) {
            await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
          }
        } catch (error) {
          console.error('Error deleting old avatar:', error);
          // Continue with upload even if delete fails
        }
      }

      // Upload new avatar
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update form data with new URL
      setFormData(prev => ({
        ...prev,
        photoURL: publicUrl
      }));

      // Save changes immediately
      await handleSave();

      toast({
        title: "Success",
        description: "Profile picture updated successfully.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match.",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      await updateUserPassword(currentPassword, newPassword);
      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await deleteUserAccount();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account. Please try again.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } finally {
      setLogoutLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Profile Settings"
        description="Manage your account preferences"
      />
      
      <div className="container py-6 space-y-6">
        {/* Profile Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign Out</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to sign out? You will need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      disabled={logoutLoading}
                    >
                      {logoutLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Signing Out...
                        </div>
                      ) : (
                        "Sign Out"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={formData.photoURL} />
                  <AvatarFallback>{formData.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image"
                    disabled={loading}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById("profile-image")?.click()}
                    disabled={loading}
                  >
                    Change Picture
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    className="bg-background"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-background"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="practice">Practice Name</Label>
                  <Input
                    id="practice"
                    value={formData.practice}
                    onChange={(e) => setFormData(prev => ({ ...prev, practice: e.target.value }))}
                    className="bg-background"
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select 
                    value={formData.specialty} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, specialty: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger id="specialty" className="bg-background">
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Dentist</SelectItem>
                      <SelectItem value="periodontist">Periodontist</SelectItem>
                      <SelectItem value="oral-surgeon">Oral Surgeon</SelectItem>
                      <SelectItem value="endodontist">Endodontist</SelectItem>
                      <SelectItem value="orthodontist">Orthodontist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-background"
                  disabled={passwordLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background"
                  disabled={passwordLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background"
                  disabled={passwordLoading}
                />
              </div>

              <Button type="submit" variant="outline" disabled={passwordLoading}>
                {passwordLoading ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>Are you absolutely sure you want to delete your account? This action cannot be undone.</p>
                      <p>This will:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Permanently delete your account</li>
                        <li>Remove all your personal information</li>
                        <li>Delete all your saved data and preferences</li>
                        <li>Cancel any active subscriptions</li>
                      </ul>
                      <p className="font-semibold text-destructive">
                        Please type "DELETE" to confirm:
                      </p>
                      <Input 
                        className="bg-background"
                        placeholder="Type DELETE to confirm"
                        onChange={(e) => {
                          const deleteButton = document.querySelector('[data-delete-confirm]') as HTMLButtonElement;
                          if (deleteButton) {
                            deleteButton.disabled = e.target.value !== 'DELETE';
                          }
                        }}
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDeleteAccount}
                      disabled={true}
                      data-delete-confirm
                    >
                      {deleteLoading ? (
                        <div className="flex items-center">
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </div>
                      ) : (
                        "Delete Account"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 