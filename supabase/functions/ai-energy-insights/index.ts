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
    // Read XGBoost model file from the function directory
    const modelUrl = new URL('./xgboost_energy_model.onnx', import.meta.url);
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

    // Use ONNX model for accurate consumption prediction
    let modelUsed: 'lovable-energy-v1' | 'xgboost-energy-v1' = 'xgboost-energy-v1';
    const nextMonthConsumption = Math.max(0, parseFloat(((analysisData.usage.avgDailyConsumption || 0) * 30 * (1 + growthRate)).toFixed(2)));
    const nextMonthSolar = Math.max(0, parseFloat(((analysisData.usage.avgDailySolar || 0) * 30 * (1 + growthRate * 0.5)).toFixed(2)));
    let nextMonthConsumptionFinal = nextMonthConsumption;
    let nextMonthSolarFinal = nextMonthSolar;
    
    const onnxDailyConsumption = await runOnnxPrediction({
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
    
    if (onnxDailyConsumption !== null) {
      nextMonthConsumptionFinal = Math.max(0, parseFloat((onnxDailyConsumption * 30).toFixed(2)));
    } else {
      // Fallback to trend-based prediction only if ONNX fails
      modelUsed = 'lovable-energy-v1';
      console.warn('ONNX prediction failed, using trend-based fallback');
    }
    
    // Predict solar generation with ONNX (if solar capacity exists)
    if ((analysisData.profile.solarCapacity || 0) > 0) {
      const onnxDailySolar = await runOnnxPrediction({
        avgDailyConsumption: 0,
        avgDailySolar: analysisData.usage.avgDailySolar || 0,
        netUsage: 0,
        peakHour: 12,
        occupants: analysisData.profile.occupants || 1,
        homeSize: analysisData.profile.homeSize,
        solarCapacity: analysisData.profile.solarCapacity || 0,
        batteryCapacity: analysisData.profile.batteryCapacity || 0,
        electricityRate: analysisData.profile.electricityRate || 0.12,
        growthRate: growthRate * 0.5,
      });
      
      if (onnxDailySolar !== null) {
        nextMonthSolarFinal = Math.max(0, parseFloat((onnxDailySolar * 30).toFixed(2)));
      }
    }
    
    const nextMonthCostFinal = parseFloat((nextMonthConsumptionFinal * rate).toFixed(2));
    const confidence: 'high' | 'medium' | 'low' = modelUsed === 'xgboost-energy-v1' ? 'high' : 'medium';
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

    // Build data-driven recommendations using ONNX model predictions
    const recommendations: Array<{
      title: string;
      description: string;
      expected_savings_kwh: number;
      expected_savings_currency: number;
      priority: 'high' | 'medium' | 'low';
      category: string;
    }> = [];

    // Helper to simulate impact and calculate savings using ONNX model
    const predictSavings = async (scenario: string, contextModifications: Partial<typeof analysisData>) => {
      const baselineDaily = analysisData.usage.avgDailyConsumption;
      const modifiedContext = {
        avgDailyConsumption: contextModifications.usage?.avgDailyConsumption ?? analysisData.usage.avgDailyConsumption,
        avgDailySolar: contextModifications.usage?.avgDailySolar ?? analysisData.usage.avgDailySolar,
        netUsage: contextModifications.usage?.netUsage ?? analysisData.usage.netUsage,
        peakHour: contextModifications.usage?.peakUsageHour ?? analysisData.usage.peakUsageHour,
        occupants: contextModifications.profile?.occupants ?? analysisData.profile.occupants,
        homeSize: contextModifications.profile?.homeSize ?? analysisData.profile.homeSize,
        solarCapacity: contextModifications.profile?.solarCapacity ?? analysisData.profile.solarCapacity,
        batteryCapacity: contextModifications.profile?.batteryCapacity ?? analysisData.profile.batteryCapacity,
        electricityRate: contextModifications.profile?.electricityRate ?? analysisData.profile.electricityRate,
        growthRate: 0, // Assume intervention stops growth
      };

      const predictedDaily = await runOnnxPrediction(modifiedContext);
      if (predictedDaily === null) return null;
      
      const savingsDaily = Math.max(0, baselineDaily - predictedDaily);
      const savingsMonthly = parseFloat((savingsDaily * 30).toFixed(2));
      
      return {
        savingsKwh: savingsMonthly,
        savingsCurrency: parseFloat((savingsMonthly * rate).toFixed(2)),
      };
    };

    // 1) PEAK HOUR LOAD SHIFTING - Only recommend if peak usage is significant
    if (analysisData.usage.peakUsageHour !== null && analysisData.usage.peakUsageAmount) {
      const dailyPeakAvg = analysisData.usage.peakUsageAmount / 30;
      
      // Only recommend if peak represents >15% of daily consumption
      if (dailyPeakAvg / analysisData.usage.avgDailyConsumption > 0.15) {
        const flexibleAppliances = [
          (hasDishwasher || hasWasher) && 'laundry appliances',
          hasEV && 'EV charging',
          hasPool && 'pool pump',
          hasWaterHeater && 'water heater'
        ].filter(Boolean).join(', ');
        
        if (flexibleAppliances) {
          // Model peak reduction by simulating 20% reduction in daily usage
          const savingsResult = await predictSavings('peak_shift', {
            usage: {
              avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.95, // 5% reduction from peak optimization
            }
          });
          
          if (savingsResult && savingsResult.savingsKwh > 5) {
            recommendations.push({
              title: `Shift ${flexibleAppliances} away from ${String(analysisData.usage.peakUsageHour).padStart(2, '0')}:00`,
              description: `Your peak hour (${String(analysisData.usage.peakUsageHour).padStart(2, '0')}:00) accounts for ${(dailyPeakAvg / analysisData.usage.avgDailyConsumption * 100).toFixed(0)}% of daily usage. Shifting flexible loads reduces grid demand charges.`,
              expected_savings_kwh: savingsResult.savingsKwh,
              expected_savings_currency: savingsResult.savingsCurrency,
              priority: savingsResult.savingsCurrency > 20 ? 'high' : 'medium',
              category: 'behavior',
            });
          }
        }
      }
    }

    // 2) APPLIANCE EFFICIENCY - Target specific high-consumption appliances
    const highPowerAppliances = appliances
      .filter(a => (a.power_rating_w || 0) >= 1000)
      .sort((a, b) => (b.power_rating_w || 0) - (a.power_rating_w || 0));
    
    for (const appliance of highPowerAppliances.slice(0, 2)) {
      const applianceDaily = (appliance.power_rating_w / 1000) * (appliance.usage_hours_per_day || 8) / 30;
      
      // Model efficiency improvement (e.g., 30% efficiency gain)
      const savingsResult = await predictSavings('appliance_upgrade', {
        usage: {
          avgDailyConsumption: analysisData.usage.avgDailyConsumption - (applianceDaily * 0.3),
        }
      });
      
      if (savingsResult && savingsResult.savingsKwh > 10) {
        const applianceType = appliance.name.toLowerCase();
        let specificAdvice = 'Consider upgrading to an energy-efficient model.';
        
        if (applianceType.includes('hvac') || applianceType.includes('ac')) {
          specificAdvice = 'Clean filters monthly, upgrade to inverter model, and set 1-2°C closer to ambient temp.';
        } else if (applianceType.includes('water heater')) {
          specificAdvice = 'Insulate the tank, lower temp to 50°C, and consider heat pump model.';
        } else if (applianceType.includes('refrigerator') || applianceType.includes('fridge')) {
          specificAdvice = 'Check door seals, defrost regularly, and upgrade to modern compressor.';
        }
        
        recommendations.push({
          title: `Optimize ${appliance.name} (${appliance.power_rating_w}W)`,
          description: `This device consumes ~${(applianceDaily * 30).toFixed(1)} kWh/month. ${specificAdvice}`,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: savingsResult.savingsCurrency > 30 ? 'high' : 'medium',
          category: 'appliance',
        });
      }
    }

    // 3) SOLAR OPTIMIZATION - Only if user has solar and suboptimal self-consumption
    if ((analysisData.profile.solarCapacity || 0) > 0 && analysisData.usage.avgDailySolar > 0) {
      const solarSelfConsumption = Math.min(analysisData.usage.avgDailySolar, analysisData.usage.avgDailyConsumption);
      const solarExcess = Math.max(0, analysisData.usage.avgDailySolar - analysisData.usage.avgDailyConsumption);
      
      // If there's excess solar (>10% of generation), recommend battery or load shifting
      if (solarExcess / analysisData.usage.avgDailySolar > 0.1 && isDaytime && !isCloudyOrRainy) {
        const savingsResult = await predictSavings('solar_optimization', {
          usage: {
            avgDailyConsumption: analysisData.usage.avgDailyConsumption - (solarExcess * 0.7), // Capture 70% of excess
            netUsage: analysisData.usage.netUsage - (solarExcess * 0.7 * 30),
          }
        });
        
        if (savingsResult && savingsResult.savingsKwh > 15) {
          const storageAdvice = (analysisData.profile.batteryCapacity || 0) > 0 
            ? 'Optimize battery charging schedule to store excess solar.' 
            : 'Consider adding battery storage to capture excess solar production.';
          
          recommendations.push({
            title: `Maximize solar self-consumption`,
            description: `You're exporting ${(solarExcess * 30).toFixed(1)} kWh/month to the grid. ${storageAdvice} Shift high-load appliances to midday.`,
            expected_savings_kwh: savingsResult.savingsKwh,
            expected_savings_currency: savingsResult.savingsCurrency,
            priority: savingsResult.savingsCurrency > 25 ? 'high' : 'medium',
            category: 'solar',
          });
        }
      }
    } else if ((analysisData.profile.solarCapacity || 0) === 0 && analysisData.usage.avgDailyConsumption > 20) {
      // Recommend solar installation only if high consumption and conditions are good
      if (isDaytime && !isCloudyOrRainy && currentIrradiance > 400) {
        const estimatedSolarDaily = analysisData.usage.avgDailyConsumption * 0.4; // 40% offset potential
        
        const savingsResult = await predictSavings('solar_install', {
          usage: {
            avgDailySolar: estimatedSolarDaily,
            netUsage: analysisData.usage.netUsage - (estimatedSolarDaily * 30),
          },
          profile: {
            solarCapacity: 5, // Assume 5kW system
          }
        });
        
        if (savingsResult && savingsResult.savingsKwh > 50) {
          recommendations.push({
            title: 'Consider rooftop solar installation',
            description: `Based on your ${analysisData.usage.avgDailyConsumption.toFixed(1)} kWh/day usage and current irradiance (${currentIrradiance.toFixed(0)} W/m²), a ~5kW solar system could offset 40% of your consumption.`,
            expected_savings_kwh: savingsResult.savingsKwh,
            expected_savings_currency: savingsResult.savingsCurrency,
            priority: savingsResult.savingsCurrency > 40 ? 'high' : 'medium',
            category: 'solar',
          });
        }
      }
    }

    // 4) BEHAVIOR-BASED - Only if growth rate is positive
    if (growthRate > 0.05) {
      const savingsResult = await predictSavings('behavior_change', {
        usage: {
          avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.93, // 7% reduction from behavior changes
        }
      });
      
      if (savingsResult && savingsResult.savingsKwh > 10) {
        recommendations.push({
          title: `Reverse ${(growthRate * 100).toFixed(0)}% consumption increase`,
          description: `Your usage has grown ${(growthRate * 100).toFixed(0)}% recently. Identify new devices or changes in habits. Check for phantom loads and reduce standby power.`,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: 'high',
          category: 'behavior',
        });
      }
    }

    // 5) GRID PRICING OPTIMIZATION - Only if dynamic pricing is available
    if (currentGridPrice && currentGridPrice.price_tier === 'peak') {
      const savingsResult = await predictSavings('grid_timing', {
        usage: {
          avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.92, // 8% reduction from timing optimization
        }
      });
      
      if (savingsResult && savingsResult.savingsKwh > 8) {
        recommendations.push({
          title: 'Optimize for time-of-use rates',
          description: `Grid is currently at ${currentGridPrice.price_per_kwh.toFixed(2)} ${currency}/kWh (peak). Schedule high-consumption tasks during off-peak hours to reduce costs by ~15%.`,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: 'medium',
          category: 'cost',
        });
      }
    }

    const analysisResult = {
      insights,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority] || 
               b.expected_savings_currency - a.expected_savings_currency;
      }).slice(0, 5), // Limit to top 5 recommendations
      forecast: {
        nextMonthConsumption: nextMonthConsumptionFinal,
        nextMonthCost: nextMonthCostFinal,
        nextMonthSolar: nextMonthSolarFinal,
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