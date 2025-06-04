import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Lock, Eye, Moon, Sun, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/ThemeProvider";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      updates: false,
    },
    privacy: {
      profileVisibility: "public",
      showEmail: false,
      showPhone: false,
    },
  });

  const handleSave = () => {
    // Save other settings
    toast({
      title: "Success",
      description: "Settings saved successfully.",
    });
  };

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          </div>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotif">Email Notifications</Label>
                <Switch
                  id="emailNotif"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pushNotif">Push Notifications</Label>
                <Switch
                  id="pushNotif"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: checked },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="updatesNotif">Product Updates</Label>
                <Switch
                  id="updatesNotif"
                  checked={settings.notifications.updates}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, updates: checked },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sun className="w-5 h-5 mr-2" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize your interface theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center">
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center">
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center">
                    <Laptop className="w-4 h-4 mr-2" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Privacy
              </CardTitle>
              <CardDescription>
                Control your privacy settings and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Profile Visibility</Label>
                <RadioGroup
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, profileVisibility: value },
                    }))
                  }
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">Public</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Private</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showEmail">Show Email Address</Label>
                  <Switch
                    id="showEmail"
                    checked={settings.privacy.showEmail}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        privacy: { ...prev.privacy, showEmail: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showPhone">Show Phone Number</Label>
                  <Switch
                    id="showPhone"
                    checked={settings.privacy.showPhone}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        privacy: { ...prev.privacy, showPhone: checked },
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings; 