import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Gauge, 
  Cloud, 
  Sun, 
  Thermometer,
  Zap,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { SimulationState } from '@/types/simulation';

interface SimulationControlsProps {
  simulationState: SimulationState;
  onStartStop: () => void;
  onReset: () => void;
  onOpenDeviceLibrary: () => void;
  onSpeedChange: (speed: number) => void;
}

export function SimulationControls({
  simulationState,
  onStartStop,
  onReset,
  onOpenDeviceLibrary,
  onSpeedChange
}: SimulationControlsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getWeatherIcon = () => {
    switch (simulationState.weather.condition) {
      case 'sunny':
        return <Sun className="h-4 w-4" />;
      case 'cloudy':
        return <Cloud className="h-4 w-4" />;
      case 'rainy':
        return <Cloud className="h-4 w-4 text-blue-500" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const currentCost = simulationState.totalConsumption * simulationState.gridPrice;
  const netUsage = simulationState.totalConsumption - simulationState.solarProduction;

  return (
    <div className="space-y-4">
      {/* Main Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Simulation Controls
          </CardTitle>
          <CardDescription>
            Control your energy simulation and add new devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button 
              onClick={onStartStop}
              variant={simulationState.isRunning ? "destructive" : "default"}
              size="sm"
            >
              {simulationState.isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            
            <Button onClick={onReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            
            <Button onClick={onOpenDeviceLibrary} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
            
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <Select 
                value={simulationState.speedMultiplier.toString()} 
                onValueChange={(value) => onSpeedChange(Number(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="10">10x</SelectItem>
                  <SelectItem value="60">60x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge 
              variant={simulationState.isRunning ? "default" : "secondary"}
              className="gap-1"
            >
              {simulationState.isRunning ? "Running" : "Paused"}
            </Badge>
            
            <div className="text-sm text-muted-foreground">
              Simulated Time: {simulationState.currentTime.toLocaleTimeString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-energy-consumption/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-energy-consumption" />
              <span className="text-sm font-medium">Consumption</span>
            </div>
            <div className="text-2xl font-bold">
              {simulationState.totalConsumption.toFixed(2)} kW
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(currentCost)}/hour
            </div>
          </CardContent>
        </Card>

        <Card className="border-energy-solar/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-energy-solar" />
              <span className="text-sm font-medium">Solar</span>
            </div>
            <div className="text-2xl font-bold">
              {simulationState.solarProduction.toFixed(2)} kW
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round((1 - simulationState.weather.cloudCover) * 100)}% clear sky
            </div>
          </CardContent>
        </Card>

        <Card className="border-energy-grid/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-energy-grid" />
              <span className="text-sm font-medium">Net Usage</span>
            </div>
            <div className="text-2xl font-bold">
              {netUsage.toFixed(2)} kW
            </div>
            <div className="text-xs text-muted-foreground">
              {netUsage > 0 ? 'Drawing from grid' : 'Sending to grid'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <span className="text-sm font-medium">Weather</span>
            </div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {Math.round(simulationState.weather.temperature)}°C
              {getWeatherIcon()}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(simulationState.weather.humidity)}% humidity
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}