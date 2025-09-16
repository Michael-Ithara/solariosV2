import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Sun, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SolarSystemStepProps {
  data: {
    hasSystem: boolean;
    capacity?: number;
    panelCount?: number;
    inverterBrand?: string;
    installDate?: string;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const INVERTER_BRANDS = [
  { id: 'tesla', name: 'Tesla', popular: true },
  { id: 'enphase', name: 'Enphase', popular: true },
  { id: 'solaredge', name: 'SolarEdge', popular: true },
  { id: 'sma', name: 'SMA', popular: true },
  { id: 'fronius', name: 'Fronius', popular: false },
  { id: 'abb', name: 'ABB', popular: false },
  { id: 'other', name: 'Other', popular: false },
];

export function SolarSystemStep({ data, onUpdate, onNext, onBack }: SolarSystemStepProps) {
  const [formData, setFormData] = useState(data);
  const [installDate, setInstallDate] = useState<Date | undefined>(
    data.installDate ? new Date(data.installDate) : undefined
  );

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleDateChange = (date: Date | undefined) => {
    setInstallDate(date);
    handleFieldChange('installDate', date ? date.toISOString() : '');
  };

  const isValid = !formData.hasSystem || (formData.capacity && formData.capacity > 0);

  // Calculate estimated panel count based on capacity
  const estimatedPanels = formData.capacity ? Math.round(formData.capacity * 1000 / 400) : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-energy-solar to-warning rounded-full flex items-center justify-center mx-auto mb-4">
          <Sun className="w-8 h-8 text-energy-solar-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Solar System Setup</h2>
        <p className="text-muted-foreground">
          Tell us about your solar installation to track energy generation
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Do you have solar panels installed?</Label>
          <RadioGroup
            value={formData.hasSystem ? 'yes' : 'no'}
            onValueChange={(value) => handleFieldChange('hasSystem', value === 'yes')}
            className="space-y-4"
          >
            <Card className="border-2 transition-colors hover:border-primary/50 cursor-pointer"
                  onClick={() => handleFieldChange('hasSystem', true)}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <RadioGroupItem value="yes" id="yes" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="yes" className="cursor-pointer text-base font-semibold">
                        Yes, I have solar panels
                      </Label>
                      <Badge variant="outline" className="bg-energy-solar/10 text-energy-solar">
                        <Sun className="w-3 h-3 mr-1" />
                        Solar Powered
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track your solar generation, monitor performance, and optimize energy usage
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 transition-colors hover:border-primary/50 cursor-pointer"
                  onClick={() => handleFieldChange('hasSystem', false)}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <RadioGroupItem value="no" id="no" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="no" className="cursor-pointer text-base font-semibold">
                        No solar panels
                      </Label>
                      <Badge variant="outline" className="bg-energy-grid/10 text-energy-grid">
                        <Zap className="w-3 h-3 mr-1" />
                        Grid Only
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Focus on energy consumption monitoring and optimization opportunities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        {formData.hasSystem && (
          <div className="space-y-6 border-t pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">System Capacity (kW)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="5.5"
                    value={formData.capacity || ''}
                    onChange={(e) => handleFieldChange('capacity', parseFloat(e.target.value) || 0)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Total rated capacity of your solar system
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panelCount">Number of Panels</Label>
                  <Input
                    id="panelCount"
                    type="number"
                    min="0"
                    placeholder={estimatedPanels.toString()}
                    value={formData.panelCount || ''}
                    onChange={(e) => handleFieldChange('panelCount', parseInt(e.target.value) || 0)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {formData.capacity && `Estimated ${estimatedPanels} panels for ${formData.capacity}kW system`}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Inverter Brand</Label>
                  <Select
                    value={formData.inverterBrand}
                    onValueChange={(value) => handleFieldChange('inverterBrand', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select inverter brand" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      {INVERTER_BRANDS.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          <div className="flex items-center gap-2">
                            {brand.name}
                            {brand.popular && (
                              <Badge variant="secondary" className="text-xs">Popular</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Installation Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !installDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {installDate ? format(installDate, "PPP") : "Pick installation date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={installDate}
                        onSelect={handleDateChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="text-xs text-muted-foreground">
                    When were your solar panels installed?
                  </div>
                </div>
              </div>
            </div>

            {formData.capacity && (
              <Card className="border-energy-solar/20 bg-gradient-to-br from-energy-solar/5 to-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Sun className="w-5 h-5 text-energy-solar" />
                    <h3 className="font-semibold">System Overview</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-energy-solar">{formData.capacity}kW</div>
                      <div className="text-muted-foreground">Total Capacity</div>
                    </div>
                    <div>
                      <div className="font-medium text-energy-solar">{estimatedPanels}</div>
                      <div className="text-muted-foreground">Est. Panels</div>
                    </div>
                    <div>
                      <div className="font-medium text-energy-solar">
                        {Math.round((formData.capacity || 0) * 4.5 * 365)} kWh
                      </div>
                      <div className="text-muted-foreground">Annual Generation</div>
                    </div>
                    <div>
                      <div className="font-medium text-success">
                        ~$1,{Math.round((formData.capacity || 0) * 4.5 * 365 * 0.12 / 100) * 100}
                      </div>
                      <div className="text-muted-foreground">Annual Savings</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-gradient-energy hover:opacity-90"
        >
          Continue to Device Setup
        </Button>
      </div>
    </div>
  );
}