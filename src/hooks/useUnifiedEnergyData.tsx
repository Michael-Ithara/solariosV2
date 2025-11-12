import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface EnergyDataPoint {
  time: string;
  consumption: number;
  solar: number;
  grid: number;
  timestamp: string;
}

interface RealTimeMetrics {
  currentUsage: number;
  solarProduction: number;
  gridUsage: number;
  batteryLevel: number;
  activeDevices: number;
  totalDevices: number;
  lastUpdate: string | null;
}

/**
 * Unified hook to fetch energy data from the correct source
 * Automatically handles demo, simulation, and iot data sources
 * Dashboards should use this instead of directly querying tables
 */
export function useUnifiedEnergyData() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [energyData, setEnergyData] = useState<EnergyDataPoint[]>([]);
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    currentUsage: 0,
    solarProduction: 0,
    gridUsage: 0,
    batteryLevel: 0,
    activeDevices: 0,
    totalDevices: 0,
    lastUpdate: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) {
      setIsLoading(false);
      return;
    }

    const dataSource = (profile as any).data_source || 'simulation';
    console.log(`[UnifiedEnergyData] Data source: ${dataSource}`);

    const fetchData = async () => {
      setIsLoading(true);

      try {
        if (dataSource === 'demo') {
          // Fetch from demo tables (no user_id filtering)
          await fetchDemoData();
        } else if (dataSource === 'simulation' || dataSource === 'iot') {
          // Fetch from unified tables (user-specific)
          await fetchUserData();
        }
      } catch (error) {
        console.error('[UnifiedEnergyData] Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchDemoData = async () => {

      // Fetch demo energy logs
      const { data: demoLogs } = await supabase
        .from('demo_energy_logs')
        .select('*')
        .order('logged_at', { ascending: false })
        .limit(24);

      // Fetch demo solar data
      const { data: demoSolar } = await supabase
        .from('demo_solar_data')
        .select('*')
        .order('logged_at', { ascending: false })
        .limit(24);

      // Combine and transform, ensure all fields are valid numbers
      const combined = (demoLogs || []).map((log, idx) => {
        const solar = Number(demoSolar?.[idx]?.generation_kwh ?? 0);
        const consumption = Number(log?.consumption_kwh ?? 0);
        const grid = Math.max(0, consumption - solar);
        return {
          time: log?.logged_at ? new Date(log.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          consumption: isNaN(consumption) ? 0 : consumption,
          solar: isNaN(solar) ? 0 : solar,
          grid: isNaN(grid) ? 0 : grid,
          timestamp: log?.logged_at || '',
        };
      }).filter(point =>
        point &&
        typeof point.solar === 'number' && !isNaN(point.solar) &&
        typeof point.grid === 'number' && !isNaN(point.grid) &&
        typeof point.consumption === 'number' && !isNaN(point.consumption) &&
        point.time !== ''
      );

      setEnergyData(combined.reverse());

      // Calculate metrics from demo appliances
      const { data: demoAppliances } = await supabase
        .from('demo_appliances')
        .select('*');

      const currentUsage = (demoAppliances || [])
        .filter(a => a.status === 'on')
        .reduce((sum, a) => sum + (a.power_rating_w || 0), 0) / 1000;

      setMetrics({
        currentUsage,
        solarProduction: demoSolar?.[0]?.generation_kwh || 0,
        gridUsage: Math.max(0, currentUsage - (demoSolar?.[0]?.generation_kwh || 0)),
        batteryLevel: 85,
        activeDevices: (demoAppliances || []).filter(a => a.status === 'on').length,
        totalDevices: demoAppliances?.length || 0,
        lastUpdate: new Date().toISOString(),
      });
    };

    const fetchUserData = async () => {

      // Fetch real-time energy data
      const { data: realtimeData } = await supabase
        .from('real_time_energy_data')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1);

      // Fetch energy logs (last 24 hours)
      const { data: energyLogs } = await supabase
        .from('energy_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(24);

      // Fetch solar data (last 24 hours)
      const { data: solarData } = await supabase
        .from('solar_data')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(24);

      // Combine and transform, ensure all fields are valid numbers
      const combined = (energyLogs || []).map((log, idx) => {
        const solar = Number(solarData?.[idx]?.generation_kwh ?? 0);
        const consumption = Number(log?.consumption_kwh ?? 0);
        const grid = Math.max(0, consumption - solar);
        return {
          time: log?.logged_at ? new Date(log.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
          consumption: isNaN(consumption) ? 0 : consumption,
          solar: isNaN(solar) ? 0 : solar,
          grid: isNaN(grid) ? 0 : grid,
          timestamp: log?.logged_at || '',
        };
      }).filter(point =>
        point &&
        typeof point.solar === 'number' && !isNaN(point.solar) &&
        typeof point.grid === 'number' && !isNaN(point.grid) &&
        typeof point.consumption === 'number' && !isNaN(point.consumption) &&
        point.time !== ''
      );

      setEnergyData(combined.reverse());

      // Set metrics from real-time data
      const latest = realtimeData?.[0];
      if (latest) {
        setMetrics({
          currentUsage: latest.consumption_kw,
          solarProduction: latest.solar_production_kw,
          gridUsage: latest.grid_usage_kw,
          batteryLevel: latest.battery_level_percent,
          activeDevices: latest.active_devices,
          totalDevices: latest.total_devices,
          lastUpdate: latest.timestamp,
        });
      }
    };

    fetchData();

    // Set up real-time subscription based on data source
    let subscription: any;

    if (dataSource === 'demo') {
      // Subscribe to demo tables
      subscription = supabase
        .channel('demo-energy-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'demo_energy_logs'
        }, fetchData)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'demo_solar_data'
        }, fetchData)
        .subscribe();
    } else {
      // Subscribe to user tables
      subscription = supabase
        .channel('user-energy-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'real_time_energy_data',
          filter: `user_id=eq.${user.id}`
        }, fetchData)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'energy_logs',
          filter: `user_id=eq.${user.id}`
        }, fetchData)
        .subscribe();
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [user, profile]);

  return { energyData, metrics, isLoading };
}
