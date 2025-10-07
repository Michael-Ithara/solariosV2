import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingState {
  currentStepIndex: number;
  stepsOrder: string[];
  data: Record<string, any>;
  version: number;
}

interface OnboardingContextValue {
  state: OnboardingState;
  setStepIndex: (idx: number) => void;
  updateStepData: (stepId: string, partial: any) => void;
  persist: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_STEPS = ['location', 'smart-meter', 'solar-system', 'devices', 'complete'];
const STORAGE_KEY = 'onboarding_state_v1';
const CURRENT_VERSION = 1;

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OnboardingState;
        return {
          currentStepIndex: parsed.currentStepIndex ?? 0,
          stepsOrder: parsed.stepsOrder?.length ? parsed.stepsOrder : DEFAULT_STEPS,
          data: parsed.data || {},
          version: CURRENT_VERSION
        };
      }
    } catch {}
    return {
      currentStepIndex: 0,
      stepsOrder: DEFAULT_STEPS,
      data: {},
      version: CURRENT_VERSION
    };
  });

  // Hydrate from user metadata if available (resume across devices)
  useEffect(() => {
    try {
      const metaState = (user?.user_metadata as any)?.onboarding_state as Partial<OnboardingState> | undefined;
      if (metaState && typeof metaState.currentStepIndex === 'number') {
        setState(prev => ({
          currentStepIndex: Math.max(prev.currentStepIndex, metaState.currentStepIndex || 0),
          stepsOrder: metaState.stepsOrder?.length ? metaState.stepsOrder : (prev.stepsOrder?.length ? prev.stepsOrder : DEFAULT_STEPS),
          data: prev.data, // keep richer local form data; metadata only tracks progression
          version: CURRENT_VERSION
        }));
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const setStepIndex = useCallback((idx: number) => {
    setState(prev => ({ ...prev, currentStepIndex: Math.max(0, Math.min(idx, prev.stepsOrder.length - 1)) }));
  }, []);

  const updateStepData = useCallback((stepId: string, partial: any) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [stepId]: { ...(prev.data?.[stepId] || {}), ...partial }
      }
    }));
  }, []);

  const persist = useCallback(async () => {
    if (!user) return;
    try {
      await supabase.auth.updateUser({ data: {
        onboarding_state: {
          currentStepIndex: state.currentStepIndex,
          stepsOrder: state.stepsOrder,
          version: state.version
        }
      }});
    } catch {}
  }, [state, user]);

  const reset = useCallback(() => {
    setState({ currentStepIndex: 0, stepsOrder: DEFAULT_STEPS, data: {}, version: CURRENT_VERSION });
  }, []);

  const value = useMemo(() => ({ state, setStepIndex, updateStepData, persist, reset }), [state, setStepIndex, updateStepData, persist, reset]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}


