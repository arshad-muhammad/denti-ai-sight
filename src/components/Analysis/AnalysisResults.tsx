import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Download, Eye, EyeOff, Info } from 'lucide-react';
import { AnalysisResult, Finding } from '@/types/analysis';

interface AnalysisResultsProps {
  result: AnalysisResult;
  originalImage: string;
}

const severityColors = {
  low: 'bg-yellow-500',
  medium: 'bg-orange-500',
  high: 'bg-red-500'
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

  const handleDownloadReport = () => {
    // TODO: Implement PDF report generation
    console.log('Downloading report...');
  };

  const renderFindingCard = (finding: Finding) => {
    const Icon = findingTypeIcons[finding.type] || Info;
    
    return (
      <Card
        key={finding.id}
        className={`cursor-pointer transition-all ${
          selectedFinding?.id === finding.id ? 'ring-2 ring-medical-500' : ''
        }`}
        onClick={() => setSelectedFinding(finding)}
      >
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="w-5 h-5 text-medical-600" />
              <div>
                <CardTitle className="text-sm font-medium">
                  {finding.type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {finding.location}
                </CardDescription>
              </div>
            </div>
            <Badge className={severityColors[finding.severity]}>
              {Math.round(finding.confidence * 100)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-gray-600 mb-2">{finding.description}</p>
          {finding.recommendations && (
            <div className="space-y-1">
              {finding.recommendations.map((rec, index) => (
                <p key={index} className="text-xs text-gray-500 flex items-start">
                  <span className="mr-1">•</span> {rec}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
          <p className="text-gray-600">
            Overall Confidence: {Math.round(result.confidence * 100)}%
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            {showAnnotations ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Annotations
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Annotations
              </>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleDownloadReport}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image Display */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Radiograph Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={originalImage}
                alt="Dental radiograph"
                className="w-full"
              />
              {showAnnotations && (
                <div className="absolute inset-0">
                  {/* TODO: Add SVG overlay for segmentation visualization */}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Findings List */}
        <div className="md:col-span-1 space-y-4">
          <Tabs defaultValue="findings">
            <TabsList>
              <TabsTrigger value="findings">
                Findings ({result.findings.length})
              </TabsTrigger>
              <TabsTrigger value="metadata">
                Image Details
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="findings" className="space-y-4">
              {result.findings.map(finding => renderFindingCard(finding))}
            </TabsContent>
            
            <TabsContent value="metadata">
              <Card>
                <CardHeader>
                  <CardTitle>Image Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Quality Score</dt>
                      <dd className="text-sm text-gray-900">
                        {Math.round(result.metadata.imageQuality.score * 100)}%
                      </dd>
                    </div>
                    {result.metadata.imageQuality.issues?.length > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Quality Issues</dt>
                        <dd className="text-sm text-gray-900">
                          <ul className="list-disc list-inside">
                            {result.metadata.imageQuality.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Analysis Time</dt>
                      <dd className="text-sm text-gray-900">
                        {result.metadata.processingTime}ms
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Model Version</dt>
                      <dd className="text-sm text-gray-900">
                        {result.metadata.modelVersion}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 