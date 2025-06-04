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
  LogOut
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
import { dentalCaseService } from "@/lib/services/dentalCase";
import { FirebaseDentalCase } from "@/types/firebase";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [cases, setCases] = useState<FirebaseDentalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadCases = async () => {
      try {
        if (user) {
          const userCases = await dentalCaseService.getByUserId(user.uid);
          setCases(userCases);
        }
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
  }, [user]);

  const stats = [
    {
      title: "Total Cases",
      value: cases.length.toString(),
      change: "+12%",
      icon: FileText,
      color: "bg-blue-500"
    },
    {
      title: "This Month",
      value: cases.filter(c => {
        const caseDate = c.createdAt?.toDate();
        if (!caseDate) return false;
        const now = new Date();
        return caseDate.getMonth() === now.getMonth() && 
               caseDate.getFullYear() === now.getFullYear();
      }).length.toString(),
      change: "+4",
      icon: Calendar,
      color: "bg-green-500"
    },
    {
      title: "Accuracy Rate",
      value: "94%",
      change: "+2%",
      icon: TrendingUp,
      color: "bg-purple-500"
    },
    {
      title: "Active Patients",
      value: new Set(cases.map(c => c.patientName)).size.toString(),
      change: "+3",
      icon: Users,
      color: "bg-orange-500"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "analyzing":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string | undefined) => {
    switch (severity) {
      case "mild":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "severe":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleNewCase = () => {
    navigate("/new-case");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
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

  const filteredCases = cases.filter(c => 
    c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DentalAI</span>
            </div>
            <span className="text-gray-400">|</span>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleNewCase}
              className="bg-medical-600 hover:bg-medical-700"
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
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change} from last month</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
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
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
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
                              <AvatarFallback>{case_.patientName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{case_.patientName}</p>
                              <p className="text-sm text-gray-500">{case_.patientAge} years</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{case_.createdAt?.toDate().toLocaleDateString()}</span>
                            <span className="text-sm text-gray-500">
                              {case_.createdAt?.toDate().toLocaleTimeString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(case_.status)}>
                            {case_.status.charAt(0).toUpperCase() + case_.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {case_.analysisResults ? (
                            <div className="space-y-1">
                              <Badge className={getSeverityColor(case_.severity)}>
                                {case_.severity || 'N/A'}
                              </Badge>
                              <p className="text-sm text-gray-500">
                                {case_.pathologies?.length || 0} findings
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
                              <DropdownMenuItem onClick={() => navigate(`/edit/${case_.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Case
                              </DropdownMenuItem>
                              <DropdownMenuItem>
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
    </div>
  );
};

export default Dashboard;
