import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, days_back = 90 } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Backfilling ${days_back} days of data for user ${user_id}`);

    // Get user profile for solar capacity
    const { data: profile } = await supabase
      .from('profiles')
      .select('solar_panel_capacity, electricity_rate, timezone')
      .eq('user_id', user_id)
      .single();

    const solarCapacity = profile?.solar_panel_capacity || 5; // kW
    const electricityRate = profile?.electricity_rate || 0.12;

    // Get user's appliances
    const { data: appliances } = await supabase
      .from('appliances')
      .select('id, name, power_rating_w')
      .eq('user_id', user_id);

    const now = new Date();
    const hoursToGenerate = days_back * 24;
    
    const energyLogs = [];
    const solarData = [];
    const weatherData = [];
    const gridPrices = [];
    const co2Data = [];
    const rawEnergyData = [];
    const processedFeatures = [];

    // Generate data for each hour going backwards
    for (let h = hoursToGenerate; h > 0; h--) {
      const timestamp = new Date(now.getTime() - h * 60 * 60 * 1000);
      const hour = timestamp.getHours();
      const dayOfYear = Math.floor((timestamp.getTime() - new Date(timestamp.getFullYear(), 0, 0).getTime()) / 86400000);
      const dayOfWeek = timestamp.getDay();
      const month = timestamp.getMonth();

      // Solar generation with realistic patterns
      const isDaytime = hour >= 6 && hour <= 18;
      const solarPeakHour = 12;
      const hoursFromPeak = Math.abs(hour - solarPeakHour);
      const cloudCover = 0.1 + Math.random() * 0.4; // 10-50% cloud cover
      const seasonalFactor = 0.7 + 0.3 * Math.sin((dayOfYear / 365) * 2 * Math.PI - Math.PI / 2); // Higher in summer
      
      let solarGeneration = 0;
      let irradiance = 0;
      
      if (isDaytime) {
        const timeOfDayFactor = Math.max(0, 1 - (hoursFromPeak / 6) ** 2);
        irradiance = 1000 * timeOfDayFactor * (1 - cloudCover * 0.7) * seasonalFactor;
        solarGeneration = (solarCapacity * irradiance / 1000) * (0.85 + Math.random() * 0.15);
      }

      // Weather data
      const baseTemp = 15 + 10 * Math.sin((dayOfYear / 365) * 2 * Math.PI - Math.PI / 2); // Seasonal variation
      const dailyTempVariation = 8 * Math.sin(((hour - 6) / 24) * 2 * Math.PI); // Daily cycle
      const temperature = baseTemp + dailyTempVariation + (Math.random() - 0.5) * 3;

      weatherData.push({
        timestamp: timestamp.toISOString(),
        temperature_celsius: Number(temperature.toFixed(2)),
        solar_irradiance_wm2: Number(irradiance.toFixed(2)),
        cloud_cover_percent: Math.round(cloudCover * 100),
        humidity_percent: 40 + Math.round(Math.random() * 40),
        wind_speed_kmh: Number((5 + Math.random() * 20).toFixed(1)),
        weather_condition: cloudCover > 0.6 ? 'cloudy' : cloudCover > 0.3 ? 'partly-cloudy' : 'sunny',
        data_source: 'simulated'
      });

      // Energy consumption with realistic patterns
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isMorningPeak = hour >= 6 && hour <= 9;
      const isEveningPeak = hour >= 17 && hour <= 22;
      const isNight = hour >= 23 || hour <= 5;

      let baseConsumption = 1.5; // kW baseline
      if (isMorningPeak) baseConsumption = 3.5 + Math.random() * 1.5;
      else if (isEveningPeak) baseConsumption = 4.0 + Math.random() * 2.0;
      else if (isNight) baseConsumption = 0.8 + Math.random() * 0.4;
      else baseConsumption = 2.0 + Math.random() * 1.0;

      if (isWeekend) baseConsumption *= 1.2; // More consumption on weekends

      const totalConsumption = baseConsumption;

      // Grid pricing (time-of-use)
      let pricePerKwh = electricityRate;
      let priceTier = 'standard';
      if (isMorningPeak || isEveningPeak) {
        pricePerKwh = electricityRate * 1.5;
        priceTier = 'peak';
      } else if (isNight) {
        pricePerKwh = electricityRate * 0.7;
        priceTier = 'off-peak';
      }

      gridPrices.push({
        user_id,
        timestamp: timestamp.toISOString(),
        price_per_kwh: Number(pricePerKwh.toFixed(4)),
        price_tier: priceTier
      });

      // Calculate grid usage
      const gridUsage = Math.max(0, totalConsumption - solarGeneration);
      const solarUsed = Math.min(solarGeneration, totalConsumption);
      const excessSolar = Math.max(0, solarGeneration - totalConsumption);

      // CO2 savings (grid electricity emits ~0.4 kg CO2 per kWh)
      const co2Saved = solarUsed * 0.4;

      co2Data.push({
        user_id,
        timestamp: timestamp.toISOString(),
        solar_kwh: Number(solarUsed.toFixed(3)),
        grid_kwh: Number(gridUsage.toFixed(3)),
        co2_saved_kg: Number(co2Saved.toFixed(3))
      });

      // Solar data
      if (solarGeneration > 0) {
        solarData.push({
          user_id,
          logged_at: timestamp.toISOString(),
          generation_kwh: Number(solarGeneration.toFixed(3)),
          irradiance_wm2: Number(irradiance.toFixed(2))
        });
      }

      // Energy logs for each appliance
      if (appliances && appliances.length > 0) {
        const consumptionPerAppliance = totalConsumption / appliances.length;
        for (const appliance of appliances) {
          energyLogs.push({
            user_id,
            appliance_id: appliance.id,
            logged_at: timestamp.toISOString(),
            consumption_kwh: Number((consumptionPerAppliance * (0.8 + Math.random() * 0.4)).toFixed(3))
          });
        }
      } else {
        // If no appliances, create general consumption log
        energyLogs.push({
          user_id,
          appliance_id: null,
          logged_at: timestamp.toISOString(),
          consumption_kwh: Number(totalConsumption.toFixed(3))
        });
      }

      // Raw energy data
      rawEnergyData.push({
        user_id,
        timestamp: timestamp.toISOString(),
        consumption_kw: Number(totalConsumption.toFixed(3)),
        solar_generation_kw: Number(solarGeneration.toFixed(3)),
        grid_import_kw: Number(gridUsage.toFixed(3)),
        grid_export_kw: Number(excessSolar.toFixed(3)),
        grid_price_per_kwh: Number(pricePerKwh.toFixed(4)),
        data_source: 'simulated'
      });

      // Processed features for ML
      processedFeatures.push({
        user_id,
        timestamp: timestamp.toISOString(),
        hour_of_day: hour,
        day_of_week: dayOfWeek,
        month: month,
        is_weekend: isWeekend,
        temperature_celsius: Number(temperature.toFixed(2)),
        solar_irradiance_wm2: Number(irradiance.toFixed(2)),
        consumption_kw: Number(totalConsumption.toFixed(3)),
        solar_generation_kw: Number(solarGeneration.toFixed(3)),
        net_usage_kw: Number(gridUsage.toFixed(3)),
        cost_usd: Number((gridUsage * pricePerKwh).toFixed(4)),
        efficiency_ratio: solarGeneration > 0 ? Number((solarUsed / solarGeneration).toFixed(3)) : 0,
        appliance_count: appliances?.length || 0
      });
    }

    console.log(`Generated ${energyLogs.length} energy logs, ${solarData.length} solar records`);

    // Insert data in batches to avoid timeouts
    const batchSize = 1000;
    
    // Insert energy logs
    for (let i = 0; i < energyLogs.length; i += batchSize) {
      const batch = energyLogs.slice(i, i + batchSize);
      await supabase.from('energy_logs').insert(batch);
    }

    // Insert solar data
    for (let i = 0; i < solarData.length; i += batchSize) {
      const batch = solarData.slice(i, i + batchSize);
      await supabase.from('solar_data').insert(batch);
    }

    // Insert weather data
    for (let i = 0; i < weatherData.length; i += batchSize) {
      const batch = weatherData.slice(i, i + batchSize);
      await supabase.from('weather_data').insert(batch);
    }

    // Insert grid prices
    for (let i = 0; i < gridPrices.length; i += batchSize) {
      const batch = gridPrices.slice(i, i + batchSize);
      await supabase.from('grid_prices').insert(batch);
    }

    // Insert CO2 data
    for (let i = 0; i < co2Data.length; i += batchSize) {
      const batch = co2Data.slice(i, i + batchSize);
      await supabase.from('co2_tracker').insert(batch);
    }

    // Insert raw energy data
    for (let i = 0; i < rawEnergyData.length; i += batchSize) {
      const batch = rawEnergyData.slice(i, i + batchSize);
      await supabase.from('raw_energy_data').insert(batch);
    }

    // Insert processed features
    for (let i = 0; i < processedFeatures.length; i += batchSize) {
      const batch = processedFeatures.slice(i, i + batchSize);
      await supabase.from('processed_features').insert(batch);
    }

    console.log('Historical data backfill complete!');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully backfilled ${days_back} days of historical data`,
        records_created: {
          energy_logs: energyLogs.length,
          solar_data: solarData.length,
          weather_data: weatherData.length,
          grid_prices: gridPrices.length,
          co2_data: co2Data.length,
          raw_energy_data: rawEnergyData.length,
          processed_features: processedFeatures.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backfill error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
