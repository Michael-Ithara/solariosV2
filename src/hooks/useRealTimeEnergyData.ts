import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EnergyDataPoint {
  time: string;
  consumption: number;
  solar: number;
  grid: number;
  timestamp: string;
}

export interface RealTimeMetrics {
  currentUsage: number;
  solarProduction: number;
  gridUsage: number;
  batteryLevel: number;
  lastUpdate: string;
}

export function useRealTimeEnergyData() {
  const [energyData, setEnergyData] = useState<EnergyDataPoint[]>([]);
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    currentUsage: 0,
    solarProduction: 0,
    gridUsage: 0,
    batteryLevel: 85,
    lastUpdate: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch initial data and set up real-time subscriptions
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Get recent real-time data points for the last 24 hours
        const { data: realtimeData } = await supabase
          .from('real_time_energy_data')
          .select('*')
          .eq('user_id', user.id)
          .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: true })
          .limit(24);

        // Fallback to traditional energy logs if no real-time data exists
        if (!realtimeData || realtimeData.length === 0) {

          // Get recent energy logs for the last 24 hours
          const { data: energyLogs } = await supabase
            .from('energy_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('logged_at', { ascending: true });

          // Get recent solar data
          const { data: solarData } = await supabase
            .from('solar_data')
            .select('*')
            .eq('user_id', user.id)
            .gte('logged_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('logged_at', { ascending: true });

          // Process traditional data for chart
          const processedData: EnergyDataPoint[] = energyLogs?.map(log => {
            const logTime = new Date(log.logged_at);
            const correspondingSolar = solarData?.find(solar => 
              Math.abs(new Date(solar.logged_at).getTime() - logTime.getTime()) < 30 * 60 * 1000 // 30 min window
            );

            const consumption = log.consumption_kwh || 0;
            const solar = correspondingSolar?.generation_kwh || 0;
            const grid = Math.max(0, consumption - solar);

            return {
              time: logTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              consumption: parseFloat(consumption.toFixed(2)),
              solar: parseFloat(solar.toFixed(2)),
              grid: parseFloat(grid.toFixed(2)),
              timestamp: log.logged_at
            };
          }) || [];

          setEnergyData(processedData);
        } else {
          // Process real-time data points
          const processedData: EnergyDataPoint[] = realtimeData.map(point => ({
            time: new Date(point.timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            consumption: parseFloat(point.consumption_kw.toFixed(2)),
            solar: parseFloat(point.solar_production_kw.toFixed(2)),
            grid: parseFloat(point.grid_usage_kw.toFixed(2)),
            timestamp: point.timestamp
          }));

          setEnergyData(processedData);
        }

        // Get current appliances for real-time usage calculation
        const { data: appliances } = await supabase
          .from('appliances')
          .select('*')
          .eq('user_id', user.id);

        // Calculate current metrics
        const currentUsage = appliances
          ?.filter(a => a.status === 'on')
          .reduce((sum, a) => sum + (a.power_rating_w || 0), 0) / 1000 || 0; // Convert to kW

        // Get latest real-time point or calculate from traditional data
        let solarProduction = 0;
        let batteryLevel = 85;

        if (realtimeData && realtimeData.length > 0) {
          const latest = realtimeData[realtimeData.length - 1];
          solarProduction = latest.solar_production_kw;
          batteryLevel = latest.battery_level_percent;
        } else {
          // Fallback to traditional solar data
          const { data: solarData } = await supabase
            .from('solar_data')
            .select('*')
            .eq('user_id', user.id)
            .order('logged_at', { ascending: false })
            .limit(1);

          const latestSolar = solarData?.[0];
          solarProduction = latestSolar?.generation_kwh || 0;
        }

        const gridUsage = Math.max(0, currentUsage - solarProduction);

        setMetrics({
          currentUsage: parseFloat(currentUsage.toFixed(2)),
          solarProduction: parseFloat(solarProduction.toFixed(2)),
          gridUsage: parseFloat(gridUsage.toFixed(2)),
          batteryLevel,
          lastUpdate: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error fetching real-time energy data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const energyChannel = supabase
      .channel('real-time-energy')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'real_time_energy_data',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time energy data update:', payload);
          fetchData(); // Refetch data when real-time data changes
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appliances',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Appliance update:', payload);
          fetchData(); // Refetch data when appliances change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Alerts update:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(energyChannel);
    };
  }, [user]);

  return {
    energyData,
    metrics,
    isLoading
  };
}