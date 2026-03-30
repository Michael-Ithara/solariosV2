# Architecture

## High-Level Diagram

```
Browser
  │
  ├── React App (Vite, port 8080)
  │     ├── AuthProvider           ← manages session, role, user state
  │     ├── QueryClientProvider    ← TanStack React Query cache
  │     ├── SidebarProvider        ← ShadCN sidebar state
  │     ├── AppSidebar             ← always-visible navigation dock
  │     ├── AppNavbar              ← top bar (user info, theme toggle)
  │     └── <Routes>               ← React Router DOM 6
  │
  └── Supabase (omxvkzykghrcbvoyayjs.supabase.co)
        ├── Auth                   ← JWT sessions, OAuth
        ├── Postgres               ← RLS-protected tables
        ├── Realtime               ← live energy + achievement channels
        └── Edge Functions (Deno)  ← ML inference, gamification, reports
```

---

## Entry Points

| File | Role |
|------|------|
| `src/main.tsx` | Mounts `<App />` into `#root` |
| `src/App.tsx` | Wraps providers, renders `<AppRoutes />` |
| `src/contexts/AuthContext.tsx` | Auth state, exposes `useAuth()` |
| `src/integrations/supabase/client.ts` | Singleton Supabase JS client |

---

## Provider Stack (App.tsx)

```tsx
<QueryClientProvider>         // React Query cache
  <AuthProvider>              // Session + role management
    <TooltipProvider>         // ShadCN tooltips
      <BrowserRouter>
        <ScrollToTop />
        <SidebarProvider>     // ShadCN sidebar
          <AppSidebar />
          <AppNavbar />
          <AppRoutes />        // All page routes
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
</QueryClientProvider>
```

---

## Routing Logic (AppRoutes)

1. While `loading` is true → show spinner
2. If user exists but `onboardingComplete` flag is missing → redirect everything to `/onboarding`
3. If `role === 'admin'` → redirect everything to `/admin`
4. Otherwise → standard route table (see `overview.md`)

Onboarding complete is checked via two legacy-compatible flags in `user_metadata`:
- `onboardingComplete === true`
- `onboarding_completed === true`

---

## Data Flow: Frontend → Supabase

```
Page/Component
  │
  ├── Custom Hook (e.g. useSupabaseData)
  │     ├── supabase.from('table').select(...)  ← RLS filters by auth.uid()
  │     └── Returns typed data
  │
  ├── React Query (useQuery / useMutation)
  │     └── Caches and deduplicates requests
  │
  └── Supabase Realtime Channel
        └── supabase.channel('name').on('postgres_changes', ...)
              └── Pushes live updates into local state
```

---

## Realtime Subscriptions

The app uses Supabase Realtime for:

| Channel | What it tracks |
|---------|---------------|
| Energy data channel | Live energy logs, solar readings |
| Achievement channel | New achievement unlocks → toast notification |
| Device status | Simulation device state sync across tabs |

Realtime is initialized inside hooks (`useRealTimeEnergyData`, `useLiveAchievements`, `useSimulation`). Each hook subscribes on mount and unsubscribes on unmount.

---

## React Query Strategy

- `QueryClient` is created once at app root (not inside a component)
- Data is fetched inside custom hooks using `useQuery`
- Mutations use `useMutation` + manual `queryClient.invalidateQueries` to refresh
- No global refetch intervals by default — hooks use Supabase Realtime for live data instead

---

## Key Patterns

### Auth-gated pages
Routes are guarded inline in `AppRoutes` — no separate `ProtectedRoute` wrapper component for most routes. `ProtectedRoute` component exists but routes currently use direct `user ? <Page /> : <Navigate to="/auth" />` pattern.

### `ml-20` layout offset
All authenticated pages are wrapped in `<div className="ml-20">` to offset from the fixed sidebar dock.

### Demo mode
`/demo` renders `EnhancedDemo` without any auth check — fully public. The simulation hook detects no session and runs in a separate demo state.

### Dual toast system
Both `<Toaster>` (ShadCN/Radix) and `<Sonner>` are mounted — `Sonner` is preferred for new toasts (`import { toast } from 'sonner'`).
