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
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DentalAI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-medical-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-medical-600 transition-colors">How It Works</a>
            <a href="#testimonials" className="text-gray-600 hover:text-medical-600 transition-colors">Reviews</a>
            {user ? (
              <Button className="bg-medical-600 hover:bg-medical-700" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleAction}>Login</Button>
                <Button className="bg-medical-600 hover:bg-medical-700" onClick={handleAction}>Get Started</Button>
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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
            AI-Powered Dental
            <span className="text-medical-600 block">Radiograph Diagnosis</span>
            <span className="text-gray-600 text-2xl md:text-3xl font-normal block mt-2">
              in Seconds
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Revolutionary AI technology that analyzes dental X-rays to detect bone loss, 
            pathologies, and provides accurate prognosis with professional treatment recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-medical-600 hover:bg-medical-700 text-lg px-8 py-3"
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
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl mx-auto">
              <div className="aspect-video bg-gradient-to-br from-medical-100 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Brain className="w-16 h-16 text-medical-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800">AI Analysis Interface</h3>
                  <p className="text-gray-600">Upload • Analyze • Diagnose</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Advanced AI Diagnostic Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive analysis tools designed for modern dental practice
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-medical-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-medical-600" />
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
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-medical-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold transition-colors ${
                  activeStep === step.number ? 'bg-medical-600' : 'bg-gray-400'
                }`}>
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Dental Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what dentists are saying about DentalAI
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-medical-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {user ? 'Ready to Analyze?' : 'Ready to Transform Your Practice?'}
          </h2>
          <p className="text-xl text-medical-100 mb-8 max-w-2xl mx-auto">
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
                className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-medical-600"
                onClick={handleAction}
              >
                Schedule Demo
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-medical-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">DentalAI</span>
              </div>
              <p className="text-gray-400">
                Professional AI-powered dental diagnosis for the modern practice.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Training</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 DentalAI. All rights reserved. Medical AI diagnosis platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
