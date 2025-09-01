import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Beaker, Lightbulb } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { DeviceLibrary } from '@/components/simulation/DeviceLibrary';
import { SimulationControls } from '@/components/simulation/SimulationControls';
import { EnhancedAppliances } from '@/components/simulation/EnhancedAppliances';
import { EnergyChart } from '@/components/charts/EnergyChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/ui/metric-card';
import { GamificationPanel } from '@/components/gamification/GamificationPanel';
import { 
  Zap, 
  Sun, 
  Battery, 
  TrendingUp,
  Activity
} from 'lucide-react';

export default function EnhancedDemo() {
  const [isDeviceLibraryOpen, setIsDeviceLibraryOpen] = useState(false);
  const {
    simulationState,
    addDevice,
    toggleDevice,
    removeDevice,
    startSimulation,
    stopSimulation,
    setSpeedMultiplier,
    isDemoMode
  } = useSimulation();

  const handleStartStop = () => {
    if (simulationState.isRunning) {
      stopSimulation();
    } else {
      startSimulation();
    }
  };

  const handleReset = () => {
    stopSimulation();
    // Reset functionality would go here
  };

  const handleUpdateDeviceSettings = (deviceId: string, settings: any) => {
    // Device settings update logic would go here
    console.log('Updating device settings:', deviceId, settings);
  };

  const netUsage = simulationState.totalConsumption - simulationState.solarProduction;

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Beaker className="h-8 w-8 text-primary" />
          Interactive Energy Simulation
          <Badge variant="outline" className="ml-3 text-xs">
            Live Demo
          </Badge>
        </h1>
        <p className="text-muted-foreground">
          Experience real-time energy management with interactive smart home devices
        </p>
      </div>

      {/* Demo Mode Notice */}
      <Alert className="border-primary/20 bg-primary/5">
        <Lightbulb className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Interactive Simulation Mode:</strong> Add devices, control appliances in real-time, 
          and see immediate impact on your energy consumption. Perfect for presentations and exploring 
          smart home possibilities!
        </AlertDescription>
      </Alert>

      {/* Simulation Controls */}
      <SimulationControls
        simulationState={simulationState}
        onStartStop={handleStartStop}
        onReset={handleReset}
        onOpenDeviceLibrary={() => setIsDeviceLibraryOpen(true)}
        onSpeedChange={setSpeedMultiplier}
      />

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Usage"
          value={simulationState.totalConsumption}
          unit="kW"
          icon={<Zap />}
          variant="consumption"
          trend={{
            value: 12,
            label: "live update"
          }}
        />
        <MetricCard
          title="Solar Production"
          value={simulationState.solarProduction}
          unit="kW"
          icon={<Sun />}
          variant="solar"
          trend={{
            value: 8,
            label: "weather dependent"
          }}
        />
        <MetricCard
          title="Net Grid Usage"
          value={Math.max(0, netUsage)}
          unit="kW"
          icon={<Activity />}
          variant="grid"
          trend={{
            value: netUsage < 0 ? -Math.abs(netUsage) : netUsage,
            label: netUsage < 0 ? "selling to grid" : "buying from grid"
          }}
        />
        <MetricCard
          title="Battery Level"
          value={85} // Mock for now
          unit="%"
          icon={<Battery />}
          trend={{
            value: 5,
            label: "charging"
          }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Energy Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Live Energy Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnergyChart 
                type="area" 
                height={350} 
                simulationData={simulationState.devices.length > 0 ? [{
                  time: new Date(simulationState.currentTime).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  consumption: parseFloat(simulationState.totalConsumption.toFixed(2)),
                  solar: parseFloat(simulationState.solarProduction.toFixed(2)),
                  grid: parseFloat(Math.max(0, simulationState.totalConsumption - simulationState.solarProduction).toFixed(2))
                }] : undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* Real-time Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Simulation Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Devices:</span>
                <span className="font-medium">
                  {simulationState.devices.filter(d => d.status === 'on').length} of {simulationState.devices.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Grid Price:</span>
                <span className="font-medium">${simulationState.gridPrice}/kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Cost:</span>
                <span className="font-medium">
                  ${(netUsage * simulationState.gridPrice).toFixed(2)}/hour
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Weather:</span>
                <span className="font-medium capitalize">
                  {simulationState.weather.condition}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Weather Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Temperature:</span>
                <span className="font-medium">{Math.round(simulationState.weather.temperature)}°C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cloud Cover:</span>
                <span className="font-medium">{Math.round(simulationState.weather.cloudCover * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Solar Efficiency:</span>
                <span className="font-medium">
                  {Math.round((1 - simulationState.weather.cloudCover) * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Appliances */}
      <EnhancedAppliances
        devices={simulationState.devices}
        onToggleDevice={toggleDevice}
        onRemoveDevice={removeDevice}
        onUpdateDeviceSettings={handleUpdateDeviceSettings}
        isDemoMode={isDemoMode}
      />

      {/* Gamification Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Energy Achievements</h2>
        <GamificationPanel />
      </div>

      {/* Device Library Modal */}
      <DeviceLibrary
        isOpen={isDeviceLibraryOpen}
        onClose={() => setIsDeviceLibraryOpen(false)}
        onAddDevice={addDevice}
      />
    </div>
  );
}