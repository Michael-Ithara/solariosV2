import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

export default function Onboarding() {
  return (
    <OnboardingProvider>
      <OnboardingWizard />
    </OnboardingProvider>
  );
}