import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onToggleMode: () => void;
  isSignUp: boolean;
}

export function LoginForm({ onToggleMode, isSignUp }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    };
  };

  const getPasswordStrength = (password: string) => {
    const validation = validatePassword(password);
    const score = Object.values(validation).filter(Boolean).length;
    
    if (score < 2) return { strength: 'weak', color: 'text-danger' };
    if (score < 3) return { strength: 'fair', color: 'text-warning' };
    if (score < 4) return { strength: 'good', color: 'text-primary' };
    return { strength: 'strong', color: 'text-success' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Client-side validation
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (isSignUp) {
        // Enhanced password validation for signup
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.length) {
          throw new Error('Password must be at least 8 characters long');
        }
        if (!passwordValidation.uppercase || !passwordValidation.lowercase) {
          throw new Error('Password must contain both uppercase and lowercase letters');
        }
        if (!passwordValidation.number) {
          throw new Error('Password must contain at least one number');
        }
        
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        await signUp(email, password);
        setSuccess('Account created successfully! Please check your email to verify your account.');
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
          duration: 5000,
        });
      } else {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
          duration: 3000,
        });
      }
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred';
      
      // Handle common Supabase auth errors with user-friendly messages
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (err.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (err.message?.includes('Signup disabled')) {
        errorMessage = 'Account registration is currently disabled. Please contact support.';
      } else if (err.message?.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please wait a moment before trying again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription>
          {isSignUp 
            ? 'Sign up to start monitoring your energy usage'
            : 'Sign in to your energy monitoring dashboard'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-success bg-success/10 text-success animate-in slide-in-from-top-2">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 transition-all ${
                  email && !validateEmail(email) 
                    ? 'border-danger focus-visible:ring-danger' 
                    : email && validateEmail(email)
                    ? 'border-success focus-visible:ring-success'
                    : ''
                }`}
                required
                autoComplete="email"
              />
              {email && validateEmail(email) && (
                <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isSignUp && password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Password strength:</span>
                  <span className={`text-sm font-medium ${getPasswordStrength(password).color}`}>
                    {getPasswordStrength(password).strength}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className={`flex items-center gap-1 ${validatePassword(password).length ? 'text-success' : ''}`}>
                    <div className={`w-1 h-1 rounded-full ${validatePassword(password).length ? 'bg-success' : 'bg-muted'}`} />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-1 ${validatePassword(password).uppercase ? 'text-success' : ''}`}>
                    <div className={`w-1 h-1 rounded-full ${validatePassword(password).uppercase ? 'bg-success' : 'bg-muted'}`} />
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${validatePassword(password).lowercase ? 'text-success' : ''}`}>
                    <div className={`w-1 h-1 rounded-full ${validatePassword(password).lowercase ? 'bg-success' : 'bg-muted'}`} />
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-1 ${validatePassword(password).number ? 'text-success' : ''}`}>
                    <div className={`w-1 h-1 rounded-full ${validatePassword(password).number ? 'bg-success' : 'bg-muted'}`} />
                    One number
                  </div>
                </div>
              </div>
            )}
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-danger focus-visible:ring-danger' 
                      : confirmPassword && password === confirmPassword && password
                      ? 'border-success focus-visible:ring-success'
                      : ''
                  }`}
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && password === confirmPassword && password && (
                  <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
                )}
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-danger">Passwords do not match</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-energy hover:scale-[1.02] transition-all shadow-energy"
            disabled={isLoading || (isSignUp && (!validateEmail(email) || password !== confirmPassword || !password))}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onToggleMode}
              className="text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </Button>
          </div>

          {!isSignUp && (
            <div className="text-center border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">Demo Accounts for Testing:</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="font-medium text-primary">Admin Account</p>
                  <p className="text-muted-foreground">admin@solarios.com / password123</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="font-medium text-primary">User Account</p>
                  <p className="text-muted-foreground">user@solarios.com / password123</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}