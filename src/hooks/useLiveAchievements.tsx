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

    // Initial check after 3 seconds
    const initialTimer = setTimeout(() => {
      checkAchievements();
    }, 3000);

    // Check every 2 minutes for more responsive updates
    const interval = setInterval(() => {
      checkAchievements();
    }, 2 * 60 * 1000);

    // Subscribe to energy data changes to trigger checks
    const energyChannel = supabase
      .channel('energy-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'energy_logs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('Energy data updated, checking achievements...');
          checkAchievements();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'solar_data',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('Solar data updated, checking achievements...');
          checkAchievements();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'real_time_energy_data',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('Real-time data updated, checking achievements...');
          checkAchievements();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      supabase.removeChannel(energyChannel);
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
