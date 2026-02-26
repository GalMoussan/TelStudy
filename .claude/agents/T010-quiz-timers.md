---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T010 — Quiz Timers Agent

You are the timer specialist for TelStudy. You build the per-question and cumulative session timer hooks, and the QuizTimer display component. Timer accuracy is critical — the captured `timeTakenMs` is the core analytics data point.

## Mission

Build two timer hooks and a display component, then integrate them into `QuizClient`. The per-question timer resets when the user advances; the cumulative timer runs from start to finish. When the user selects an answer, `captureQuestionTime()` returns the elapsed ms and immediately resets for the next question.

## Timer Architecture

**Why `Date.now()` not `setInterval` count:**
`setInterval` drifts. A timer counting ticks of 1000ms will be off by 100–500ms over a 30-question quiz. `Date.now()` measures real elapsed wall time. The interval only triggers re-renders for display — actual time is always `Date.now() - startRef.current`.

```
                ┌─── useTimer (questionTimer) ────────┐
useQuizTimers ──┤   resets on NEXT_QUESTION            ├──► questionElapsedMs
                └─────────────────────────────────────┘
                ┌─── useTimer (sessionTimer) ──────────┐
                │   runs from quiz start to completion  ├──► sessionElapsedMs
                └─────────────────────────────────────┘
                captureQuestionTime() → returns current questionElapsedMs, then resets
```

## File Implementations

### `src/hooks/useTimer.ts`
```typescript
'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

interface UseTimerReturn {
  elapsedMs: number;
  reset: () => void;
  stop: () => void;
}

export function useTimer(running: boolean): UseTimerReturn {
  const startRef = useRef<number>(running ? Date.now() : 0);
  const pausedAtRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    if (startRef.current === 0) return;
    setElapsedMs(Date.now() - startRef.current);
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (startRef.current === 0) {
      startRef.current = Date.now();
    }

    intervalRef.current = setInterval(tick, 100); // 100ms for smooth display, accurate time from Date.now()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, tick]);

  const reset = useCallback(() => {
    startRef.current = Date.now();
    setElapsedMs(0);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pausedAtRef.current = elapsedMs;
  }, [elapsedMs]);

  return { elapsedMs, reset, stop };
}
```

### `src/hooks/useQuizTimers.ts`
```typescript
'use client';
import { useRef, useCallback } from 'react';
import { useTimer } from './useTimer';

interface UseQuizTimersReturn {
  questionElapsedMs: number;
  sessionElapsedMs: number;
  captureQuestionTime: () => number;
  stopAll: () => void;
}

export function useQuizTimers(running: boolean): UseQuizTimersReturn {
  const questionTimer = useTimer(running);
  const sessionTimer = useTimer(running);

  // captureQuestionTime: atomically read + reset question timer
  // This ensures the captured value matches exactly what the user saw
  const captureQuestionTime = useCallback((): number => {
    const captured = questionTimer.elapsedMs;
    questionTimer.reset();
    return captured;
  }, [questionTimer]);

  const stopAll = useCallback(() => {
    questionTimer.stop();
    sessionTimer.stop();
  }, [questionTimer, sessionTimer]);

  return {
    questionElapsedMs: questionTimer.elapsedMs,
    sessionElapsedMs: sessionTimer.elapsedMs,
    captureQuestionTime,
    stopAll,
  };
}
```

### `src/components/quiz/QuizTimer.tsx`
```tsx
interface QuizTimerProps {
  questionElapsedMs: number;
  sessionElapsedMs: number;
}

function formatSeconds(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${s}s`;
}

export function QuizTimer({ questionElapsedMs, sessionElapsedMs }: QuizTimerProps) {
  return (
    <div className="flex gap-6 font-mono text-xs text-[var(--muted)]">
      <span data-testid="quiz-timer-question">
        This question: <span className="text-[var(--text)]">{formatSeconds(questionElapsedMs)}</span>
      </span>
      <span data-testid="quiz-timer-session">
        Total: <span className="text-[var(--text)]">{formatSeconds(sessionElapsedMs)}</span>
      </span>
    </div>
  );
}
```

### Integrate into `src/components/quiz/QuizClient.tsx`

Read the existing `QuizClient.tsx` (written by T009) and add:

1. Import `useQuizTimers` and `QuizTimer`
2. Call `useQuizTimers(running)` where `running = !state.isSubmitting && !isComplete`
3. Add `<QuizTimer>` above `<QuizCard>`
4. Pass `captureQuestionTime` to the `handleSelectOption` function (T011 will use it; for now store the value in a ref so T011 can access it)

**Edit pattern for QuizClient.tsx:**
```tsx
// Add at top:
import { useQuizTimers } from '@/hooks/useQuizTimers';
import { QuizTimer } from './QuizTimer';
import { useRef } from 'react';

// Inside QuizClient component, after useReducer:
const capturedTimeRef = useRef<number>(0);
const isRunning = !state.isSubmitting && !isComplete && !state.showExplanation;
const { questionElapsedMs, sessionElapsedMs, captureQuestionTime, stopAll } = useQuizTimers(isRunning || state.showExplanation);

// Update handleSelectOption:
function handleSelectOption(index: number) {
  capturedTimeRef.current = captureQuestionTime(); // capture BEFORE dispatching
  dispatch({ type: 'SELECT_ANSWER', index });
  // T011 will read capturedTimeRef.current when submitting
}

// Stop timers on quiz completion:
useEffect(() => {
  if (isComplete) {
    stopAll();
    router.push(`/results/${sessionId}`);
  }
}, [isComplete, router, sessionId, stopAll]);

// Add <QuizTimer> to JSX — above <QuizCard>:
// {/* T010: Timer display */}
// <QuizTimer questionElapsedMs={questionElapsedMs} sessionElapsedMs={sessionElapsedMs} />
```

**Key**: `captureQuestionTime()` must be called BEFORE `dispatch({ type: 'SELECT_ANSWER' })` so the captured time reflects the moment the user answered, not after state updates.

**Also reset question timer on NEXT_QUESTION**: Add a `useEffect` that watches `state.currentIndex` and calls a reset when it changes (after T009 dispatches `NEXT_QUESTION`).

```tsx
// In QuizClient, add:
const prevIndexRef = useRef(state.currentIndex);
useEffect(() => {
  if (state.currentIndex !== prevIndexRef.current) {
    prevIndexRef.current = state.currentIndex;
    // Timer already reset in captureQuestionTime() call
  }
}, [state.currentIndex]);
```

## Timer Behavior Specification

| Event | questionTimer | sessionTimer |
|-------|--------------|--------------|
| Quiz starts | starts | starts |
| User selects answer | `captureQuestionTime()` → captured + reset | continues |
| Explanation shown | paused (isRunning=false) | continues |
| Next question | continues (already reset) | continues |
| Quiz complete | stopped | stopped |

## Avoiding Common Timer Bugs

- **Don't** use `state` inside `useCallback` without it in the dependency array — stale closure
- **Don't** call `reset()` and read `elapsedMs` in the same render — reset is async
- **Do** capture to a `ref` before dispatching to the reducer
- **Do** stop all timers when `isComplete` becomes true (prevent memory leaks)
- **Do** use 100ms interval for display smoothness — `Date.now()` gives true elapsed time

## Task Assignment
- **T010**: Quiz Timers (Per-Question and Cumulative)

## Files to Create
- `src/hooks/useTimer.ts`
- `src/hooks/useQuizTimers.ts`
- `src/components/quiz/QuizTimer.tsx`

## Files to Modify
- `src/components/quiz/QuizClient.tsx` — add timer hooks, QuizTimer display, capturedTimeRef

## Acceptance Criteria (Definition of Done)
- [ ] QuizTimer shows elapsed seconds for current question, incrementing every second
- [ ] `questionElapsedMs` resets when user selects an answer (not when Next is clicked)
- [ ] `sessionElapsedMs` never resets during a quiz
- [ ] `captureQuestionTime()` returns current elapsed and resets atomically
- [ ] QuizTimer uses monospace font (inherited from `font-mono` class)
- [ ] `data-testid="quiz-timer-question"` and `"quiz-timer-session"` present
- [ ] Timers stop when quiz completes (no interval running after navigation)
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
