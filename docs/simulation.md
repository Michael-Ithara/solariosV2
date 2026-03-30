# Device Simulation Engine

## Overview

The simulation engine is the core of the demo and authenticated experiences. It models IoT device behavior, solar production, weather, and grid pricing in real time — all client-side, with periodic syncing to Supabase.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useSimulation.tsx` | Main simulation engine (~17KB) |
| `src/hooks/useAutoSimulation.tsx` | Auto-starts simulation for authenticated users |
| `src/data/deviceTemplates.ts` | Predefined device template library |
| `src/types/simulation.ts` | TypeScript types for devices, weather, simulation state |
| `src/components/simulation/SimulationControls.tsx` | UI controls (start/stop/speed) |
| `src/components/simulation/DeviceLibrary.tsx` | Device picker UI |
| `src/components/simulation/EnhancedAppliances.tsx` | Advanced appliance management |

---

## Device Types

Devices are categorized by type. Each has a wattage range and behavioral pattern:

| Category | Examples |
|----------|---------|
| HVAC / Heating | Air conditioner, heat pump, furnace |
| Lighting | LED bulbs, smart lights |
| Kitchen | Refrigerator, oven, microwave, dishwasher |
| Water heating | Electric water heater, heat pump water heater |
| Entertainment | TV, gaming console, home theater |
| Laundry | Washing machine, dryer |
| Plug loads | Laptop, phone charger, router |

Device templates are defined in `src/data/deviceTemplates.ts`. Each template includes:
- `name`, `type`, `wattage` (or range)
- `icon`, `category`
- Optional scheduling / usage pattern metadata

---

## Solar Production Model

Solar output is calculated every simulation tick:

```
solarOutput = maxSolarCapacity × timeOfDayCurve(hour) × cloudCoverFactor
```

- **`maxSolarCapacity`** — defaults to 5kW for residential
- **`timeOfDayCurve(hour)`** — bell curve peaking at solar noon (~13:00), zero before 6:00 and after 20:00
- **`cloudCoverFactor`** — `1 - (cloudCover / 100)` where cloudCover is 0–100%

---

## Weather Simulation

Weather state is updated periodically and affects solar output:

| Property | Range | Effect |
|----------|-------|--------|
| `temperature` | Seasonal range (°C) | Affects HVAC load |
| `humidity` | 0–100% | Informational |
| `cloudCover` | 0–100% | Directly reduces solar output |
| `condition` | Sunny / Partly Cloudy / Cloudy / Rainy | Display label |

---

## Grid Pricing Model

Time-of-use pricing (USD/kWh):

| Period | Hours | Rate |
|--------|-------|------|
| Peak | 16:00–20:00 | $0.25/kWh |
| Mid-peak | 09:00–16:00 | $0.15/kWh |
| Off-peak | 20:00–09:00 | $0.12/kWh |

The current rate is exposed in simulation state for display in `GridPricingWidget`.

---

## Speed Multiplier

The simulation supports adjustable time compression:

| Speed | Real-world meaning |
|-------|--------------------|
| 1× | Real-time (1 second = 1 second) |
| 10× | 1 second = 10 seconds |
| 60× | 1 second ≈ 1 minute |
| 3600× | 1 second = 1 hour |

Higher speeds allow testing a full day's energy cycle quickly.

---

## Demo Mode vs Authenticated Mode

| Aspect | Demo mode | Authenticated mode |
|--------|-----------|--------------------|
| Data persistence | No | Yes (writes to Supabase) |
| Device list | Template defaults | User's saved devices |
| Achievement tracking | No | Yes |
| Realtime sync | No | Yes (Supabase Realtime channel) |

The simulation hook detects `session === null` and skips DB writes in demo mode.

---

## Supabase Sync

When authenticated, the simulation:
1. Accumulates energy data in 30-second intervals
2. Batches the interval data and writes to `energy_logs` and `solar_data`
3. Subscribes to a Supabase Realtime channel to sync device state across browser tabs

---

## Auto-Simulation

`useAutoSimulation` wraps `useSimulation` and automatically starts the simulation when:
- The user is authenticated
- The user's profile `data_source` is `'simulation'`

This means the dashboard shows live simulated data without the user having to manually start anything.
