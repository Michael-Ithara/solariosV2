import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Zap, Sun, Home, Activity, ArrowRight } from 'lucide-react';
import type { OnboardingData } from '../OnboardingWizard';

interface SetupCompleteStepProps {
  data: OnboardingData;
  onComplete: () => void;
  isLoading: boolean;
}

export function SetupCompleteStep({ data, onComplete, isLoading }: SetupCompleteStepProps) {
  const totalDevices = data.devices.selectedDevices.length + data.devices.customDevices.length;
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
          Setup Complete!
        </h2>
        <p className="text-lg text-muted-foreground mb-6">
          Your personalized energy dashboard is ready. Here's what we've configured:
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Location Summary */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Location & Pricing</h3>
                <Badge variant="outline" className="bg-primary/10 text-primary mt-1">
                  {data.location.country}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">City:</span>
                <span className="font-medium">{data.location.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium">{data.location.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Electricity Rate:</span>
                <span className="font-medium">${data.location.electricityRate.toFixed(3)}/kWh</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Meter Summary */}
        <Card className="border-energy-grid/20 bg-gradient-to-br from-energy-grid/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-energy-grid/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-energy-grid" />
              </div>
              <div>
                <h3 className="font-semibold">Smart Meter</h3>
                <Badge variant="outline" className="bg-energy-grid/10 text-energy-grid mt-1">
                  {data.smartMeter.type === 'demo' ? 'Demo Mode' : 'Real Device'}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.smartMeter.type === 'demo' 
                ? 'Virtual smart meter with real-time simulation'
                : `${data.smartMeter.brand} smart meter connected`
              }
            </div>
          </CardContent>
        </Card>

        {/* Solar System Summary */}
        <Card className="border-energy-solar/20 bg-gradient-to-br from-energy-solar/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-energy-solar/10 rounded-lg flex items-center justify-center">
                <Sun className="w-5 h-5 text-energy-solar" />
              </div>
              <div>
                <h3 className="font-semibold">Solar System</h3>
                <Badge variant="outline" className={`mt-1 ${
                  data.solarSystem.hasSystem 
                    ? 'bg-energy-solar/10 text-energy-solar' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {data.solarSystem.hasSystem ? `${data.solarSystem.capacity}kW` : 'No Solar'}
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.solarSystem.hasSystem 
                ? `${data.solarSystem.capacity}kW capacity with ${data.solarSystem.inverterBrand} inverter`
                : 'Grid-only energy monitoring and optimization'
              }
            </div>
          </CardContent>
        </Card>

        {/* Devices Summary */}
        <Card className="border-energy-consumption/20 bg-gradient-to-br from-energy-consumption/5 to-background">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-energy-consumption/10 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-energy-consumption" />
              </div>
              <div>
                <h3 className="font-semibold">Household Devices</h3>
                <Badge variant="outline" className="bg-energy-consumption/10 text-energy-consumption mt-1">
                  {totalDevices} Devices
                </Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {totalDevices > 0 
                ? `Monitoring ${totalDevices} appliances and devices for energy optimization`
                : 'Ready to add devices as you connect them'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Preview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-primary/5 to-energy-solar/5">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-center">What's Next?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Real-time energy monitoring dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>AI-powered optimization insights</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Cost tracking and savings analysis</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Gamified achievements and rewards</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Energy forecasting and planning</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Device simulation and optimization</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={onComplete}
          disabled={isLoading}
          size="lg"
          className="bg-gradient-energy hover:opacity-90 text-lg px-8 py-6"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-3"></div>
              Setting up your dashboard...
            </>
          ) : (
            <>
              Launch My Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-3">
          You can always update these settings later in your profile
        </p>
      </div>
    </div>
  );
}