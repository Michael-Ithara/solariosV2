# Solarios V2 — Project Overview

## What Is Solarios?

Solarios V2 is a full-stack, AI-powered energy monitoring and analytics SaaS platform. It targets households and businesses that want to track energy consumption, solar generation, and receive intelligent recommendations to reduce costs and carbon footprint.

The platform supports three modes:
- **Authenticated users** — full experience with personal dashboard, simulation, and AI insights
- **Admin users** — restricted to the admin panel for system management
- **Demo mode** (`/demo`) — full UI preview without requiring an account

---

## Core Value Propositions

| Feature | Description |
|---------|-------------|
| Real-time monitoring | Live energy consumption and solar production metrics via Supabase Realtime |
| AI nudges | XGBoost ONNX model generates contextual energy-saving recommendations |
| Device simulation | IoT device simulation engine with realistic solar, weather, and grid pricing models |
| Gamification | Achievement system with XP, levels, CO₂ tracking, and live notifications |
| Multi-currency | 40+ countries with localized electricity rates |
| Demo mode | Full-featured demo accessible without login |
| Reports | CSV and PDF export of energy data |
| Onboarding | Multi-step setup wizard for new users |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 + SWC |
| UI components | ShadCN UI (Radix UI primitives) |
| Styling | Tailwind CSS 3 + next-themes (dark mode) |
| State / data fetching | TanStack React Query 5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Routing | React Router DOM 6 |
| Backend | Supabase (Auth, Postgres, Realtime, Edge Functions) |
| ML model | XGBoost exported to ONNX, runs inside Supabase edge function |
| Notifications | Sonner (toast) |
| Icons | Lucide React |

---

## Folder Structure

```
solariosV2/
├── src/                        # Frontend React application
│   ├── App.tsx                 # Root component with routing and providers
│   ├── main.tsx                # Vite entry point
│   ├── pages/                  # Route-level page components
│   ├── components/             # Reusable UI components, grouped by domain
│   ├── hooks/                  # Custom React hooks
│   ├── contexts/               # React contexts (Auth, Onboarding)
│   ├── integrations/supabase/  # Supabase client + auto-generated DB types
│   ├── lib/                    # Auth service and utility helpers
│   ├── data/                   # Static data (device templates)
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Supabase helper functions
│
├── supabase/
│   ├── functions/              # Deno edge functions
│   └── migrations/             # SQL migration files
│
├── public/                     # Static assets
├── docs/                       # Project documentation (this folder)
├── tailwind.config.ts          # Tailwind + energy color palette
├── vite.config.ts              # Vite config (port 8080, @ alias)
└── components.json             # ShadCN UI config
```

---

## Pages (Routes)

| Route | Page | Auth required |
|-------|------|---------------|
| `/` | `Landing.tsx` | No (redirects to `/dashboard` if logged in) |
| `/auth` | `Auth.tsx` | No |
| `/auth/callback` | `AuthCallback.tsx` | No |
| `/demo` | `EnhancedDemo.tsx` | No |
| `/onboarding` | `Onboarding.tsx` | Yes (new users only) |
| `/dashboard` | `Dashboard.tsx` | Yes |
| `/appliances` | `Appliances.tsx` | Yes |
| `/analytics` | `Analytics.tsx` | Yes |
| `/insights` | `Insights.tsx` | Yes |
| `/reports` | `Reports.tsx` | Yes |
| `/settings` | `Settings.tsx` | Yes |
| `/admin` | `Admin.tsx` | Yes (admin role only) |

---

## Documentation Index

| File | Topic |
|------|-------|
| [architecture.md](./architecture.md) | Data flow, providers, React Query, Realtime |
| [database.md](./database.md) | Supabase tables, columns, RLS, generated types |
| [auth.md](./auth.md) | Auth flow, roles, ProtectedRoute, OAuth |
| [simulation.md](./simulation.md) | Device simulation engine, solar/weather models |
| [ai-insights.md](./ai-insights.md) | ONNX ML pipeline, nudge system, edge function |
| [gamification.md](./gamification.md) | Achievement system, CO₂ tracking, XP/levels |
| [hooks.md](./hooks.md) | All custom React hooks catalogue |
| [components.md](./components.md) | Component catalogue by domain |
| [onboarding.md](./onboarding.md) | Multi-step wizard steps and context |
| [styling.md](./styling.md) | Tailwind config, energy color palette, dark mode |
| [edge-functions.md](./edge-functions.md) | All Supabase edge functions |

---

## Owner

Proprietary software — Michael Kihuyu (mkihuy020@gmail.com)
