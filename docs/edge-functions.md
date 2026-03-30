# Supabase Edge Functions

All edge functions run on **Deno** in the Supabase edge runtime. They live in `supabase/functions/<function-name>/index.ts`.

**Project:** `omxvkzykghrcbvoyayjs`

Invoke from the frontend:
```ts
import { supabase } from '@/integrations/supabase/client';
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ...payload },
});
```

---

## `ai-energy-insights`

**Directory:** `supabase/functions/ai-energy-insights/`

**Purpose:** Generates AI energy-saving nudges and monthly consumption forecasts using an XGBoost model exported to ONNX.

**Trigger:** Called from frontend (`useAIInsights` hook) with user context payload.

**Key behavior:**
- Lazy-loads `xgboost_energy_model.onnx` on first invocation
- Extracts 12-feature vector from user context (consumption, solar, occupants, home size, etc.)
- Runs ONNX inference via `onnxruntime-web` (WASM provider)
- Selects and renders nudge templates based on context
- Saves results to `ai_recommendations` and `ai_forecasts` tables
- Falls back to heuristic forecast if ONNX model fails

**Input payload:**
```ts
{
  avgDailyConsumption: number,  // kWh
  avgDailySolar: number,        // kWh
  netUsage: number,
  peakHour: number,
  occupants: number,
  homeSize: number,             // sq ft
  solarCapacity: number,        // kW
  batteryCapacity: number,      // kWh
  electricityRate: number,
  growthRate: number,
}
```

**Auth:** Accepts `Authorization: Bearer <user-jwt>` header.

See [ai-insights.md](./ai-insights.md) for full details.

---

## `check-gamification`

**Directory:** `supabase/functions/check-gamification/`

**Purpose:** Processes CO₂ tracking and unlocks achievements for users.

**Trigger:**
- `GET` — processes all users with `data_source` in `['simulation', 'iot']`
- `POST` with `{ userId }` — processes a single user (manual trigger)

**Key behavior:**
- CO₂ saved = `solar_kwh × 0.233 kg/kWh`
- Evaluates achievement criteria for each user
- Sets `user_achievements.unlocked = true` and writes `unlocked_at` when criteria met
- Uses **service role key** (bypasses RLS) to access all users' data

**Auth:** Requires service role key (not intended for direct client calls — should be invoked by a scheduled cron or server-side trigger).

See [gamification.md](./gamification.md) for full details.

---

## `backfill-historical-data`

**Directory:** `supabase/functions/backfill-historical-data/`

**Purpose:** Seeds historical energy data (energy logs and solar data) for a user, used for testing and demo purposes.

**Trigger:** Manual POST from admin panel or developer tooling.

**Input payload:**
```ts
{
  userId: string,
  days: number,       // How many days back to generate data
}
```

**Key behavior:**
- Generates realistic energy consumption patterns (daily cycles, weekday/weekend variation)
- Generates solar generation curves
- Writes to `energy_logs` and `solar_data` tables
- Uses service role key to bypass RLS

---

## `energy-simulation`

**Directory:** `supabase/functions/energy-simulation/`

**Purpose:** Server-side IoT device simulation — alternative to client-side simulation for cases where persistent background data generation is needed.

**Note:** The primary simulation engine runs client-side in `useSimulation.tsx`. This edge function is a supplementary server-side variant.

---

## `generate-csv-report`

**Directory:** `supabase/functions/generate-csv-report/`

**Purpose:** Exports a user's energy data as a CSV file for the selected date range.

**Trigger:** Called from `ReportsPanel` component when user selects CSV export.

**Input payload:**
```ts
{
  userId: string,
  startDate: string,   // ISO date
  endDate: string,     // ISO date
}
```

**Output:** CSV file as `application/octet-stream` response.

---

## `generate-pdf-report`

**Directory:** `supabase/functions/generate-pdf-report/`

**Purpose:** Generates a formatted PDF energy report for the selected date range.

**Trigger:** Called from `ReportsPanel` component when user selects PDF export.

**Input payload:**
```ts
{
  userId: string,
  startDate: string,
  endDate: string,
}
```

**Output:** PDF file as `application/pdf` response.

---

## Shared Patterns

All edge functions follow these conventions:

```ts
// CORS headers (all functions)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OPTIONS preflight handler
if (req.method === 'OPTIONS') {
  return new Response(null, { headers: corsHeaders });
}
```

Functions that need RLS bypass use `SUPABASE_SERVICE_ROLE_KEY` from `Deno.env`.
Functions called by users use the user's JWT passed in the `Authorization` header.

## Deploying / Updating Edge Functions

```bash
supabase functions deploy <function-name> --project-ref omxvkzykghrcbvoyayjs
```
