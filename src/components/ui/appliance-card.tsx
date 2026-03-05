import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Power, Settings, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
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
  onEdit?: () => void;
  onDelete?: () => void;
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

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

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
  onSettings,
  onEdit,
  onDelete
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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusStyles[status]}>
            {statusLabels[status]}
          </Badge>
          {(onEdit || onDelete || onSettings) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit appliance">
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-danger hover:bg-danger/10" onClick={onDelete} title="Delete appliance">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onSettings && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onSettings} title="Settings">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          )}
        </div>
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
        <p className="text-xs text-muted-foreground" title={lastUpdate}>
          Updated {formatRelativeTime(lastUpdate)}
        </p>

        {/* Toggle Action */}
        {onToggle && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="w-full"
            >
              <Power className="h-4 w-4 mr-2" />
              Toggle
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}