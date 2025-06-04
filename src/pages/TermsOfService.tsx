import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, Scale, AlertTriangle, FileCheck } from "lucide-react";

export default function TermsOfService() {
  return (
    <PageLayout
      title="Terms of Service"
      description="Legal terms and conditions for using PerioVision"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Welcome to PerioVision. By accessing or using our service, you agree to be bound
              by these Terms of Service. Please read them carefully before using our platform.
            </p>

            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing or using PerioVision, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms,
              you are prohibited from using or accessing this platform.
            </p>

            <h3>2. Service Description</h3>
            <p>
              PerioVision provides AI-powered dental radiograph analysis services. Our platform
              is designed to assist dental professionals in diagnosis and treatment planning,
              but should not be considered a replacement for professional clinical judgment.
            </p>

            <h3>3. User Responsibilities</h3>
            <ul>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Ensure all uploaded patient data complies with privacy regulations</li>
              <li>Use the service in accordance with applicable laws and regulations</li>
              <li>Not attempt to reverse engineer or modify the platform</li>
              <li>Report any security vulnerabilities or misuse</li>
            </ul>

            <h3>4. Professional Judgment</h3>
            <p>
              The AI analysis provided by PerioVision is intended to support, not replace,
              professional clinical judgment. Users are solely responsible for all medical
              decisions and their consequences.
            </p>

            <h3>5. Intellectual Property</h3>
            <p>
              All content, features, and functionality of PerioVision, including but not
              limited to text, graphics, logos, and software, are the exclusive property
              of PerioVision and are protected by international copyright laws.
            </p>

            <h3>6. Data Usage and Privacy</h3>
            <p>
              Your use of PerioVision is also governed by our Privacy Policy. By using our
              service, you consent to the collection and use of information as detailed in
              our Privacy Policy.
            </p>

            <h3>7. Service Availability</h3>
            <p>
              We strive to provide uninterrupted service but cannot guarantee the platform
              will be available at all times. We reserve the right to modify, suspend, or
              discontinue any part of the service without notice.
            </p>

            <h3>8. Limitation of Liability</h3>
            <p>
              PerioVision shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use or inability
              to use the service.
            </p>

            <h3>9. Subscription and Billing</h3>
            <ul>
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable unless required by law</li>
              <li>We reserve the right to modify pricing with 30 days notice</li>
              <li>Cancellation requests must be submitted 30 days in advance</li>
            </ul>

            <h3>10. Termination</h3>
            <p>
              We reserve the right to terminate or suspend access to our service immediately,
              without prior notice or liability, for any reason, including breach of Terms.
            </p>

            <h3>11. Changes to Terms</h3>
            <p>
              We reserve the right to modify these terms at any time. We will notify users
              of any material changes via email or through the platform.
            </p>

            <h3>12. Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of
              the United States, without regard to its conflict of law provisions.
            </p>

            <h3>Contact Information</h3>
            <p>
              For any questions about these Terms of Service, please contact us:
            </p>
            <ul>
              <li>Email: legal@periovision.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Address: 123 Legal Avenue, Suite 200, Medical City, MC 12345</li>
            </ul>
          </CardContent>
        </Card>

        {/* Quick Reference Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <ScrollText className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Legal Agreement</h3>
                <p className="text-sm text-muted-foreground">
                  Binding terms for service use
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Scale className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Fair Use</h3>
                <p className="text-sm text-muted-foreground">
                  Guidelines for proper usage
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <AlertTriangle className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Limitations</h3>
                <p className="text-sm text-muted-foreground">
                  Service restrictions
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <FileCheck className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Compliance</h3>
                <p className="text-sm text-muted-foreground">
                  Regulatory adherence
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
} 