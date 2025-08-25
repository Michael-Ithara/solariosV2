import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Sun, 
  Battery, 
  TrendingUp, 
  Shield, 
  Smartphone,
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Award,
  Trophy
} from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Real-time Monitoring",
    description: "Track your energy consumption and production in real-time with advanced analytics."
  },
  {
    icon: <Sun className="w-6 h-6" />,
    title: "Solar Optimization",
    description: "Maximize your solar panel efficiency with AI-powered insights and recommendations."
  },
  {
    icon: <Battery className="w-6 h-6" />,
    title: "Smart Storage",
    description: "Optimize battery usage and storage to reduce grid dependency and save money."
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Predictive Analytics",
    description: "Forecast energy needs and production to make informed decisions about usage."
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure & Private",
    description: "Your energy data is encrypted and protected with enterprise-grade security."
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile Ready",
    description: "Access your energy dashboard anywhere with our responsive web application."
  }
];

const achievements = [
  { icon: "🏆", title: "Energy Saver", description: "Reduce consumption by 20%" },
  { icon: "☀️", title: "Solar Hero", description: "Generate 100kWh from solar" },
  { icon: "🔥", title: "Streak Master", description: "7 days of monitoring" },
  { icon: "⚡", title: "Efficiency Expert", description: "90% efficiency rating" }
];

const stats = [
  { value: "10,000+", label: "Homes Connected" },
  { value: "2.5M", label: "kWh Saved" },
  { value: "98%", label: "Uptime" },
  { value: "500+", label: "Happy Users" }
];

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-radial from-primary/20 to-transparent rounded-full animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-radial from-energy-solar/20 to-transparent rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-transparent via-primary/10 to-transparent rounded-full animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-energy rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-energy-solar bg-clip-text text-transparent">
              Solarios
            </h1>
          </div>
          {user ? (
            <Link to="/dashboard">
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10">
                Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button 
              variant="outline" 
              className="border-primary/20 hover:bg-primary/10"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Badge variant="outline" className="mb-6 px-4 py-2 border-primary/30 bg-primary/10">
              <Star className="w-4 h-4 mr-2" />
              Smart Energy Management Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-energy-solar bg-clip-text text-transparent leading-tight">
              Transform Your<br />
              Energy Future
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Monitor, optimize, and gamify your energy consumption with AI-powered insights. 
              Join thousands of homeowners saving money and reducing their carbon footprint.
            </p>
            
            <div className="flex gap-4 justify-center mb-12">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="px-8 py-6 text-lg bg-gradient-energy hover:scale-105 transition-transform shadow-xl">
                    <Play className="w-5 h-5 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  className="px-8 py-6 text-lg bg-gradient-energy hover:scale-105 transition-transform shadow-xl"
                  onClick={() => setShowAuthModal(true)}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Monitoring
                </Button>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-primary/30 hover:bg-primary/10">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-muted/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to take control of your energy consumption and production
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`border-primary/20 bg-gradient-to-br from-background/80 to-primary/5 backdrop-blur-sm hover:scale-105 transition-all duration-500 hover:shadow-xl ${
                  currentFeature === index ? 'ring-2 ring-primary/30 shadow-lg' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-energy rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Preview */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Gamified Experience
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Earn achievements, unlock milestones, and compete with friends while saving energy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <Card 
                key={index} 
                className="border-success/30 bg-gradient-to-br from-success/10 to-transparent hover:scale-105 transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h3 className="font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <div className="flex items-center justify-center mt-3">
                    <Award className="w-4 h-4 text-success mr-1" />
                    <span className="text-xs text-success">Achievement</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-success/30 hover:bg-success/10">
                  <Trophy className="w-5 h-5 mr-2" />
                  View All Achievements
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-6 text-lg border-success/30 hover:bg-success/10"
                onClick={() => setShowAuthModal(true)}
              >
                <Trophy className="w-5 h-5 mr-2" />
                View All Achievements
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-primary/10 via-energy-solar/10 to-primary/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Ready to Start Your Energy Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users already saving money and reducing their environmental impact
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="px-8 py-6 text-lg bg-gradient-energy hover:scale-105 transition-transform shadow-xl">
                  <Zap className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                className="px-8 py-6 text-lg bg-gradient-energy hover:scale-105 transition-transform shadow-xl"
                onClick={() => setShowAuthModal(true)}
              >
                <Zap className="w-5 h-5 mr-2" />
                Get Started Now
              </Button>
            )}
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-primary/30 hover:bg-primary/10">
              <CheckCircle className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Free to start • No credit card required • 24/7 support</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-primary/20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-energy rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Solarios</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Solarios. Powering the future of energy management.
          </p>
        </div>
      </footer>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}