import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Required environment variables are missing');
    }

    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user's energy data for analysis
    const [energyLogsRes, solarDataRes, appliancesRes, profileRes] = await Promise.all([
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
        .single()
    ]);

    const energyLogs = energyLogsRes.data || [];
    const solarData = solarDataRes.data || [];
    const appliances = appliancesRes.data || [];
    const profile = profileRes.data;

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
    
    const peakHour = Object.entries(hourlyUsage).sort(([,a], [,b]) => b - a)[0];
    
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
        peakUsageAmount: peakHour ? parseFloat(peakHour[1].toFixed(2)) : null
      },
      appliances: applianceUsage,
      monthlyCost: parseFloat((totalConsumption * (profile?.electricity_rate || 0.12)).toFixed(2))
    };

    // Generate AI insights and recommendations
    const aiPrompt = `
Analyze this home energy usage data and provide personalized insights and recommendations:

${JSON.stringify(analysisData, null, 2)}

Please provide:
1. 3-5 specific energy efficiency recommendations with estimated savings in kWh and currency
2. 2-3 key insights about their energy usage patterns
3. Energy forecast for next month based on current trends
4. Priority level for each recommendation (high, medium, low)

Format your response as a JSON object with this structure:
{
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed description",
      "category": "usage_pattern" | "efficiency" | "cost" | "solar"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description with actionable steps",
      "expectedSavingsKwh": number,
      "expectedSavingsCurrency": number,
      "priority": "high" | "medium" | "low",
      "category": "appliance" | "solar" | "battery" | "behavior"
    }
  ],
  "forecast": {
    "nextMonthConsumption": number,
    "nextMonthCost": number,
    "nextMonthSolar": number,
    "confidence": "high" | "medium" | "low"
  }
}`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert energy efficiency consultant. Analyze energy data and provide actionable, personalized recommendations. Always provide realistic estimates and practical advice.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    const aiResult = await openAIResponse.json();
    const analysisResult = JSON.parse(aiResult.choices[0].message.content);

    // Store recommendations in database
    const recommendationsToStore = analysisResult.recommendations.map((rec: any) => ({
      user_id: userId,
      title: rec.title,
      description: rec.description,
      expected_savings_kwh: rec.expectedSavingsKwh,
      expected_savings_currency: rec.expectedSavingsCurrency,
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
          model: 'gpt-4.1-2025-04-14'
        },
        {
          user_id: userId,
          target: 'generation',
          value: analysisResult.forecast.nextMonthSolar,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          model: 'gpt-4.1-2025-04-14'
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
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});