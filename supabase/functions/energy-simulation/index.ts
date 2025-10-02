import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate realistic energy data based on current time and weather
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Generate solar production (realistic curve based on time of day)
    let solarGeneration = 0;
    if (hour >= 6 && hour <= 18) {
      const dayProgress = (hour - 6) / 12;
      const solarCurve = Math.sin(dayProgress * Math.PI);
      // Random cloud effects
      const cloudFactor = 0.7 + (Math.random() * 0.3);
      solarGeneration = Math.max(0, solarCurve * 8 * cloudFactor); // Max 8kW system
    }

    // Generate realistic consumption patterns
    let baseConsumption = 0.5; // 500W baseline
    
    // Morning peak
    if (hour >= 6 && hour <= 9) {
      baseConsumption += 2 + (Math.random() * 1.5);
    }
    // Evening peak
    else if (hour >= 17 && hour <= 22) {
      baseConsumption += 3 + (Math.random() * 2);
    }
    // Daytime
    else if (hour >= 9 && hour <= 17) {
      baseConsumption += 1 + (Math.random() * 1);
    }
    // Night
    else {
      baseConsumption += Math.random() * 0.5;
    }

    // Add some random variation
    const consumption = baseConsumption + (Math.random() - 0.5) * 0.5;

    // Calculate cost (simple time-of-use pricing)
    let gridPrice = 0.12; // Base price per kWh
    if (hour >= 16 && hour <= 20) {
      gridPrice = 0.25; // Peak pricing
    } else if (hour >= 9 && hour <= 16) {
      gridPrice = 0.15; // Mid-peak
    }

    // Insert demo energy log
    const { error: energyError } = await supabase
      .from('demo_energy_logs')
      .insert({
        consumption_kwh: consumption,
        appliance_name: 'Simulation',
        logged_at: now.toISOString()
      });

    if (energyError) console.error('Energy log error:', energyError);

    // Insert demo solar data
    const { error: solarError } = await supabase
      .from('demo_solar_data')
      .insert({
        generation_kwh: solarGeneration,
        irradiance_wm2: Math.max(0, solarGeneration * 125), // Rough conversion
        logged_at: now.toISOString()
      });

    if (solarError) console.error('Solar data error:', solarError);

    // Generate alerts based on conditions
    const netUsage = consumption - solarGeneration;
    const currentCost = netUsage * gridPrice;

    // High usage alert
    if (consumption > 6) {
      await supabase
        .from('demo_alerts')
        .insert({
          title: 'High Energy Usage Detected',
          message: `Current consumption is ${consumption.toFixed(1)} kW - consider reducing usage during peak hours.`,
          severity: 'warning'
        });
    }

    // Peak pricing alert
    if (hour >= 16 && hour <= 20 && netUsage > 3) {
      await supabase
        .from('demo_alerts')
        .insert({
          title: 'Peak Pricing Active',
          message: `You're drawing ${netUsage.toFixed(1)} kW during peak hours. Consider using stored solar energy.`,
          severity: 'info'
        });
    }

    // Excellent solar production
    if (solarGeneration > 6) {
      await supabase
        .from('demo_alerts')
        .insert({
          title: 'Excellent Solar Production',
          message: `Your solar panels are generating ${solarGeneration.toFixed(1)} kW - perfect conditions for energy storage!`,
          severity: 'info'
        });
    }

    // Clean up old demo data (keep last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    await Promise.all([
      supabase
        .from('demo_energy_logs')
        .delete()
        .lt('logged_at', oneDayAgo.toISOString()),
      supabase
        .from('demo_solar_data')
        .delete()
        .lt('logged_at', oneDayAgo.toISOString()),
      supabase
        .from('demo_alerts')
        .delete()
        .lt('created_at', oneDayAgo.toISOString())
    ]);

    const response = {
      success: true,
      timestamp: now.toISOString(),
      data: {
        consumption: consumption,
        solarGeneration: solarGeneration,
        netUsage: netUsage,
        gridPrice: gridPrice,
        currentCost: currentCost,
        weather: {
          temperature: 20 + Math.sin(hour / 24 * 2 * Math.PI) * 8 + (Math.random() - 0.5) * 3,
          cloudCover: Math.max(0, Math.min(1, 0.3 + (Math.random() - 0.5) * 0.4)),
          condition: hour >= 6 && hour <= 18 ? 'sunny' : 'clear'
        }
      }
    };

    console.log('Simulation data generated:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in energy-simulation function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
