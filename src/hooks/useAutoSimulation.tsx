import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

/**
 * Auto-starts and manages the user's personalized energy simulation
 * This runs continuously in the background for authenticated users
 */
export function useAutoSimulation() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatorRef = useRef({ consumption: 0, solar: 0, count: 0 });

  useEffect(() => {
    if (!user || !profile) return;

    // Start the simulation loop
    const startSimulation = async () => {
      // Fetch user's appliances
      const { data: appliances } = await supabase
        .from('appliances')
        .select('*')
        .eq('user_id', user.id);

      if (!appliances || appliances.length === 0) return;

      // Simulation loop - runs every 10 seconds (simulated 10 minutes)
      intervalRef.current = setInterval(async () => {
        const now = new Date();
        const hour = now.getHours();

        // Calculate consumption from active appliances
        const consumption = appliances
          .filter(a => a.status === 'on')
          .reduce((sum, a) => sum + (a.power_rating_w || 0), 0) / 1000; // Convert to kW

        // Simulate solar production (based on time of day and user's solar capacity)
        const solarCapacity = profile.solar_panel_capacity || 0;
        let solarProduction = 0;
        if (solarCapacity > 0 && hour >= 6 && hour <= 18) {
          // Peak solar: 11am-3pm
          const peakHours = [11, 12, 13, 14, 15];
          const isPeak = peakHours.includes(hour);
          const cloudCover = Math.random() * 0.3; // Random 0-30% cloud cover
          const efficiency = isPeak ? 0.9 : 0.6;
          solarProduction = solarCapacity * efficiency * (1 - cloudCover);
        }

        // Calculate grid usage
        const gridUsage = Math.max(0, consumption - solarProduction);

        // Calculate weather data
        const temperature = 20 + Math.sin(hour / 24 * Math.PI * 2) * 10;
        const cloudCover = Math.random() * 100;

        // Accumulate data for batching
        accumulatorRef.current.consumption += consumption * (10 / 60); // 10 minutes worth
        accumulatorRef.current.solar += solarProduction * (10 / 60);
        accumulatorRef.current.count++;

        // Update real-time data every cycle
        await supabase.from('real_time_energy_data').insert({
          user_id: user.id,
          timestamp: now.toISOString(),
          consumption_kw: consumption,
          solar_production_kw: solarProduction,
          grid_usage_kw: gridUsage,
          battery_level_percent: 0, // Future feature
          active_devices: appliances.filter(a => a.status === 'on').length,
          total_devices: appliances.length,
          temperature_celsius: temperature,
          cloud_cover_percent: Math.floor(cloudCover),
          weather_condition: cloudCover < 30 ? 'sunny' : cloudCover < 70 ? 'partly-cloudy' : 'cloudy'
        });

        // Every 6 cycles (1 simulated hour), flush to energy_logs and solar_data
        if (accumulatorRef.current.count >= 6) {
          const avgConsumption = accumulatorRef.current.consumption / accumulatorRef.current.count;
          const avgSolar = accumulatorRef.current.solar / accumulatorRef.current.count;

          // Log energy consumption
          if (avgConsumption > 0) {
            await supabase.from('energy_logs').insert({
              user_id: user.id,
              logged_at: now.toISOString(),
              consumption_kwh: avgConsumption
            });
          }

          // Log solar production
          if (avgSolar > 0) {
            await supabase.from('solar_data').insert({
              user_id: user.id,
              logged_at: now.toISOString(),
              generation_kwh: avgSolar,
              irradiance_wm2: Math.random() * 1000
            });
          }

          // Reset accumulator
          accumulatorRef.current = { consumption: 0, solar: 0, count: 0 };
        }

        // Clean up old real_time_energy_data (keep last 24 hours)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        await supabase
          .from('real_time_energy_data')
          .delete()
          .eq('user_id', user.id)
          .lt('timestamp', oneDayAgo);

      }, 10000); // Run every 10 seconds (simulated 10 minutes)
    };

    startSimulation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, profile]);

  return { isRunning: !!intervalRef.current };
}
