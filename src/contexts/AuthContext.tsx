import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, UserRole, authService } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const role = authService.getUserRole(user);

  const processAuthSession = (session: Session | null) => {
    setSession(session);
    
    if (session?.user) {
      const adminEmails = ['admin@solarios.com', 'admin@example.com'];
      const userRole = adminEmails.includes(session.user.email || '') ? 'admin' : 'user';
      setUser({ ...session.user, role: userRole });
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting initial session:', error);
          processAuthSession(null);
        } else {
          processAuthSession(session);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          processAuthSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.email);
      
      processAuthSession(session);
      
      // Only set loading to false after initial load is complete
      if (!loading) {
        setLoading(false);
      }
      
      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        // Clear any cached data
        localStorage.removeItem('supabase.auth.token');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in successfully');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loading]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await authService.signIn(email, password);
      if (error) throw error;
      
      console.log('Sign in successful:', data.user?.email);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await authService.signUp(email, password);
      if (error) throw error;
      
      console.log('Sign up successful:', data.user?.email);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await authService.signOut();
      if (error) throw error;
      
      console.log('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      processAuthSession(session);
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  const hasPermission = (requiredRole: UserRole) => {
    return authService.hasPermission(role, requiredRole);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      loading,
      signIn,
      signUp,
      signOut,
      hasPermission,
      refreshUser
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