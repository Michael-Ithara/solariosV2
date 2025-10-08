import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as ort from "https://esm.sh/onnxruntime-web@1.18.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ONNX model lazy loader (global across invocations)
let onnxSession: ort.InferenceSession | null = null;
let onnxInitError: string | null = null;

async function getOnnxSession(): Promise<ort.InferenceSession | null> {
  if (onnxSession || onnxInitError) return onnxSession;
  try {
    // Configure wasm paths to CDN
    // deno-lint-ignore no-explicit-any
    (ort as any).env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";
    // Read model file from the function directory
    const modelUrl = new URL('./daily_energy_model.onnx', import.meta.url);
    const modelBytes = await Deno.readFile(modelUrl);
    onnxSession = await ort.InferenceSession.create(modelBytes, { executionProviders: ['wasm'] });
    console.log('ONNX model loaded:', onnxSession?.inputNames, onnxSession?.outputNames);
  } catch (e) {
    onnxInitError = (e as any)?.message ?? String(e);
    console.error('Failed to initialize ONNX model:', onnxInitError);
    onnxSession = null;
  }
  return onnxSession;
}

function buildFeatureVector(d: number, context: {
  avgDailyConsumption: number;
  avgDailySolar: number;
  netUsage: number;
  peakHour: number | null;
  occupants: number;
  homeSize: number | 'unknown';
  solarCapacity: number;
  batteryCapacity: number;
  electricityRate: number;
  growthRate: number;
}): Float32Array {
  const norm = (v: number, s: number) => (isFinite(v) ? v / (s || 1) : 0);
  const features: number[] = [
    context.avgDailyConsumption,
    context.avgDailySolar,
    context.netUsage,
    norm(context.peakHour ?? 0, 23),
    context.occupants,
    typeof context.homeSize === 'number' ? norm(context.homeSize, 3000) : 0,
    context.solarCapacity,
    context.batteryCapacity,
    context.electricityRate,
    context.growthRate,
    // temporal features
    new Date().getMonth() / 11,
    [0,6].includes(new Date().getDay()) ? 1 : 0,
  ];
  // Pad or trim to match expected length
  if (features.length < d) {
    while (features.length < d) features.push(0);
  } else if (features.length > d) {
    features.length = d;
  }
  return new Float32Array(features);
}

async function runOnnxPrediction(context: any): Promise<number | null> {
  const session = await getOnnxSession();
  if (!session) return null;
  try {
    const inputName = session.inputNames[0];
    // Find feature dimension (assume [1, d] or [d])
    const meta = session.inputMetadata[inputName as keyof typeof session.inputMetadata];
    const dims = (meta as any)?.dimensions ?? [1, 12];
    const d = Math.max(1, (dims.length === 1 ? dims[0] : dims[dims.length - 1]) || 12);
    const inputTensor = new ort.Tensor('float32', buildFeatureVector(d, context), dims.length === 1 ? [d] : [1, d]);
    const output = await session.run({ [inputName]: inputTensor });
    const outName = session.outputNames[0];
    const outTensor = output[outName];
    // deno-lint-ignore no-explicit-any
    const data: any = (outTensor as any)?.data ?? [];
    const val = Array.isArray(data) ? data[0] : (typeof data?.[0] === 'number' ? data[0] : Number(data?.[0] ?? NaN));
    return typeof val === 'number' && isFinite(val) ? val : null;
  } catch (e) {
    console.error('ONNX inference failed:', e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Required environment variables are missing');
    }

    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's energy data for analysis from unified tables
    const [energyLogsRes, solarDataRes, appliancesRes, profileRes, weatherRes, gridPriceRes] = await Promise.all([
      supabase
        .from('energy_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('logged_at', { ascending: false })
        .limit(200),
      supabase
        .from('solar_data')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: false })
        .limit(200),
      supabase
        .from('appliances')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('weather_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('grid_prices')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    const energyLogs = energyLogsRes.data || [];
    const solarData = solarDataRes.data || [];
    const appliances = appliancesRes.data || [];
    const profile = profileRes.data;
    const currentWeather = weatherRes.data;
    const currentGridPrice = gridPriceRes.data;

    // Contextual validation helpers
    const currentHour = new Date().getHours();
    const isDaytime = currentHour >= 6 && currentHour <= 18;
    const isNighttime = !isDaytime;
    const isCloudyOrRainy = currentWeather?.weather_condition && 
      ['cloudy', 'rainy', 'overcast'].includes(currentWeather.weather_condition.toLowerCase());
    const currentIrradiance = currentWeather?.solar_irradiance_wm2 || 0;

    // Calculate analytics for AI analysis
    const totalConsumption = energyLogs.reduce((sum, log) => sum + log.consumption_kwh, 0);
    const avgDailyConsumption = totalConsumption / 30;
    const totalSolarGeneration = solarData.reduce((sum, data) => sum + data.generation_kwh, 0);
    const avgDailySolar = totalSolarGeneration / 30;
    const netUsage = totalConsumption - totalSolarGeneration;
    
    // Peak usage analysis
    const hourlyUsage = energyLogs.reduce((acc, log) => {
      const hour = new Date(log.logged_at).getHours();
      acc[hour] = (acc[hour] || 0) + log.consumption_kwh;
      return acc;
    }, {} as Record<number, number>);
    
    const peakHour = Object.entries(hourlyUsage).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
    // Appliance efficiency analysis
    const applianceUsage = appliances.map(app => ({
      name: app.name,
      power: app.power_rating_w,
      efficiency: app.power_rating_w > 0 ? (app.total_kwh / 30) / (app.power_rating_w / 1000) : 0
    }));

    // Prepare data for AI analysis
    const analysisData = {
      profile: {
        homeSize: profile?.home_size_sqft || 'unknown',
        occupants: profile?.occupants || 1,
        solarCapacity: profile?.solar_panel_capacity || 0,
        batteryCapacity: profile?.battery_capacity || 0,
        electricityRate: profile?.electricity_rate || 0.12
      },
      usage: {
        avgDailyConsumption: parseFloat(avgDailyConsumption.toFixed(2)),
        avgDailySolar: parseFloat(avgDailySolar.toFixed(2)),
        netUsage: parseFloat(netUsage.toFixed(2)),
        peakUsageHour: peakHour ? parseInt(peakHour[0]) : null,
        peakUsageAmount: peakHour ? parseFloat((peakHour[1] as number).toFixed(2)) : null
      },
      appliances: applianceUsage,
      monthlyCost: parseFloat((totalConsumption * (profile?.electricity_rate || 0.12)).toFixed(2))
    };

    // Generate insights using built-in rule-based engine (no external APIs)
    const rate = analysisData.profile.electricityRate || 0.12;

    // Compute 15-day usage trend
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;

    const sumInRange = (logs: any[], start: number, end: number) =>
      logs
        .filter((l) => {
          const t = new Date(l.logged_at).getTime();
          return t >= start && t < end;
        })
        .reduce((s, l) => s + (Number(l.consumption_kwh) || 0), 0);

    const firstHalf = sumInRange(energyLogs, thirtyDaysAgo, fifteenDaysAgo);
    const secondHalf = sumInRange(energyLogs, fifteenDaysAgo, now);
    let growthRate = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
    growthRate = Math.max(-0.15, Math.min(0.15, growthRate));

    const nextMonthConsumption = Math.max(0, parseFloat(((analysisData.usage.avgDailyConsumption || 0) * 30 * (1 + growthRate)).toFixed(2)));
    const nextMonthSolar = Math.max(0, parseFloat(((analysisData.usage.avgDailySolar || 0) * 30 * (1 + growthRate * 0.5)).toFixed(2)));
    const nextMonthCost = parseFloat((nextMonthConsumption * rate).toFixed(2));
    const confidence: 'high' | 'medium' | 'low' =
      Math.abs(growthRate) < 0.05 ? 'high' : Math.abs(growthRate) < 0.1 ? 'medium' : 'low';

    // Try ONNX model for monthly consumption prediction (via daily prediction * 30)
    let modelUsed: 'lovable-energy-v1' | 'onnx-daily-energy-v1' = 'lovable-energy-v1';
    let nextMonthConsumptionFinal = nextMonthConsumption;
    try {
      const onnxDaily = await runOnnxPrediction({
        avgDailyConsumption: analysisData.usage.avgDailyConsumption || 0,
        avgDailySolar: analysisData.usage.avgDailySolar || 0,
        netUsage: analysisData.usage.netUsage || 0,
        peakHour: analysisData.usage.peakUsageHour,
        occupants: analysisData.profile.occupants || 1,
        homeSize: analysisData.profile.homeSize,
        solarCapacity: analysisData.profile.solarCapacity || 0,
        batteryCapacity: analysisData.profile.batteryCapacity || 0,
        electricityRate: analysisData.profile.electricityRate || 0.12,
        growthRate,
      });
      if (onnxDaily !== null) {
        nextMonthConsumptionFinal = Math.max(0, parseFloat((onnxDaily * 30).toFixed(2)));
        modelUsed = 'onnx-daily-energy-v1';
      }
    } catch (_) { /* no-op */ }
    const nextMonthCostFinal = parseFloat((nextMonthConsumptionFinal * rate).toFixed(2));
    // Build insights
    const insights = [] as Array<{ title: string; description: string; category: 'usage_pattern' | 'efficiency' | 'cost' | 'solar' }>;    
    if (analysisData.usage.peakUsageHour !== null) {
      const dailyPeakAvg = analysisData.usage.peakUsageAmount ? parseFloat((analysisData.usage.peakUsageAmount / 30).toFixed(2)) : null;
      insights.push({
        title: `Peak usage around ${String(analysisData.usage.peakUsageHour).padStart(2, '0')}:00`,
        description: dailyPeakAvg ? `This hour averages ~${dailyPeakAvg} kWh/day. Consider shifting flexible loads.` : `Consider shifting flexible loads away from this hour.`,
        category: 'usage_pattern',
      });
    }

    const currency = profile?.currency || 'USD';
    insights.push({
      title: 'Monthly energy cost estimate',
      description: `Based on recent usage, your monthly cost is approximately ${nextMonthCostFinal.toLocaleString(undefined, { style: 'currency', currency })}.`,
      category: 'cost',
    });

    // Contextual validation: only show solar insights during daytime or if solar is present
    if (analysisData.usage.avgDailySolar > 0) {
      const solarPercentage = Math.round((analysisData.usage.avgDailySolar / (analysisData.usage.avgDailyConsumption || 1)) * 100);
      insights.push({
        title: 'Solar contribution',
        description: `Solar covers ~${solarPercentage}% of daily usage on average.`,
        category: 'solar',
      });
    }

    // Add weather-contextual insight
    if (currentWeather && isDaytime) {
      const irradianceQuality = currentIrradiance > 700 ? 'excellent' : currentIrradiance > 400 ? 'good' : 'moderate';
      insights.push({
        title: 'Current solar conditions',
        description: `Irradiance at ${currentIrradiance.toFixed(0)} W/m² (${irradianceQuality}). ${isCloudyOrRainy ? 'Cloud cover reducing solar output.' : 'Good conditions for solar generation.'}`,
        category: 'solar',
      });
    }

    // Add grid pricing insight
    if (currentGridPrice) {
      insights.push({
        title: 'Current grid price',
        description: `Grid electricity at ${currentGridPrice.price_per_kwh.toFixed(2)} ${currency}/kWh (${currentGridPrice.price_tier} rate). ${currentGridPrice.price_tier === 'peak' ? 'Consider reducing usage or shifting to solar.' : 'Good time for grid usage.'}`,
        category: 'cost',
      });
    }

    if (appliances.length > 0) {
      const top = [...appliances].sort((a, b) => (b.power_rating_w || 0) - (a.power_rating_w || 0))[0];
      insights.push({
        title: `High-load device: ${top.name}`,
        description: `Rated at ${top.power_rating_w}W. Scheduling or upgrading this device can reduce bills.`,
        category: 'efficiency',
      });
    }

    // Build appliance-specific context
    const applianceNames = (appliances || []).map(a => a.name.toLowerCase());
    const hasHVAC = applianceNames.some(n => n.includes('hvac') || n.includes('ac') || n.includes('thermostat') || n.includes('air'));
    const hasWaterHeater = applianceNames.some(n => n.includes('water') && n.includes('heater'));
    const hasPool = applianceNames.some(n => n.includes('pool'));
    const hasEV = applianceNames.some(n => n.includes('ev') || n.includes('charger') || n.includes('electric vehicle'));
    const hasDishwasher = applianceNames.some(n => n.includes('dishwasher'));
    const hasWasher = applianceNames.some(n => n.includes('washer') || n.includes('laundry'));

    // Build recommendations (snake_case fields as expected by the app)
    const recommendations: Array<{
      title: string;
      description: string;
      expected_savings_kwh: number;
      expected_savings_currency: number;
      priority: 'high' | 'medium' | 'low';
      category: string;
    }> = [];

    // 1) Peak shifting - only if user has flexible appliances
    if (analysisData.usage.peakUsageAmount && (hasDishwasher || hasWasher || hasEV)) {
      const dailyPeakAvg = analysisData.usage.peakUsageAmount / 30;
      const savingsKwh = parseFloat((dailyPeakAvg * 0.2 * 30).toFixed(2)); // 20% of peak hour load
      const flexibleAppliances = [
        hasDishwasher && 'dishwasher',
        hasWasher && 'laundry',
        hasEV && 'EV charging'
      ].filter(Boolean).join(', ');
      
      recommendations.push({
        title: 'Shift peak-hour usage',
        description: `Run ${flexibleAppliances} outside your peak hour to cut demand charges and reduce grid stress.`,
        expected_savings_kwh: savingsKwh,
        expected_savings_currency: parseFloat((savingsKwh * rate).toFixed(2)),
        priority: 'high',
        category: 'behavior',
      });
    }

    // 2) Standby load reduction
    const standbyKwh = parseFloat((totalConsumption * 0.03).toFixed(2)); // ~3% conservative
    recommendations.push({
      title: 'Eliminate standby loads',
      description: 'Use smart plugs or power strips to fully turn off TVs, game consoles, and chargers when not in use.',
      expected_savings_kwh: standbyKwh,
      expected_savings_currency: parseFloat((standbyKwh * rate).toFixed(2)),
      priority: standbyKwh > 10 ? 'medium' : 'low',
      category: 'behavior',
    });

    // 3) Appliance upgrade target
    const inefficient = appliances
      .filter((a) => (a.power_rating_w || 0) >= 1500)
      .sort((a, b) => (b.power_rating_w || 0) - (a.power_rating_w || 0))[0];
    if (inefficient) {
      const savingsKwh = parseFloat(((inefficient.power_rating_w / 1000) * 0.3 * 30).toFixed(2)); // estimate 30% savings if upgraded
      recommendations.push({
        title: `Upgrade or tune ${inefficient.name}`,
        description: 'Consider a high-efficiency model or maintenance (clean filters, descale).',
        expected_savings_kwh: savingsKwh,
        expected_savings_currency: parseFloat((savingsKwh * rate).toFixed(2)),
        priority: 'medium',
        category: 'appliance',
      });
    }

    // 4) Solar optimization or install assessment (contextual validation)
    if ((analysisData.profile.solarCapacity || 0) > 0) {
      const extraSelfUseKwh = parseFloat((Math.max(0, analysisData.usage.avgDailySolar - 0.5) * 0.1 * 30).toFixed(2));
      // Only recommend solar optimization if conditions make sense (not at night, not heavily cloudy)
      if (extraSelfUseKwh > 0 && !isNighttime) {
        recommendations.push({
          title: 'Improve solar self-consumption',
          description: 'Time flexible loads during midday and consider a small battery to store excess.',
          expected_savings_kwh: extraSelfUseKwh,
          expected_savings_currency: parseFloat((extraSelfUseKwh * rate).toFixed(2)),
          priority: 'low',
          category: 'solar',
        });
      }
    } else if (isDaytime && !isCloudyOrRainy) {
      // Only recommend solar installation during daytime with good weather
      const solarKwh = parseFloat(((analysisData.usage.avgDailyConsumption || 0) * 0.25 * 30).toFixed(2));
      recommendations.push({
        title: 'Assess rooftop solar feasibility',
        description: 'Based on usage, a modest solar system could offset ~25% of your consumption.',
        expected_savings_kwh: solarKwh,
        expected_savings_currency: parseFloat((solarKwh * rate).toFixed(2)),
        priority: 'medium',
        category: 'solar',
      });
    }

    // Add HVAC recommendation only if user has HVAC
    if (hasHVAC && recommendations.length < 5) {
      const hvacKwh = parseFloat((totalConsumption * 0.05).toFixed(2));
      recommendations.push({
        title: 'Optimize HVAC settings',
        description: 'Set thermostat 1-2°C closer to ambient and use scheduled setbacks.',
        expected_savings_kwh: hvacKwh,
        expected_savings_currency: parseFloat((hvacKwh * rate).toFixed(2)),
        priority: 'high',
        category: 'behavior',
      });
    }

    // Add water heater recommendation only if user has water heater
    if (hasWaterHeater && recommendations.length < 5) {
      const waterHeaterKwh = parseFloat((totalConsumption * 0.04).toFixed(2));
      recommendations.push({
        title: 'Schedule water heater',
        description: 'Set timer to heat water during off-peak hours or when solar is abundant.',
        expected_savings_kwh: waterHeaterKwh,
        expected_savings_currency: parseFloat((waterHeaterKwh * rate).toFixed(2)),
        priority: 'medium',
        category: 'behavior',
      });
    }

    // Add pool recommendation only if user has pool
    if (hasPool && recommendations.length < 5) {
      const poolKwh = parseFloat((totalConsumption * 0.06).toFixed(2));
      recommendations.push({
        title: 'Optimize pool pump schedule',
        description: 'Run pool pump during solar peak hours (midday) instead of overnight.',
        expected_savings_kwh: poolKwh,
        expected_savings_currency: parseFloat((poolKwh * rate).toFixed(2)),
        priority: 'medium',
        category: 'behavior',
      });
    }

    // Generic recommendations if still need more
    if (recommendations.length < 3) {
      const lightingKwh = parseFloat((totalConsumption * 0.03).toFixed(2));
      recommendations.push({
        title: 'Upgrade to LED lighting',
        description: 'Replace remaining incandescent bulbs with LEDs for 75% energy savings.',
        expected_savings_kwh: lightingKwh,
        expected_savings_currency: parseFloat((lightingKwh * rate).toFixed(2)),
        priority: 'low',
        category: 'upgrade',
      });
    }

    const analysisResult = {
      insights,
      recommendations,
      forecast: {
        nextMonthConsumption: nextMonthConsumptionFinal,
        nextMonthCost: nextMonthCostFinal,
        nextMonthSolar,
        confidence,
      },
    };

    // Store recommendations in database
    const recommendationsToStore = analysisResult.recommendations.map((rec: any) => ({
      user_id: userId,
      title: rec.title,
      description: rec.description,
      expected_savings_kwh: rec.expected_savings_kwh,
      expected_savings_currency: rec.expected_savings_currency,
      priority: rec.priority
    }));

    // Clear old recommendations and insert new ones
    await supabase
      .from('ai_recommendations')
      .delete()
      .eq('user_id', userId);

    if (recommendationsToStore.length > 0) {
      await supabase
        .from('ai_recommendations')
        .insert(recommendationsToStore);
    }

    // Store forecast data
    await supabase
      .from('ai_forecasts')
      .delete()
      .eq('user_id', userId)
      .eq('target', 'consumption');

    await supabase
      .from('ai_forecasts')
      .insert([
        {
          user_id: userId,
          target: 'consumption',
          value: analysisResult.forecast.nextMonthConsumption,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
           model: modelUsed
        },
        {
          user_id: userId,
          target: 'generation',
          value: analysisResult.forecast.nextMonthSolar,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          model: 'lovable-energy-v1'
        }
      ]);

    console.log(`Generated ${analysisResult.recommendations.length} recommendations for user ${userId}`);

    return new Response(JSON.stringify({
      success: true,
      insights: analysisResult.insights,
      recommendations: analysisResult.recommendations,
      forecast: analysisResult.forecast,
      analytics: analysisData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-energy-insights function:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});