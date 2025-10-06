import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useCurrency } from './useCurrency';

/**
 * Auto-starts and manages the user's personalized energy simulation
 * This runs continuously in the background for authenticated users
 * Respects the data_source field in profiles: 'demo', 'simulation', or 'iot'
 */
export function useAutoSimulation() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatorRef = useRef({ consumption: 0, solar: 0, count: 0 });

  useEffect(() => {
    if (!user || !profile) return;

    // Only run simulation if data_source is 'simulation'
    // For 'demo', data comes from demo_* tables
    // For 'iot', data comes from real IoT device ingestion (future)
    const dataSource = (profile as any).data_source || 'simulation';
    if (dataSource !== 'simulation') {
      console.log(`[AutoSimulation] Skipping simulation - data_source is '${dataSource}'`);
      return;
    }

    // Helper function to calculate grid price based on time
    const calculateGridPrice = (hour: number, baseRate: number): { price: number; tier: string } => {
      if (hour >= 0 && hour < 6) {
        return { price: baseRate * 0.90, tier: 'off-peak' }; // 10% discount off-peak
      } else if (hour >= 18 && hour < 24) {
        return { price: baseRate * 1.17, tier: 'peak' }; // 17% premium peak
      } else {
        return { price: baseRate, tier: 'standard' };
      }
    };

    // Helper function to calculate solar irradiance based on time
    const calculateIrradiance = (hour: number, cloudCover: number): number => {
      if (hour < 6 || hour > 18) return 0; // No sun at night
      
      // Morning rise (6AM-11AM)
      if (hour >= 6 && hour < 11) {
        const progress = (hour - 6) / 5; // 0 to 1
        const baseIrradiance = progress * 800; // Rise to 800 W/m²
        return baseIrradiance * (1 - cloudCover);
      }
      
      // Noon peak (11AM-2PM)
      if (hour >= 11 && hour < 14) {
        const baseIrradiance = 800 + Math.random() * 200; // 800-1000 W/m²
        return baseIrradiance * (1 - cloudCover);
      }
      
      // Evening decline (2PM-7PM)
      if (hour >= 14 && hour <= 18) {
        const progress = (18 - hour) / 4; // 1 to 0
        const baseIrradiance = progress * 800;
        return baseIrradiance * (1 - cloudCover);
      }
      
      return 0;
    };

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

        // Calculate weather data
        const cloudCoverPercent = Math.random() * 100;
        const cloudCoverRatio = cloudCoverPercent / 100;
        const temperature = 20 + Math.sin(hour / 24 * Math.PI * 2) * 10;
        const humidity = 40 + Math.random() * 40; // 40-80%
        const windSpeed = 5 + Math.random() * 15; // 5-20 km/h
        const weatherCondition = cloudCoverPercent < 30 ? 'sunny' : cloudCoverPercent < 70 ? 'partly-cloudy' : 'cloudy';
        
        // Calculate irradiance based on time and cloud cover
        const irradiance = calculateIrradiance(hour, cloudCoverRatio);

        // Simulate solar production (based on irradiance and user's solar capacity)
        const solarCapacity = profile.solar_panel_capacity || 0;
        let solarProduction = 0;
        if (solarCapacity > 0 && irradiance > 0) {
          // Convert irradiance to power output (simplified formula)
          // Typical efficiency is around 15-20% for solar panels
          const panelEfficiency = 0.17;
          solarProduction = (solarCapacity * irradiance / 1000) * panelEfficiency;
        }

        // Calculate grid pricing (dynamic based on time of day)
        const baseRate = profile.electricity_rate || 0.12;
        const { price: gridPrice, tier: priceTier } = calculateGridPrice(hour, baseRate);

        // Calculate grid usage
        const gridUsage = Math.max(0, consumption - solarProduction);

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
          cloud_cover_percent: Math.floor(cloudCoverPercent),
          weather_condition: weatherCondition
        });

        // Update weather data (every cycle)
        await supabase.from('weather_data').insert({
          timestamp: now.toISOString(),
          temperature_celsius: temperature,
          humidity_percent: Math.floor(humidity),
          cloud_cover_percent: Math.floor(cloudCoverPercent),
          wind_speed_kmh: windSpeed,
          solar_irradiance_wm2: irradiance,
          uv_index: Math.floor((irradiance / 1000) * 11), // Simplified UV calculation
          weather_condition: weatherCondition,
          data_source: 'simulation'
        });

        // Update grid pricing (every cycle)
        await supabase.from('grid_prices').insert({
          user_id: user.id,
          timestamp: now.toISOString(),
          price_per_kwh: gridPrice,
          price_tier: priceTier
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
              irradiance_wm2: irradiance
            });
          }

          // Reset accumulator
          accumulatorRef.current = { consumption: 0, solar: 0, count: 0 };
        }

        // Clean up old data (keep last 24 hours)
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        await Promise.all([
          supabase.from('real_time_energy_data').delete().eq('user_id', user.id).lt('timestamp', oneDayAgo),
          supabase.from('weather_data').delete().lt('timestamp', oneDayAgo),
          supabase.from('grid_prices').delete().eq('user_id', user.id).lt('timestamp', oneDayAgo)
        ]);

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
