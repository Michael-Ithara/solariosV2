import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Beaker, Lightbulb, TrendingUp } from 'lucide-react';
import { useSimulation } from '@/hooks/useSimulation';
import { DeviceLibrary } from '@/components/simulation/DeviceLibrary';
import { SimulationControls } from '@/components/simulation/SimulationControls';
import { SimulationStatus } from '@/components/simulation/SimulationStatus';
import { EnhancedAppliances } from '@/components/simulation/EnhancedAppliances';
import { EnergyChart } from '@/components/charts/EnergyChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GamificationPanel } from '@/components/gamification/GamificationPanel';

export default function EnhancedDemo() {
  const [isDeviceLibraryOpen, setIsDeviceLibraryOpen] = useState(false);
  const {
    simulationState,
    addDevice,
    toggleDevice,
    removeDevice,
    resetSimulation,
    isDemoMode
  } = useSimulation();

  const handleUpdateDeviceSettings = (deviceId: string, settings: any) => {
    console.log('Updating device settings:', deviceId, settings);
  };

  return (
    <div className="flex-1 space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Beaker className="h-8 w-8 text-primary animate-[pulse_3s_ease-in-out_infinite]" />
          Smart Energy Demo
          <Badge variant="outline" className="ml-3 text-xs animate-fade-in">
            Live Simulation
          </Badge>
        </h1>
        <p className="text-muted-foreground">
          Experience real-time energy management with interactive smart home devices
        </p>
      </div>

      {/* Demo Mode Notice */}
      <Alert className="border-primary/20 bg-primary/5 animate-fade-in">
        <Lightbulb className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Auto-Playing Demo:</strong> Watch energy flow in real-time as you add and control smart devices. 
          The simulation automatically adjusts based on time of day, weather, and device usage patterns.
        </AlertDescription>
      </Alert>

      {/* Simplified Controls */}
      <SimulationControls
        simulationState={simulationState}
        onReset={resetSimulation}
        onOpenDeviceLibrary={() => setIsDeviceLibraryOpen(true)}
      />

      {/* Live Status Display */}
      <SimulationStatus 
        simulationState={simulationState}
        className="animate-fade-in"
      />

      {/* Energy Flow Visualization */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Live Energy Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnergyChart 
            type="area" 
            height={300} 
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

      {/* Smart Devices Management */}
      <div className="animate-fade-in">
        <EnhancedAppliances
          devices={simulationState.devices}
          onToggleDevice={toggleDevice}
          onRemoveDevice={removeDevice}
          onUpdateDeviceSettings={handleUpdateDeviceSettings}
          isDemoMode={isDemoMode}
        />
      </div>

      {/* Achievements */}
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>Energy Achievements</span>
          <Badge variant="secondary" className="text-xs">
            {simulationState.devices.filter(d => d.status === 'on').length} active
          </Badge>
        </h2>
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