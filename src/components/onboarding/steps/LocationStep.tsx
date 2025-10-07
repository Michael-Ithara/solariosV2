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

const COUNTRIES = [
  { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' }, { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' }, { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' }, { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' }, { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' }, { code: 'IE', name: 'Ireland' },
  { code: 'JP', name: 'Japan' }, { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' }, { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' }, { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' }, { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' }, { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' }, { code: 'VN', name: 'Vietnam' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' }, { code: 'TR', name: 'Turkey' },
  { code: 'ZA', name: 'South Africa' }, { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' }, { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' }, { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'America/Toronto', label: 'Toronto' },
  { value: 'America/Vancouver', label: 'Vancouver' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
  { value: 'America/Santiago', label: 'Santiago' },
  { value: 'America/Bogota', label: 'Bogotá' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam' },
  { value: 'Europe/Brussels', label: 'Brussels' },
  { value: 'Europe/Vienna', label: 'Vienna' },
  { value: 'Europe/Zurich', label: 'Zurich' },
  { value: 'Europe/Stockholm', label: 'Stockholm' },
  { value: 'Europe/Oslo', label: 'Oslo' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen' },
  { value: 'Europe/Helsinki', label: 'Helsinki' },
  { value: 'Europe/Warsaw', label: 'Warsaw' },
  { value: 'Europe/Prague', label: 'Prague' },
  { value: 'Europe/Lisbon', label: 'Lisbon' },
  { value: 'Europe/Athens', label: 'Athens' },
  { value: 'Europe/Dublin', label: 'Dublin' },
  { value: 'Europe/Istanbul', label: 'Istanbul' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Kolkata' },
  { value: 'Asia/Bangkok', label: 'Bangkok' },
  { value: 'Asia/Jakarta', label: 'Jakarta' },
  { value: 'Asia/Manila', label: 'Manila' },
  { value: 'Asia/Taipei', label: 'Taipei' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Riyadh', label: 'Riyadh' },
  { value: 'Asia/Jerusalem', label: 'Jerusalem' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Australia/Melbourne', label: 'Melbourne' },
  { value: 'Australia/Brisbane', label: 'Brisbane' },
  { value: 'Australia/Perth', label: 'Perth' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg' },
  { value: 'Africa/Lagos', label: 'Lagos' },
  { value: 'Africa/Cairo', label: 'Cairo' },
];

const COMMON_RATES: Record<string, number> = {
  US: 0.12, CA: 0.16, GB: 0.25, AU: 0.18, NZ: 0.20, DE: 0.30, FR: 0.28,
  ES: 0.25, IT: 0.32, NL: 0.35, BE: 0.27, AT: 0.22, CH: 0.25, SE: 0.15,
  NO: 0.12, DK: 0.28, FI: 0.17, PL: 0.13, CZ: 0.13, PT: 0.21, GR: 0.19,
  IE: 0.28, JP: 0.19, KR: 0.12, CN: 0.08, IN: 0.12, SG: 0.17, HK: 0.13,
  TW: 0.10, MY: 0.09, TH: 0.12, ID: 0.10, PH: 0.11, VN: 0.08, AE: 0.09,
  SA: 0.05, IL: 0.16, TR: 0.10, ZA: 0.10, NG: 0.15, EG: 0.08, BR: 0.13,
  MX: 0.11, AR: 0.08, CL: 0.16, CO: 0.14,
};

export function LocationStep({ data, onUpdate, onNext }: LocationStepProps) {
  const { currency, formatCurrency, formatRate, isLoading: currencyLoading, manuallySetCurrency } = useCurrency();
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
    
    // Update electricity rate and currency based on country
    if (field === 'country') {
      updated.electricityRate = COMMON_RATES[value as string] || 0.12;
      // Update currency to match selected country
      manuallySetCurrency(value as string);
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
              <SelectContent className="bg-background border border-border">
                {COUNTRIES.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
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
              <SelectContent className="bg-background border border-border">
                {TIMEZONES.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
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
                  <span>{formatRate(COMMON_RATES[formData.country] || 0.12)}</span>
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