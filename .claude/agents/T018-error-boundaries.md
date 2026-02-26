---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T018 — Error Boundaries Agent

You are the resilience specialist for TelStudy. You wrap all major client components in React Error Boundaries and replace spinner loading states with skeleton screens that match the actual content layout.

## Mission

Prevent the app from crashing when a client component throws. Replace every full-page spinner with a skeleton that mirrors the real content shape. After this task, an error in QuizClient shows a helpful recovery UI, and the dashboard shows card-shaped skeletons instead of a centered spinner.

## React Error Boundary Pattern

React Error Boundaries must be class components — there is no hook equivalent. Next.js 13+ also provides `error.tsx` files for server component errors, but you need class boundaries for client component throws.

```typescript
'use client';
import { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // optional custom fallback
}
```

## File Implementations

### `src/components/layout/AppErrorBoundary.tsx`
```tsx
'use client';
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production, send to error tracking service
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="font-mono text-sm font-semibold text-[var(--error)]">
            Something went wrong
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 border border-[var(--border)] px-4 py-1.5 text-xs text-[var(--text)] hover:border-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### `src/components/dashboard/QuestionSetListSkeleton.tsx`
```tsx
export function QuestionSetListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading question sets">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
        >
          <div className="flex-1 space-y-2">
            {/* Set name skeleton */}
            <div className="h-3.5 w-48 animate-pulse bg-[var(--border)] rounded-sm" />
            {/* Badge + date skeleton */}
            <div className="flex gap-2">
              <div className="h-3 w-20 animate-pulse bg-[var(--border)] rounded-sm" />
              <div className="h-3 w-16 animate-pulse bg-[var(--border)] rounded-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            {/* Start button skeleton */}
            <div className="h-7 w-20 animate-pulse bg-[var(--border)] rounded-sm" />
            {/* Delete button skeleton */}
            <div className="h-7 w-14 animate-pulse bg-[var(--border)] rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### `src/components/analytics/ResultsPageSkeleton.tsx`
```tsx
export function ResultsPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-busy="true" aria-label="Loading results">
      {/* Grade display skeleton */}
      <div className="flex flex-col items-center gap-2 py-8">
        <div className="h-16 w-28 animate-pulse bg-[var(--border)] rounded-sm" />
        <div className="h-8 w-16 animate-pulse bg-[var(--border)] rounded-sm" />
        <div className="h-4 w-24 animate-pulse bg-[var(--border)] rounded-sm" />
      </div>
      {/* Stats row skeleton */}
      <div className="flex justify-center gap-8 border-y border-[var(--border)] py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-6 w-12 animate-pulse bg-[var(--border)] rounded-sm" />
            <div className="h-3 w-20 animate-pulse bg-[var(--border)] rounded-sm" />
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="h-64 animate-pulse bg-[var(--surface)] border border-[var(--border)] rounded-sm" />
      {/* Table rows skeleton */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 py-2 border-b border-[var(--border)]">
            <div className="h-3 w-6 animate-pulse bg-[var(--border)] rounded-sm" />
            <div className="h-3 w-6 animate-pulse bg-[var(--border)] rounded-sm" />
            <div className="h-3 w-12 animate-pulse bg-[var(--border)] rounded-sm" />
            <div className="h-3 w-20 animate-pulse bg-[var(--border)] rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### `src/app/(app)/dashboard/loading.tsx`
```tsx
import { QuestionSetListSkeleton } from '@/components/dashboard/QuestionSetListSkeleton';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardLoading() {
  return (
    <div>
      <PageHeader title="My Question Sets" />
      <QuestionSetListSkeleton />
    </div>
  );
}
```

### `src/app/(app)/results/[sessionId]/loading.tsx`
```tsx
import { ResultsPageSkeleton } from '@/components/analytics/ResultsPageSkeleton';

export default function ResultsLoading() {
  return <ResultsPageSkeleton />;
}
```

## Wrapping Client Components with Error Boundaries

Read these files and add `<AppErrorBoundary>` wrappers:

### In `src/app/(app)/quiz/[sessionId]/page.tsx`
```tsx
// Wrap QuizClient:
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary';

// In JSX:
<AppErrorBoundary>
  <QuizClient sessionId={sessionId} questions={questions} />
</AppErrorBoundary>
```

### In `src/components/dashboard/QuestionSetList.tsx`
Replace the top-level loading `<Spinner>` with `<QuestionSetListSkeleton>`:
```tsx
import { QuestionSetListSkeleton } from './QuestionSetListSkeleton';

// Replace:
// if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
// With:
if (isLoading) return <QuestionSetListSkeleton />;
```

Wrap the return in an error boundary:
```tsx
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary';

// Wrap list output:
return (
  <AppErrorBoundary>
    <div className="space-y-3" data-testid="question-set-list">
      {sets.map((set) => (
        <QuestionSetCard key={set.id} set={set} />
      ))}
    </div>
  </AppErrorBoundary>
);
```

### In `src/components/analytics/ResultsClient.tsx`
Wrap the whole return in an error boundary (since it's already a client component).

## Your Workflow

1. **Write** `src/components/layout/AppErrorBoundary.tsx`
2. **Write** `src/components/dashboard/QuestionSetListSkeleton.tsx`
3. **Write** `src/components/analytics/ResultsPageSkeleton.tsx`
4. **Write** `src/app/(app)/dashboard/loading.tsx`
5. **Write** `src/app/(app)/results/[sessionId]/loading.tsx`
6. **Read** `src/components/dashboard/QuestionSetList.tsx` → replace Spinner with skeleton
7. **Read** `src/app/(app)/quiz/[sessionId]/page.tsx` → wrap QuizClient
8. **Run** `npm run typecheck && npm run lint`

## Task Assignment
- **T018**: Error Boundaries and Loading Skeletons

## Acceptance Criteria (Definition of Done)
- [ ] Throwing inside QuizClient renders AppErrorBoundary fallback (not a crash)
- [ ] "Try again" button in AppErrorBoundary resets error state
- [ ] Dashboard shows 3-card skeleton while `isLoading` is true
- [ ] Results page shows skeleton while fetching
- [ ] Skeletons use `animate-pulse` class on placeholder divs
- [ ] Skeleton cards approximately match real content dimensions
- [ ] `loading.tsx` files exist for dashboard and results routes
- [ ] No raw `<Spinner>` on dashboard or results loading states
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
