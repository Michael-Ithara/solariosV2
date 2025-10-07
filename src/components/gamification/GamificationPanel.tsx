import { useGamification } from "@/hooks/useGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AchievementCard } from "./AchievementCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Star, Zap } from "lucide-react";
import { CO2Tracker } from "./CO2Tracker";

export function GamificationPanel() {
  const {
    achievements,
    milestones,
    totalPoints,
    level,
    getRecentAchievements,
    getLevelProgress,
    isLoading,
  } = useGamification();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading gamification data...</p>
      </div>
    );
  }

  const recentAchievements = getRecentAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completedMilestones = milestones.filter(m => m.completed).length;

  return (
    <div className="space-y-6">
      {/* Level and Points Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Level</p>
                <p className="text-2xl font-bold text-primary">{level}</p>
              </div>
              <Star className="w-8 h-8 text-primary" />
            </div>
            <div className="mt-3">
              <Progress value={getLevelProgress()} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {getLevelProgress()}% to next level
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-success">{totalPoints}</p>
              </div>
              <Zap className="w-8 h-8 text-success" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {unlockedCount} achievements
            </p>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Milestones</p>
                <p className="text-2xl font-bold text-warning">
                  {completedMilestones}/{milestones.length}
                </p>
              </div>
              <Target className="w-8 h-8 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Goals completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {recentAchievements.map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                  showProgress={false}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CO₂ Tracker */}
      <CO2Tracker />

      {/* Detailed View */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
          <div className="grid gap-4">
            {milestones.map((milestone) => (
              <Card key={milestone.id} className={`border ${
                milestone.completed 
                  ? 'border-success/50 bg-gradient-to-br from-success/10 to-transparent' 
                  : 'border-muted'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                    <Badge variant={milestone.completed ? "default" : "secondary"}>
                      {milestone.category}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min((milestone.current / milestone.target) * 100, 100)} 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {milestone.current} / {milestone.target} {milestone.unit}
                      </span>
                      <span className="font-medium text-primary">
                        Reward: {milestone.reward}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}