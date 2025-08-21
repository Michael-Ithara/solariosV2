import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "solar" | "grid" | "consumption";
  className?: string;
}

const variantStyles = {
  default: "border-border",
  solar: "border-energy-solar/20 bg-gradient-to-br from-energy-solar/5 to-transparent",
  grid: "border-energy-grid/20 bg-gradient-to-br from-energy-grid/5 to-transparent", 
  consumption: "border-energy-consumption/20 bg-gradient-to-br from-energy-consumption/5 to-transparent"
};

const iconStyles = {
  default: "text-primary",
  solar: "text-energy-solar",
  grid: "text-energy-grid",
  consumption: "text-energy-consumption"
};

export function MetricCard({ 
  title, 
  value, 
  unit, 
  icon, 
  trend, 
  variant = "default",
  className 
}: MetricCardProps) {
  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-5 w-5", iconStyles[variant])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <div className="text-2xl font-bold text-foreground">
            {value}
          </div>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={cn(
              "font-medium",
              trend.value > 0 ? "text-success" : trend.value < 0 ? "text-danger" : "text-muted-foreground"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>{" "}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}