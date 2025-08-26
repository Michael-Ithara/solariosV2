import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'user' | 'guest';

export interface AuthUser extends User {
  role?: UserRole;
}

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string) {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    if (error) throw error;
    return { data, error };
  },

  // Sign in user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  },

  // Sign out user
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Determine user role (admin emails can be configured)
    const adminEmails = ['admin@solarios.com', 'admin@example.com'];
    const role: UserRole = adminEmails.includes(user.email || '') ? 'admin' : 'user';

    return { ...user, role };
  },

  // Get user role
  getUserRole(user: AuthUser | null): UserRole {
    if (!user) return 'guest';
    return user.role || 'user';
  },

  // Check if user has permission
  hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = { guest: 0, user: 1, admin: 2 };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
};