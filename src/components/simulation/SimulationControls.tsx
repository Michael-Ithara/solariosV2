import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  RotateCcw, 
  Plus, 
  Gauge,
  Sparkles
} from 'lucide-react';
import { SimulationState } from '@/types/simulation';

interface SimulationControlsProps {
  simulationState: SimulationState;
  onReset: () => void;
  onOpenDeviceLibrary: () => void;
}

export function SimulationControls({
  simulationState,
  onReset,
  onOpenDeviceLibrary
}: SimulationControlsProps) {

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Interactive Demo Controls
        </CardTitle>
        <CardDescription>
          Add devices and watch real-time energy flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Button 
            onClick={onOpenDeviceLibrary} 
            className="hover-scale transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Smart Device
          </Button>
          
          <Button 
            onClick={onReset} 
            variant="outline" 
            className="hover-scale transition-all duration-300"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
          
          <div className="ml-auto text-sm text-muted-foreground">
            Auto-playing at real-time speed
          </div>
        </div>
      </CardContent>
    </Card>
  );
}