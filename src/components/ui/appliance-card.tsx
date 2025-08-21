import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Power, Settings, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplianceCardProps {
  name: string;
  icon: ReactNode;
  isOnline: boolean;
  currentUsage: number;
  unit: string;
  status: "normal" | "high" | "anomaly";
  dailyUsage: number;
  trend: number;
  lastUpdate: string;
  onToggle?: () => void;
  onSettings?: () => void;
}

const statusStyles = {
  normal: "bg-success/10 text-success border-success/20",
  high: "bg-warning/10 text-warning border-warning/20", 
  anomaly: "bg-danger/10 text-danger border-danger/20"
};

const statusLabels = {
  normal: "Normal",
  high: "High Usage",
  anomaly: "Anomaly"
};

export function ApplianceCard({
  name,
  icon,
  isOnline,
  currentUsage,
  unit,
  status,
  dailyUsage,
  trend,
  lastUpdate,
  onToggle,
  onSettings
}: ApplianceCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isOnline ? "bg-success" : "bg-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={statusStyles[status]}>
          {statusLabels[status]}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Usage */}
        <div>
          <div className="text-2xl font-bold text-foreground">
            {currentUsage.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </div>
          <p className="text-sm text-muted-foreground">Current usage</p>
        </div>

        {/* Daily Usage & Trend */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">
              {dailyUsage.toFixed(1)} {unit}
            </div>
            <p className="text-xs text-muted-foreground">Today</p>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-danger" />
            ) : (
              <TrendingDown className="h-4 w-4 text-success" />
            )}
            <span className={cn(
              "font-medium",
              trend > 0 ? "text-danger" : "text-success"
            )}>
              {Math.abs(trend)}%
            </span>
          </div>
        </div>

        {/* Last Update */}
        <p className="text-xs text-muted-foreground">
          Last update: {lastUpdate}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onToggle && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggle}
              className="flex-1"
            >
              <Power className="h-4 w-4 mr-2" />
              Toggle
            </Button>
          )}
          {onSettings && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onSettings}
              className="px-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}