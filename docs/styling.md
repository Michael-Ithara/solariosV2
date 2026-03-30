# Styling

## Stack

| Tool | Purpose |
|------|---------|
| Tailwind CSS 3 | Utility-first CSS |
| tailwindcss-animate | Animation utilities |
| next-themes | Dark mode provider |
| ShadCN UI | Component style system using CSS custom properties |

Config files:
- `tailwind.config.ts` — Tailwind theme extension
- `src/index.css` — CSS custom property definitions (light + dark mode)
- `components.json` — ShadCN UI configuration

---

## Dark Mode

Dark mode is class-based (`darkMode: ["class"]` in `tailwind.config.ts`). The `next-themes` `ThemeProvider` toggles the `dark` class on the `<html>` element.

Toggle is in the `AppNavbar`. Default theme respects system preference.

---

## Color System

Colors are defined as CSS custom properties in `src/index.css` and referenced in `tailwind.config.ts` with `hsl(var(--token))` syntax.

### Base UI Colors

| Token | Usage |
|-------|-------|
| `--background` | Page background |
| `--foreground` | Default text |
| `--primary` | Brand primary (buttons, links) |
| `--primary-glow` | Glow effect variant |
| `--secondary` | Secondary actions |
| `--accent` | Hover / highlight states |
| `--muted` | Subtle backgrounds |
| `--destructive` | Errors, delete actions |
| `--border` | Borders and dividers |
| `--ring` | Focus rings |

### Sidebar Colors

| Token | Usage |
|-------|-------|
| `--sidebar-background` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | Active nav item |
| `--sidebar-accent` | Sidebar hover state |
| `--sidebar-border` | Sidebar border |

### Energy Domain Colors

These are used for data visualization and energy-related UI:

| Token | Tailwind class | Meaning |
|-------|----------------|---------|
| `--energy-solar` | `bg-energy-solar` / `text-energy-solar` | Solar generation (warm yellow/orange) |
| `--energy-grid` | `bg-energy-grid` / `text-energy-grid` | Grid electricity (blue) |
| `--energy-consumption` | `bg-energy-consumption` / `text-energy-consumption` | Total consumption (red/orange) |

### Status Colors

| Token | Tailwind class | Usage |
|-------|----------------|-------|
| `--success` | `bg-success` | Positive states, savings |
| `--warning` | `bg-warning` | Cautions, peak pricing |
| `--danger` | `bg-danger` | High consumption alerts |

---

## Gradients

Custom background gradients defined as CSS variables, available as Tailwind utilities:

| Class | Usage |
|-------|-------|
| `bg-gradient-energy` | General energy dashboard gradient |
| `bg-gradient-solar` | Solar-themed gradient |
| `bg-gradient-grid` | Grid-themed gradient |
| `bg-gradient-consumption` | Consumption-themed gradient |

---

## Shadows

| Class | Usage |
|-------|-------|
| `shadow-energy` | Card shadow for energy widgets |
| `shadow-glow` | Glow effect for active/highlighted elements |

---

## Border Radius

Radius tokens follow ShadCN convention:

| Token | Tailwind class |
|-------|----------------|
| `--radius` | `rounded-lg` |
| `calc(var(--radius) - 2px)` | `rounded-md` |
| `calc(var(--radius) - 4px)` | `rounded-sm` |

---

## Typography

No custom font is configured — defaults to Tailwind's system font stack. Font sizes and weights use standard Tailwind utilities.

---

## Responsive Design

Mobile-first with standard Tailwind breakpoints:

| Breakpoint | Width |
|-----------|-------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1400px (container max) |

Mobile detection in JS: use `src/hooks/use-mobile.tsx` (returns boolean for `< 768px`).

---

## Adding New ShadCN Components

```bash
npx shadcn@latest add <component-name>
```

This generates the component into `src/components/ui/`. Never edit generated files directly — instead wrap them in domain components.
