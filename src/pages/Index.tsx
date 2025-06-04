import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Clock, Download, Shield, Star, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";

const Index = () => {
  const [activeStep, setActiveStep] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAction = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const features = [
    {
      icon: Upload,
      title: "Upload X-ray Images",
      description: "Support for JPEG, PNG, and DICOM formats with instant processing"
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms detect bone loss, caries, and pathologies"
    },
    {
      icon: Clock,
      title: "Instant Diagnosis",
      description: "Get comprehensive analysis results in seconds, not hours"
    },
    {
      icon: Download,
      title: "Professional Reports",
      description: "Generate detailed PDF reports for clinical records and patient consultation"
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Upload Radiograph",
      description: "Simply drag and drop your dental X-ray image"
    },
    {
      number: 2,
      title: "Patient History",
      description: "Fill in patient details and clinical information"
    },
    {
      number: 3,
      title: "AI Diagnosis",
      description: "Receive instant analysis with treatment recommendations"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Oral Surgeon",
      content: "This AI diagnostic tool has revolutionized our practice. The accuracy is remarkable.",
      rating: 5
    },
    {
      name: "Dr. Michael Rodriguez",
      role: "Periodontist",
      content: "Saves us hours of analysis time while providing consistent, reliable results.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">PerioVision</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">Reviews</a>
            {user ? (
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleAction}>Login</Button>
                <Button onClick={handleAction}>Get Started</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            Trusted by 500+ Dental Professionals
          </Badge>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            AI-Powered Periodontal Analysis
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Transform your periodontal practice with advanced AI technology.
            Get accurate, fast, and reliable periodontal analysis to enhance your diagnostic capabilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={handleAction}
            >
              {user ? 'Go to Dashboard' : 'Try Free Analysis'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={() => window.location.href = '#how-it-works'}
            >
              Watch Demo
            </Button>
          </div>
          
          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="bg-card rounded-xl shadow-2xl p-8 max-w-4xl mx-auto">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">AI Analysis Interface</h3>
                  <p className="text-muted-foreground">Upload • Analyze • Diagnose</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Advanced AI Diagnostic Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive analysis tools designed for modern dental practice
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to professional AI diagnosis
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`text-center cursor-pointer transition-all ${
                  activeStep === step.number ? 'scale-105' : ''
                }`}
                onMouseEnter={() => setActiveStep(step.number)}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-foreground text-xl font-bold transition-colors ${
                  activeStep === step.number ? 'bg-primary' : 'bg-muted'
                }`}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Dental Professionals
            </h2>
            <p className="text-xl text-muted-foreground">
              See what dentists are saying about PerioVision
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {user ? 'Ready to Analyze?' : 'Ready to Transform Your Practice?'}
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {user 
              ? 'Start analyzing your dental radiographs with AI technology.'
              : 'Join hundreds of dental professionals using AI to improve patient care and diagnosis accuracy.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-3"
              onClick={handleAction}
            >
              {user ? 'New Analysis' : 'Start Free Trial'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!user && (
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                onClick={handleAction}
              >
                Schedule Demo
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
