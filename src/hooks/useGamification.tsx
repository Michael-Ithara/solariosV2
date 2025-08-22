import { useState, useEffect } from 'react';

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

const initialAchievements: Achievement[] = [
  {
    id: 'first_day',
    title: 'First Day Online',
    description: 'Monitor your energy for the first day',
    icon: '🚀',
    unlocked: true,
    unlockedAt: new Date(),
    progress: 1,
    maxProgress: 1,
    category: 'consistency',
    points: 50
  },
  {
    id: 'solar_hero',
    title: 'Solar Hero',
    description: 'Generate 100kWh from solar panels',
    icon: '☀️',
    unlocked: false,
    progress: 42,
    maxProgress: 100,
    category: 'solar',
    points: 200
  },
  {
    id: 'energy_saver',
    title: 'Energy Saver',
    description: 'Reduce consumption by 20% for a week',
    icon: '💡',
    unlocked: false,
    progress: 15,
    maxProgress: 20,
    category: 'energy_saving',
    points: 150
  },
  {
    id: 'efficiency_master',
    title: 'Efficiency Master',
    description: 'Maintain 90%+ efficiency for 30 days',
    icon: '⚡',
    unlocked: false,
    progress: 12,
    maxProgress: 30,
    category: 'efficiency',
    points: 300
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Check your dashboard 7 days in a row',
    icon: '🔥',
    unlocked: false,
    progress: 3,
    maxProgress: 7,
    category: 'consistency',
    points: 100
  }
];

const initialMilestones: Milestone[] = [
  {
    id: 'daily_solar',
    title: 'Daily Solar Goal',
    description: 'Generate 50kWh today',
    target: 50,
    current: 42,
    unit: 'kWh',
    category: 'daily',
    reward: '25 points',
    completed: false
  },
  {
    id: 'weekly_savings',
    title: 'Weekly Savings',
    description: 'Save $100 this week',
    target: 100,
    current: 156,
    unit: '$',
    category: 'weekly',
    reward: '100 points',
    completed: true
  },
  {
    id: 'monthly_efficiency',
    title: 'Monthly Efficiency',
    description: 'Maintain 85% efficiency this month',
    target: 85,
    current: 87,
    unit: '%',
    category: 'monthly',
    reward: 'Efficiency Badge',
    completed: true
  }
];

export function useGamification() {
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [totalPoints, setTotalPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [experiencePoints, setExperiencePoints] = useState(150);
  const [nextLevelXP, setNextLevelXP] = useState(200);

  useEffect(() => {
    // Calculate total points from unlocked achievements
    const points = achievements
      .filter(achievement => achievement.unlocked)
      .reduce((sum, achievement) => sum + achievement.points, 0);
    
    setTotalPoints(points);

    // Calculate level based on total XP
    const totalXP = experiencePoints;
    const newLevel = Math.floor(totalXP / 100) + 1;
    setLevel(newLevel);
    setNextLevelXP(newLevel * 100);
  }, [achievements, experiencePoints]);

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
    getLevelProgress
  };
}