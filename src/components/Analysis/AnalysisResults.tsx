import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Download, Eye, EyeOff, Info } from 'lucide-react';
import { Finding, FindingType } from '@/types/analysis';
import { Progress } from '@/components/ui/progress';
import { AIAnalysisResult } from '@/lib/services/aiService';

interface AnalysisResultsProps {
  result: AIAnalysisResult;
  originalImage: string;
}

const severityColors = {
  mild: 'bg-yellow-500',
  moderate: 'bg-orange-500',
  severe: 'bg-red-500'
};

const findingTypeIcons = {
  cavity: AlertTriangle,
  abscess: AlertTriangle,
  bone_loss: AlertTriangle,
  root_canal: Info,
  other: Info
};

export const AnalysisResults = ({ result, originalImage }: AnalysisResultsProps) => {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'periodontal'>('overview');

  const handleDownloadReport = () => {
    // TODO: Implement PDF report generation
    console.log('Downloading report...');
  };

  const renderFindingCard = (finding: Finding) => {
    const Icon = findingTypeIcons[finding.type as keyof typeof findingTypeIcons] || Info;
    return (
      <Card key={`${finding.type}-${finding.location}`} className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">
              {finding.type.replace('_', ' ').toUpperCase()}
            </CardTitle>
          </div>
          <Badge variant="outline" className={severityColors[finding.severity]}>
            {finding.severity}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Location: {finding.location}</p>
          <p className="text-sm text-gray-500">
            Confidence: {Math.round(finding.confidence * 100)}%
          </p>
          {finding.description && (
            <p className="text-sm text-gray-500 mt-2">{finding.description}</p>
          )}
          {finding.recommendations && finding.recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Recommendations:</p>
              <ul className="list-disc list-inside text-sm text-gray-500">
                {finding.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPeriodontalMeasurements = () => {
    if (!result.findings.boneLoss) return null;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bone Loss Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Severity</h4>
                <Badge variant="outline" className={severityColors[result.findings.boneLoss.severity]}>
                  {result.findings.boneLoss.severity}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Bone Loss Percentage</h4>
                <Progress value={result.findings.boneLoss.percentage} className="h-2" />
                <p className="text-sm text-gray-500 mt-1">
                  {result.findings.boneLoss.percentage}% bone loss
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Affected Regions</h4>
                <div className="flex flex-wrap gap-2">
                  {result.findings.boneLoss.regions.map((region) => (
                    <Badge key={region} variant="outline">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analysis Results</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            {showAnnotations ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Annotations
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Show Annotations
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'periodontal')}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="periodontal">Periodontal Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Diagnosis</h4>
                    <p className="text-sm">{result.diagnosis}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Confidence</h4>
                    <Progress value={result.confidence * 100} className="h-2" />
                    <p className="text-sm text-gray-500 mt-1">
                      {Math.round(result.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {result.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {result.findings.pathologies && result.findings.pathologies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detected Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.findings.pathologies.map((finding) => renderFindingCard(finding))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="periodontal" className="space-y-4">
          {renderPeriodontalMeasurements()}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 