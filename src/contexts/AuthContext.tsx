import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, UserRole, authService } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const role = authService.getUserRole(user);

  useEffect(() => {
    // Get initial session first
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
        } else if (session?.user) {
          const adminEmails = ['admin@solarios.com', 'admin@example.com'];
          const userRole = adminEmails.includes(session.user.email || '') ? 'admin' : 'user';
          setUser({ ...session.user, role: userRole });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Then listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (session?.user) {
        const adminEmails = ['admin@solarios.com', 'admin@example.com'];
        const userRole = adminEmails.includes(session.user.email || '') ? 'admin' : 'user';
        setUser({ ...session.user, role: userRole });
      } else {
        setUser(null);
      }
      
      if (!loading) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await authService.signIn(email, password);
      if (error) throw error;
      
      // Session will be updated via onAuthStateChange listener
      console.log('Sign in successful:', data.user?.email);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await authService.signUp(email, password);
      if (error) throw error;
      
      console.log('Sign up successful:', data.user?.email);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await authService.signOut();
      if (error) throw error;
      
      console.log('Sign out successful');
      // Session will be cleared via onAuthStateChange listener
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const hasPermission = (requiredRole: UserRole) => {
    return authService.hasPermission(role, requiredRole);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      signIn,
      signUp,
      signOut,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}