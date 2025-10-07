import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Leaf } from 'lucide-react';

interface CO2Stats {
  daily: number;
  weekly: number;
  monthly: number;
  total: number;
}

export function CO2Tracker() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CO2Stats>({ daily: 0, weekly: 0, monthly: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchCO2Stats();

    // Subscribe to updates
    const channel = supabase
      .channel('co2-tracker-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'co2_tracker',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCO2Stats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCO2Stats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all time periods in parallel
      const [dailyData, weeklyData, monthlyData, totalData] = await Promise.all([
        supabase
          .from('co2_tracker')
          .select('co2_saved_kg')
          .eq('user_id', user.id)
          .gte('timestamp', today.toISOString()),
        supabase
          .from('co2_tracker')
          .select('co2_saved_kg')
          .eq('user_id', user.id)
          .gte('timestamp', weekAgo.toISOString()),
        supabase
          .from('co2_tracker')
          .select('co2_saved_kg')
          .eq('user_id', user.id)
          .gte('timestamp', monthAgo.toISOString()),
        supabase
          .from('co2_tracker')
          .select('co2_saved_kg')
          .eq('user_id', user.id),
      ]);

      setStats({
        daily: dailyData.data?.reduce((sum, d) => sum + d.co2_saved_kg, 0) || 0,
        weekly: weeklyData.data?.reduce((sum, d) => sum + d.co2_saved_kg, 0) || 0,
        monthly: monthlyData.data?.reduce((sum, d) => sum + d.co2_saved_kg, 0) || 0,
        total: totalData.data?.reduce((sum, d) => sum + d.co2_saved_kg, 0) || 0,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching CO₂ stats:', error);
      setIsLoading(false);
    }
  };

  const treesEquivalent = Math.floor(stats.total / 21); // ~21kg CO₂ per tree per year

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
          CO₂ Impact
        </CardTitle>
        <CardDescription>Carbon emissions saved by solar energy</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.daily.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">kg CO₂</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.weekly.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">kg CO₂</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.monthly.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">kg CO₂</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">All Time</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.total.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">kg CO₂</p>
              </div>
            </div>
            
            {treesEquivalent > 0 && (
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-center">
                <p className="text-sm text-green-800 dark:text-green-200">
                  🌳 Equivalent to <span className="font-bold">{treesEquivalent}</span> tree
                  {treesEquivalent !== 1 ? 's' : ''} planted
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
