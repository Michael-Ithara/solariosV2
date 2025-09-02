import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Zap } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if user is already authenticated
    if (user && !loading) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo, { replace: true });
    }

    // Check if we should default to sign up mode
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [user, loading, navigate, searchParams]);

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          <Button 
            variant="outline" 
            className="border-primary/20 hover:bg-primary/10"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Auth Form Section */}
      <section className="relative z-10 py-8 px-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              {isSignUp ? 'Join Solarios' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp 
                ? 'Start your journey to smarter energy management'
                : 'Sign in to continue managing your energy'
              }
            </p>
          </div>

          <LoginForm onToggleMode={handleToggleMode} isSignUp={isSignUp} />

          {/* Features preview for sign up */}
          {isSignUp && (
            <Card className="mt-8 border-primary/20 bg-gradient-to-br from-background/80 to-primary/5 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 text-center">What you'll get:</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Real-time energy monitoring and analytics
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-energy-solar rounded-full"></div>
                    AI-powered optimization recommendations
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Gamified achievements and rewards
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-energy-grid rounded-full"></div>
                    Advanced device simulation tools
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-sm text-muted-foreground">
            © 2025 Solarios. Powering the future of energy management.
          </p>
        </div>
      </footer>
    </div>
  );
}