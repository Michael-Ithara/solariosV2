import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { LocationStep } from './steps/LocationStep';
import { SmartMeterStep } from './steps/SmartMeterStep';
import { SolarSystemStep } from './steps/SolarSystemStep';
import { DeviceSetupStep } from './steps/DeviceSetupStep';
import { SetupCompleteStep } from './steps/SetupCompleteStep';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    location: {
      country: '',
      city: '',
      timezone: '',
      currency: 'USD',
      electricityRate: 0.12,
    },
    smartMeter: {
      type: 'demo',
    },
    solarSystem: {
      hasSystem: false,
    },
    devices: {
      selectedDevices: [],
      customDevices: [],
    },
  });

  const { user } = useAuth();
  const { updateProfile } = useProfile();

  const updateStepData = (stepId: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [stepId.replace('-', '_').replace('smart_meter', 'smartMeter').replace('solar_system', 'solarSystem')]: data,
    }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update user profile with onboarding data
      await updateProfile({
        currency: onboardingData.location.currency,
        electricity_rate: onboardingData.location.electricityRate,
        solar_panel_capacity: onboardingData.solarSystem.capacity || 0,
        // Mark onboarding as complete
        dashboard_layout: 'personalized',
      });

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
            onUpdate={(data) => updateStepData('location', data)}
            onNext={handleNext}
          />
        );
      case 'smart-meter':
        return (
          <SmartMeterStep
            data={onboardingData.smartMeter}
            onUpdate={(data) => updateStepData('smart-meter', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'solar-system':
        return (
          <SolarSystemStep
            data={onboardingData.solarSystem}
            onUpdate={(data) => updateStepData('solar-system', data)}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'devices':
        return (
          <DeviceSetupStep
            data={onboardingData.devices}
            onUpdate={(data) => updateStepData('devices', data)}
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