import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Home, Zap } from 'lucide-react';

interface DeviceSetupStepProps {
  data: {
    selectedDevices: string[];
    customDevices: Array<{
      name: string;
      powerRating: number;
      category: string;
    }>;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const DEVICE_CATEGORIES = [
  {
    id: 'heating-cooling',
    name: 'Heating & Cooling',
    icon: '🌡️',
    devices: [
      { id: 'central-air', name: 'Central Air Conditioning', power: 3500 },
      { id: 'heat-pump', name: 'Heat Pump', power: 3000 },
      { id: 'electric-heater', name: 'Electric Heater', power: 1500 },
      { id: 'ceiling-fan', name: 'Ceiling Fan', power: 75 },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen Appliances',
    icon: '🍳',
    devices: [
      { id: 'refrigerator', name: 'Refrigerator', power: 150 },
      { id: 'dishwasher', name: 'Dishwasher', power: 1800 },
      { id: 'oven', name: 'Electric Oven', power: 3000 },
      { id: 'microwave', name: 'Microwave', power: 1000 },
      { id: 'coffee-maker', name: 'Coffee Maker', power: 1200 },
    ],
  },
  {
    id: 'laundry',
    name: 'Laundry',
    icon: '👕',
    devices: [
      { id: 'washer', name: 'Washing Machine', power: 2000 },
      { id: 'dryer', name: 'Electric Dryer', power: 3000 },
    ],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '💻',
    devices: [
      { id: 'tv-55', name: '55" LED TV', power: 150 },
      { id: 'desktop-pc', name: 'Desktop Computer', power: 500 },
      { id: 'laptop', name: 'Laptop', power: 65 },
      { id: 'gaming-console', name: 'Gaming Console', power: 180 },
    ],
  },
  {
    id: 'lighting',
    name: 'Lighting',
    icon: '💡',
    devices: [
      { id: 'led-bulbs', name: 'LED Light Bulbs (10x)', power: 100 },
      { id: 'outdoor-lights', name: 'Outdoor Lighting', power: 200 },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: '🔌',
    devices: [
      { id: 'water-heater', name: 'Electric Water Heater', power: 4000 },
      { id: 'pool-pump', name: 'Pool Pump', power: 1500 },
      { id: 'ev-charger', name: 'EV Charger', power: 7000 },
    ],
  },
];

export function DeviceSetupStep({ data, onUpdate, onNext, onBack }: DeviceSetupStepProps) {
  const [formData, setFormData] = useState(data);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDevice, setCustomDevice] = useState({
    name: '',
    powerRating: 0,
    category: 'other',
  });

  const handleDeviceToggle = (deviceId: string, checked: boolean) => {
    const updated = {
      ...formData,
      selectedDevices: checked
        ? [...formData.selectedDevices, deviceId]
        : formData.selectedDevices.filter(id => id !== deviceId),
    };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleAddCustomDevice = () => {
    if (customDevice.name && customDevice.powerRating > 0) {
      const updated = {
        ...formData,
        customDevices: [...formData.customDevices, customDevice],
      };
      setFormData(updated);
      onUpdate(updated);
      setCustomDevice({ name: '', powerRating: 0, category: 'other' });
      setShowCustomForm(false);
    }
  };

  const handleRemoveCustomDevice = (index: number) => {
    const updated = {
      ...formData,
      customDevices: formData.customDevices.filter((_, i) => i !== index),
    };
    setFormData(updated);
    onUpdate(updated);
  };

  const totalSelectedDevices = formData.selectedDevices.length + formData.customDevices.length;
  const totalPower = [
    ...formData.selectedDevices.map(id => {
      for (const category of DEVICE_CATEGORIES) {
        const device = category.devices.find(d => d.id === id);
        if (device) return device.power;
      }
      return 0;
    }),
    ...formData.customDevices.map(d => d.powerRating),
  ].reduce((sum, power) => sum + power, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-energy-consumption rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Add Your Devices</h2>
        <p className="text-muted-foreground">
          Select the appliances and devices in your home to track their energy usage
        </p>
      </div>

      <div className="space-y-6">
        {DEVICE_CATEGORIES.map((category) => (
          <Card key={category.id} className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{category.icon}</span>
                <h3 className="font-semibold text-lg">{category.name}</h3>
                <Badge variant="outline" className="ml-auto">
                  {category.devices.filter(d => formData.selectedDevices.includes(d.id)).length} selected
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.devices.map((device) => (
                  <div key={device.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-background/50">
                    <Checkbox
                      id={device.id}
                      checked={formData.selectedDevices.includes(device.id)}
                      onCheckedChange={(checked) => handleDeviceToggle(device.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={device.id} className="cursor-pointer font-medium">
                        {device.name}
                      </Label>
                      <div className="text-sm text-muted-foreground">
                        {device.power}W avg power
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Custom Devices */}
        <Card className="border-energy-consumption/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-energy-consumption" />
                <h3 className="font-semibold text-lg">Custom Devices</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Device
              </Button>
            </div>

            {showCustomForm && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/50 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Device Name</Label>
                  <Input
                    id="custom-name"
                    placeholder="Smart Thermostat"
                    value={customDevice.name}
                    onChange={(e) => setCustomDevice(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-power">Power Rating (W)</Label>
                  <Input
                    id="custom-power"
                    type="number"
                    min="0"
                    placeholder="250"
                    value={customDevice.powerRating || ''}
                    onChange={(e) => setCustomDevice(prev => ({ ...prev, powerRating: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-category">Category</Label>
                  <Select
                    value={customDevice.category}
                    onValueChange={(value) => setCustomDevice(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      {DEVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    onClick={handleAddCustomDevice}
                    disabled={!customDevice.name || customDevice.powerRating <= 0}
                    className="flex-1"
                  >
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {formData.customDevices.length > 0 && (
              <div className="space-y-2">
                {formData.customDevices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {device.powerRating}W • {DEVICE_CATEGORIES.find(c => c.id === device.category)?.name}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomDevice(index)}
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {totalSelectedDevices > 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-energy-consumption/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Home className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Setup Summary</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-primary">{totalSelectedDevices}</div>
                  <div className="text-muted-foreground">Total Devices</div>
                </div>
                <div>
                  <div className="font-medium text-energy-consumption">{(totalPower / 1000).toFixed(1)}kW</div>
                  <div className="text-muted-foreground">Peak Load</div>
                </div>
                <div>
                  <div className="font-medium text-warning">
                    ~{Math.round(totalPower * 8 / 1000)} kWh
                  </div>
                  <div className="text-muted-foreground">Daily Usage</div>
                </div>
                <div>
                  <div className="font-medium text-success">
                    ${(totalPower * 8 * 0.12 / 1000).toFixed(2)}
                  </div>
                  <div className="text-muted-foreground">Daily Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext} 
          className="bg-gradient-energy hover:opacity-90"
        >
          Complete Setup
        </Button>
      </div>
    </div>
  );
}