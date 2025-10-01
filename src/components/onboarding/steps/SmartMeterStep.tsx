import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, Smartphone, Wifi, Zap } from 'lucide-react';

interface SmartMeterStepProps {
  data: {
    type: 'demo' | 'real';
    brand?: string;
    model?: string;
    connectionMethod?: string;
  };
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const METER_BRANDS = [
  { id: 'landis-gyr', name: 'Landis+Gyr', popular: true },
  { id: 'itron', name: 'Itron', popular: true },
  { id: 'sensus', name: 'Sensus', popular: true },
  { id: 'aclara', name: 'Aclara', popular: false },
  { id: 'elster', name: 'Elster', popular: false },
  { id: 'ge', name: 'General Electric', popular: false },
  { id: 'other', name: 'Other', popular: false },
];

const CONNECTION_METHODS = [
  { id: 'utility-api', name: 'Utility API', description: 'Connect through your utility company', icon: Wifi },
  { id: 'green-button', name: 'Green Button', description: 'Download and import data', icon: Activity },
  { id: 'manual', name: 'Manual Entry', description: 'Enter readings manually', icon: Smartphone },
];

export function SmartMeterStep({ data, onUpdate, onNext, onBack }: SmartMeterStepProps) {
  const [formData, setFormData] = useState(data);
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [validating, setValidating] = useState(false);
  const { user } = useAuth();

  const handleFieldChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const isValid = formData.type === 'demo' || (formData.brand && formData.connectionMethod);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-energy-grid to-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-energy-grid-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Connect Your Smart Meter</h2>
        <p className="text-muted-foreground">
          Your smart meter is the central hub that tracks all your energy usage
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Choose Your Setup</Label>
          <RadioGroup
            value={formData.type}
            onValueChange={(value) => handleFieldChange('type', value)}
            className="space-y-4"
          >
            <Card className="border-2 transition-colors hover:border-primary/50 cursor-pointer" 
                  onClick={() => handleFieldChange('type', 'demo')}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <RadioGroupItem value="demo" id="demo" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="demo" className="cursor-pointer text-base font-semibold">
                        Demo Mode
                      </Label>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Experience Solarios with a fully simulated smart home including solar panels, 
                      smart meter, and various appliances. Perfect for exploring all features.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">Virtual Smart Meter</Badge>
                      <Badge variant="outline" className="text-xs">Solar System</Badge>
                      <Badge variant="outline" className="text-xs">Smart Appliances</Badge>
                      <Badge variant="outline" className="text-xs">Real-time Data</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 transition-colors hover:border-primary/50 cursor-pointer"
                  onClick={() => handleFieldChange('type', 'real')}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <RadioGroupItem value="real" id="real" className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="real" className="cursor-pointer text-base font-semibold">
                        Real Smart Meter
                      </Label>
                      <Badge variant="outline" className="bg-warning/10 text-warning">
                        Coming Soon
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect your actual smart meter or energy monitoring device to track 
                      real energy usage and get personalized insights.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">Real Device</Badge>
                      <Badge variant="outline" className="text-xs">Live Monitoring</Badge>
                      <Badge variant="outline" className="text-xs">Accurate Data</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        {formData.type === 'real' && (
          <div className="space-y-6 border-t pt-6">
            <div className="space-y-4">
              <Label>Smart Meter Brand</Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => handleFieldChange('brand', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your smart meter brand" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {METER_BRANDS.map((brand) => (
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

            <div className="space-y-4">
              <Label>Connection Method</Label>
              <div className="grid gap-3">
                {CONNECTION_METHODS.map((method) => (
                  <Card 
                    key={method.id}
                    className={`border-2 transition-colors cursor-pointer hover:border-primary/50 ${
                      formData.connectionMethod === method.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleFieldChange('connectionMethod', method.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <method.icon className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <h4 className="font-medium">{method.name}</h4>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                        {method.id === 'utility-api' && (
                          <Badge variant="outline" className="bg-success/10 text-success">
                            Automatic
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Minimal credentials form for Utility API */}
            {formData.connectionMethod === 'utility-api' && (
              <div className="space-y-4">
                <Label>Connect to Utility</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meter-account">Utility Account ID</Label>
                    <Input id="meter-account" value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g., 12345" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meter-api">API Key / Token</Label>
                    <Input id="meter-api" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste token" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={validating || !apiKey || !accountId}
                    onClick={async () => {
                      if (!user) return;
                      try {
                        setValidating(true);
                        // Simulate validation by storing a redacted record in a private table
                        const { error } = await supabase
                          .from('user_integrations')
                          .upsert({
                            user_id: user.id,
                            provider: 'utility',
                            account_id: accountId,
                            // NEVER store raw api keys in client DB in production; this is a placeholder
                            masked_key: apiKey ? `****${apiKey.slice(-4)}` : null,
                          });
                        if (error) throw error;
                        const updated = { ...formData, validated: true } as any;
                        setFormData(updated);
                        onUpdate(updated);
                      } catch (err) {
                        console.error('Validation failed:', err);
                        const updated = { ...formData, validated: false } as any;
                        setFormData(updated);
                        onUpdate(updated);
                      } finally {
                        setValidating(false);
                      }
                    }}
                    className="bg-primary"
                  >
                    {validating ? 'Validating...' : 'Test Connection'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {formData.type === 'demo' && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-energy-solar/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Demo Features</h3>
              </div>
              <div className="text-sm space-y-2 text-muted-foreground">
                <div>• Realistic smart meter readings updated in real-time</div>
                <div>• Simulated solar panel system with weather-based generation</div>
                <div>• Virtual appliances with usage patterns</div>
                <div>• AI insights and energy optimization recommendations</div>
                <div>• Full dashboard experience with historical data</div>
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
          disabled={!isValid}
          className="bg-gradient-energy hover:opacity-90"
        >
          Continue to Solar Setup
        </Button>
      </div>
    </div>
  );
}