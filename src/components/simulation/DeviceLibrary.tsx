import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Zap, Clock, Settings } from 'lucide-react';
import { DEVICE_TEMPLATES, DEVICE_CATEGORIES } from '@/data/deviceTemplates';
import { DeviceTemplate } from '@/types/simulation';
import * as Icons from 'lucide-react';

interface DeviceLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (template: DeviceTemplate, customName?: string) => void;
}

export function DeviceLibrary({ isOpen, onClose, onAddDevice }: DeviceLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDevice, setSelectedDevice] = useState<DeviceTemplate | null>(null);
  const [customName, setCustomName] = useState('');

  const filteredDevices = DEVICE_TEMPLATES.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || device.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="h-6 w-6" /> : <Zap className="h-6 w-6" />;
  };

  const handleAddDevice = () => {
    if (selectedDevice) {
      onAddDevice(selectedDevice, customName || selectedDevice.name);
      setSelectedDevice(null);
      setCustomName('');
      onClose();
    }
  };

  const formatPowerRating = (watts: number) => {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)} kW`;
    }
    return `${watts} W`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Device Library
          </DialogTitle>
          <DialogDescription>
            Choose from our collection of smart home devices to add to your simulation
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDevices.map((device) => (
                <Card 
                  key={device.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDevice?.id === device.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedDevice(device)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getIcon(device.icon)}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{device.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {device.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatPowerRating(device.powerRating)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Max Power
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs mb-3">
                      {device.description}
                    </CardDescription>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          Peak: {device.usagePattern.peakHours.length > 0 
                            ? `${device.usagePattern.peakHours[0]}:00-${device.usagePattern.peakHours[device.usagePattern.peakHours.length - 1]}:00`
                            : 'Variable'
                          }
                        </span>
                      </div>
                      
                      {device.features && device.features.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {device.features.slice(0, 2).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs py-0">
                              {feature}
                            </Badge>
                          ))}
                          {device.features.length > 2 && (
                            <Badge variant="secondary" className="text-xs py-0">
                              +{device.features.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Add Device Section */}
          {selectedDevice && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Device Name (Optional)</label>
                  <Input
                    placeholder={selectedDevice.name}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleAddDevice} className="mt-6">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Simulation
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}