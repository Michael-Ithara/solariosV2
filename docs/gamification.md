# Gamification

## Overview

The gamification system rewards users for energy-efficient behavior through achievements, experience points (XP), levels, and CO₂ reduction tracking. Achievement processing runs server-side in a Supabase edge function.

---

## Key Files

| File | Purpose |
|------|---------|
| `supabase/functions/check-gamification/index.ts` | Edge function — unlocks achievements, tracks CO₂ |
| `src/hooks/useGamification.tsx` | Frontend hook — fetches achievements and user XP |
| `src/hooks/useLiveAchievements.tsx` | Realtime hook — listens for newly unlocked achievements |
| `src/components/gamification/GamificationPanel.tsx` | Dashboard panel showing level and progress |
| `src/components/gamification/AchievementCard.tsx` | Individual achievement display |
| `src/components/gamification/CO2Tracker.tsx` | CO₂ offset tracker |

---

## CO₂ Tracking

The CO₂ conversion factor used throughout the system:

```
CO2_PER_KWH = 0.233 kg CO₂ / kWh
```

CO₂ saved is calculated as:
```
co2_saved = solar_kwh_generated × 0.233
```

This is processed per-user in the `check-gamification` edge function and tracked in `user_achievements` progress fields.

---

## Achievement System

### Achievement Definitions (`achievements` table)

Each achievement has:
- `code` — unique string identifier (e.g. `'first_solar_hour'`, `'co2_saver_10kg'`)
- `title` / `description` — display text
- `category` — grouping (e.g. `'solar'`, `'savings'`, `'efficiency'`)
- `max_progress` — threshold to unlock (e.g. `10` for "save 10 kg CO₂")
- `points` — XP awarded on unlock

### User Progress (`user_achievements` table)

Per-user rows tracking:
- `progress` — current value (incremented by the edge function)
- `unlocked` — boolean, set to `true` when `progress >= max_progress`
- `unlocked_at` — timestamp of unlock

---

## Edge Function: `check-gamification`

**Runtime:** Deno

**Trigger:** Called periodically (cron or manually via POST with `{ userId }`)

**What it does:**
1. Fetches all users with `data_source` in `['simulation', 'iot']` (or processes a single user if `userId` is provided)
2. For each user:
   - Calls `processCO2Tracking(userId, supabase)` — recalculates CO₂ saved from solar logs
   - Calls `checkAchievements(userId, supabase)` — evaluates all achievement criteria and unlocks any that are newly met

**Manual trigger:**
```bash
curl -X POST https://omxvkzykghrcbvoyayjs.supabase.co/functions/v1/check-gamification \
  -H "Authorization: Bearer <anon-key>" \
  -d '{"userId": "<user-uuid>"}'
```

---

## Frontend Hook: `useGamification`

Location: `src/hooks/useGamification.tsx`

```ts
const {
  achievements,        // All achievement definitions
  userAchievements,    // This user's progress rows
  totalPoints,         // Sum of points from unlocked achievements
  level,               // Computed level from totalPoints
  loading,
} = useGamification();
```

Used in `GamificationPanel`, `Dashboard`, and `Insights` pages.

---

## Live Achievement Notifications

`useLiveAchievements` (called at app root in `AppRoutes`) subscribes to a Supabase Realtime channel on `user_achievements`. When a row changes to `unlocked = true`, it fires a toast notification:

```
🏆 Achievement Unlocked: "First Solar Hour"
```

---

## XP and Level System

Total XP = sum of `points` from all unlocked achievements.

Level thresholds are computed in `useGamification` based on total XP (exact thresholds defined in the hook). The `GamificationPanel` displays current level, XP, and progress to next level.
