import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to trigger live achievement checking
 * Calls the gamification edge function periodically
 */
export function useLiveAchievements() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initial check after 5 seconds
    const initialTimer = setTimeout(() => {
      checkAchievements();
    }, 5000);

    // Check every 5 minutes
    const interval = setInterval(() => {
      checkAchievements();
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user]);

  const checkAchievements = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('check-gamification', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Failed to check achievements:', error);
      } else {
        console.log('Achievement check completed');
      }
    } catch (error) {
      console.error('Error triggering achievement check:', error);
    }
  };

  return { checkAchievements };
}
