import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  User, 
  FileText, 
  Clock,
  CheckCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  Brain,
  Activity,
  Users,
  TrendingUp,
  LogOut,
  Settings,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/AuthContext";
import dentalCaseService from "@/lib/services/dentalCaseService";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { EditCaseDialog } from "@/components/EditCaseDialog";
import { generatePDFReport } from "@/services/reportService";
import { getEnhancedAnalysis } from '@/services/geminiService';
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import type { GeminiAnalysisInput } from '@/services/geminiService';
import { LoadingOverlay } from '@/components/LoadingOverlay';

type Case = {
  id: string;
  user_id: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  radiograph_url: string | null;
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
    chiefComplaint?: string;
    medicalHistory?: string;
  };
  clinical_data?: {
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
      };
      pathologies?: Array<{
        type: string;
        location: string;
        severity: string;
        confidence: number;
      }>;
    };
  };
  created_at: string;
  updated_at: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Add new state for AI insights
  const [aiStats, setAiStats] = useState({
    accuracyRate: 0,
    averageProcessingTime: 0,
    totalFindings: 0,
    recentTrends: []
  });

  const [healthTips, setHealthTips] = useState({
    tips: [],
    loading: true,
    error: null
  });

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Load cases only when user is authenticated
  useEffect(() => {
    const loadCases = async () => {
      if (!user) return;
      
      try {
        const userCases = await dentalCaseService.getByUserId(user.id);
        console.log('Fetched cases:', userCases); // Debug log
        
        // No need to transform the data anymore since it's already in the correct structure
        setCases(userCases || []);
      } catch (error) {
        console.error("Error loading cases:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load cases. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, [user, toast]);

  // Fetch health tips using Gemini API
  useEffect(() => {
    const fetchHealthTips = async () => {
      try {
        setHealthTips(prev => ({ ...prev, loading: true }));
        
        // Structured prompt for dental health tips
        const prompt: GeminiAnalysisInput = {
          diagnosis: "Dental Health Education and Prevention",
          findings: {
            boneLoss: {
              percentage: 0,
              severity: "none",
              regions: ["general"]
            },
            pathologies: [{
              type: "preventive care",
              location: "general",
              severity: "none",
              confidence: 1.0
            }]
          },
          patientData: {
            age: 30,
            gender: "not specified",
            medicalHistory: "General dental health guidelines for all patients"
          }
        };

        const response = await getEnhancedAnalysis(prompt);

        // Extract tips from the response
        const tipsList = [
          ...response.detailedTreatmentPlan.preventiveMeasures,
          ...response.detailedTreatmentPlan.lifestyle
        ].filter(tip => tip.length > 0)
         .slice(0, 5);

        if (tipsList.length === 0) {
          throw new Error('No tips received from API');
        }

        setHealthTips({
          tips: tipsList,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error("Error fetching health tips:", error);
        
        // Fallback tips focused on periodontal health
        setHealthTips({
          tips: [
            "Brush teeth for at least two minutes, twice daily with fluoride toothpaste",
            "Use soft-bristled toothbrush and gentle circular motions for gum health",
            "Clean between teeth daily with floss or interdental brushes",
            "Regular dental check-ups every 6 months for preventive care",
            "Maintain a balanced diet and stay hydrated for optimal oral health"
          ],
          loading: false,
          error: "Using preset tips while AI service refreshes"
        });

        // Show toast notification
        toast({
          title: "Tips Update",
          description: "Using preset dental health tips. New AI-generated tips will be available soon.",
          duration: 5000
        });
      }
    };

    fetchHealthTips();
  }, [toast]); // Add toast to dependencies

  // Add state for current tip index
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Auto-rotate tips every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => 
        prev === (healthTips.tips.length - 1) ? 0 : prev + 1
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [healthTips.tips.length]);

  // Calculate AI statistics
  useEffect(() => {
    if (cases.length > 0) {
      // Calculate accuracy rate (based on completed cases)
      const completedCases = cases.filter(c => c.status === 'completed');
      const accuracyRate = completedCases.length > 0 
        ? completedCases.reduce((acc, curr) => {
            const confidence = curr.analysis_results?.confidence || 0;
            return acc + confidence;
          }, 0) / completedCases.length
        : 0;

      // Calculate average processing time (if timestamps available)
      const processingTimes = completedCases
        .filter(c => c.created_at)
        .map(c => {
          const start = new Date(c.created_at);
          const end = new Date();
          return (end.getTime() - start.getTime()) / 1000; // in seconds
        });

      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((acc, curr) => acc + curr, 0) / processingTimes.length
        : 0;

      // Calculate total findings
      const totalFindings = completedCases.reduce((acc, curr) => {
        return acc + (curr.analysis_results?.findings?.pathologies?.length || 0);
      }, 0);

      // Calculate recent trends (last 7 days)
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      const recentCases = cases.filter(c => 
        c.created_at ? new Date(c.created_at) >= last7Days : false
      );

      const dailyCounts = new Array(7).fill(0);
      recentCases.forEach(c => {
        if (c.created_at) {
          const dayIndex = 6 - Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < 7) {
            dailyCounts[dayIndex]++;
          }
        }
      });

      setAiStats({
        accuracyRate,
        averageProcessingTime: avgProcessingTime,
        totalFindings,
        recentTrends: dailyCounts
      });
    }
  }, [cases]);

  const stats = [
    {
      title: "Total Cases",
      value: cases.length.toString(),
      change: "+12%",
      icon: FileText,
      variant: "primary"
    },
    {
      title: "This Month",
      value: cases.filter(c => {
        const caseDate = c.created_at ? new Date(c.created_at) : null;
        if (!caseDate) return false;
        const now = new Date();
        return caseDate.getMonth() === now.getMonth() && 
               caseDate.getFullYear() === now.getFullYear();
      }).length.toString(),
      change: "+4",
      icon: Calendar,
      variant: "success"
    },
    {
      title: "Accuracy Rate",
      value: "94%",
      change: "+2%",
      icon: TrendingUp,
      variant: "info"
    },
    {
      title: "Active Patients",
      value: new Set(cases.map(c => c.patient_data.fullName)).size.toString(),
      change: "+3",
      icon: Users,
      variant: "warning"
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "analyzing":
        return "warning";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getSeverityBadgeVariant = (severity: string | undefined) => {
    switch (severity) {
      case "mild":
        return "success";
      case "moderate":
        return "warning";
      case "severe":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleNewCase = () => {
    navigate("/new-case");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  const handleDeleteCase = async (id: string) => {
    try {
      await dentalCaseService.delete(id);
      setCases(cases.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Case deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting case:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete case. Please try again.",
      });
    }
  };

  const handleDownloadReport = async (caseData: Case) => {
    try {
      setIsGeneratingReport(true);
      
      // Get enhanced analysis first
      const enhancedAnalysis = await getEnhancedAnalysis({
        diagnosis: caseData.analysis_results?.diagnosis || '',
        findings: caseData.analysis_results?.findings || {},
        patientData: {
          age: caseData.patient_data.age,
          gender: caseData.patient_data.gender,
          medicalHistory: caseData.patient_data.medicalHistory
        }
      });

      // Generate and download the report
      await generatePDFReport(caseData, enhancedAnalysis);
      
      toast({
        title: "Success",
        description: "Report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = searchTerm === "" || (
      (c.patient_data?.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (c.id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesSeverity = filterSeverity === "all" || c.analysis_results?.severity === filterSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Return loading state if not authenticated
  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">PerioVision</span>
            </div>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleNewCase}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutConfirmDialog onConfirm={handleLogout} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change} from last month</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-${stat.variant} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Cases</CardTitle>
                <CardDescription>Manage your patient cases and AI diagnoses</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                      Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("analyzing")}>
                      Analyzing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                      Completed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Severity</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setFilterSeverity("all")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterSeverity("mild")}>
                      Mild
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterSeverity("moderate")}>
                      Moderate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterSeverity("severe")}>
                      Severe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-medical-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length > 0 ? (
                    filteredCases.map((case_) => (
                      <TableRow key={case_.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {case_?.patient_data?.fullName?.charAt(0)?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {case_?.patient_data?.fullName || 'Unknown Patient'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {case_?.patient_data?.age ? `${case_?.patient_data?.age} years` : 'Age not specified'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {case_.created_at ? new Date(case_.created_at).toLocaleDateString() : 'Date not available'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {case_.created_at ? new Date(case_.created_at).toLocaleTimeString() : 'Time not available'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(case_.status)}>
                            {case_.status.charAt(0).toUpperCase() + case_.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {case_.analysis_results ? (
                            <div className="space-y-1">
                              <Badge variant={getSeverityBadgeVariant(case_.analysis_results.severity)}>
                                {case_.analysis_results.severity || 'N/A'}
                              </Badge>
                              <p className="text-sm text-gray-500">
                                {case_.analysis_results.findings?.pathologies?.length || 0} findings
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500">No results yet</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/analysis/${case_.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Analysis
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <EditCaseDialog
                                  caseData={case_}
                                  onUpdate={(updatedCase) => {
                                    setCases(cases.map(c => 
                                      c.id === updatedCase.id ? updatedCase : c
                                    ));
                                    toast({
                                      title: "Success",
                                      description: "Case details have been updated successfully.",
                                    });
                                  }}
                                  trigger={
                                    <div 
                                      className="flex items-center px-2 py-1.5 text-sm cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Case
                                    </div>
                                  }
                                />
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadReport(case_)}
                                disabled={!case_.analysis_results}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download Report
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteCase(case_.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Case
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No cases found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactive Elements Section */}
      <div className="container mx-auto px-6 py-12 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Tips Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Today's Tip</CardTitle>
                </div>
                <Badge variant="outline" className="font-mono">
                  {currentTipIndex + 1}/{healthTips.tips.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthTips.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : healthTips.error ? (
                  <div className="text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Couldn't load tips. Using backup tips.</p>
                  </div>
                ) : (
                  <>
                    <div className="min-h-[100px] flex items-center">
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                          <p className="text-gray-700">
                            {healthTips.tips[currentTipIndex]}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentTipIndex(prev => 
                          prev === 0 ? healthTips.tips.length - 1 : prev - 1
                        )}
                      >
                        Previous
                      </Button>
                      <div className="flex gap-1">
                        {healthTips.tips.map((_, index) => (
                          <div
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              index === currentTipIndex ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentTipIndex(prev => 
                          prev === healthTips.tips.length - 1 ? 0 : prev + 1
                        )}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">AI Insights</CardTitle>
                </div>
                <Badge variant="secondary" className="font-mono">
                  v2.0
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Accuracy Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Analysis Accuracy</span>
                    <Badge 
                      variant={aiStats.accuracyRate >= 90 ? "success" : "warning"}
                      className="font-mono"
                    >
                      {aiStats.accuracyRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        aiStats.accuracyRate >= 90 ? 'bg-primary' : 'bg-warning'
                      }`}
                      style={{ width: `${aiStats.accuracyRate}%` }}
                    />
                  </div>
                </div>

                {/* Processing Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(aiStats.averageProcessingTime)}s
                    </div>
                    <div className="text-sm text-gray-600">Avg. Processing</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {aiStats.totalFindings}
                    </div>
                    <div className="text-sm text-gray-600">Total Findings</div>
                  </div>
                </div>

                {/* Weekly Trend */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Weekly Activity</span>
                    <div className="flex items-center space-x-1">
                      {aiStats.recentTrends[6] > aiStats.recentTrends[5] ? (
                        <ChevronUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(aiStats.recentTrends[6] - aiStats.recentTrends[5])} cases
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between h-12 gap-1">
                    {aiStats.recentTrends.map((count, index) => {
                      const maxCount = Math.max(...aiStats.recentTrends);
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      const day = new Date();
                      day.setDate(day.getDate() - (6 - index));
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-full ${
                              index === 6 ? 'bg-blue-600' : 'bg-blue-200'
                            } rounded-sm`}
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-gray-500 mt-1">
                            {day.toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Health Status */}
                <div className="flex items-center space-x-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    aiStats.accuracyRate >= 90 ? 'bg-green-600' : 'bg-yellow-600'
                  }`} />
                  <span className="text-gray-600">
                    {aiStats.accuracyRate >= 90 
                      ? 'AI system performing optimally'
                      : 'AI system needs attention'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/new-case')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Training Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isGeneratingReport && (
        <LoadingOverlay message="Generating comprehensive report... This may take a few moments." />
      )}
    </div>
  );
};

export default Dashboard;
