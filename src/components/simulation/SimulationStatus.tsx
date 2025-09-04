import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveMetricDisplay } from '@/components/ui/live-metric-display';
import { 
  Zap, 
  Sun, 
  TrendingUp, 
  Thermometer,
  Activity,
  DollarSign
} from 'lucide-react';
import { SimulationState } from '@/types/simulation';

interface SimulationStatusProps {
  simulationState: SimulationState;
  className?: string;
}

export function SimulationStatus({ simulationState, className }: SimulationStatusProps) {
  const netUsage = simulationState.totalConsumption - simulationState.solarProduction;
  const hourlyCost = Math.max(0, netUsage) * simulationState.gridPrice;
  const activeDevices = simulationState.devices.filter(d => d.status === 'on').length;

  const getWeatherIcon = () => {
    switch (simulationState.weather.condition) {
      case 'sunny':
        return <Sun className="h-4 w-4" />;
      case 'partly-cloudy':
        return <Sun className="h-4 w-4 opacity-70" />;
      case 'cloudy':
        return <Thermometer className="h-4 w-4" />;
      case 'rainy':
        return <Thermometer className="h-4 w-4 text-blue-500" />;
      case 'stormy':
        return <Thermometer className="h-4 w-4 text-red-500" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Simulation Status */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              <div>
                <div className="font-semibold">Live Simulation</div>
                <div className="text-sm text-muted-foreground">
                  {simulationState.currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
            <Badge 
              variant={simulationState.isRunning ? "default" : "secondary"}
              className="animate-fade-in"
            >
              {simulationState.isRunning ? "Running" : "Paused"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LiveMetricDisplay
          label="Consumption"
          value={simulationState.totalConsumption}
          unit="kW"
          trend={activeDevices}
          animated
          className="border-energy-consumption/20"
        />
        
        <LiveMetricDisplay
          label="Solar Production"
          value={simulationState.solarProduction}
          unit="kW"
          trend={Math.round((1 - simulationState.weather.cloudCover) * 100)}
          animated
          className="border-energy-solar/20"
        />
        
        <LiveMetricDisplay
          label="Net Grid Usage"
          value={Math.max(0, netUsage)}
          unit="kW"
          trend={netUsage < 0 ? -1 : 1}
          animated
          className="border-energy-grid/20"
        />
        
        <LiveMetricDisplay
          label="Current Cost"
          value={hourlyCost}
          unit="$/h"
          trend={hourlyCost > 0.5 ? 1 : -1}
          animated
          className="border-destructive/20"
        />
      </div>

      {/* Weather & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getWeatherIcon()}
                <div>
                  <div className="font-medium">Weather Conditions</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {simulationState.weather.condition}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {Math.round(simulationState.weather.temperature)}°C
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(simulationState.weather.cloudCover * 100)}% clouds
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Devices</span>
                <span className="font-semibold">{activeDevices} / {simulationState.devices.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Grid Price</span>
                <span className="font-semibold">${simulationState.gridPrice.toFixed(3)}/kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Solar Efficiency</span>
                <span className="font-semibold">
                  {Math.round((1 - simulationState.weather.cloudCover) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}