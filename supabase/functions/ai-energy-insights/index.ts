import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://deno.land/x/supabase_js@2.39.7/mod.ts";
import * as ort from "https://deno.land/x/onnxruntime_wasm@1.16.3/mod.ts";

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
    const response = await fetch(modelUrl.toString());
    if (!response.ok) throw new Error(`Failed to fetch ONNX model: ${response.statusText}`);
    const modelBytes = new Uint8Array(await response.arrayBuffer());
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

interface Profile {
  home_size_sqft: number | 'unknown';
  occupants: number;
  solar_panel_capacity: number;
  battery_capacity: number;
  electricity_rate: number;
  currency?: string;
}

interface Usage {
  avgDailyConsumption: number;
  avgDailySolar: number;
  netUsage: number;
  peakUsageHour: number | null;
  peakUsageAmount: number | null;
}

interface Appliance {
  name: string;
  power_rating_w: number;
  total_kwh: number;
  usage_hours_per_day?: number;
}

interface WeatherData {
  weather_condition?: string;
  solar_irradiance_wm2?: number;
}

interface GridPrice {
  price_per_kwh: number;
  price_tier: string;
}

interface Insight {
  title: string;
  description: string;
  category: 'usage_pattern' | 'efficiency' | 'cost' | 'solar';
}

interface Recommendation {
  title: string;
  description: string;
  expected_savings_kwh: number;
  expected_savings_currency: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface AnalysisData {
  profile: {
    homeSize: number | 'unknown';
    occupants: number;
    solarCapacity: number;
    batteryCapacity: number;
    electricityRate: number;
  };
  usage: Usage;
  appliances: Array<{
    name: string;
    power: number;
    efficiency: number;
  }>;
  monthlyCost: number;
}

interface AnalysisResult {
  insights: Insight[];
  recommendations: Recommendation[];
  forecast: {
    nextMonthConsumption: number;
    nextMonthCost: number;
    nextMonthSolar: number;
    confidence: 'high' | 'medium' | 'low';
  };
}

serve(async (req: Request): Promise<Response> => {
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

    const { userId }: { userId: string } = await req.json();
    
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

    const energyLogs: any[] = energyLogsRes.data || [];
    const solarData: any[] = solarDataRes.data || [];
    const appliances: Appliance[] = appliancesRes.data || [];
    const profile: Profile | null = profileRes.data;
    const currentWeather: WeatherData | null = weatherRes.data;
    const currentGridPrice: GridPrice | null = gridPriceRes.data;

    // Contextual validation helpers
    const currentHour: number = new Date().getHours();
    const isDaytime: boolean = currentHour >= 6 && currentHour <= 18;
    const isNighttime: boolean = !isDaytime;
    const isCloudyOrRainy: boolean = !!(currentWeather?.weather_condition && 
      ['cloudy', 'rainy', 'overcast'].includes(currentWeather.weather_condition.toLowerCase()));
    const currentIrradiance: number = currentWeather?.solar_irradiance_wm2 || 0;

    // Calculate analytics for AI analysis
    const totalConsumption: number = energyLogs.reduce((sum: number, log: any) => sum + log.consumption_kwh, 0);
    const avgDailyConsumption: number = totalConsumption / 30;
    const totalSolarGeneration: number = solarData.reduce((sum: number, data: any) => sum + data.generation_kwh, 0);
    const avgDailySolar: number = totalSolarGeneration / 30;
    const netUsage: number = totalConsumption - totalSolarGeneration;
    
    // Peak usage analysis
    const hourlyUsage: Record<number, number> = energyLogs.reduce((acc: Record<number, number>, log: any) => {
      const hour = new Date(log.logged_at).getHours();
      acc[hour] = (acc[hour] || 0) + log.consumption_kwh;
      return acc;
    }, {});
    
    const peakHour: [string, number] | undefined = Object.entries(hourlyUsage).sort(([,a]: [any, any], [,b]: [any, any]) => (b as number) - (a as number))[0];
    
    // Appliance efficiency analysis
    const applianceUsage: Array<{ name: string; power: number; efficiency: number }> = appliances.map((app: Appliance) => ({
      name: app.name,
      power: app.power_rating_w,
      efficiency: app.power_rating_w > 0 ? (app.total_kwh / 30) / (app.power_rating_w / 1000) : 0
    }));

    // Prepare data for AI analysis
    const analysisData: AnalysisData = {
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
    const rate: number = analysisData.profile.electricityRate || 0.12;

    // Compute 15-day usage trend
    const now: number = Date.now();
    const thirtyDaysAgo: number = now - 30 * 24 * 60 * 60 * 1000;
    const fifteenDaysAgo: number = now - 15 * 24 * 60 * 60 * 1000;

    const sumInRange = (logs: any[], start: number, end: number): number =>
      logs
        .filter((l: any) => {
          const t = new Date(l.logged_at).getTime();
          return t >= start && t < end;
        })
        .reduce((s: number, l: any) => s + (Number(l.consumption_kwh) || 0), 0);

    const firstHalf: number = sumInRange(energyLogs, thirtyDaysAgo, fifteenDaysAgo);
    const secondHalf: number = sumInRange(energyLogs, fifteenDaysAgo, now);
    let growthRate: number = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
    growthRate = Math.max(-0.15, Math.min(0.15, growthRate));

    // Use ONNX model for accurate consumption prediction
    let modelUsed: 'lovable-energy-v1' | 'xgboost-energy-v1' = 'xgboost-energy-v1';
    const nextMonthConsumption: number = Math.max(0, parseFloat(((analysisData.usage.avgDailyConsumption || 0) * 30 * (1 + growthRate)).toFixed(2)));
    const nextMonthSolar: number = Math.max(0, parseFloat(((analysisData.usage.avgDailySolar || 0) * 30 * (1 + growthRate * 0.5)).toFixed(2)));
    let nextMonthConsumptionFinal: number = nextMonthConsumption;
    let nextMonthSolarFinal: number = nextMonthSolar;
    
    const onnxDailyConsumption: number | null = await runOnnxPrediction({
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
      const onnxDailySolar: number | null = await runOnnxPrediction({
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
    
    const nextMonthCostFinal: number = parseFloat((nextMonthConsumptionFinal * rate).toFixed(2));
    const confidence: 'high' | 'medium' | 'low' = modelUsed === 'xgboost-energy-v1' ? 'high' : 'medium';
    // Build insights
    const insights: Insight[] = [];    
    if (analysisData.usage.peakUsageHour !== null) {
      const dailyPeakAvg: number | null = analysisData.usage.peakUsageAmount ? parseFloat((analysisData.usage.peakUsageAmount / 30).toFixed(2)) : null;
      insights.push({
        title: `Peak usage around ${String(analysisData.usage.peakUsageHour).padStart(2, '0')}:00`,
        description: dailyPeakAvg ? `This hour averages ~${dailyPeakAvg} kWh/day. Consider shifting flexible loads.` : `Consider shifting flexible loads away from this hour.`,
        category: 'usage_pattern',
      });
    }

    const currency: string = profile?.currency || 'USD';
    insights.push({
      title: 'Monthly energy cost estimate',
      description: `Based on recent usage, your monthly cost is approximately ${nextMonthCostFinal.toLocaleString(undefined, { style: 'currency', currency })}.`,
      category: 'cost',
    });

    // Contextual validation: only show solar insights during daytime or if solar is present
    if (analysisData.usage.avgDailySolar > 0) {
      const solarPercentage: number = Math.round((analysisData.usage.avgDailySolar / (analysisData.usage.avgDailyConsumption || 1)) * 100);
      insights.push({
        title: 'Solar contribution',
        description: `Solar covers ~${solarPercentage}% of daily usage on average.`,
        category: 'solar',
      });
    }

    // Add weather-contextual insight
    if (currentWeather && isDaytime) {
      const irradianceQuality: string = currentIrradiance > 700 ? 'excellent' : currentIrradiance > 400 ? 'good' : 'moderate';
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
      const top: Appliance = [...appliances].sort((a, b) => (b.power_rating_w || 0) - (a.power_rating_w || 0))[0];
      insights.push({
        title: `High-load device: ${top.name}`,
        description: `Rated at ${top.power_rating_w}W. Scheduling or upgrading this device can reduce bills.`,
        category: 'efficiency',
      });
    }

    // Build appliance-specific context
    const applianceNames: string[] = (appliances || []).map((a: Appliance) => a.name.toLowerCase());
    const hasHVAC: boolean = applianceNames.some((n: string) => n.includes('hvac') || n.includes('ac') || n.includes('thermostat') || n.includes('air'));
    const hasWaterHeater: boolean = applianceNames.some((n: string) => n.includes('water') && n.includes('heater'));
    const hasPool: boolean = applianceNames.some((n: string) => n.includes('pool'));
    const hasEV: boolean = applianceNames.some((n: string) => n.includes('ev') || n.includes('charger') || n.includes('electric vehicle'));
    const hasDishwasher: boolean = applianceNames.some((n: string) => n.includes('dishwasher'));
    const hasWasher: boolean = applianceNames.some((n: string) => n.includes('washer') || n.includes('laundry'));


    // --- Actionable Recommendation Mapping Layer ---
    type NudgeTemplate = {
      scenario: string;
      template: (ctx: any) => string;
      verb: string;
      category: string;
    };

    // Add/modify templates here for easy scaling
    const nudgeTemplates: NudgeTemplate[] = [
      {
        scenario: 'peak_shift',
        verb: 'Shift',
        category: 'behavior',
        template: (ctx) => `Shift your ${ctx.flexibleAppliances} away from ${ctx.peakHour}:00 to save up to ${ctx.savingsCurrency.toLocaleString(undefined, { style: 'currency', currency: ctx.currency })} this month.`
      },
      {
        scenario: 'appliance_upgrade',
        verb: 'Upgrade',
        category: 'appliance',
        template: (ctx) => `Upgrade your ${ctx.applianceName} to an energy-efficient model this week to save about ${ctx.savingsCurrency.toLocaleString(undefined, { style: 'currency', currency: ctx.currency })} every month.`
      },
      {
        scenario: 'solar_optimization',
        verb: 'Use',
        category: 'solar',
        template: (ctx) => `Use more of your solar power by running high-load appliances at midday. This could save you ${ctx.savingsCurrency.toLocaleString(undefined, { style: 'currency', currency: ctx.currency })} monthly.`
      },
      {
        scenario: 'solar_install',
        verb: 'Install',
        category: 'solar',
        template: (ctx) => `Install rooftop solar to offset up to 40% of your usage and save about ${ctx.savingsCurrency.toLocaleString(undefined, { style: 'currency', currency: ctx.currency })} per month.`
      },
      {
        scenario: 'behavior_change',
        verb: 'Reduce',
        category: 'behavior',
        template: (ctx) => `Reduce your energy use by unplugging unused devices and turning off lights to save ${ctx.savingsCurrency.toLocaleString(undefined, { style: 'currency', currency: ctx.currency })} this month.`
      },
      {
        scenario: 'grid_timing',
        verb: 'Schedule',
        category: 'cost',
        template: (ctx) => `Schedule high-consumption tasks for off-peak hours to cut your bill by up to 15% and save ${ctx.savingsCurrency.toLocaleString(undefined, { style: 'currency', currency: ctx.currency })}.`
      },
    ];

    // Helper to simulate impact and calculate savings using ONNX model
    const predictSavings = async (
      scenario: string, 
      contextModifications: Partial<{
        usage: Partial<Usage>;
        profile: Partial<AnalysisData['profile']>;
      }>,
      nudgeContext: any = {}
    ): Promise<{ savingsKwh: number; savingsCurrency: number; nudge: string; verb: string; category: string } | null> => {
      const baselineDaily: number = analysisData.usage.avgDailyConsumption;
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

      const predictedDaily: number | null = await runOnnxPrediction(modifiedContext);
      if (predictedDaily === null) return null;
      const savingsDaily: number = Math.max(0, baselineDaily - predictedDaily);
      const savingsMonthly: number = parseFloat((savingsDaily * 30).toFixed(2));
      const savingsCurrency = parseFloat((savingsMonthly * rate).toFixed(2));

      // Find template for this scenario
      const template = nudgeTemplates.find(t => t.scenario === scenario);
      if (!template) return null;
      const ctx = { ...nudgeContext, savingsKwh: savingsMonthly, savingsCurrency, currency };
      return {
        savingsKwh: savingsMonthly,
        savingsCurrency,
        nudge: template.template(ctx),
        verb: template.verb,
        category: template.category,
      };
    };

    // --- End Mapping Layer ---

    const recommendations: Recommendation[] = [];

    // 1) PEAK HOUR LOAD SHIFTING - Only recommend if peak usage is significant
    if (analysisData.usage.peakUsageHour !== null && analysisData.usage.peakUsageAmount) {
      const dailyPeakAvg: number = analysisData.usage.peakUsageAmount / 30;
      if (dailyPeakAvg / analysisData.usage.avgDailyConsumption > 0.15) {
        const flexibleAppliances: string = [
          (hasDishwasher || hasWasher) && 'laundry appliances',
          hasEV && 'EV charging',
          hasPool && 'pool pump',
          hasWaterHeater && 'water heater'
        ].filter(Boolean).join(', ');
        if (flexibleAppliances) {
          const savingsResult = await predictSavings('peak_shift', {
            usage: {
              avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.95,
            }
          }, {
            flexibleAppliances,
            peakHour: String(analysisData.usage.peakUsageHour).padStart(2, '0'),
            currency
          });
          if (savingsResult && savingsResult.savingsKwh > 5) {
            recommendations.push({
              title: `${savingsResult.verb} ${flexibleAppliances} (peak hour)`,
              description: savingsResult.nudge,
              expected_savings_kwh: savingsResult.savingsKwh,
              expected_savings_currency: savingsResult.savingsCurrency,
              priority: savingsResult.savingsCurrency > 20 ? 'high' : 'medium',
              category: savingsResult.category,
            });
          }
        }
      }
    }

    // 2) APPLIANCE EFFICIENCY - Target specific high-consumption appliances
    const highPowerAppliances: Appliance[] = appliances
      .filter((a: Appliance) => (a.power_rating_w || 0) >= 1000)
      .sort((a: Appliance, b: Appliance) => (b.power_rating_w || 0) - (a.power_rating_w || 0));
    
    for (const appliance of highPowerAppliances.slice(0, 2)) {
      const applianceDaily: number = (appliance.power_rating_w / 1000) * (appliance.usage_hours_per_day || 8) / 30;
      const savingsResult = await predictSavings('appliance_upgrade', {
        usage: {
          avgDailyConsumption: analysisData.usage.avgDailyConsumption - (applianceDaily * 0.3),
        }
      }, {
        applianceName: appliance.name,
        currency
      });
      if (savingsResult && savingsResult.savingsKwh > 10) {
        recommendations.push({
          title: `${savingsResult.verb} ${appliance.name}`,
          description: savingsResult.nudge,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: savingsResult.savingsCurrency > 30 ? 'high' : 'medium',
          category: savingsResult.category,
        });
      }
    }

    // 3) SOLAR OPTIMIZATION - Only if user has solar and suboptimal self-consumption
    if ((analysisData.profile.solarCapacity || 0) > 0 && analysisData.usage.avgDailySolar > 0) {
      const solarSelfConsumption: number = Math.min(analysisData.usage.avgDailySolar, analysisData.usage.avgDailyConsumption);
      const solarExcess: number = Math.max(0, analysisData.usage.avgDailySolar - analysisData.usage.avgDailyConsumption);
      if (solarExcess / analysisData.usage.avgDailySolar > 0.1 && isDaytime && !isCloudyOrRainy) {
        const savingsResult = await predictSavings('solar_optimization', {
          usage: {
            avgDailyConsumption: analysisData.usage.avgDailyConsumption - (solarExcess * 0.7),
            netUsage: analysisData.usage.netUsage - (solarExcess * 0.7 * 30),
          }
        }, {
          currency
        });
        if (savingsResult && savingsResult.savingsKwh > 15) {
          recommendations.push({
            title: `${savingsResult.verb} more solar at home`,
            description: savingsResult.nudge,
            expected_savings_kwh: savingsResult.savingsKwh,
            expected_savings_currency: savingsResult.savingsCurrency,
            priority: savingsResult.savingsCurrency > 25 ? 'high' : 'medium',
            category: savingsResult.category,
          });
        }
      }
    } else if ((analysisData.profile.solarCapacity || 0) === 0 && analysisData.usage.avgDailyConsumption > 20) {
      if (isDaytime && !isCloudyOrRainy && currentIrradiance > 400) {
        const estimatedSolarDaily: number = analysisData.usage.avgDailyConsumption * 0.4;
        const savingsResult = await predictSavings('solar_install', {
          usage: {
            avgDailySolar: estimatedSolarDaily,
            netUsage: analysisData.usage.netUsage - (estimatedSolarDaily * 30),
          },
          profile: {
            solarCapacity: 5,
          }
        }, {
          currency
        });
        if (savingsResult && savingsResult.savingsKwh > 50) {
          recommendations.push({
            title: `${savingsResult.verb} solar panels`,
            description: savingsResult.nudge,
            expected_savings_kwh: savingsResult.savingsKwh,
            expected_savings_currency: savingsResult.savingsCurrency,
            priority: savingsResult.savingsCurrency > 40 ? 'high' : 'medium',
            category: savingsResult.category,
          });
        }
      }
    }

    // 4) BEHAVIOR-BASED - Only if growth rate is positive
    if (growthRate > 0.05) {
      const savingsResult = await predictSavings('behavior_change', {
        usage: {
          avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.93,
        }
      }, {
        currency
      });
      if (savingsResult && savingsResult.savingsKwh > 10) {
        recommendations.push({
          title: `${savingsResult.verb} energy use`,
          description: savingsResult.nudge,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: 'high',
          category: savingsResult.category,
        });
      }
    }

    // 5) GRID PRICING OPTIMIZATION - Only if dynamic pricing is available
    if (currentGridPrice && currentGridPrice.price_tier === 'peak') {
      const savingsResult = await predictSavings('grid_timing', {
        usage: {
          avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.92,
        }
      }, {
        currency
      });
      if (savingsResult && savingsResult.savingsKwh > 8) {
        recommendations.push({
          title: `${savingsResult.verb} tasks for off-peak`,
          description: savingsResult.nudge,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: 'medium',
          category: savingsResult.category,
        });
      }
    }

    const analysisResult: AnalysisResult = {
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
    const recommendationsToStore = analysisResult.recommendations.map((rec: Recommendation) => ({
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