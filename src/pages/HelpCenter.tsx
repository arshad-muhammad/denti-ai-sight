import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Mail, MessageCircle, Phone, FileQuestion, AlertCircle, Settings, FileText } from "lucide-react";

export default function HelpCenter() {
  return (
    <PageLayout
      title="Help Center"
      description="Get help and support for PerioVision"
    >
      <div className="space-y-6">
        {/* Search Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                className="pl-9 w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <MessageCircle className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Chat with our support team</p>
                <Button variant="outline" className="mt-2">Start Chat</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <Mail className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Email Support</h3>
                <p className="text-sm text-muted-foreground">Get help via email</p>
                <Button variant="outline" className="mt-2">Send Email</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <FileQuestion className="h-8 w-8 text-primary" />
                <h3 className="font-medium">Documentation</h3>
                <p className="text-sm text-muted-foreground">Browse our guides</p>
                <Button variant="outline" className="mt-2">View Docs</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Find quick answers to common questions about PerioVision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What file formats are supported?</AccordionTrigger>
                <AccordionContent>
                  PerioVision supports JPEG, PNG, and DICOM file formats for dental radiographs.
                  For optimal results, we recommend using high-resolution images with clear contrast.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How accurate is the AI analysis?</AccordionTrigger>
                <AccordionContent>
                  Our AI model has been trained on thousands of dental radiographs and achieves
                  an accuracy rate of over 95% in detecting common dental pathologies. However,
                  the system is designed to assist, not replace, professional clinical judgment.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Is my data secure?</AccordionTrigger>
                <AccordionContent>
                  Yes, we take data security seriously. All data is encrypted both in transit
                  and at rest. We comply with HIPAA regulations and implement industry-standard
                  security measures to protect your information.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I export analysis results?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can export analysis results in PDF format. Reports include detailed
                  findings, measurements, annotations, and treatment recommendations that can
                  be shared with patients or colleagues.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What if I need technical support?</AccordionTrigger>
                <AccordionContent>
                  Our technical support team is available 24/7. You can reach us through live
                  chat, email, or phone. For urgent issues, we recommend using the live chat
                  feature for immediate assistance.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>
              Get in touch with our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <Phone className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Phone Support</h4>
                  <p className="text-sm text-muted-foreground">Monday - Friday, 9AM - 5PM EST</p>
                  <p className="text-sm font-medium mt-1">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Email Support</h4>
                  <p className="text-sm text-muted-foreground">24/7 Response Time</p>
                  <p className="text-sm font-medium mt-1">support@periovision.com</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
} 