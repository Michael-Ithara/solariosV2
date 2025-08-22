import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = 'user',
  fallback 
}: ProtectedRouteProps) {
  const { user, role, hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-4">
              {requiredRole === 'admin' ? (
                <Shield className="w-6 h-6 text-warning" />
              ) : (
                <Lock className="w-6 h-6 text-warning" />
              )}
            </div>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {requiredRole === 'admin' 
                ? 'This area requires administrator privileges.'
                : 'Please sign in to access this feature.'
              }
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Your current role: <span className="font-medium capitalize">{role}</span></p>
              <p>Required role: <span className="font-medium capitalize">{requiredRole}</span></p>
            </div>
            {role === 'guest' && (
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Go to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}