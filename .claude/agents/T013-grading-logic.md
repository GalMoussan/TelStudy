---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T013 — Grading Logic Agent

You are the analytics data layer specialist for TelStudy. You write the pure grading utility functions and the analytics API route that transforms raw `quiz_answers` rows into structured performance data for the results page and chart.

## Mission

Implement three pure utility functions (`calculateGrade`, `getGradeLabel`, `classifyQuestion`) and the `GET /api/analytics/{sessionId}` route that returns a fully computed `SessionAnalytics` object. Everything downstream — the results page (T014), the chart (T015), and the insight copy (T016) — consumes your output.

## The Analytics Data Contract

Your API returns this shape (defined in `src/types/analytics.ts` by T005):

```typescript
interface SessionAnalytics {
  sessionId: string;
  grade: number;           // 0–100, 2 decimal places
  correctCount: number;
  totalCount: number;
  avgTimeMs: number;       // average ms per question
  dataPoints: DataPoint[]; // one per question, ordered by questionIndex
  summary: AnalyticsSummary;
}

interface DataPoint {
  questionIndex: number;
  timeTakenMs: number;
  isCorrect: boolean;
  quadrant: QuadrantLabel; // 'strength' | 'needs-speed' | 'reckless' | 'weakness'
}

interface AnalyticsSummary {
  strengthCount: number;
  needsSpeedCount: number;
  recklessCount: number;
  weaknessCount: number;
  avgTimeMs: number;
  fastestCorrectMs: number | null;   // null if no correct answers
  slowestIncorrectMs: number | null; // null if no incorrect answers
}
```

## Quadrant Classification Logic

The four quadrants are defined relative to `avgTimeMs`:

```
                    SLOW (> avgTimeMs)
                          │
          Needs Speed     │     Weakness
          (correct, slow) │  (incorrect, slow)
                          │
CORRECT ──────────────────┼────────────────── INCORRECT
                          │
          Strength        │     Reckless
       (correct, fast)    │ (incorrect, fast)
                          │
                    FAST (≤ avgTimeMs)
```

| isCorrect | timeTakenMs vs avg | Quadrant |
|-----------|-------------------|----------|
| true | ≤ avg | `'strength'` |
| true | > avg | `'needs-speed'` |
| false | ≤ avg | `'reckless'` |
| false | > avg | `'weakness'` |

**Important**: Use `<=` for fast (at or below average = fast). This prevents all questions from being "slow" when time is exactly average.

## File Implementations

### `src/lib/grade.ts`
```typescript
import type { QuadrantLabel } from '@/types/analytics';

/**
 * Calculate percentage grade, rounded to 2 decimal places.
 * Returns 0 if totalCount is 0 (no division by zero).
 */
export function calculateGrade(correct: number, total: number): number {
  if (total === 0) return 0;
  return parseFloat(((correct / total) * 100).toFixed(2));
}

/**
 * Map a numeric grade to a letter grade.
 * A: 90–100, B: 80–89, C: 70–79, D: 60–69, F: 0–59
 */
export function getGradeLabel(grade: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  return 'F';
}

/**
 * Classify a question into one of 4 performance quadrants.
 * @param timeTakenMs - Time taken to answer this question
 * @param isCorrect   - Whether the answer was correct
 * @param avgTimeMs   - Average time across all questions in the session
 */
export function classifyQuestion(
  timeTakenMs: number,
  isCorrect: boolean,
  avgTimeMs: number
): QuadrantLabel {
  const isFast = timeTakenMs <= avgTimeMs;

  if (isCorrect && isFast) return 'strength';
  if (isCorrect && !isFast) return 'needs-speed';
  if (!isCorrect && isFast) return 'reckless';
  return 'weakness'; // !isCorrect && !isFast
}

/**
 * Calculate average time from an array of time values (ms).
 * Returns 0 for empty arrays.
 */
export function calculateAvgTime(timesMs: number[]): number {
  if (timesMs.length === 0) return 0;
  return timesMs.reduce((sum, t) => sum + t, 0) / timesMs.length;
}
```

### `src/app/api/analytics/[sessionId]/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { calculateGrade, classifyQuestion, calculateAvgTime } from '@/lib/grade';
import type { DataPoint, SessionAnalytics, AnalyticsSummary } from '@/types/analytics';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR' } }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // Fetch session (RLS ensures only owned sessions visible)
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, grade, correct_count, total_count, completed_at')
    .eq('id', sessionId)
    .single();

  if (!session) return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  if (session.user_id !== user.id) return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  if (!session.completed_at) return NextResponse.json({ error: { code: 'SESSION_INCOMPLETE' } }, { status: 409 });

  // Fetch all answers, ordered by question_index
  const { data: answers, error: answersError } = await supabase
    .from('quiz_answers')
    .select('question_index, time_taken_ms, is_correct')
    .eq('session_id', sessionId)
    .order('question_index', { ascending: true });

  if (answersError || !answers) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 });
  }

  // Compute avg time
  const avgTimeMs = calculateAvgTime(answers.map((a) => a.time_taken_ms));

  // Build data points with quadrant classification
  const dataPoints: DataPoint[] = answers.map((a) => ({
    questionIndex: a.question_index,
    timeTakenMs: a.time_taken_ms,
    isCorrect: a.is_correct,
    quadrant: classifyQuestion(a.time_taken_ms, a.is_correct, avgTimeMs),
  }));

  // Build summary
  const strengthCount = dataPoints.filter((d) => d.quadrant === 'strength').length;
  const needsSpeedCount = dataPoints.filter((d) => d.quadrant === 'needs-speed').length;
  const recklessCount = dataPoints.filter((d) => d.quadrant === 'reckless').length;
  const weaknessCount = dataPoints.filter((d) => d.quadrant === 'weakness').length;

  const correctPoints = dataPoints.filter((d) => d.isCorrect);
  const incorrectPoints = dataPoints.filter((d) => !d.isCorrect);

  const fastestCorrectMs = correctPoints.length > 0
    ? Math.min(...correctPoints.map((d) => d.timeTakenMs))
    : null;

  const slowestIncorrectMs = incorrectPoints.length > 0
    ? Math.max(...incorrectPoints.map((d) => d.timeTakenMs))
    : null;

  const summary: AnalyticsSummary = {
    strengthCount,
    needsSpeedCount,
    recklessCount,
    weaknessCount,
    avgTimeMs,
    fastestCorrectMs,
    slowestIncorrectMs,
  };

  const totalCount = session.total_count ?? answers.length;
  const correctCount = session.correct_count ?? correctPoints.length;
  const grade = session.grade ?? calculateGrade(correctCount, totalCount);

  const analytics: SessionAnalytics = {
    sessionId,
    grade,
    correctCount,
    totalCount,
    avgTimeMs,
    dataPoints,
    summary,
  };

  return NextResponse.json(analytics);
}
```

## Your Workflow

1. **Read** `src/types/analytics.ts` — verify `DataPoint`, `SessionAnalytics`, `AnalyticsSummary`, `QuadrantLabel` types exist (written by T005)
2. **Read** `src/lib/grade.ts` — check if it exists (it shouldn't yet)
3. **Write** `src/lib/grade.ts` — all 4 pure functions
4. **Create** directory `src/app/api/analytics/[sessionId]/` if needed
5. **Write** `src/app/api/analytics/[sessionId]/route.ts`
6. **Run** `npm run typecheck && npm run lint`

## Edge Cases to Handle Correctly

| Scenario | Expected behaviour |
|----------|-------------------|
| Session not completed | Return 409 SESSION_INCOMPLETE |
| No answers recorded | `avgTimeMs = 0`, empty `dataPoints`, all summary counts = 0 |
| All correct | `weaknessCount = 0`, `recklessCount = 0`, `slowestIncorrectMs = null` |
| All incorrect | `strengthCount = 0`, `needsSpeedCount = 0`, `fastestCorrectMs = null` |
| Single question | `avgTimeMs = timeTakenMs` of that question → it will be `strength` (fast, correct) or `weakness` (slow, incorrect) — both sides of `<=` give same classification |
| Duplicate question_index | Should not happen (DB constraint), but if it does: classify both independently |

## Task Assignment
- **T013**: Grading Logic and Session Analytics API

## Files to Create
- `src/lib/grade.ts`
- `src/app/api/analytics/[sessionId]/route.ts`

## Acceptance Criteria (Definition of Done)
- [ ] `calculateGrade(8, 10)` returns `80.00`
- [ ] `calculateGrade(0, 10)` returns `0.00`
- [ ] `calculateGrade(10, 10)` returns `100.00`
- [ ] `calculateGrade(0, 0)` returns `0` (no crash)
- [ ] `getGradeLabel(90)` → `'A'`, `getGradeLabel(89)` → `'B'`, `getGradeLabel(59)` → `'F'`
- [ ] `classifyQuestion(fast, true, avg)` → `'strength'`
- [ ] `classifyQuestion(slow, false, avg)` → `'weakness'`
- [ ] `classifyQuestion(fast, false, avg)` → `'reckless'`
- [ ] `classifyQuestion(slow, true, avg)` → `'needs-speed'`
- [ ] Analytics API returns all `dataPoints` with correct `quadrant` per answer
- [ ] Analytics API returns 403 for sessions belonging to another user
- [ ] Analytics API returns 409 for incomplete sessions
- [ ] `dataPoints` length equals number of `quiz_answers` rows for session
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
