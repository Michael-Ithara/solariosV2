import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useSupabaseData() {
  const { user, role } = useAuth();
  const [appliances, setAppliances] = useState([]);
  const [energyLogs, setEnergyLogs] = useState([]);
  const [solarData, setSolarData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [userPoints, setUserPoints] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if we should use demo data
  const useDemo = role === 'guest' || !user;

  useEffect(() => {
    fetchData();
  }, [user, role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (useDemo) {
        // Fetch demo data (public access)
        const [appliancesRes, energyRes, solarRes, alertsRes, pointsRes, achievementsRes] = await Promise.all([
          supabase.from('demo_appliances').select('*'),
          supabase.from('demo_energy_logs').select('*').order('logged_at', { ascending: false }).limit(100),
          supabase.from('demo_solar_data').select('*').order('logged_at', { ascending: false }).limit(100),
          supabase.from('demo_alerts').select('*').order('created_at', { ascending: false }).limit(10),
          supabase.from('demo_user_points').select('*').single(),
          supabase.from('demo_achievements').select('*')
        ]);

        setAppliances(appliancesRes.data || []);
        setEnergyLogs(energyRes.data || []);
        setSolarData(solarRes.data || []);
        setAlerts(alertsRes.data || []);
        setUserPoints(pointsRes.data);
        setAchievements(achievementsRes.data || []);
      } else {
        // Fetch user-specific data
        const [appliancesRes, energyRes, solarRes, alertsRes, pointsRes, achievementsRes, userAchievementsRes] = await Promise.all([
          supabase.from('appliances').select('*').eq('user_id', user.id),
          supabase.from('energy_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(100),
          supabase.from('solar_data').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(100),
          supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('user_points').select('*').eq('user_id', user.id).single(),
          supabase.from('achievements').select('*'),
          supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id)
        ]);

        setAppliances(appliancesRes.data || []);
        setEnergyLogs(energyRes.data || []);
        setSolarData(solarRes.data || []);
        setAlerts(alertsRes.data || []);
        setUserPoints(pointsRes.data);
        
        // Merge achievements with user progress
        const allAchievements = achievementsRes.data || [];
        const userProgress = userAchievementsRes.data || [];
        
        const mergedAchievements = allAchievements.map(achievement => {
          const userAchievement = userProgress.find(ua => ua.achievement_id === achievement.id);
          return {
            ...achievement,
            progress: userAchievement?.progress || 0,
            unlocked: userAchievement?.unlocked || false,
            unlocked_at: userAchievement?.unlocked_at
          };
        });
        
        setAchievements(mergedAchievements);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAppliance = async (applianceId: string) => {
    if (useDemo) {
      // For demo mode, just update local state
      setAppliances(prev => prev.map(app => 
        app.id === applianceId 
          ? { ...app, status: app.status === 'on' ? 'off' : 'on' }
          : app
      ));
      return;
    }

    try {
      const appliance = appliances.find(a => a.id === applianceId);
      if (!appliance) return;

      const newStatus = appliance.status === 'on' ? 'off' : 'on';
      
      const { error } = await supabase
        .from('appliances')
        .update({ status: newStatus })
        .eq('id', applianceId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setAppliances(prev => prev.map(app => 
        app.id === applianceId 
          ? { ...app, status: newStatus }
          : app
      ));
    } catch (err) {
      console.error('Error toggling appliance:', err);
      setError(err.message);
    }
  };

  const addAppliance = async (name: string, powerRating: number = 0) => {
    if (useDemo) {
      // For demo mode, just update local state
      const newAppliance = {
        id: Date.now().toString(),
        name,
        status: 'off',
        power_rating_w: powerRating,
        total_kwh: 0,
        created_at: new Date().toISOString()
      };
      setAppliances(prev => [...prev, newAppliance]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('appliances')
        .insert({
          user_id: user.id,
          name,
          power_rating_w: powerRating,
          status: 'off',
          total_kwh: 0
        })
        .select()
        .single();

      if (error) throw error;

      setAppliances(prev => [...prev, data]);
    } catch (err) {
      console.error('Error adding appliance:', err);
      setError(err.message);
    }
  };

  return {
    appliances,
    energyLogs,
    solarData,
    alerts,
    userPoints,
    achievements,
    loading,
    error,
    useDemo,
    toggleAppliance,
    addAppliance,
    refetch: fetchData
  };
}