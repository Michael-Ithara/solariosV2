import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, 
  Power, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Timer,
  Gauge
} from 'lucide-react';
import { SimulatedDevice } from '@/types/simulation';
import * as Icons from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface EnhancedAppliancesProps {
  devices: SimulatedDevice[];
  onToggleDevice: (deviceId: string) => void;
  onRemoveDevice: (deviceId: string) => void;
  onUpdateDeviceSettings: (deviceId: string, settings: any) => void;
  isDemoMode: boolean;
}

export function EnhancedAppliances({ 
  devices, 
  onToggleDevice, 
  onRemoveDevice, 
  onUpdateDeviceSettings,
  isDemoMode 
}: EnhancedAppliancesProps) {
  const [selectedDevice, setSelectedDevice] = useState<SimulatedDevice | null>(null);

  const getIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('air') || name.includes('hvac')) return <Icons.Snowflake className="h-5 w-5" />;
    if (name.includes('tv')) return <Icons.Tv className="h-5 w-5" />;
    if (name.includes('light')) return <Icons.Lightbulb className="h-5 w-5" />;
    if (name.includes('microwave')) return <Icons.Microwave className="h-5 w-5" />;
    if (name.includes('wash')) return <Icons.WashingMachine className="h-5 w-5" />;
    if (name.includes('pool')) return <Icons.Waves className="h-5 w-5" />;
    if (name.includes('car') || name.includes('ev')) return <Icons.Car className="h-5 w-5" />;
    if (name.includes('heater')) return <Icons.Thermometer className="h-5 w-5" />;
    return <Zap className="h-5 w-5" />;
  };

  const getStatusColor = (device: SimulatedDevice) => {
    if (device.status === 'off') return 'text-muted-foreground';
    if (device.currentUsage > device.powerRating * 0.8 / 1000) return 'text-destructive';
    if (device.currentUsage > device.powerRating * 0.5 / 1000) return 'text-warning';
    return 'text-success';
  };

  const formatPower = (watts: number) => {
    if (watts >= 1) return `${watts.toFixed(1)} kW`;
    return `${(watts * 1000).toFixed(0)} W`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Connected Devices</h3>
        <Badge variant="outline">
          {devices.filter(d => d.status === 'on').length} of {devices.length} active
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <Card key={device.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${
                    device.status === 'on' 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {getIcon(device.name)}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{device.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={device.status === 'on' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {device.status.toUpperCase()}
                      </Badge>
                      {device.status === 'on' && (
                        <span className={`text-xs font-medium ${getStatusColor(device)}`}>
                          {formatPower(device.currentUsage)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Switch
                    checked={device.status === 'on'}
                    onCheckedChange={() => onToggleDevice(device.id)}
                  />
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{device.name} Settings</DialogTitle>
                      </DialogHeader>
                      <DeviceSettings 
                        device={device}
                        onUpdateSettings={(settings) => onUpdateDeviceSettings(device.id, settings)}
                        onRemove={() => onRemoveDevice(device.id)}
                        isDemoMode={isDemoMode}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Power Rating */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Max Power:</span>
                  <span className="font-medium">{formatPower(device.powerRating / 1000)}</span>
                </div>

                {/* Current Usage Bar */}
                {device.status === 'on' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Current Usage</span>
                      <span className={getStatusColor(device)}>
                        {Math.round((device.currentUsage / (device.powerRating / 1000)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          device.currentUsage > device.powerRating * 0.8 / 1000 
                            ? 'bg-destructive' 
                            : device.currentUsage > device.powerRating * 0.5 / 1000
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (device.currentUsage / (device.powerRating / 1000)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Last Update */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Updated {new Date(device.lastUsageUpdate).toLocaleTimeString()}</span>
                </div>

                {/* Scheduled Tasks */}
                {device.scheduledTasks.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <Timer className="h-3 w-3 text-primary" />
                    <span className="text-primary">{device.scheduledTasks.length} scheduled task(s)</span>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Status Indicator */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
              device.status === 'on' ? 'bg-primary' : 'bg-muted'
            }`} />
          </Card>
        ))}
        
        {devices.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Devices Added</h3>
              <p className="text-muted-foreground mb-4">
                Add devices from the library to start your simulation
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface DeviceSettingsProps {
  device: SimulatedDevice;
  onUpdateSettings: (settings: any) => void;
  onRemove: () => void;
  isDemoMode: boolean;
}

function DeviceSettings({ device, onUpdateSettings, onRemove, isDemoMode }: DeviceSettingsProps) {
  const [settings, setSettings] = useState(device.settings);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  return (
    <div className="space-y-6">
      {/* Device Info */}
      <div className="space-y-2">
        <Label>Device Information</Label>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Power Rating:</span>
            <div className="font-medium">{device.powerRating}W</div>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <div className="font-medium capitalize">{device.status}</div>
          </div>
        </div>
      </div>

      {/* Settings based on device type */}
      {device.name.toLowerCase().includes('thermostat') || device.name.toLowerCase().includes('ac') || device.name.toLowerCase().includes('heater') && (
        <div className="space-y-2">
          <Label>Temperature Settings</Label>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Target Temperature</span>
                <span className="text-sm font-medium">{settings.temperature || 22}°C</span>
              </div>
              <Slider
                value={[settings.temperature || 22]}
                onValueChange={([value]) => handleSettingChange('temperature', value)}
                min={16}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {device.name.toLowerCase().includes('light') && (
        <div className="space-y-2">
          <Label>Lighting Settings</Label>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Brightness</span>
                <span className="text-sm font-medium">{settings.brightness || 100}%</span>
              </div>
              <Slider
                value={[settings.brightness || 100]}
                onValueChange={([value]) => handleSettingChange('brightness', value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Common Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Eco Mode</Label>
          <Switch
            checked={settings.ecoMode || false}
            onCheckedChange={(checked) => handleSettingChange('ecoMode', checked)}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label>Auto Mode</Label>
          <Switch
            checked={settings.autoMode || false}
            onCheckedChange={(checked) => handleSettingChange('autoMode', checked)}
          />
        </div>
      </div>

      {/* Timer Settings */}
      <div className="space-y-2">
        <Label>Auto Shut-off Timer (minutes)</Label>
        <Input
          type="number"
          value={settings.timer || ''}
          onChange={(e) => handleSettingChange('timer', parseInt(e.target.value) || 0)}
          placeholder="0 = disabled"
          min="0"
          max="1440"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onRemove}
          disabled={isDemoMode}
        >
          <Minus className="h-4 w-4 mr-2" />
          Remove Device
        </Button>
      </div>
    </div>
  );
}