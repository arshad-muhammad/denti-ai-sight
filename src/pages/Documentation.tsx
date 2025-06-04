import { PageLayout } from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileText, Upload, Brain, Stethoscope } from "lucide-react";

export default function Documentation() {
  return (
    <PageLayout
      title="Documentation"
      description="Learn how to use PerioVision effectively"
    >
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <div className="col-span-12 md:col-span-3">
          <ScrollArea className="h-[calc(100vh-12rem)] md:sticky md:top-20">
            <div className="space-y-4 pr-4">
              <div>
                <h3 className="mb-2 text-sm font-medium">Getting Started</h3>
                <ul className="space-y-2">
                  <li>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                      <FileText className="mr-2 h-4 w-4" />
                      Introduction
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                      <Upload className="mr-2 h-4 w-4" />
                      Quick Start Guide
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium">Features</h3>
                <ul className="space-y-2">
                  <li>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                      <Brain className="mr-2 h-4 w-4" />
                      AI Analysis
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Clinical Tools
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Introduction to PerioVision</CardTitle>
              <CardDescription>
                Learn about our AI-powered dental radiograph analysis platform
              </CardDescription>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>
                PerioVision is an advanced dental radiograph analysis platform that leverages
                artificial intelligence to assist dental professionals in diagnosis and treatment
                planning. Our platform provides accurate, consistent, and rapid analysis of dental
                radiographs, helping you make informed clinical decisions.
              </p>
              
              <h3>Key Features</h3>
              <ul>
                <li>Automated bone loss measurement and analysis</li>
                <li>Pathology detection and classification</li>
                <li>Comprehensive treatment planning assistance</li>
                <li>Detailed reporting and documentation</li>
                <li>Secure patient data management</li>
              </ul>

              <h3>Getting Started</h3>
              <p>
                To begin using PerioVision, you'll need to:
              </p>
              <ol>
                <li>Create an account or sign in</li>
                <li>Upload your first dental radiograph</li>
                <li>Enter patient information</li>
                <li>Review the AI analysis results</li>
                <li>Generate and download detailed reports</li>
              </ol>

              <h3>System Requirements</h3>
              <p>
                PerioVision is a web-based platform that works on any modern browser. For optimal
                performance, we recommend:
              </p>
              <ul>
                <li>Chrome 90+ or Firefox 88+</li>
                <li>Stable internet connection</li>
                <li>Screen resolution of 1920x1080 or higher</li>
                <li>PDF viewer for reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>
                Get up and running with PerioVision in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="analyze">Analyze</TabsTrigger>
                  <TabsTrigger value="report">Report</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <h3 className="text-lg font-medium">Uploading Radiographs</h3>
                  <p className="text-muted-foreground">
                    Learn how to properly upload and prepare your dental radiographs for analysis.
                  </p>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Supported formats: JPEG, PNG, DICOM</li>
                    <li>Maximum file size: 10MB</li>
                    <li>Recommended resolution: 1500x1500 pixels or higher</li>
                    <li>Ensure proper orientation and contrast</li>
                  </ul>
                </TabsContent>
                <TabsContent value="analyze" className="space-y-4">
                  <h3 className="text-lg font-medium">Analysis Process</h3>
                  <p className="text-muted-foreground">
                    Understanding how our AI analyzes your radiographs and provides insights.
                  </p>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Automated bone loss measurement</li>
                    <li>Pathology detection</li>
                    <li>Treatment recommendations</li>
                    <li>Confidence scores and validation</li>
                  </ul>
                </TabsContent>
                <TabsContent value="report" className="space-y-4">
                  <h3 className="text-lg font-medium">Generating Reports</h3>
                  <p className="text-muted-foreground">
                    Create comprehensive reports for your records and patient communication.
                  </p>
                  <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                    <li>Customizable report templates</li>
                    <li>Export in PDF format</li>
                    <li>Include annotations and measurements</li>
                    <li>Patient-friendly summaries</li>
                  </ul>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
} 