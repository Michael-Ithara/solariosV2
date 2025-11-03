import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AchievementCriteria {
  code: string;
  checkFn: (userId: string, supabase: any) => Promise<{ met: boolean; progress: number }>;
}

const CO2_PER_KWH = 0.233; // kg CO₂ per kWh

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userIds: string[] = [];

    // Allow manual trigger with userId
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.userId) {
          userIds = [body.userId];
          console.log('Manual trigger for user:', body.userId);
        }
      } catch (e) {
        // Not JSON, continue to get all users
      }
    }

    // If no manual trigger, get all users with simulation or iot data source
    if (userIds.length === 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .in('data_source', ['simulation', 'iot']);

      if (!profiles) {
        console.log('No profiles found');
        return new Response(JSON.stringify({ processed: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userIds = profiles.map(p => p.user_id);
    }

    console.log(`Processing ${userIds.length} users`);

    for (const userId of userIds) {

      // Process CO₂ tracking
      await processCO2Tracking(userId, supabase);

      // Check and unlock achievements
      await checkAchievements(userId, supabase);
    }

    return new Response(
      JSON.stringify({ success: true, processed: userIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processCO2Tracking(userId: string, supabase: any) {
  // Get today's energy data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: energyData } = await supabase
    .from('real_time_energy_data')
    .select('solar_production_kw, grid_usage_kw')
    .eq('user_id', userId)
    .gte('timestamp', today.toISOString())
    .order('timestamp', { ascending: false });

  if (!energyData || energyData.length === 0) return;

  // Calculate daily totals
  const solarKwh = energyData.reduce((sum, d) => sum + (d.solar_production_kw || 0), 0) / 6; // 10-min intervals
  const gridKwh = energyData.reduce((sum, d) => sum + (d.grid_usage_kw || 0), 0) / 6;
  const co2SavedKg = solarKwh * CO2_PER_KWH;

  // Check if already tracked today
  const { data: existing } = await supabase
    .from('co2_tracker')
    .select('id')
    .eq('user_id', userId)
    .gte('timestamp', today.toISOString())
    .single();

  if (!existing) {
    await supabase.from('co2_tracker').insert({
      user_id: userId,
      timestamp: new Date().toISOString(),
      solar_kwh: solarKwh,
      grid_kwh: gridKwh,
      co2_saved_kg: co2SavedKg,
    });
  }
}

async function checkAchievements(userId: string, supabase: any) {
const criteria: AchievementCriteria[] = [
    {
      code: 'eco_starter',
      checkFn: async (uid, sb) => {
        // Reduced grid use by 10%
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const { data: recent } = await sb
          .from('real_time_energy_data')
          .select('grid_usage_kw')
          .eq('user_id', uid)
          .gte('timestamp', yesterday.toISOString())
          .order('timestamp', { ascending: false })
          .limit(144); // Last 24 hours at 10-min intervals

        if (!recent || recent.length < 100) return { met: false, progress: 0 };

        const avgRecent = recent.slice(0, 72).reduce((sum, d) => sum + d.grid_usage_kw, 0) / 72;
        const avgOld = recent.slice(72).reduce((sum, d) => sum + d.grid_usage_kw, 0) / 72;
        
        const reduction = avgOld > 0 ? ((avgOld - avgRecent) / avgOld) * 100 : 0;
        return { met: reduction >= 10, progress: Math.min(Math.floor(reduction), 10) };
      },
    },
    {
      code: 'solar_hero',
      checkFn: async (uid, sb) => {
        // 80% solar reliance
        const { data } = await sb
          .from('real_time_energy_data')
          .select('consumption_kw, solar_production_kw')
          .eq('user_id', uid)
          .order('timestamp', { ascending: false })
          .limit(72); // Last 12 hours

        if (!data || data.length === 0) return { met: false, progress: 0 };

        const totalConsumption = data.reduce((sum, d) => sum + d.consumption_kw, 0);
        const totalSolar = data.reduce((sum, d) => sum + d.solar_production_kw, 0);
        
        const solarPercent = totalConsumption > 0 ? (totalSolar / totalConsumption) * 100 : 0;
        return { met: solarPercent >= 80, progress: Math.min(Math.floor(solarPercent), 80) };
      },
    },
    {
      code: 'power_producer',
      checkFn: async (uid, sb) => {
        // Generate 10+ kWh solar in a day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data } = await sb
          .from('solar_data')
          .select('generation_kwh')
          .eq('user_id', uid)
          .gte('logged_at', today.toISOString());

        if (!data) return { met: false, progress: 0 };

        const totalGeneration = data.reduce((sum, d) => sum + d.generation_kwh, 0);
        return { met: totalGeneration >= 10, progress: Math.min(Math.floor(totalGeneration), 10) };
      },
    },
    {
      code: 'first_day',
      checkFn: async (uid, sb) => {
        // Has any energy data
        const { data } = await sb
          .from('real_time_energy_data')
          .select('id')
          .eq('user_id', uid)
          .limit(1);

        return { met: !!data && data.length > 0, progress: data && data.length > 0 ? 1 : 0 };
      },
    },
    {
      code: 'week_warrior',
      checkFn: async (uid, sb) => {
        // Check dashboard 7 days in a row (check if they have data for 7 consecutive days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data } = await sb
          .from('energy_logs')
          .select('logged_at')
          .eq('user_id', uid)
          .gte('logged_at', weekAgo.toISOString())
          .order('logged_at', { ascending: true });

        if (!data || data.length === 0) return { met: false, progress: 0 };

        // Count unique days with activity
        const uniqueDays = new Set(data.map(d => new Date(d.logged_at).toDateString())).size;
        return { met: uniqueDays >= 7, progress: Math.min(uniqueDays, 7) };
      },
    },
    {
      code: 'peak_shifter',
      checkFn: async (uid, sb) => {
        // Reduce usage during peak hours (9am-9pm) by 20%
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { data: energyData } = await sb
          .from('energy_logs')
          .select('consumption_kwh, logged_at')
          .eq('user_id', uid)
          .gte('logged_at', weekAgo.toISOString());

        if (!energyData || energyData.length < 50) return { met: false, progress: 0 };

        // Calculate average peak vs off-peak
        let peakSum = 0, offPeakSum = 0, peakCount = 0, offPeakCount = 0;
        
        energyData.forEach(log => {
          const hour = new Date(log.logged_at).getHours();
          if (hour >= 9 && hour <= 21) {
            peakSum += log.consumption_kwh;
            peakCount++;
          } else {
            offPeakSum += log.consumption_kwh;
            offPeakCount++;
          }
        });

        const peakAvg = peakCount > 0 ? peakSum / peakCount : 0;
        const offPeakAvg = offPeakCount > 0 ? offPeakSum / offPeakCount : 0;
        
        // Check if peak usage is lower than off-peak (good!)
        const reduction = peakAvg > 0 && offPeakAvg > 0 && peakAvg < offPeakAvg 
          ? ((offPeakAvg - peakAvg) / offPeakAvg) * 100 
          : 0;
        
        return { met: reduction >= 20, progress: Math.min(Math.floor(reduction), 20) };
      },
    },
    {
      code: 'solar_streak',
      checkFn: async (uid, sb) => {
        // Generate solar power for 7 consecutive days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const { data } = await sb
          .from('solar_data')
          .select('generation_kwh, logged_at')
          .eq('user_id', uid)
          .gte('logged_at', weekAgo.toISOString())
          .order('logged_at', { ascending: true });

        if (!data || data.length === 0) return { met: false, progress: 0 };

        // Count unique days with solar generation > 0
        const daysWithSolar = new Set(
          data
            .filter(d => d.generation_kwh > 0)
            .map(d => new Date(d.logged_at).toDateString())
        ).size;

        return { met: daysWithSolar >= 7, progress: Math.min(daysWithSolar, 7) };
      },
    },
    {
      code: 'co2_champion',
      checkFn: async (uid, sb) => {
        // Save 10kg of CO₂ total
        const { data } = await sb
          .from('co2_tracker')
          .select('co2_saved_kg')
          .eq('user_id', uid);

        if (!data) return { met: false, progress: 0 };

        const totalCO2 = data.reduce((sum, d) => sum + d.co2_saved_kg, 0);
        return { met: totalCO2 >= 10, progress: Math.min(Math.floor(totalCO2), 10) };
      },
    },
    {
      code: 'energy_efficient',
      checkFn: async (uid, sb) => {
        // Maintain consumption below average for 14 days
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const { data } = await sb
          .from('energy_logs')
          .select('consumption_kwh, logged_at')
          .eq('user_id', uid)
          .gte('logged_at', twoWeeksAgo.toISOString());

        if (!data || data.length < 20) return { met: false, progress: 0 };

        const avgConsumption = data.reduce((sum, d) => sum + d.consumption_kwh, 0) / data.length;
        
        // Group by day and check if below average
        const dailyData: Record<string, number[]> = {};
        data.forEach(log => {
          const day = new Date(log.logged_at).toDateString();
          if (!dailyData[day]) dailyData[day] = [];
          dailyData[day].push(log.consumption_kwh);
        });

        let daysBelow = 0;
        Object.values(dailyData).forEach(dayLogs => {
          const dayAvg = dayLogs.reduce((a, b) => a + b, 0) / dayLogs.length;
          if (dayAvg < avgConsumption) daysBelow++;
        });

        return { met: daysBelow >= 14, progress: Math.min(daysBelow, 14) };
      },
    },
    {
      code: 'battery_master',
      checkFn: async (uid, sb) => {
        // Store and use 50 kWh from battery (track battery discharge)
        const { data } = await sb
          .from('real_time_energy_data')
          .select('battery_level_percent')
          .eq('user_id', uid)
          .order('timestamp', { ascending: true });

        if (!data || data.length < 2) return { met: false, progress: 0 };

        // Calculate total battery usage by tracking decreases in battery level
        let totalUsed = 0;
        for (let i = 1; i < data.length; i++) {
          const decrease = data[i-1].battery_level_percent - data[i].battery_level_percent;
          if (decrease > 0) {
            // Assuming 10kWh battery capacity (adjust as needed)
            totalUsed += (decrease / 100) * 10;
          }
        }

        return { met: totalUsed >= 50, progress: Math.min(Math.floor(totalUsed), 50) };
      },
    },
    {
      code: 'efficiency_master',
      checkFn: async (uid, sb) => {
        // Maintain 90%+ efficiency for 30 days
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        const { data: energyData } = await sb
          .from('energy_logs')
          .select('consumption_kwh, logged_at')
          .eq('user_id', uid)
          .gte('logged_at', monthAgo.toISOString());

        const { data: solarData } = await sb
          .from('solar_data')
          .select('generation_kwh, logged_at')
          .eq('user_id', uid)
          .gte('logged_at', monthAgo.toISOString());

        if (!energyData || !solarData || energyData.length < 50) return { met: false, progress: 0 };

        // Group by day
        const dailyEfficiency: Record<string, { consumption: number; solar: number }> = {};
        
        energyData.forEach(log => {
          const day = new Date(log.logged_at).toDateString();
          if (!dailyEfficiency[day]) dailyEfficiency[day] = { consumption: 0, solar: 0 };
          dailyEfficiency[day].consumption += log.consumption_kwh;
        });

        solarData.forEach(log => {
          const day = new Date(log.logged_at).toDateString();
          if (!dailyEfficiency[day]) dailyEfficiency[day] = { consumption: 0, solar: 0 };
          dailyEfficiency[day].solar += log.generation_kwh;
        });

        // Count days with 90%+ solar efficiency
        let efficientDays = 0;
        Object.values(dailyEfficiency).forEach(day => {
          if (day.consumption > 0) {
            const efficiency = (day.solar / day.consumption) * 100;
            if (efficiency >= 90) efficientDays++;
          }
        });

        return { met: efficientDays >= 30, progress: Math.min(efficientDays, 30) };
      },
    },
  ];

  // Get all achievements
  const { data: achievements } = await supabase
    .from('achievements')
    .select('id, code, points, max_progress');

  if (!achievements) return;

  for (const achievement of achievements) {
    const criteriaFn = criteria.find((c) => c.code === achievement.code);
    if (!criteriaFn) continue;

    const result = await criteriaFn.checkFn(userId, supabase);

    // Get or create user achievement
    const { data: userAchievement } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single();

    if (!userAchievement) {
      // Create new
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
        progress: result.progress,
        unlocked: result.met,
        unlocked_at: result.met ? new Date().toISOString() : null,
      });

      if (result.met) {
        await awardXP(userId, achievement.points, supabase);
      }
    } else if (!userAchievement.unlocked && result.met) {
      // Unlock existing
      await supabase
        .from('user_achievements')
        .update({
          progress: result.progress,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', userAchievement.id);

      await awardXP(userId, achievement.points, supabase);
    } else if (!userAchievement.unlocked) {
      // Update progress
      await supabase
        .from('user_achievements')
        .update({ progress: result.progress })
        .eq('id', userAchievement.id);
    }
  }
}

async function awardXP(userId: string, points: number, supabase: any) {
  const { data: userPoints } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!userPoints) {
    // Create new
    const newXP = points;
    const newLevel = Math.floor(newXP / 100) + 1;
    await supabase.from('user_points').insert({
      user_id: userId,
      xp: newXP,
      points: points,
      level: newLevel,
    });
  } else {
    // Update existing
    const newXP = userPoints.xp + points;
    const newLevel = Math.floor(newXP / 100) + 1;
    await supabase
      .from('user_points')
      .update({
        xp: newXP,
        points: userPoints.points + points,
        level: newLevel,
      })
      .eq('user_id', userId);
  }
}
