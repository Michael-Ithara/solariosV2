import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { LocationStep } from './steps/LocationStep';
import { SmartMeterStep } from './steps/SmartMeterStep';
import { SolarSystemStep } from './steps/SolarSystemStep';
import { DeviceSetupStep } from './steps/DeviceSetupStep';
import { SetupCompleteStep } from './steps/SetupCompleteStep';
import { useOnboarding } from '@/contexts/OnboardingContext';

export interface OnboardingData {
  location: {
    country: string;
    city: string;
    timezone: string;
    currency: string;
    electricityRate: number;
  };
  smartMeter: {
    type: 'demo' | 'real';
    brand?: string;
    model?: string;
    connectionMethod?: string;
  };
  solarSystem: {
    hasSystem: boolean;
    capacity?: number;
    panelCount?: number;
    inverterBrand?: string;
    installDate?: string;
  };
  devices: {
    selectedDevices: string[];
    customDevices: Array<{
      name: string;
      powerRating: number;
      category: string;
    }>;
  };
}

const STEPS = [
  { id: 'location', title: 'Location & Currency', description: 'Set your location and energy rates' },
  { id: 'smart-meter', title: 'Smart Meter', description: 'Connect your energy monitoring hub' },
  { id: 'solar-system', title: 'Solar System', description: 'Configure your solar installation' },
  { id: 'devices', title: 'Household Devices', description: 'Add your appliances and devices' },
  { id: 'complete', title: 'Setup Complete', description: 'Your personalized dashboard awaits' },
];

export function OnboardingWizard() {
  const [isLoading, setIsLoading] = useState(false);
  const { state, setStepIndex, updateStepData, persist, reset } = useOnboarding();
  const currentStep = state.currentStepIndex;

  const onboardingData = useMemo<OnboardingData>(() => ({
    location: {
      country: state.data?.location?.country || '',
      city: state.data?.location?.city || '',
      timezone: state.data?.location?.timezone || '',
      currency: state.data?.location?.currency || 'USD',
      electricityRate: state.data?.location?.electricityRate ?? 0.12,
    },
    smartMeter: {
      type: (state.data?.['smart-meter']?.type as 'demo' | 'real') || 'demo',
      brand: state.data?.['smart-meter']?.brand,
      model: state.data?.['smart-meter']?.model,
      connectionMethod: state.data?.['smart-meter']?.connectionMethod,
      ...(state.data?.['smart-meter'] || {}),
    },
    solarSystem: {
      hasSystem: state.data?.['solar-system']?.hasSystem ?? false,
      capacity: state.data?.['solar-system']?.capacity,
      panelCount: state.data?.['solar-system']?.panelCount,
      inverterBrand: state.data?.['solar-system']?.inverterBrand,
      installDate: state.data?.['solar-system']?.installDate,
    },
    devices: {
      selectedDevices: state.data?.devices?.selectedDevices || [],
      customDevices: state.data?.devices?.customDevices || [],
    },
  }), [state]);

  // Catalog to resolve selected onboarding device IDs to concrete name/power
  const ONBOARDING_DEVICE_CATALOG: Record<string, { name: string; power: number }> = {
    // heating-cooling
    'central-air': { name: 'Central Air Conditioning', power: 3500 },
    'heat-pump': { name: 'Heat Pump', power: 3000 },
    'electric-heater': { name: 'Electric Heater', power: 1500 },
    'ceiling-fan': { name: 'Ceiling Fan', power: 75 },
    // kitchen
    'refrigerator': { name: 'Refrigerator', power: 150 },
    'dishwasher': { name: 'Dishwasher', power: 1800 },
    'oven': { name: 'Electric Oven', power: 3000 },
    'microwave': { name: 'Microwave', power: 1000 },
    'coffee-maker': { name: 'Coffee Maker', power: 1200 },
    // laundry
    'washer': { name: 'Washing Machine', power: 2000 },
    'dryer': { name: 'Electric Dryer', power: 3000 },
    // electronics
    'tv-55': { name: '55" LED TV', power: 150 },
    'desktop-pc': { name: 'Desktop Computer', power: 500 },
    'laptop': { name: 'Laptop', power: 65 },
    'gaming-console': { name: 'Gaming Console', power: 180 },
    // lighting
    'led-bulbs': { name: 'LED Light Bulbs (10x)', power: 100 },
    'outdoor-lights': { name: 'Outdoor Lighting', power: 200 },
    // other
    'water-heater': { name: 'Electric Water Heater', power: 4000 },
    'pool-pump': { name: 'Pool Pump', power: 1500 },
    'ev-charger': { name: 'EV Charger', power: 7000 },
  };

  const { user, refreshUser } = useAuth();
  const { updateProfile } = useProfile();

  const handleUpdateStepData = (stepId: string, data: any) => {
    updateStepData(stepId, data);
    void persist();
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      // Require validation for real smart meter before proceeding past that step
      const currentId = STEPS[currentStep].id;
      // Persist step-specific data to DB as we advance
      try {
        if (currentId === 'location') {
          await updateProfile({
            currency: onboardingData.location.currency,
            electricity_rate: onboardingData.location.electricityRate,
          });
        }
        if (currentId === 'solar-system') {
          await updateProfile({
            solar_panel_capacity: onboardingData.solarSystem.capacity || 0,
          });
        }
        if (currentId === 'smart-meter') {
          const sm = onboardingData.smartMeter as any;
          if (sm.type === 'real' && sm.validated) {
            await supabase.auth.updateUser({
              data: {
                meterConnected: true,
                meterBrand: sm.brand || null,
                meterMethod: sm.connectionMethod || null,
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to persist step data:', e);
      }
      if (currentId === 'smart-meter') {
        const sm = onboardingData.smartMeter as any;
        if (sm.type === 'real' && !sm.validated) {
          console.warn('Please test and validate your smart meter connection before continuing.');
          return;
        }
      }
      setStepIndex(currentStep + 1);
      await persist();
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStepIndex(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update user metadata to mark onboarding as complete
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      });
      
      if (metadataError) throw metadataError;

      // Update user profile with onboarding data
      await updateProfile({
        currency: onboardingData.location.currency,
        electricity_rate: onboardingData.location.electricityRate,
        solar_panel_capacity: onboardingData.solarSystem.capacity || 0,
        dashboard_layout: 'personalized',
      });

      // If user connected a real smart meter and validated, persist minimal metadata
      if ((onboardingData.smartMeter as any)?.type === 'real' && (onboardingData.smartMeter as any)?.validated) {
        const { error: metaErr } = await supabase.auth.updateUser({
          data: {
            meterConnected: true,
            meterBrand: (onboardingData.smartMeter as any)?.brand || null,
            meterMethod: (onboardingData.smartMeter as any)?.connectionMethod || null,
          }
        });
        if (metaErr) {
          console.error('Failed to persist meter metadata:', metaErr);
        }
      }

      // Persist selected devices into appliances table (deduplicate existing)
      try {
        const selectedIds = onboardingData.devices.selectedDevices || [];
        const custom = onboardingData.devices.customDevices || [];
        const rows = [
          ...selectedIds
            .map(id => ({ id, meta: ONBOARDING_DEVICE_CATALOG[id] }))
            .filter(item => !!item.meta)
            .map(item => ({
              user_id: user.id,
              name: item.meta!.name,
              power_rating_w: item.meta!.power,
              status: 'off',
              total_kwh: 0
            })),
          ...custom.map(dev => ({
            user_id: user.id,
            name: dev.name,
            power_rating_w: dev.powerRating,
            status: 'off',
            total_kwh: 0
          }))
        ];
        if (rows.length > 0) {
          // Fetch existing appliance names for user to avoid duplicates
          const { data: existing, error: existingErr } = await supabase
            .from('appliances')
            .select('name')
            .eq('user_id', user.id);
          if (existingErr) throw existingErr;
          const existingNames = new Set((existing || []).map(a => (a as any).name as string));
          const filtered = rows.filter(r => !existingNames.has(r.name));
          if (filtered.length > 0) {
            await supabase.from('appliances').insert(filtered);
          }
        }
      } catch (e) {
        console.error('Failed to persist onboarding devices:', e);
      }

      // Mark onboarding as complete in user metadata
      const { data: updatedUser, error: metaError } = await supabase.auth.updateUser({
        data: { onboardingComplete: true, onboarding_version: 1 }
      });
      if (metaError) {
        console.error('Failed to set onboardingComplete metadata:', metaError);
      }

      // Refresh session/user so route guards see the flag immediately
      await refreshUser();

      // Clear local onboarding state
      reset();

      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'location':
        return (
          <LocationStep
            data={onboardingData.location}
            onUpdate={(data) => handleUpdateStepData('location', data)}
            onNext={handleNext}
          />
        );
      case 'smart-meter':
        return (
          <SmartMeterStep
            data={onboardingData.smartMeter}
            onUpdate={(data) => handleUpdateStepData('smart-meter', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'solar-system':
        return (
          <SolarSystemStep
            data={onboardingData.solarSystem}
            onUpdate={(data) => handleUpdateStepData('solar-system', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'devices':
        return (
          <DeviceSetupStep
            data={onboardingData.devices}
            onUpdate={(data) => handleUpdateStepData('devices', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'complete':
        return (
          <SetupCompleteStep
            data={onboardingData}
            onComplete={completeOnboarding}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-energy rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-energy-solar bg-clip-text text-transparent">
                Solarios Setup
              </h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center text-center max-w-[120px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  index < currentStep 
                    ? 'bg-success text-success-foreground' 
                    : index === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="text-xs font-medium text-foreground">{step.title}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-primary/20 bg-gradient-to-br from-background/80 to-primary/5 backdrop-blur-sm">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}