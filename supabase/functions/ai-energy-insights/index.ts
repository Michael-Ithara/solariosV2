import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://deno.land/x/supabase_js@2.39.7/mod.ts";
import * as ort from "https://deno.land/x/onnxruntime_wasm@1.16.3/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ONNX model lazy loader
let onnxSession: ort.InferenceSession | null = null;
let onnxInitError: string | null = null;

async function getOnnxSession(): Promise<ort.InferenceSession | null> {
  if (onnxSession || onnxInitError) return onnxSession;
  try {
    (ort as any).env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";
    const modelUrl = new URL('./xgboost_energy_model.onnx', import.meta.url);
    const response = await fetch(modelUrl.toString());
    if (!response.ok) throw new Error(`Failed to fetch ONNX model: ${response.statusText}`);
    const modelBytes = new Uint8Array(await response.arrayBuffer());
    onnxSession = await ort.InferenceSession.create(modelBytes, { executionProviders: ['wasm'] });
    console.log('ONNX model loaded');
  } catch (e) {
    onnxInitError = (e as any)?.message ?? String(e);
    console.error('Failed to initialize ONNX model:', onnxInitError);
    onnxSession = null;
  }
  return onnxSession;
}

function buildFeatureVector(d: number, context: any): Float32Array {
  const norm = (v: number, s: number) => (isFinite(v) ? v / (s || 1) : 0);
  const features: number[] = [
    context.avgDailyConsumption, context.avgDailySolar, context.netUsage,
    norm(context.peakHour ?? 0, 23), context.occupants,
    typeof context.homeSize === 'number' ? norm(context.homeSize, 3000) : 0,
    context.solarCapacity, context.batteryCapacity, context.electricityRate, context.growthRate,
    new Date().getMonth() / 11, [0,6].includes(new Date().getDay()) ? 1 : 0,
  ];
  if (features.length < d) while (features.length < d) features.push(0);
  else if (features.length > d) features.length = d;
  return new Float32Array(features);
}

async function runOnnxPrediction(context: any): Promise<number | null> {
  const session = await getOnnxSession();
  if (!session) return null;
  try {
    const inputName = session.inputNames[0];
    const meta = session.inputMetadata[inputName as keyof typeof session.inputMetadata];
    const dims = (meta as any)?.dimensions ?? [1, 12];
    const d = Math.max(1, (dims.length === 1 ? dims[0] : dims[dims.length - 1]) || 12);
    const inputTensor = new ort.Tensor('float32', buildFeatureVector(d, context), dims.length === 1 ? [d] : [1, d]);
    const output = await session.run({ [inputName]: inputTensor });
    const data: any = (output[session.outputNames[0]] as any)?.data ?? [];
    const val = Array.isArray(data) ? data[0] : Number(data?.[0] ?? NaN);
    return typeof val === 'number' && isFinite(val) ? val : null;
  } catch (e) {
    console.error('ONNX inference failed:', e);
    return null;
  }
}

// Nudge Templates with 4-Part Structure
interface NudgeTemplate {
  scenario: string;
  actionVerb: string;
  specificItem: (ctx: any) => string;
  contextWhen: (ctx: any) => string;
  benefitWhy: (ctx: any) => string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

const nudgeTemplates: NudgeTemplate[] = [
  {
    scenario: 'peak_shift', actionVerb: 'Shift',
    specificItem: (ctx) => ctx.flexibleAppliances || 'your dishwasher and laundry',
    contextWhen: (ctx) => `away from ${ctx.peakHour}:00 to off-peak hours`,
    benefitWhy: (ctx) => `You'll save ${ctx.savingsCurrency?.toLocaleString('en-US', { style: 'currency', currency: ctx.currency || 'USD' })} this month`,
    category: 'behavior', priority: 'high'
  },
  {
    scenario: 'appliance_upgrade', actionVerb: 'Replace',
    specificItem: (ctx) => `your ${ctx.applianceName}`,
    contextWhen: (ctx) => 'with an energy-efficient model',
    benefitWhy: (ctx) => `It will save ${ctx.savingsCurrency?.toLocaleString('en-US', { style: 'currency', currency: ctx.currency || 'USD' })} every month`,
    category: 'appliance', priority: 'medium'
  },
  {
    scenario: 'lights_off', actionVerb: 'Turn off',
    specificItem: (ctx) => `the ${ctx.roomName || 'living room'} light`,
    contextWhen: (ctx) => 'when you leave',
    benefitWhy: (ctx) => `It wastes ${ctx.savingsCurrency?.toLocaleString('en-US', { style: 'currency', currency: ctx.currency || 'USD' })} a month`,
    category: 'behavior', priority: 'low'
  },
  {
    scenario: 'solar_timing', actionVerb: 'Run',
    specificItem: (ctx) => ctx.applianceName || 'your dishwasher',
    contextWhen: (ctx) => 'during midday',
    benefitWhy: (ctx) => 'Your solar panels generate the most power then',
    category: 'solar', priority: 'medium'
  },
  {
    scenario: 'thermostat_adjust', actionVerb: 'Lower',
    specificItem: (ctx) => 'your heat',
    contextWhen: (ctx) => `by ${ctx.degrees || 2} degrees tonight`,
    benefitWhy: (ctx) => `You'll save ${ctx.savingsCurrency?.toLocaleString('en-US', { style: 'currency', currency: ctx.currency || 'USD' })} this week`,
    category: 'behavior', priority: 'high'
  },
  {
    scenario: 'solar_optimization', actionVerb: 'Charge',
    specificItem: (ctx) => 'your battery',
    contextWhen: (ctx) => 'during peak solar hours (11 AM - 2 PM)',
    benefitWhy: (ctx) => `You'll use ${ctx.savingsCurrency?.toLocaleString('en-US', { style: 'currency', currency: ctx.currency || 'USD' })} less grid power this month`,
    category: 'solar', priority: 'high'
  },
];

const renderNudge = (template: NudgeTemplate, context: any): string => {
  return `${template.actionVerb} ${template.specificItem(context)} ${template.contextWhen(context)}. ${template.benefitWhy(context)}.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const userId = user.id;

    // Fetch data
    const [energyLogsRes, solarDataRes, appliancesRes, profileRes, weatherRes, gridPriceRes] = await Promise.all([
      supabase.from('energy_logs').select('*').eq('user_id', userId)
        .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: false }).limit(200),
      supabase.from('solar_data').select('*').eq('user_id', userId)
        .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('logged_at', { ascending: false }).limit(200),
      supabase.from('appliances').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('weather_data').select('*').order('timestamp', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('grid_prices').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(1).maybeSingle()
    ]);

    const energyLogs: any[] = energyLogsRes.data || [];
    const solarData: any[] = solarDataRes.data || [];
    const appliances: any[] = appliancesRes.data || [];
    const profile: any = profileRes.data;
    const currentWeather: any = weatherRes.data;

    const currentHour = new Date().getHours();
    const isDaytime = currentHour >= 6 && currentHour <= 18;

    // Analytics
    const totalConsumption = energyLogs.reduce((sum, log) => sum + log.consumption_kwh, 0);
    const avgDailyConsumption = totalConsumption / 30;
    const totalSolarGeneration = solarData.reduce((sum, data) => sum + data.generation_kwh, 0);
    const avgDailySolar = totalSolarGeneration / 30;
    const netUsage = totalConsumption - totalSolarGeneration;
    
    const hourlyUsage: Record<number, number> = energyLogs.reduce((acc, log) => {
      const hour = new Date(log.logged_at).getHours();
      acc[hour] = (acc[hour] || 0) + log.consumption_kwh;
      return acc;
    }, {});
    
    const peakHour = Object.entries(hourlyUsage).sort(([,a], [,b]) => (b as number) - (a as number))[0];
    
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
      monthlyCost: parseFloat((totalConsumption * (profile?.electricity_rate || 0.12)).toFixed(2))
    };

    const rate = analysisData.profile.electricityRate || 0.12;
    const currency = profile?.currency || 'USD';

    // Growth rate calculation
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;
    const sumInRange = (logs: any[], start: number, end: number) =>
      logs.filter((l) => {
        const t = new Date(l.logged_at).getTime();
        return t >= start && t < end;
      }).reduce((s, l) => s + (Number(l.consumption_kwh) || 0), 0);

    const firstHalf = sumInRange(energyLogs, thirtyDaysAgo, fifteenDaysAgo);
    const secondHalf = sumInRange(energyLogs, fifteenDaysAgo, now);
    let growthRate = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;
    growthRate = Math.max(-0.15, Math.min(0.15, growthRate));

    // Forecast
    let nextMonthConsumptionFinal = Math.max(0, parseFloat(((analysisData.usage.avgDailyConsumption || 0) * 30 * (1 + growthRate)).toFixed(2)));
    let nextMonthSolarFinal = Math.max(0, parseFloat(((analysisData.usage.avgDailySolar || 0) * 30 * (1 + growthRate * 0.5)).toFixed(2)));
    
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
    }

    const nextMonthCostFinal = parseFloat((nextMonthConsumptionFinal * rate).toFixed(2));

    // Insights
    const insights: any[] = [];
    if (analysisData.usage.peakUsageHour !== null) {
      insights.push({
        title: `Peak usage around ${String(analysisData.usage.peakUsageHour).padStart(2, '0')}:00`,
        category: 'usage',
        description: `You spent the most money between 4 PM and 6 PM. Consider shifting usage to off-peak hours.`,
        impact: 'high'
      });
    }

    // Helper with fallback
    const predictSavings = async (scenario: string, contextModifications: any, nudgeContext: any = {}): Promise<any | null> => {
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
        growthRate: 0,
      };

      let predictedDaily = await runOnnxPrediction(modifiedContext);
      let confidence: 'high' | 'medium' | 'low' = 'high';
      
      if (predictedDaily === null) {
        console.log(`ML prediction failed for ${scenario}, using heuristic fallback`);
        confidence = 'medium';
        const heuristicSavings: Record<string, number> = {
          'peak_shift': 0.10, 'appliance_upgrade': 0.30, 'solar_optimization': 0.15,
          'behavior_change': 0.08, 'thermostat_adjust': 0.12, 'lights_off': 0.05,
          'solar_timing': 0.12,
        };
        const savingFactor = heuristicSavings[scenario] || 0.05;
        predictedDaily = baselineDaily * (1 - savingFactor);
      }
      
      const savingsDaily = Math.max(0, baselineDaily - predictedDaily);
      const savingsMonthly = parseFloat((savingsDaily * 30).toFixed(2));
      const savingsCurrency = parseFloat((savingsMonthly * rate).toFixed(2));

      const template = nudgeTemplates.find(t => t.scenario === scenario);
      if (!template) return null;
      
      const ctx = { ...nudgeContext, savingsKwh: savingsMonthly, savingsCurrency, currency };
      const nudge = renderNudge(template, ctx);
      
      return {
        savingsKwh: savingsMonthly,
        savingsCurrency,
        nudge,
        verb: template.actionVerb,
        category: template.category,
        confidence
      };
    };

    const recommendations: any[] = [];

    // Peak shift
    if (analysisData.usage.peakUsageHour !== null && analysisData.usage.peakUsageAmount && analysisData.usage.peakUsageAmount > 2) {
      const savingsResult = await predictSavings('peak_shift', {
        usage: {
          avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.90,
          peakUsageHour: (analysisData.usage.peakUsageHour + 6) % 24,
        }
      }, { flexibleAppliances: 'your dishwasher and laundry', peakHour: analysisData.usage.peakUsageHour, currency });
      if (savingsResult && savingsResult.savingsKwh > 3) {
        recommendations.push({
          title: `${savingsResult.verb} high-consumption tasks`,
          description: savingsResult.nudge,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: savingsResult.savingsCurrency > 10 ? 'high' : 'medium',
          category: savingsResult.category,
          confidence: savingsResult.confidence,
        });
      }
    }

    // Appliance upgrade
    const inefficientAppliances = appliances.filter((app: any) => app.power_rating_w > 1500);
    if (inefficientAppliances.length > 0) {
      const topInefficient = inefficientAppliances[0];
      const savingsResult = await predictSavings('appliance_upgrade', {
        usage: { avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.70 }
      }, { applianceName: topInefficient.name.toLowerCase(), currency });
      if (savingsResult && savingsResult.savingsKwh > 5) {
        recommendations.push({
          title: `${savingsResult.verb} your ${topInefficient.name.toLowerCase()}`,
          description: savingsResult.nudge,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: savingsResult.savingsCurrency > 20 ? 'high' : 'medium',
          category: savingsResult.category,
          confidence: savingsResult.confidence,
        });
      }
    }

    // Solar timing
    if ((analysisData.profile.solarCapacity || 0) > 0 && isDaytime) {
      const dishwasher = appliances.find((a: any) => a.name.toLowerCase().includes('dishwasher'));
      if (dishwasher) {
        const savingsResult = await predictSavings('solar_timing', {
          usage: { avgDailyConsumption: analysisData.usage.avgDailyConsumption, netUsage: analysisData.usage.netUsage * 0.88 }
        }, { applianceName: 'your dishwasher', currency });
        if (savingsResult) {
          recommendations.push({
            title: `${savingsResult.verb} dishwasher during solar peak`,
            description: savingsResult.nudge,
            expected_savings_kwh: savingsResult.savingsKwh,
            expected_savings_currency: savingsResult.savingsCurrency,
            priority: 'medium',
            category: savingsResult.category,
            confidence: savingsResult.confidence,
          });
        }
      }
    }

    // Thermostat
    const hasThermostat = appliances.some((a: any) => a.name.toLowerCase().includes('thermostat'));
    if (currentWeather && currentWeather.temperature > 28 && hasThermostat) {
      const savingsResult = await predictSavings('thermostat_adjust', {
        usage: { avgDailyConsumption: analysisData.usage.avgDailyConsumption * 0.88 }
      }, { degrees: 2, currency });
      if (savingsResult && savingsResult.savingsKwh > 3) {
        recommendations.push({
          title: `${savingsResult.verb} your heat`,
          description: savingsResult.nudge,
          expected_savings_kwh: savingsResult.savingsKwh,
          expected_savings_currency: savingsResult.savingsCurrency,
          priority: savingsResult.savingsCurrency > 15 ? 'high' : 'medium',
          category: savingsResult.category,
          confidence: savingsResult.confidence,
        });
      }
    }

    // Sort recommendations
    recommendations.sort((a, b) => {
      const priorityOrder: any = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expected_savings_currency - a.expected_savings_currency;
    });

    // Store recommendations
    if (recommendations.length > 0) {
      await supabase.from('ai_recommendations').delete().eq('user_id', userId);
      const recsToStore = recommendations.map(rec => ({
        user_id: userId, title: rec.title, description: rec.description,
        expected_savings_kwh: rec.expected_savings_kwh,
        expected_savings_currency: rec.expected_savings_currency,
        priority: rec.priority, category: rec.category,
        confidence: rec.confidence || 'medium',
      }));
      await supabase.from('ai_recommendations').insert(recsToStore);
    }

    // Store forecast
    await supabase.from('ai_forecast').delete().eq('user_id', userId);
    await supabase.from('ai_forecast').insert({
      user_id: userId,
      next_month_consumption_kwh: nextMonthConsumptionFinal,
      next_month_solar_generation_kwh: nextMonthSolarFinal,
      next_month_cost: nextMonthCostFinal,
      forecast_model: 'xgboost-energy-v1',
    });

    return new Response(JSON.stringify({
      insights,
      recommendations,
      forecast: {
        nextMonthConsumption: nextMonthConsumptionFinal,
        nextMonthSolarGeneration: nextMonthSolarFinal,
        nextMonthCost: nextMonthCostFinal,
      },
      analytics: {
        totalAnalyzed: energyLogs.length + solarData.length,
        patterns: [`Peak usage hour: ${analysisData.usage.peakUsageHour ?? 'N/A'}`]
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error in ai-energy-insights:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
