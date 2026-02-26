---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T014 — Results Page Agent

You are the results page specialist for TelStudy. You build the post-quiz results view: the grade display, a question-by-question summary table, summary stat row, and navigation actions. T015 will add the chart into a slot you leave for it.

## Mission

Build `/results/{sessionId}` — the destination after quiz completion. It fetches from `GET /api/analytics/{sessionId}` and renders the grade prominently, a stats row, and a summary table of every question's outcome. Leave a clearly commented slot for T015's chart component between the grade and the table.

## Layout Structure

```
/results/{sessionId}
│
├── GradeDisplay          ← large % + letter grade
├── StatsRow              ← avg time | accuracy | total
├── [CHART SLOT]          ← T015 inserts <PerformanceChart> here
├── [INSIGHT SLOT]        ← T016 inserts <KeyInsight> here
├── ResultsSummaryTable   ← per-question breakdown
└── ActionRow             ← Back to Dashboard | Retry this set
```

## File Implementations

### `src/components/analytics/GradeDisplay.tsx`
```tsx
import { getGradeLabel } from '@/lib/grade';

interface GradeDisplayProps {
  grade: number;
  correctCount: number;
  totalCount: number;
}

export function GradeDisplay({ grade, correctCount, totalCount }: GradeDisplayProps) {
  const letter = getGradeLabel(grade);
  const isPassing = grade >= 70;

  return (
    <div className="text-center py-8">
      <p
        className={`font-mono text-6xl font-bold tabular-nums ${
          isPassing ? 'text-[var(--success)]' : 'text-[var(--error)]'
        }`}
        data-testid="grade-percentage"
      >
        {grade.toFixed(1)}%
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold ${
          isPassing ? 'text-[var(--success)]' : 'text-[var(--error)]'
        }`}
      >
        {letter}
      </p>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {correctCount} / {totalCount} correct
      </p>
    </div>
  );
}
```

### `src/components/analytics/StatsRow.tsx`
```tsx
interface StatsRowProps {
  avgTimeMs: number;
  grade: number;
  totalCount: number;
}

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function StatsRow({ avgTimeMs, grade, totalCount }: StatsRowProps) {
  return (
    <div className="flex justify-center gap-8 border-y border-[var(--border)] py-4">
      <div className="text-center">
        <p className="font-mono text-lg text-[var(--text)]">{formatMs(avgTimeMs)}</p>
        <p className="text-xs text-[var(--muted)]">avg per question</p>
      </div>
      <div className="text-center">
        <p className="font-mono text-lg text-[var(--text)]">{grade.toFixed(1)}%</p>
        <p className="text-xs text-[var(--muted)]">accuracy</p>
      </div>
      <div className="text-center">
        <p className="font-mono text-lg text-[var(--text)]">{totalCount}</p>
        <p className="text-xs text-[var(--muted)]">questions</p>
      </div>
    </div>
  );
}
```

### `src/components/analytics/ResultsSummaryTable.tsx`
```tsx
import { Badge } from '@/components/ui';
import type { DataPoint } from '@/types/analytics';

interface ResultsSummaryTableProps {
  dataPoints: DataPoint[];
}

const QUADRANT_LABELS: Record<string, string> = {
  strength: 'Strength',
  'needs-speed': 'Needs Speed',
  reckless: 'Reckless',
  weakness: 'Weakness',
};

const QUADRANT_BADGE: Record<string, 'correct' | 'incorrect' | 'pending' | 'default'> = {
  strength: 'correct',
  'needs-speed': 'pending',
  reckless: 'pending',
  weakness: 'incorrect',
};

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ResultsSummaryTable({ dataPoints }: ResultsSummaryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="results-table">
        <thead>
          <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
            <th className="pb-2 pr-4 font-mono font-normal">#</th>
            <th className="pb-2 pr-4 font-mono font-normal">Result</th>
            <th className="pb-2 pr-4 font-mono font-normal">Time</th>
            <th className="pb-2 font-mono font-normal">Quadrant</th>
          </tr>
        </thead>
        <tbody>
          {dataPoints.map((point) => (
            <tr
              key={point.questionIndex}
              className="border-b border-[var(--border)] last:border-0"
            >
              <td className="py-2 pr-4 font-mono text-xs text-[var(--muted)]">
                {point.questionIndex + 1}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`font-mono text-base ${
                    point.isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'
                  }`}
                  aria-label={point.isCorrect ? 'Correct' : 'Incorrect'}
                >
                  {point.isCorrect ? '✓' : '✗'}
                </span>
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-[var(--text)]">
                {formatMs(point.timeTakenMs)}
              </td>
              <td className="py-2">
                <Badge variant={QUADRANT_BADGE[point.quadrant] ?? 'default'}>
                  {QUADRANT_LABELS[point.quadrant] ?? point.quadrant}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### `src/components/analytics/ResultsClient.tsx`
```tsx
'use client';
import { GradeDisplay } from './GradeDisplay';
import { StatsRow } from './StatsRow';
import { ResultsSummaryTable } from './ResultsSummaryTable';
import type { SessionAnalytics } from '@/types/analytics';

interface ResultsClientProps {
  analytics: SessionAnalytics;
  setId: string;
}

export function ResultsClient({ analytics, setId }: ResultsClientProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <GradeDisplay
        grade={analytics.grade}
        correctCount={analytics.correctCount}
        totalCount={analytics.totalCount}
      />

      <StatsRow
        avgTimeMs={analytics.avgTimeMs}
        grade={analytics.grade}
        totalCount={analytics.totalCount}
      />

      {/* T016: <KeyInsight> goes here */}
      {/* <KeyInsight summary={analytics.summary} /> */}

      {/* T015: <PerformanceChart> goes here */}
      {/* <PerformanceChart dataPoints={analytics.dataPoints} avgTimeMs={analytics.avgTimeMs} /> */}
      {/* <QuadrantLegend summary={analytics.summary} /> */}

      <div>
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Question Breakdown
        </h2>
        <ResultsSummaryTable dataPoints={analytics.dataPoints} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
        <a
          href="/dashboard"
          className="text-sm text-[var(--muted)] underline hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          data-testid="back-to-dashboard"
        >
          ← Back to Dashboard
        </a>
        <div className="flex gap-2">
          <a
            href="/history"
            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
          >
            View all sessions →
          </a>
          <RetryButton setId={setId} />
        </div>
      </div>
    </div>
  );
}

function RetryButton({ setId }: { setId: string }) {
  async function handleRetry() {
    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_id: setId }),
    });
    if (!res.ok) return;
    const { session_id } = await res.json() as { session_id: string };
    window.location.href = `/quiz/${session_id}`;
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      data-testid="retry-btn"
      className="text-sm text-[var(--text)] underline hover:text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
    >
      Retry this set
    </button>
  );
}
```

### `src/app/(app)/results/[sessionId]/page.tsx`
```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResultsClient } from '@/components/analytics/ResultsClient';
import type { SessionAnalytics } from '@/types/analytics';

interface ResultsPageProps {
  params: Promise<{ sessionId: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { sessionId } = await params;

  if (!UUID_REGEX.test(sessionId)) redirect('/dashboard?error=not-found');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify session + get set_id for retry
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, set_id, completed_at')
    .eq('id', sessionId)
    .single();

  if (!session || session.user_id !== user.id) redirect('/dashboard?error=not-found');
  if (!session.completed_at) redirect(`/quiz/${sessionId}`);

  // Fetch analytics from our own API route
  // Using absolute URL for server-side fetch
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/analytics/${sessionId}`, {
    headers: { Cookie: '' }, // Next.js forwards cookies automatically in server fetch
    cache: 'no-store',
  });

  if (!res.ok) redirect('/dashboard?error=not-found');

  const analytics = await res.json() as SessionAnalytics;

  return (
    <ResultsClient analytics={analytics} setId={session.set_id} />
  );
}
```

**Alternative pattern** (avoid the self-fetch): Import the analytics logic directly instead of fetching. This is simpler and avoids the server-to-server request:

```typescript
// Instead of fetching, call the DB directly:
import { calculateGrade, classifyQuestion, calculateAvgTime } from '@/lib/grade';

// ... (same DB queries as the analytics API route)
// Then pass the constructed SessionAnalytics object directly to ResultsClient
```

Use whichever approach works cleanly with your typecheck. The direct DB call is recommended.

## Your Workflow

1. **Read** `src/types/analytics.ts` — verify all types exist
2. **Read** `src/lib/grade.ts` — verify `getGradeLabel` exists (written by T013)
3. **Write** `src/components/analytics/GradeDisplay.tsx`
4. **Write** `src/components/analytics/StatsRow.tsx`
5. **Write** `src/components/analytics/ResultsSummaryTable.tsx`
6. **Write** `src/components/analytics/ResultsClient.tsx`
7. **Write** `src/app/(app)/results/[sessionId]/page.tsx`
8. **Run** `npm run typecheck && npm run lint`

## Task Assignment
- **T014**: Results Page and Grade Display

## Files to Create
- `src/components/analytics/GradeDisplay.tsx`
- `src/components/analytics/StatsRow.tsx`
- `src/components/analytics/ResultsSummaryTable.tsx`
- `src/components/analytics/ResultsClient.tsx`
- `src/app/(app)/results/[sessionId]/page.tsx`

## Acceptance Criteria (Definition of Done)
- [ ] Grade displays as large percentage (`data-testid="grade-percentage"`)
- [ ] Grade is green (≥70%) or red (<70%)
- [ ] Letter grade rendered below percentage
- [ ] "X / Y correct" count displayed
- [ ] StatsRow shows avg time, accuracy %, question count
- [ ] Summary table shows all questions with ✓/✗, time, quadrant badge
- [ ] Chart and insight slots are present as comments in `ResultsClient.tsx`
- [ ] "Back to Dashboard" link navigates to `/dashboard`
- [ ] "Retry this set" creates new session with same set
- [ ] Accessing another user's session redirects to `/dashboard`
- [ ] Incomplete session redirects to `/quiz/{sessionId}`
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
