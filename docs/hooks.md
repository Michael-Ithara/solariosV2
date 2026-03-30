# Custom React Hooks

All hooks live in `src/hooks/`. They are the primary data and logic layer between pages/components and Supabase.

---

## Hook Catalogue

### `useAIInsights`
**File:** `src/hooks/useAIInsights.tsx`

Fetches AI-generated recommendations and forecasts for the current user.

```ts
const { recommendations, forecasts, loading, error, refetch } = useAIInsights();
```

- Reads from `ai_recommendations` and `ai_forecasts` tables
- Can optionally invoke the `ai-energy-insights` edge function to regenerate insights
- Used in: `Insights.tsx`, `Dashboard.tsx`

---

### `useAutoSimulation`
**File:** `src/hooks/useAutoSimulation.tsx`

Automatically starts the simulation engine when the user is authenticated and their `data_source` is `'simulation'`. Wraps `useSimulation`.

- Used in: `Dashboard.tsx`, `Appliances.tsx`

---

### `useCurrency`
**File:** `src/hooks/useCurrency.tsx`

Multi-currency support for 40+ countries with localized electricity rates and formatting.

```ts
const { currency, formatCurrency, convertAmount, countryCurrencies } = useCurrency();
```

- Reads user's country/currency preference from their profile
- `formatCurrency(amount)` → locale-formatted string
- Used throughout for cost display

---

### `useGamification`
**File:** `src/hooks/useGamification.tsx`

Fetches user's achievement progress, total XP, and computed level.

```ts
const { achievements, userAchievements, totalPoints, level, loading } = useGamification();
```

- Reads `achievements` and `user_achievements` tables
- Used in: `GamificationPanel`, `Dashboard.tsx`, `Insights.tsx`

---

### `useInsightFeedback`
**File:** `src/hooks/useInsightFeedback.tsx`

Tracks user thumbs up/down feedback on AI nudges.

```ts
const { submitFeedback, getFeedback } = useInsightFeedback();
```

- Used in: `InsightsPanel`, `Insights.tsx`

---

### `useLiveAchievements`
**File:** `src/hooks/useLiveAchievements.tsx`

Subscribes to Supabase Realtime on `user_achievements`. Fires a toast notification when an achievement is newly unlocked.

- Called once at app root (`AppRoutes` in `App.tsx`)
- No return value needed — side effect only

---

### `useProfile`
**File:** `src/hooks/useProfile.ts`

Reads and updates the user's `profiles` row.

```ts
const { profile, updateProfile, loading } = useProfile();
```

- Used in: `Settings.tsx`, `Onboarding.tsx`

---

### `useRealTimeEnergyData`
**File:** `src/hooks/useRealTimeEnergyData.ts`

Subscribes to live energy data via Supabase Realtime channel and returns current energy metrics.

```ts
const {
  currentConsumption,   // kW
  currentSolar,         // kW
  gridImport,           // kW
  gridExport,           // kW
  loading,
} = useRealTimeEnergyData();
```

- Used in: `Dashboard.tsx`

---

### `useSimulation`
**File:** `src/hooks/useSimulation.tsx`

The core simulation engine. Manages all simulation state including devices, weather, solar output, grid pricing, and periodic DB writes.

```ts
const {
  isRunning,
  devices,
  weather,
  solarOutput,          // kW
  totalConsumption,     // kW
  gridRate,             // $/kWh
  speedMultiplier,
  startSimulation,
  stopSimulation,
  setSpeedMultiplier,
  addDevice,
  removeDevice,
  toggleDevice,
} = useSimulation();
```

- Used in: `Appliances.tsx`, `EnhancedDemo.tsx`
- See [simulation.md](./simulation.md) for the full model description

---

### `useSmartMeterData`
**File:** `src/hooks/useSmartMeterData.ts`

Fetches smart meter configurations and readings from the `smart_meters` table.

- Used in: `Dashboard.tsx` (when `data_source === 'iot'`)

---

### `useSupabaseData`
**File:** `src/hooks/useSupabaseData.ts`

General-purpose data fetching hook. Fetches the main user data bundle:

```ts
const {
  appliances,
  energyLogs,
  solarData,
  alerts,
  userPoints,
  loading,
  refetch,
} = useSupabaseData();
```

- Used across multiple pages as the primary data source

---

### `useUnifiedEnergyData`
**File:** `src/hooks/useUnifiedEnergyData.tsx`

Merges data from simulation state and Supabase to provide a unified energy data object regardless of data source.

```ts
const {
  consumption,
  solar,
  grid,
  cost,
  historicalData,
} = useUnifiedEnergyData();
```

- Abstracts over whether user is in simulation or IoT mode
- Used in: `Analytics.tsx`, `Reports.tsx`

---

### `useWeatherAndPricing`
**File:** `src/hooks/useWeatherAndPricing.tsx`

Fetches real or simulated weather data and current grid electricity pricing.

```ts
const {
  weather,        // temperature, condition, humidity
  gridPrice,      // current $/kWh
  loading,
} = useWeatherAndPricing();
```

- Used in: `WeatherWidget`, `GridPricingWidget`, `Dashboard.tsx`

---

## Utility Hooks

| Hook | File | Purpose |
|------|------|---------|
| `use-mobile` | `src/hooks/use-mobile.tsx` | Detects mobile viewport (returns boolean) |
| `use-toast` | `src/hooks/use-toast.ts` | ShadCN toast state (prefer Sonner for new toasts) |
