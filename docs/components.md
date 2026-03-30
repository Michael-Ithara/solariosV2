# Components

All components live in `src/components/`, organized by domain. ShadCN UI primitives are in `src/components/ui/` and should not be modified directly.

---

## Layout

**Directory:** `src/components/layout/`

| Component | Purpose |
|-----------|---------|
| `AppSidebar.tsx` | Fixed left navigation dock with icon buttons and tooltips. Always visible for authenticated users. Uses `ml-20` offset on page content. |
| `AppNavbar.tsx` | Top navigation bar. Shows current page title, theme toggle, user menu, and notification bell. |
| `ScrollToTop.tsx` | Resets scroll position on route change. Rendered inside `<BrowserRouter>`. |

---

## Authentication

**Directory:** `src/components/auth/`

| Component | Purpose |
|-----------|---------|
| `LoginForm.tsx` | Email/password login and signup form with password strength indicator. |
| `AuthModal.tsx` | Modal wrapper for login form (used in landing page CTA). |
| `ProtectedRoute.tsx` | Route wrapper that redirects to `/auth` if user is not authenticated. (Note: most routes in `App.tsx` use inline auth guards instead.) |

---

## Charts

**Directory:** `src/components/charts/`

| Component | Purpose |
|-----------|---------|
| `EnergyChart.tsx` | Main Recharts-based visualization for energy consumption, solar generation, and grid usage over time. Supports line, area, and bar modes. |
| `EnergyInsightsSummary.tsx` | Summary stats card shown alongside charts (totals, averages). |

---

## Gamification

**Directory:** `src/components/gamification/`

| Component | Purpose |
|-----------|---------|
| `GamificationPanel.tsx` | Dashboard panel showing user level, XP bar, and recent achievements. |
| `AchievementCard.tsx` | Individual achievement display with icon, progress bar, and locked/unlocked state. |
| `CO2Tracker.tsx` | Visual tracker showing kg CO₂ offset by solar generation. |

---

## Simulation

**Directory:** `src/components/simulation/`

| Component | Purpose |
|-----------|---------|
| `SimulationControls.tsx` | Start/stop button, speed multiplier slider, simulation status indicator. |
| `DeviceLibrary.tsx` | Grid of device templates the user can add to their simulation. |
| `EnhancedAppliances.tsx` | Full appliance management UI with device cards, toggle on/off, wattage display, and scheduling. |

---

## AI

**Directory:** `src/components/ai/`

| Component | Purpose |
|-----------|---------|
| `InsightsPanel.tsx` | Renders AI recommendations with priority badges, expected savings, and thumbs up/down feedback. |

---

## Onboarding

**Directory:** `src/components/onboarding/`

| Component | Purpose |
|-----------|---------|
| `OnboardingWizard.tsx` | Multi-step wizard container with step progress indicator. |
| `steps/LocationStep.tsx` | Location and timezone selection |
| `steps/SolarStep.tsx` | Solar system configuration (capacity, install date) |
| `steps/SmartMeterStep.tsx` | Smart meter setup or simulation selection |
| `steps/DeviceStep.tsx` | Initial device library selection |
| `steps/CompletionStep.tsx` | Confirms setup, writes `onboardingComplete` flag to `user_metadata` |

---

## Widgets

**Directory:** `src/components/widgets/`

| Component | Purpose |
|-----------|---------|
| `WeatherWidget.tsx` | Displays current temperature, condition, and humidity. Data from `useWeatherAndPricing`. |
| `GridPricingWidget.tsx` | Shows current electricity grid rate and time-of-use period (peak/mid/off-peak). |

---

## Notifications

**Directory:** `src/components/notifications/`

| Component | Purpose |
|-----------|---------|
| `NotificationsPanel.tsx` | Slide-out panel listing AI notifications from `ai_notifications` table. |

---

## Reports

**Directory:** `src/components/reports/`

| Component | Purpose |
|-----------|---------|
| `ReportsPanel.tsx` | Report generation UI — date range picker, format selector (CSV/PDF), download trigger. |

---

## Admin

**Directory:** `src/components/admin/`

Admin-specific components for the `/admin` page. Only visible to users with `role === 'admin'`.

---

## Settings

**Directory:** `src/components/settings/`

| Component | Purpose |
|-----------|---------|
| Profile settings components | Forms for updating display name, currency, electricity rate, notification preferences. |

---

## UI Primitives

**Directory:** `src/components/ui/`

80+ ShadCN UI components (Button, Card, Dialog, Input, Select, Table, Tabs, etc.). These are auto-generated from `components.json` and should not be hand-edited. Add new ShadCN components with:

```bash
npx shadcn@latest add <component-name>
```
