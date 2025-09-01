import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LiveMetricDisplayProps {
  value: number;
  unit: string;
  label: string;
  trend?: number;
  className?: string;
  animated?: boolean;
}

export function LiveMetricDisplay({ 
  value, 
  unit, 
  label, 
  trend, 
  className = '',
  animated = true 
}: LiveMetricDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (animated && value !== displayValue) {
      setIsUpdating(true);
      
      // Animate the value change
      const duration = 500; // ms
      const steps = 20;
      const stepValue = (value - displayValue) / steps;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayValue(value);
          setIsUpdating(false);
          clearInterval(interval);
        } else {
          setDisplayValue(prev => prev + stepValue);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [value, displayValue, animated]);

  const formatValue = (val: number) => {
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'k';
    }
    return val.toFixed(val < 10 ? 2 : 1);
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${isUpdating ? 'ring-2 ring-primary/20' : ''} ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold transition-all duration-300 ${isUpdating ? 'text-primary' : ''}`}>
              {formatValue(displayValue)}
            </span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              <Badge 
                variant={trend > 0 ? "default" : trend < 0 ? "destructive" : "secondary"}
                className="text-xs"
              >
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">vs last hour</span>
            </div>
          )}
        </div>
        
        {/* Animated pulse effect when updating */}
        {isUpdating && (
          <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        )}
      </CardContent>
    </Card>
  );
}