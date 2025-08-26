import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth token from URL hash or search params
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');
          return;
        }

        // Check for specific error codes in URL params
        const errorCode = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorCode) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        // If we have a session, authentication was successful
        if (data.session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          // No session but no error - might be email confirmation
          const type = searchParams.get('type');
          if (type === 'signup') {
            setStatus('success');
            setMessage('Email confirmed successfully! You can now sign in.');
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Authentication session not found');
          }
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-destructive" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            {getIcon()}
            
            <h1 className="text-2xl font-semibold tracking-tight">
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Authentication Failed'}
            </h1>
            
            <p className="text-muted-foreground">
              {message}
            </p>
            
            {status === 'error' && (
              <Alert className="mt-4">
                <AlertDescription>
                  If this error persists, please try signing in again or contact support.
                  <br />
                  <button 
                    onClick={() => navigate('/', { replace: true })}
                    className="mt-2 text-primary hover:underline"
                  >
                    Return to home page
                  </button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}