import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, DollarSign, Zap } from 'lucide-react';
import { useCurrency, getCurrencyInfo } from '@/hooks/useCurrency';
import timezones from '@/lib/timezones.json';
import countries from '@/lib/countries.json';

interface LocationStepProps {
  data: {
    country: string;
    city: string;
    timezone: string;
    currency: string;
    electricityRate: number;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const COMMON_RATES = {
  US: 0.12,
  CA: 0.14,
  GB: 0.28,
  DE: 0.32,
  AU: 0.25,
  JP: 0.26,
  FR: 0.21,
  ES: 0.24,
  IT: 0.23,
  NL: 0.23,
};

export function LocationStep({ data, onUpdate, onNext }: LocationStepProps) {
  const { currency, formatCurrency, formatRate, isLoading: currencyLoading } = useCurrency();
  const [formData, setFormData] = useState(data);

  useEffect(() => {
    if (currency && !formData.country) {
      setFormData(prev => ({
        ...prev,
        currency: currency.code,
        country: countries.find(c => c.code === (currency.code === 'USD' ? 'US' : (currency.code === 'CAD' ? 'CA' : (currency.code === 'GBP' ? 'GB' : 'US'))))?.code || 'US',
        electricityRate: currency.rate,
      }));
    }
  }, [currency, formData.country]);

  const handleFieldChange = (field: string, value: string | number) => {
    const updated = { ...formData, [field]: value };
    
    // Update electricity rate based on country
    if (field === 'country') {
      updated.electricityRate = COMMON_RATES[value as keyof typeof COMMON_RATES] || 0.12;
    }
    
    setFormData(updated);
    onUpdate(updated);
  };

  const isValid = formData.country && formData.city && formData.electricityRate > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Set Your Location</h2>
        <p className="text-muted-foreground">
          We'll customize energy rates and currency for your location
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country/Region</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => {
                const currencyInfo = getCurrencyInfo(value);
                const next = { ...formData, country: value, currency: currencyInfo.code, electricityRate: currencyInfo.rate };
                setFormData(next);
                onUpdate(next);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border max-h-64 overflow-y-auto">
                {countries.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Enter your city"
              value={formData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleFieldChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auto-detected timezone" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border max-h-64 overflow-y-auto">
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-energy-solar/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Energy Pricing</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    {currencyLoading ? 'Detecting...' : `Detected: ${currency?.name || 'USD'}`}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="electricityRate">Electricity Rate</Label>
                  <div className="relative">
                    <Input
                      id="electricityRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.12"
                      value={formData.electricityRate}
                      onChange={(e) => handleFieldChange('electricityRate', parseFloat(e.target.value) || 0)}
                      className="pr-16"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      per kWh
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRate(formData.electricityRate)} - Check your utility bill for exact rates
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-energy-grid/20 bg-gradient-to-br from-energy-grid/5 to-background">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-energy-grid" />
                <h3 className="font-semibold">Regional Info</h3>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span>{currency?.name || 'US Dollar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span>{currency?.symbol || '$'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Rate:</span>
                  <span>{formatRate(COMMON_RATES[formData.country as keyof typeof COMMON_RATES] || 0.12)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="bg-gradient-energy hover:opacity-90"
        >
          Continue to Smart Meter Setup
        </Button>
      </div>
    </div>
  );
}