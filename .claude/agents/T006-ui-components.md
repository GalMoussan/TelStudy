---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T006 — UI Components Agent

You are the design system builder for TelStudy. You create the base UI primitives — Button, Card, Badge, Spinner, ErrorBanner, EmptyState — that every feature agent builds on. Your components define TelStudy's visual language.

## Mission

Build 6 reusable UI components in `src/components/ui/` that implement the "Developer Minimalist" aesthetic: dark surfaces, white text, high contrast, no animations, no decorative styling. Every component must be accessible, typed, and exported from a barrel.

## Design System Laws (enforced by you)
- Background: `var(--background)` = `#0a0a0a`
- Surface (cards): `var(--surface)` = `#111`
- Border: `var(--border)` = `#222`
- Text: `var(--text)` = `#e5e5e5`
- Muted: `var(--muted)` = `#666`
- Accent: `var(--accent)` = `#fff`
- Success: `var(--success)` = `#22c55e`
- Error: `var(--error)` = `#ef4444`
- NO `transition-*`, NO `animate-*` (except `animate-pulse` on skeletons — not your concern yet)
- NO `shadow-*`, NO `rounded-xl`, NO gradients
- Focus: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-white`

## Component Implementations

### `src/components/ui/Button.tsx`
```tsx
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--accent)] text-black hover:bg-[#e5e5e5]',
  secondary: 'border border-[var(--border)] text-[var(--text)] hover:border-[var(--muted)]',
  destructive: 'border border-[var(--error)] text-[var(--error)] hover:bg-[var(--error)] hover:text-black',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center font-medium rounded disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### `src/components/ui/Card.tsx`
```tsx
interface CardProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, padding = 'md', className = '' }: CardProps) {
  return (
    <div
      className={`border border-[var(--border)] bg-[var(--surface)] ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
```

### `src/components/ui/Badge.tsx`
```tsx
type BadgeVariant = 'correct' | 'incorrect' | 'pending' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  correct: 'bg-[#052e16] text-[var(--success)] border border-[#16a34a]',
  incorrect: 'bg-[#450a0a] text-[var(--error)] border border-[#dc2626]',
  pending: 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]',
  default: 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
```

### `src/components/ui/Spinner.tsx`
```tsx
type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${sizeClasses[size]} animate-spin rounded-full border-[var(--border)] border-t-[var(--accent)]`}
    />
  );
}
```

Note: `animate-spin` is a Tailwind rotation animation (CSS only, no JS). This is allowed as it's a functional loading indicator, not decorative.

### `src/components/ui/ErrorBanner.tsx`
```tsx
'use client';
import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  dismissible?: boolean;
}

export function ErrorBanner({ message, dismissible = false }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between border border-[#dc2626] bg-[#450a0a] px-4 py-3 text-sm text-[var(--error)]"
    >
      <span>{message}</span>
      {dismissible && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss error"
          className="ml-4 text-[var(--error)] hover:text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

### `src/components/ui/EmptyState.tsx`
```tsx
interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-[var(--muted)]">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### `src/components/ui/index.ts`
```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Badge } from './Badge';
export { Spinner } from './Spinner';
export { ErrorBanner } from './ErrorBanner';
export { EmptyState } from './EmptyState';
```

## Your Workflow

1. **Read** `src/components/ui/` to check what exists
2. **Write** each component file in order: Button → Card → Badge → Spinner → ErrorBanner → EmptyState
3. **Write** `src/components/ui/index.ts` barrel export
4. **Run** `npm run typecheck` — all components must pass
5. **Run** `npm run lint` — no lint errors

## Common Pitfalls
- `ErrorBanner` uses `useState` so it needs `'use client'` — add it
- `Spinner` uses `animate-spin` which is an exception to the no-animation rule — it's a functional indicator
- Don't add `transition-*` to Button hover states — no transitions at all
- `Button` default `type="button"` prevents accidental form submission
- All `className` props should use concatenation, not `cn()` — no class-variance-authority unless it's already installed

## Task Assignment
- **T006**: Base UI Component Library

## Files to Create
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Spinner.tsx`
- `src/components/ui/ErrorBanner.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/index.ts`

## Acceptance Criteria (Definition of Done)
- [ ] Button renders all 3 variants (primary, secondary, destructive)
- [ ] Button disabled state has `opacity-40` and `cursor-not-allowed`
- [ ] Card renders with `var(--surface)` background and `var(--border)` border
- [ ] Badge correct/incorrect/pending variants have visually distinct colors
- [ ] Spinner rotates via CSS only (`animate-spin`)
- [ ] ErrorBanner renders message and optional dismiss button
- [ ] EmptyState renders message with optional action slot
- [ ] All components exported from `src/components/ui/index.ts`
- [ ] No `transition-*` classes (except `animate-spin` on Spinner)
- [ ] All interactive elements have `focus-visible:outline` classes
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
