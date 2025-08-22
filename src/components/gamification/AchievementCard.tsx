import { Achievement } from "@/hooks/useGamification";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Lock } from "lucide-react";

interface AchievementCardProps {
  achievement: Achievement;
  showProgress?: boolean;
}

export function AchievementCard({ achievement, showProgress = true }: AchievementCardProps) {
  const progressPercentage = Math.round((achievement.progress / achievement.maxProgress) * 100);
  const isCompleted = achievement.unlocked;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
      isCompleted 
        ? 'border-success/50 bg-gradient-to-br from-success/10 to-transparent shadow-lg' 
        : 'border-muted bg-muted/5'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`text-2xl p-2 rounded-lg ${
              isCompleted 
                ? 'bg-success/20 border border-success/30' 
                : 'bg-muted/50 border border-muted'
            }`}>
              {isCompleted ? achievement.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
            </div>
            <div>
              <h3 className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                {achievement.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {achievement.description}
              </p>
            </div>
          </div>
          {isCompleted && (
            <Trophy className="w-5 h-5 text-success" />
          )}
        </div>
        
        {showProgress && !isCompleted && (
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{achievement.progress} / {achievement.maxProgress}</span>
              <span>{progressPercentage}%</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
            {achievement.category.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1 text-sm font-medium">
            <span className={isCompleted ? 'text-success' : 'text-muted-foreground'}>
              {achievement.points}
            </span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>
        
        {isCompleted && achievement.unlockedAt && (
          <div className="mt-2 text-xs text-muted-foreground">
            Unlocked {achievement.unlockedAt.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}