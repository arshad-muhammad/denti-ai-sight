import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Globe, Bell } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <PageLayout
      title="Privacy Policy"
      description="How we handle and protect your data"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              At PerioVision, we take your privacy seriously. This Privacy Policy explains how
              we collect, use, disclose, and safeguard your information when you use our
              dental radiograph analysis platform.
            </p>

            <h3>Information We Collect</h3>
            <ul>
              <li>Personal identification information (Name, email address, phone number)</li>
              <li>Professional credentials and practice information</li>
              <li>Patient radiographs and related medical information</li>
              <li>Usage data and analytics</li>
              <li>Technical information about your device and connection</li>
            </ul>

            <h3>How We Use Your Information</h3>
            <p>
              We use the collected information for various purposes:
            </p>
            <ul>
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>

            <h3>Data Security</h3>
            <p>
              We implement appropriate technical and organizational security measures to protect
              your personal information, including:
            </p>
            <ul>
              <li>End-to-end encryption for all data transmission</li>
              <li>Secure data storage with regular backups</li>
              <li>Access controls and authentication measures</li>
              <li>Regular security audits and assessments</li>
              <li>Employee training on data protection</li>
            </ul>

            <h3>HIPAA Compliance</h3>
            <p>
              As a healthcare technology provider, we maintain strict compliance with HIPAA
              regulations. This includes:
            </p>
            <ul>
              <li>Implementation of required security safeguards</li>
              <li>Regular risk assessments</li>
              <li>Business Associate Agreements with partners</li>
              <li>Audit trails of all data access</li>
              <li>Breach notification procedures</li>
            </ul>

            <h3>Your Rights</h3>
            <p>
              Under applicable data protection laws, you have the following rights:
            </p>
            <ul>
              <li>Right to access your personal information</li>
              <li>Right to correct inaccurate data</li>
              <li>Right to request deletion of your data</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>

            <h3>Third-Party Services</h3>
            <p>
              We may employ third-party companies and individuals for the following reasons:
            </p>
            <ul>
              <li>To facilitate our Service</li>
              <li>To provide the Service on our behalf</li>
              <li>To perform Service-related services</li>
              <li>To assist us in analyzing how our Service is used</li>
            </ul>

            <h3>Changes to This Policy</h3>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the
              "Last updated" date.
            </p>

            <h3>Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul>
              <li>By email: privacy@periovision.com</li>
              <li>By phone: +1 (555) 123-4567</li>
              <li>By mail: 123 Privacy Street, Suite 100, Medical City, MC 12345</li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Reference Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Shield className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Data Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Industry-standard security measures to protect your information
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Lock className="h-8 w-8 text-primary" />
                <h3 className="font-medium">HIPAA Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  Full compliance with healthcare privacy regulations
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Eye className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Transparency</h3>
                <p className="text-sm text-muted-foreground">
                  Clear information about how we handle your data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
} 