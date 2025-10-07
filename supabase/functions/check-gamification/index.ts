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

    // Get all users with simulation or iot data source
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

    console.log(`Processing ${profiles.length} users`);

    for (const profile of profiles) {
      const userId = profile.user_id;

      // Process CO₂ tracking
      await processCO2Tracking(userId, supabase);

      // Check and unlock achievements
      await checkAchievements(userId, supabase);
    }

    return new Response(
      JSON.stringify({ success: true, processed: profiles.length }),
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
