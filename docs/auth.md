# Authentication

## Overview

Auth is handled by **Supabase Auth** with email/password as the primary provider. OAuth is configured but the provider setup depends on Supabase dashboard settings.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | React context — session state, sign in/up/out |
| `src/lib/auth.ts` | `authService` — wraps Supabase Auth SDK methods |
| `src/components/auth/ProtectedRoute.tsx` | Route guard component |
| `src/pages/Auth.tsx` | Login / signup page |
| `src/pages/AuthCallback.tsx` | OAuth redirect handler at `/auth/callback` |

---

## AuthContext

Provides to the whole app via `<AuthProvider>` (mounted in `App.tsx`):

```ts
interface AuthContextType {
  user: AuthUser | null;      // Supabase user + injected role
  session: Session | null;    // Raw Supabase session
  role: UserRole;             // 'admin' | 'user' | 'guest'
  loading: boolean;
  signIn: (email, password) => Promise<void>;
  signUp: (email, password) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
  refreshUser: () => Promise<void>;
}
```

Consume with:
```ts
import { useAuth } from '@/contexts/AuthContext';
const { user, role, signOut } = useAuth();
```

---

## Role System

### Hierarchy
```
guest < user < admin
```

### How roles are assigned

1. Checked from `user.user_metadata.role` (set on signup or by admin)
2. Fallback: if email is in the hardcoded admin list (`admin@solarios.com`, `admin@example.com`) → role is `admin`
3. Default: `'user'`

### `hasPermission(requiredRole)`
Returns `true` if the user's role is equal to or higher than `requiredRole` in the hierarchy.

---

## Auth Flow

### Sign Up
1. `authService.signUp(email, password)` calls `supabase.auth.signUp()`
2. Supabase sends a confirmation email (redirect URL configured in Supabase dashboard)
3. On confirmation, `onAuthStateChange` fires `SIGNED_IN`
4. `AuthContext` processes session and sets user state
5. `AppRoutes` detects `needsOnboarding = true` → redirects to `/onboarding`

### Sign In
1. `authService.signIn(email, password)` calls `supabase.auth.signInWithPassword()`
2. `onAuthStateChange` fires → session set in context
3. If onboarding complete → `/dashboard`; otherwise → `/onboarding`

### Sign Out
1. `authService.signOut()` calls `supabase.auth.signOut()`
2. `AuthSessionMissingError` is silently swallowed (treated as already signed out)
3. State cleared, user redirected to `/auth`

### OAuth Callback
- Route `/auth/callback` is handled by `AuthCallback.tsx`
- Supabase exchanges the code for a session automatically on that page

---

## Onboarding Gate

In `AppRoutes` (inside `App.tsx`):

```ts
const onboardingComplete = Boolean(
  user && (
    user.user_metadata?.onboardingComplete === true ||
    user.user_metadata?.onboarding_completed === true
  )
);
const needsOnboarding = Boolean(user) && !onboardingComplete;
```

If `needsOnboarding` is true, ALL routes redirect to `/onboarding`. The flag is written to `user_metadata` when onboarding completes.

---

## Session Persistence

Supabase JS stores the session in `localStorage` by default. The key `supabase.auth.token` is manually cleared on `SIGNED_OUT` events.

---

## Admin Routing

Admin users are hard-routed to `/admin` — they cannot access standard user pages. Check is done in `AppRoutes`:

```ts
if (user && role === 'admin') {
  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
```
