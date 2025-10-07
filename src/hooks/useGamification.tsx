import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  category: 'energy_saving' | 'solar' | 'efficiency' | 'consistency';
  points: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  category: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  reward: string;
  completed: boolean;
}

const categoryIcons: Record<string, string> = {
  energy_saving: '💡',
  solar: '☀️',
  efficiency: '⚡',
  consistency: '🔥',
};

export function useGamification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [experiencePoints, setExperiencePoints] = useState(0);
  const [nextLevelXP, setNextLevelXP] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    fetchGamificationData();

    // Subscribe to achievement updates
    const channel = supabase
      .channel('user-achievements-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Achievement updated:', payload);
          fetchGamificationData();
          
          // Show toast if newly unlocked
          if (payload.new.unlocked && !payload.old.unlocked) {
            const achievement = achievements.find(a => a.id === payload.new.achievement_id);
            if (achievement) {
              toast({
                title: '🏅 New Achievement!',
                description: `${achievement.title} (+${achievement.points} XP)`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchGamificationData = async () => {
    if (!user) return;

    try {
      // Fetch all achievements with user progress
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select(`
          id,
          code,
          title,
          description,
          category,
          max_progress,
          points,
          user_achievements (
            progress,
            unlocked,
            unlocked_at
          )
        `)
        .eq('user_achievements.user_id', user.id);

      if (achievementsData) {
        const formattedAchievements: Achievement[] = achievementsData.map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: categoryIcons[a.category] || '🎯',
          unlocked: a.user_achievements?.[0]?.unlocked || false,
          unlockedAt: a.user_achievements?.[0]?.unlocked_at 
            ? new Date(a.user_achievements[0].unlocked_at) 
            : undefined,
          progress: a.user_achievements?.[0]?.progress || 0,
          maxProgress: a.max_progress,
          category: a.category,
          points: a.points,
        }));
        setAchievements(formattedAchievements);
      }

      // Fetch user points and level
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (pointsData) {
        setTotalPoints(pointsData.points || 0);
        setLevel(pointsData.level || 1);
        setExperiencePoints(pointsData.xp || 0);
        setNextLevelXP(pointsData.level * 100);
      }

      // Calculate milestones from recent data
      await fetchMilestones();

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
      setIsLoading(false);
    }
  };

  const fetchMilestones = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily solar goal
    const { data: dailySolar } = await supabase
      .from('solar_data')
      .select('generation_kwh')
      .eq('user_id', user.id)
      .gte('logged_at', today.toISOString());

    const dailySolarTotal = dailySolar?.reduce((sum, d) => sum + d.generation_kwh, 0) || 0;

    // Weekly CO₂ savings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: weeklyCO2 } = await supabase
      .from('co2_tracker')
      .select('co2_saved_kg')
      .eq('user_id', user.id)
      .gte('timestamp', weekAgo.toISOString());

    const weeklyCO2Total = weeklyCO2?.reduce((sum, d) => sum + d.co2_saved_kg, 0) || 0;

    setMilestones([
      {
        id: 'daily_solar',
        title: 'Daily Solar Goal',
        description: 'Generate 10 kWh today',
        target: 10,
        current: dailySolarTotal,
        unit: 'kWh',
        category: 'daily',
        reward: '25 points',
        completed: dailySolarTotal >= 10,
      },
      {
        id: 'weekly_co2',
        title: 'Weekly CO₂ Savings',
        description: 'Save 5 kg CO₂ this week',
        target: 5,
        current: weeklyCO2Total,
        unit: 'kg',
        category: 'weekly',
        reward: '100 points',
        completed: weeklyCO2Total >= 5,
      },
    ]);
  };

  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev => 
      prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, unlocked: true, unlockedAt: new Date() }
          : achievement
      )
    );
  };

  const updateProgress = (achievementId: string, progress: number) => {
    setAchievements(prev => 
      prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, progress: Math.min(progress, achievement.maxProgress) }
          : achievement
      )
    );
  };

  const completeMilestone = (milestoneId: string) => {
    setMilestones(prev => 
      prev.map(milestone => 
        milestone.id === milestoneId 
          ? { ...milestone, completed: true }
          : milestone
      )
    );
  };

  const getRecentAchievements = () => {
    return achievements
      .filter(achievement => achievement.unlocked)
      .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
      .slice(0, 3);
  };

  const getProgressPercentage = (achievement: Achievement) => {
    return Math.round((achievement.progress / achievement.maxProgress) * 100);
  };

  const getLevelProgress = () => {
    const currentLevelXP = (level - 1) * 100;
    const progressInCurrentLevel = experiencePoints - currentLevelXP;
    const xpNeededForCurrentLevel = 100;
    return Math.round((progressInCurrentLevel / xpNeededForCurrentLevel) * 100);
  };

  return {
    achievements,
    milestones,
    totalPoints,
    level,
    experiencePoints,
    nextLevelXP,
    unlockAchievement,
    updateProgress,
    completeMilestone,
    getRecentAchievements,
    getProgressPercentage,
    getLevelProgress,
    isLoading,
  };
}