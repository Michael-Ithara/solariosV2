# Onboarding

## Overview

New users are automatically redirected to the onboarding wizard after their first login. The wizard collects essential setup information before the user can access the main app.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/Onboarding.tsx` | Onboarding page — renders the wizard |
| `src/contexts/OnboardingContext.tsx` | Wizard state (current step, collected data) |
| `src/components/onboarding/OnboardingWizard.tsx` | Step container with progress indicator |
| `src/components/onboarding/steps/` | Individual step components |

---

## Onboarding Gate

The gate lives in `AppRoutes` inside `src/App.tsx`:

```ts
const onboardingComplete = Boolean(
  user && (
    user.user_metadata?.onboardingComplete === true ||
    user.user_metadata?.onboarding_completed === true  // legacy flag
  )
);

if (needsOnboarding) {
  // Lock all routes to /onboarding
}
```

Until onboarding is marked complete, every route redirects to `/onboarding`.

---

## Wizard Steps

### Step 1 — Location
**File:** `src/components/onboarding/steps/LocationStep.tsx`

- User selects their country and timezone
- Used to set localized electricity rates and solar peak hours
- Data saved to `profiles.country` and `profiles.timezone`

---

### Step 2 — Solar System
**File:** `src/components/onboarding/steps/SolarStep.tsx`

- User inputs solar panel capacity (kW) or indicates they don't have solar
- Optional: installation date, inverter brand
- Data saved to `profiles.solar_capacity` (and `inverters` table if applicable)

---

### Step 3 — Smart Meter / Data Source
**File:** `src/components/onboarding/steps/SmartMeterStep.tsx`

- User chooses data source:
  - **Simulation** — use the built-in IoT device simulator
  - **Smart meter** — connect a physical smart meter
- Sets `profiles.data_source` to `'simulation'` or `'iot'`

---

### Step 4 — Device Setup
**File:** `src/components/onboarding/steps/DeviceStep.tsx`

- User selects devices from the template library (`src/data/deviceTemplates.ts`)
- Selected devices are saved to `appliances` table
- Seeds the initial device list for the simulation engine

---

### Step 5 — Completion
**File:** `src/components/onboarding/steps/CompletionStep.tsx`

- Congratulatory screen
- Calls `supabase.auth.updateUser({ data: { onboardingComplete: true } })` to set the completion flag in `user_metadata`
- After this, `AppRoutes` allows access to the full app

---

## OnboardingContext

**File:** `src/contexts/OnboardingContext.tsx`

Manages wizard state across steps:

```ts
interface OnboardingContextType {
  currentStep: number;
  totalSteps: number;
  data: OnboardingData;        // Accumulated form data
  nextStep: () => void;
  prevStep: () => void;
  updateData: (partial: Partial<OnboardingData>) => void;
  completeOnboarding: () => Promise<void>;
}
```

---

## Skipping / Re-triggering Onboarding

To force a user back through onboarding, clear the flag in Supabase:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'onboardingComplete' - 'onboarding_completed'
WHERE id = '<user-uuid>';
```

Or via the admin panel in the app.
