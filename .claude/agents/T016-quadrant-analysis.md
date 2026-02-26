---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T016 — Quadrant Analysis Agent

You are the insight copy specialist for TelStudy. You write `generateInsight()` — a pure function that converts quadrant summary counts into a single actionable sentence — and the `KeyInsight` component that displays it prominently on the results page.

## Mission

Give users a plain-English interpretation of their performance pattern. Numbers and charts tell users *what* happened. The key insight tells them *what to do about it*. Build `src/lib/insights.ts` with full test coverage in mind, and wire `KeyInsight` into the slot T014 left in `ResultsClient`.

## The Insight Logic

`generateInsight` reads the quadrant counts and returns one sentence. The logic:

```
1. Find the dominant quadrant (highest count)
2. If tied, use priority order: weakness > needs-speed > reckless > strength
3. Handle edge cases: perfect score (all correct), zero score (all wrong)
4. Return actionable present-tense advice
```

### Insight Strings by Dominant Quadrant

| Dominant | Insight |
|----------|---------|
| `strength` | "You answered most questions correctly and quickly — excellent command of this material." |
| `needs-speed` | "You're getting the right answers but spending too long — focus on building speed through repetition." |
| `reckless` | "You're answering too quickly and getting them wrong — slow down and read each question carefully." |
| `weakness` | "You spent the most time on questions you got wrong — prioritize understanding these concepts before your next attempt." |
| All correct (100%) | "Perfect score! Review questions that took longer than average to build your speed." |
| All incorrect (0%) | "Revisit the material before your next attempt — accuracy needs work across the board." |
| No data | "Complete a quiz to see your performance insights." |

### Tie-breaking Priority
When two quadrants have equal counts:
`weakness > needs-speed > reckless > strength`

This prioritizes the most actionable (and concerning) pattern.

## File Implementations

### `src/lib/insights.ts`
```typescript
import type { AnalyticsSummary } from '@/types/analytics';

type QuadrantKey = 'weakness' | 'needsSpeed' | 'reckless' | 'strength';

const INSIGHTS: Record<QuadrantKey, string> = {
  weakness:
    'You spent the most time on questions you got wrong — prioritize understanding these concepts before your next attempt.',
  needsSpeed:
    "You're getting the right answers but spending too long — focus on building speed through repetition.",
  reckless:
    "You're answering too quickly and getting them wrong — slow down and read each question carefully.",
  strength:
    'You answered most questions correctly and quickly — excellent command of this material.',
};

const PRIORITY_ORDER: QuadrantKey[] = ['weakness', 'needsSpeed', 'reckless', 'strength'];

/**
 * Generate a single actionable insight sentence from the quadrant summary.
 * Handles: all correct (perfect), all incorrect, empty data, tied quadrants.
 */
export function generateInsight(summary: AnalyticsSummary): string {
  const total =
    summary.strengthCount +
    summary.needsSpeedCount +
    summary.recklessCount +
    summary.weaknessCount;

  // No data
  if (total === 0) {
    return 'Complete a quiz to see your performance insights.';
  }

  const correctTotal = summary.strengthCount + summary.needsSpeedCount;
  const incorrectTotal = summary.recklessCount + summary.weaknessCount;

  // Perfect score (all correct)
  if (incorrectTotal === 0) {
    return 'Perfect score! Review questions that took longer than average to build your speed.';
  }

  // Zero score (all incorrect)
  if (correctTotal === 0) {
    return 'Revisit the material before your next attempt — accuracy needs work across the board.';
  }

  // Map to a comparable structure
  const counts: Record<QuadrantKey, number> = {
    weakness: summary.weaknessCount,
    needsSpeed: summary.needsSpeedCount,
    reckless: summary.recklessCount,
    strength: summary.strengthCount,
  };

  // Find max count
  const maxCount = Math.max(...Object.values(counts));

  // Among tied maximums, pick highest priority
  const dominant = PRIORITY_ORDER.find((key) => counts[key] === maxCount);

  if (!dominant) return INSIGHTS.weakness;

  return INSIGHTS[dominant];
}
```

### `src/components/analytics/KeyInsight.tsx`
```tsx
import { generateInsight } from '@/lib/insights';
import type { AnalyticsSummary } from '@/types/analytics';

interface KeyInsightProps {
  summary: AnalyticsSummary;
}

export function KeyInsight({ summary }: KeyInsightProps) {
  const insight = generateInsight(summary);

  return (
    <div
      className="border-l-2 border-[var(--accent)] bg-[var(--surface)] px-4 py-3"
      data-testid="key-insight"
    >
      <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Key Insight
      </p>
      <p className="text-sm leading-relaxed text-[var(--text)]">{insight}</p>
    </div>
  );
}
```

### Uncomment insight slot in `src/components/analytics/ResultsClient.tsx`

Read the file and replace the `KeyInsight` comment with the real component:

```tsx
// Add import at top:
import { KeyInsight } from './KeyInsight';

// Replace comment:
// {/* T016: <KeyInsight> goes here */}
// with:
<KeyInsight summary={analytics.summary} />
```

Place it **above** the chart slot (above `PerformanceChart`) — so the reading order is: Grade → Stats → Insight → Chart → Table.

## Test Coverage Plan

`generateInsight` is a pure function — it should have 100% line coverage. Here are the test cases to verify:

```typescript
// src/lib/insights.test.ts — reference for T023 (unit tests task)

const BASE_SUMMARY = {
  avgTimeMs: 3000,
  fastestCorrectMs: 1000,
  slowestIncorrectMs: 8000,
};

// Dominant: strength
generateInsight({ ...BASE_SUMMARY, strengthCount: 8, needsSpeedCount: 1, recklessCount: 0, weaknessCount: 1 })
// → "You answered most questions correctly and quickly..."

// Dominant: needs-speed
generateInsight({ ...BASE_SUMMARY, strengthCount: 1, needsSpeedCount: 8, recklessCount: 0, weaknessCount: 1 })
// → "You're getting the right answers but spending too long..."

// Dominant: reckless
generateInsight({ ...BASE_SUMMARY, strengthCount: 1, needsSpeedCount: 0, recklessCount: 8, weaknessCount: 1 })
// → "You're answering too quickly..."

// Dominant: weakness
generateInsight({ ...BASE_SUMMARY, strengthCount: 1, needsSpeedCount: 0, recklessCount: 1, weaknessCount: 8 })
// → "You spent the most time on questions you got wrong..."

// Perfect score
generateInsight({ ...BASE_SUMMARY, strengthCount: 5, needsSpeedCount: 5, recklessCount: 0, weaknessCount: 0 })
// → "Perfect score!..."

// Zero score
generateInsight({ ...BASE_SUMMARY, strengthCount: 0, needsSpeedCount: 0, recklessCount: 5, weaknessCount: 5 })
// → "Revisit the material..."

// Empty (no data)
generateInsight({ ...BASE_SUMMARY, strengthCount: 0, needsSpeedCount: 0, recklessCount: 0, weaknessCount: 0 })
// → "Complete a quiz..."

// Tie: weakness vs needs-speed → weakness wins (higher priority)
generateInsight({ ...BASE_SUMMARY, strengthCount: 0, needsSpeedCount: 4, recklessCount: 0, weaknessCount: 4 })
// → "You spent the most time on questions you got wrong..."
```

## Your Workflow

1. **Read** `src/types/analytics.ts` — verify `AnalyticsSummary` type
2. **Write** `src/lib/insights.ts`
3. **Write** `src/components/analytics/KeyInsight.tsx`
4. **Read** `src/components/analytics/ResultsClient.tsx` — find the insight comment slot
5. **Edit** `ResultsClient.tsx` — uncomment/replace with `<KeyInsight summary={analytics.summary} />`; add import
6. **Run** `npm run typecheck && npm run lint`

## Task Assignment
- **T016**: Quadrant Analysis and Insight Copy

## Files to Create
- `src/lib/insights.ts`
- `src/components/analytics/KeyInsight.tsx`

## Files to Modify
- `src/components/analytics/ResultsClient.tsx` — uncomment insight slot, add import

## Acceptance Criteria (Definition of Done)
- [ ] `generateInsight` returns non-empty string for all quadrant distributions
- [ ] Dominant `strength` → correct insight string
- [ ] Dominant `needs-speed` → correct insight string
- [ ] Dominant `reckless` → correct insight string
- [ ] Dominant `weakness` → correct insight string
- [ ] All correct (no incorrect) → perfect score message
- [ ] All incorrect (no correct) → revisit material message
- [ ] Empty summary (all zeros) → "Complete a quiz..." message
- [ ] Tied weakness+needs-speed → weakness wins (priority order)
- [ ] `KeyInsight` renders with left white border accent
- [ ] `data-testid="key-insight"` on KeyInsight container
- [ ] KeyInsight appears above chart on results page
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
