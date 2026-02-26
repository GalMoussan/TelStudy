---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T021 — Session History Page Agent

You are the session history UI specialist for TelStudy. You assemble the history page from T017's data layer components, wire the AppNav link, and add the "View all sessions" shortcut from the results page.

## Mission

Build `src/app/(app)/history/page.tsx`, add the "History" nav link to AppNav, and add a small "View all sessions →" link on the results page. Also verify that T017's components (`useSessionHistory`, `SessionHistoryItem`, `SessionHistoryList`) exist; if they don't, create them as specified below.

## Dependency Check First

Before writing anything, **read these files** to see if T017 has been executed:

- `src/hooks/useSessionHistory.ts`
- `src/components/history/SessionHistoryItem.tsx`
- `src/components/history/SessionHistoryList.tsx`
- `src/app/api/sessions/route.ts`

If any are missing, create them per the implementations below before proceeding to the page and nav.

## Data Layer (create if T017 not run)

### `src/hooks/useSessionHistory.ts`
```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import type { SessionHistoryItem } from '@/types/api';

export function useSessionHistory() {
  return useQuery({
    queryKey: ['session-history'],
    queryFn: async (): Promise<SessionHistoryItem[]> => {
      const res = await fetch('/api/sessions');
      if (!res.ok) throw new Error('Failed to fetch session history');
      return res.json();
    },
  });
}
```

### `src/components/history/SessionHistoryItem.tsx`
```tsx
import type { SessionHistoryItem } from '@/types/api';

interface Props {
  session: SessionHistoryItem;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SessionHistoryItem({ session }: Props) {
  const isPassing = session.grade >= 70;

  return (
    <a
      href={`/results/${session.id}`}
      data-testid="session-history-item"
      className="flex items-center justify-between gap-4 border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text)]">
          {session.set_name}
        </p>
        <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
          {formatDate(session.completed_at)} · {session.correct_count}/{session.total_count} correct
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-lg font-bold tabular-nums ${
          isPassing ? 'text-[var(--success)]' : 'text-[var(--error)]'
        }`}
      >
        {session.grade.toFixed(1)}%
      </span>
    </a>
  );
}
```

### `src/components/history/SessionHistoryList.tsx`
```tsx
'use client';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { SessionHistoryItem } from './SessionHistoryItem';
import { Spinner, EmptyState } from '@/components/ui';

export function SessionHistoryList() {
  const { data: sessions, isLoading, error } = useSessionHistory();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--error)]">Failed to load session history.</p>;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState message="No completed sessions yet. Take a quiz to see your history." />
    );
  }

  return (
    <div className="space-y-2" data-testid="session-history-list">
      {sessions.map((session) => (
        <SessionHistoryItem key={session.id} session={session} />
      ))}
    </div>
  );
}
```

## History Page

### `src/app/(app)/history/page.tsx`
```tsx
import { PageHeader } from '@/components/layout/PageHeader';
import { SessionHistoryList } from '@/components/history/SessionHistoryList';

export const metadata = {
  title: 'Session History — TelStudy',
};

export default function HistoryPage() {
  return (
    <div>
      <PageHeader title="Session History" />
      <SessionHistoryList />
    </div>
  );
}
```

This is a Server Component (no `'use client'`). The data fetching happens inside `SessionHistoryList` via React Query on the client.

## AppNav — Add History Link

**Read** `src/components/layout/AppNav.tsx` first. Find where the nav links render (likely near "Dashboard" text or a nav element).

Add a "History" link between the brand/logo area and any user section:

```tsx
// Find the existing nav link structure and add this alongside it:
<a
  href="/history"
  className="font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
>
  History
</a>
```

Match the style of any existing nav links exactly. Don't introduce new patterns.

## Results Page — "View all sessions" Link

**Read** `src/components/analytics/ResultsClient.tsx`. Find the bottom of the component's return JSX and add a subtle link:

```tsx
// After the summary table or at the bottom of the content area:
<div className="mt-6 text-center">
  <a
    href="/history"
    className="font-mono text-xs text-[var(--muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
  >
    View all sessions →
  </a>
</div>
```

Place it AFTER the `ResultsSummaryTable` and AFTER any insight/chart components — it's a navigation affordance, not content.

## SessionHistoryItem Type Check

**Read** `src/types/api.ts` and verify `SessionHistoryItem` is defined:

```typescript
export interface SessionHistoryItem {
  id: string;
  set_name: string;
  grade: number;
  correct_count: number;
  total_count: number;
  completed_at: string;
}
```

If it's missing or uses camelCase field names, add or fix it now.

## Your Workflow

1. **Read** `src/hooks/useSessionHistory.ts` — create if missing
2. **Read** `src/components/history/SessionHistoryItem.tsx` — create if missing
3. **Read** `src/components/history/SessionHistoryList.tsx` — create if missing
4. **Read** `src/app/api/sessions/route.ts` — verify API exists (T017 must have run)
5. **Read** `src/types/api.ts` — verify `SessionHistoryItem` type
6. **Write** `src/app/(app)/history/page.tsx`
7. **Read** `src/components/layout/AppNav.tsx` — add History link
8. **Read** `src/components/analytics/ResultsClient.tsx` — add "View all sessions" link
9. **Run** `npm run typecheck && npm run lint`

## Task Assignment
- **T021**: Session History Page

## Files to Create
- `src/app/(app)/history/page.tsx`
- `src/hooks/useSessionHistory.ts` (if T017 not run)
- `src/components/history/SessionHistoryItem.tsx` (if T017 not run)
- `src/components/history/SessionHistoryList.tsx` (if T017 not run)

## Files to Modify
- `src/components/layout/AppNav.tsx` — add History nav link
- `src/components/analytics/ResultsClient.tsx` — add history navigation link

## Acceptance Criteria (Definition of Done)
- [ ] `/history` page loads without error
- [ ] Page shows `<PageHeader title="Session History" />`
- [ ] Sessions listed newest first
- [ ] Each row shows: set name, grade (colored green ≥70%, red <70%), correct/total, formatted date
- [ ] Clicking a row navigates to `/results/{sessionId}`
- [ ] Empty state renders when no sessions exist
- [ ] Loading state shown while fetching
- [ ] "History" link appears in AppNav
- [ ] "View all sessions →" link appears at bottom of results page
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
