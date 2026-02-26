---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T023 — Vitest Unit Test Suite Agent

You are the unit testing specialist for TelStudy. You write comprehensive Vitest tests covering every pure function and custom hook — achieving 100% line coverage on grade utilities and insight generator, and ≥90% on the quiz reducer.

## Mission

Every pure function and hook in TelStudy can be tested without a browser or network. This task writes those tests: `grade.ts`, `insights.ts`, `quizReducer`, `question-schema` validator, `useTimer`, and `useQuizKeyboard`. After this task, `npm run test:run` exits 0 with ≥40 individual test cases.

## Vitest Config

Read `vitest.config.ts` first. If it doesn't exist or is minimal, **write** the full config:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
      include: [
        'src/lib/**/*.ts',
        'src/hooks/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/test/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Also create the setup file:
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
```

## Test Files

### `src/lib/grade.test.ts`

**Read** `src/lib/grade.ts` first to understand exact implementations.

```typescript
import { describe, it, expect } from 'vitest';
import { calculateGrade, getGradeLabel, classifyQuestion } from './grade';

describe('calculateGrade', () => {
  it('returns 100 when all correct', () => {
    expect(calculateGrade(10, 10)).toBe(100);
  });

  it('returns 0 when all wrong', () => {
    expect(calculateGrade(0, 10)).toBe(0);
  });

  it('calculates percentage to 2 decimal places', () => {
    expect(calculateGrade(7, 10)).toBe(70);
    expect(calculateGrade(1, 3)).toBeCloseTo(33.33, 1);
  });

  it('returns 0 for 0 total questions', () => {
    expect(calculateGrade(0, 0)).toBe(0);
  });
});

describe('getGradeLabel', () => {
  it('returns A for 90+', () => {
    expect(getGradeLabel(90)).toBe('A');
    expect(getGradeLabel(100)).toBe('A');
  });

  it('returns B for 80-89', () => {
    expect(getGradeLabel(80)).toBe('B');
    expect(getGradeLabel(89)).toBe('B');
  });

  it('returns C for 70-79', () => {
    expect(getGradeLabel(70)).toBe('C');
    expect(getGradeLabel(79)).toBe('C');
  });

  it('returns D for 60-69', () => {
    expect(getGradeLabel(60)).toBe('D');
    expect(getGradeLabel(69)).toBe('D');
  });

  it('returns F for below 60', () => {
    expect(getGradeLabel(59)).toBe('F');
    expect(getGradeLabel(0)).toBe('F');
  });
});

describe('classifyQuestion', () => {
  const avg = 5000; // 5 seconds avg

  it('classifies fast+correct as strength', () => {
    expect(classifyQuestion(3000, true, avg)).toBe('strength');
  });

  it('classifies slow+correct as needs-speed', () => {
    expect(classifyQuestion(8000, true, avg)).toBe('needs-speed');
  });

  it('classifies fast+wrong as reckless', () => {
    expect(classifyQuestion(2000, false, avg)).toBe('reckless');
  });

  it('classifies slow+wrong as weakness', () => {
    expect(classifyQuestion(9000, false, avg)).toBe('weakness');
  });

  it('treats exactly at avg threshold as fast (<=)', () => {
    // At exactly avgTimeMs — should classify as fast (strength/reckless)
    expect(classifyQuestion(5000, true, avg)).toBe('strength');
    expect(classifyQuestion(5000, false, avg)).toBe('reckless');
  });
});
```

### `src/lib/insights.test.ts`

**Read** `src/lib/insights.ts` first to understand the exact insight strings.

```typescript
import { describe, it, expect } from 'vitest';
import { generateInsight } from './insights';

const BASE = {
  avgTimeMs: 3000,
  fastestCorrectMs: 1000,
  slowestIncorrectMs: 8000,
};

describe('generateInsight', () => {
  it('returns "Complete a quiz" when all counts are zero', () => {
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 0, recklessCount: 0, weaknessCount: 0 });
    expect(result).toContain('Complete a quiz');
  });

  it('returns perfect score message when no incorrect answers', () => {
    const result = generateInsight({ ...BASE, strengthCount: 5, needsSpeedCount: 5, recklessCount: 0, weaknessCount: 0 });
    expect(result).toContain('Perfect score');
  });

  it('returns revisit material message when all incorrect', () => {
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 0, recklessCount: 5, weaknessCount: 5 });
    expect(result).toContain('Revisit the material');
  });

  it('returns strength insight when strength is dominant', () => {
    const result = generateInsight({ ...BASE, strengthCount: 8, needsSpeedCount: 1, recklessCount: 0, weaknessCount: 1 });
    expect(result).toContain('correctly and quickly');
  });

  it('returns needs-speed insight when needsSpeed is dominant', () => {
    const result = generateInsight({ ...BASE, strengthCount: 1, needsSpeedCount: 8, recklessCount: 0, weaknessCount: 1 });
    expect(result).toContain('spending too long');
  });

  it('returns reckless insight when reckless is dominant', () => {
    const result = generateInsight({ ...BASE, strengthCount: 1, needsSpeedCount: 0, recklessCount: 8, weaknessCount: 1 });
    expect(result).toContain('slow down');
  });

  it('returns weakness insight when weakness is dominant', () => {
    const result = generateInsight({ ...BASE, strengthCount: 1, needsSpeedCount: 0, recklessCount: 1, weaknessCount: 8 });
    expect(result).toContain('prioritize understanding');
  });

  it('breaks ties in favor of weakness over needs-speed', () => {
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 4, recklessCount: 0, weaknessCount: 4 });
    expect(result).toContain('prioritize understanding');
  });

  it('breaks ties in favor of weakness over reckless', () => {
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 0, recklessCount: 4, weaknessCount: 4 });
    expect(result).toContain('prioritize understanding');
  });

  it('breaks ties in favor of needs-speed over reckless', () => {
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 4, recklessCount: 4, weaknessCount: 0 });
    expect(result).toContain('spending too long');
  });
});
```

### `src/hooks/useQuizReducer.test.ts`

**Read** `src/hooks/useQuizReducer.ts` and `src/types/quiz.ts` first.

```typescript
import { describe, it, expect } from 'vitest';
import { quizReducer } from './useQuizReducer';
import type { QuizSessionState, QuizAction } from '@/types/quiz';

// Build initial state based on the actual type shape
function makeState(overrides?: Partial<QuizSessionState>): QuizSessionState {
  return {
    currentIndex: 0,
    selectedAnswer: null,
    showExplanation: false,
    isSubmitting: false,
    isComplete: false,
    answers: [],
    ...overrides,
  };
}

describe('quizReducer', () => {
  describe('SELECT_ANSWER', () => {
    it('sets selectedAnswer index', () => {
      const state = makeState();
      const next = quizReducer(state, { type: 'SELECT_ANSWER', index: 2 });
      expect(next.selectedAnswer).toBe(2);
    });

    it('ignores action when showExplanation is true', () => {
      const state = makeState({ selectedAnswer: 0, showExplanation: true });
      const next = quizReducer(state, { type: 'SELECT_ANSWER', index: 3 });
      expect(next.selectedAnswer).toBe(0); // unchanged
    });

    it('ignores action when isSubmitting is true', () => {
      const state = makeState({ isSubmitting: true });
      const next = quizReducer(state, { type: 'SELECT_ANSWER', index: 1 });
      expect(next.selectedAnswer).toBeNull();
    });
  });

  describe('SET_SUBMITTING', () => {
    it('sets isSubmitting to true', () => {
      const state = makeState();
      const next = quizReducer(state, { type: 'SET_SUBMITTING', value: true });
      expect(next.isSubmitting).toBe(true);
    });

    it('sets isSubmitting to false', () => {
      const state = makeState({ isSubmitting: true });
      const next = quizReducer(state, { type: 'SET_SUBMITTING', value: false });
      expect(next.isSubmitting).toBe(false);
    });
  });

  describe('SHOW_EXPLANATION', () => {
    it('sets showExplanation and stores answer record', () => {
      const state = makeState({ selectedAnswer: 1, isSubmitting: true });
      const data = { isCorrect: true, correctIndex: 1, explanation: 'test' };
      const next = quizReducer(state, { type: 'SHOW_EXPLANATION', data, timeTakenMs: 3000 });
      expect(next.showExplanation).toBe(true);
      expect(next.isSubmitting).toBe(false);
      expect(next.answers).toHaveLength(1);
      expect(next.answers[0]?.isCorrect).toBe(true);
      expect(next.answers[0]?.timeTakenMs).toBe(3000);
    });
  });

  describe('NEXT_QUESTION', () => {
    it('increments currentIndex and resets per-question state', () => {
      const state = makeState({ currentIndex: 0, selectedAnswer: 2, showExplanation: true });
      const next = quizReducer(state, { type: 'NEXT_QUESTION' });
      expect(next.currentIndex).toBe(1);
      expect(next.selectedAnswer).toBeNull();
      expect(next.showExplanation).toBe(false);
    });
  });

  describe('COMPLETE', () => {
    it('sets isComplete to true', () => {
      const state = makeState();
      const next = quizReducer(state, { type: 'COMPLETE' });
      expect(next.isComplete).toBe(true);
    });
  });
});
```

### `src/lib/validators/question-schema.test.ts`

**Read** `src/lib/validators/question-schema.ts` first to understand `validateQuestionFile()`.

```typescript
import { describe, it, expect } from 'vitest';
import { validateQuestionFile } from './question-schema';

const VALID_QUESTIONS = JSON.stringify([
  {
    question_text: 'What is 2+2?',
    options: ['1', '2', '3', '4'],
    correct_answer_index: 3,
    explanation: 'Basic addition.',
  },
]);

describe('validateQuestionFile', () => {
  it('accepts a valid question set', async () => {
    const file = new File([VALID_QUESTIONS], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a non-JSON file extension', async () => {
    const file = new File([VALID_QUESTIONS], 'test.txt', { type: 'text/plain' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/\.json/);
  });

  it('rejects malformed JSON content', async () => {
    const file = new File(['not valid json {{{'], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not valid JSON/i);
  });

  it('rejects empty array', async () => {
    const file = new File(['[]'], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/at least 1/);
  });

  it('rejects question missing required fields', async () => {
    const bad = JSON.stringify([{ question_text: 'Only text' }]);
    const file = new File([bad], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects options array with wrong length', async () => {
    const bad = JSON.stringify([{
      question_text: 'Q',
      options: ['a', 'b'], // only 2, needs 4
      correct_answer_index: 0,
      explanation: 'E',
    }]);
    const file = new File([bad], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
  });

  it('rejects correct_answer_index out of range', async () => {
    const bad = JSON.stringify([{
      question_text: 'Q',
      options: ['a', 'b', 'c', 'd'],
      correct_answer_index: 99,
      explanation: 'E',
    }]);
    const file = new File([bad], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
  });
});
```

### `src/hooks/useTimer.test.ts`

**Read** `src/hooks/useTimer.ts` first.

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 0 elapsed time', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.elapsed).toBe(0);
  });

  it('increments elapsed over time', () => {
    const { result } = renderHook(() => useTimer());
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.elapsed).toBeGreaterThan(0);
  });

  it('reset brings elapsed back to near 0', () => {
    const { result } = renderHook(() => useTimer());
    act(() => { vi.advanceTimersByTime(5000); });
    act(() => { result.current.reset(); });
    expect(result.current.elapsed).toBeLessThan(100);
  });

  it('cleans up interval on unmount (no memory leak)', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useTimer());
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
```

### `src/hooks/useQuizKeyboard.test.ts`

**Read** `src/hooks/useQuizKeyboard.ts` first.

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuizKeyboard } from './useQuizKeyboard';
import { fireEvent } from '@testing-library/react';

describe('useQuizKeyboard', () => {
  it('calls onSelectOption(0) when "1" is pressed', () => {
    const onSelectOption = vi.fn();
    const onNext = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext, disabled: false }));
    fireEvent.keyDown(window, { key: '1' });
    expect(onSelectOption).toHaveBeenCalledWith(0);
  });

  it('calls onSelectOption(3) when "4" is pressed', () => {
    const onSelectOption = vi.fn();
    const onNext = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext, disabled: false }));
    fireEvent.keyDown(window, { key: '4' });
    expect(onSelectOption).toHaveBeenCalledWith(3);
  });

  it('calls onNext when Enter is pressed', () => {
    const onSelectOption = vi.fn();
    const onNext = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext, disabled: false }));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onNext).toHaveBeenCalled();
  });

  it('does nothing when disabled=true', () => {
    const onSelectOption = vi.fn();
    const onNext = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext, disabled: true }));
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onSelectOption).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() =>
      useQuizKeyboard({ onSelectOption: vi.fn(), onNext: vi.fn(), disabled: false })
    );
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
```

## Required Dependencies

Verify these are in `package.json`. If not, add them:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest @vitest/coverage-v8 jsdom
```

## Your Workflow

1. **Read** `vitest.config.ts` — rewrite if missing or incomplete
2. **Write** `src/test/setup.ts`
3. **Read** each source file before writing its test: `grade.ts`, `insights.ts`, `useQuizReducer.ts`, `question-schema.ts`, `useTimer.ts`, `useQuizKeyboard.ts`
4. **Write** each test file, adapting test assertions to match the actual function signatures you read
5. **Run** `npm run test:run`
6. Fix any failing tests (likely: type field names differ from what you expected — adapt tests to match real code)
7. **Run** `npm run typecheck`

## Task Assignment
- **T023**: Vitest Unit Test Suite

## Files to Create
- `vitest.config.ts` (if missing or incomplete)
- `src/test/setup.ts`
- `src/lib/grade.test.ts`
- `src/lib/insights.test.ts`
- `src/hooks/useQuizReducer.test.ts`
- `src/lib/validators/question-schema.test.ts`
- `src/hooks/useTimer.test.ts`
- `src/hooks/useQuizKeyboard.test.ts`

## Acceptance Criteria (Definition of Done)
- [ ] `npm run test:run` exits 0 (all tests pass)
- [ ] `src/lib/grade.ts` has 100% line coverage
- [ ] `src/lib/insights.ts` has 100% line coverage
- [ ] `src/hooks/useQuizReducer.ts` has ≥90% line coverage
- [ ] Schema validator covers valid + all invalid input types
- [ ] Timer tests verify interval cleanup on unmount
- [ ] Keyboard hook tests verify disabled guard and listener cleanup
- [ ] Total test cases: ≥40 individual `it()` assertions
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run test:run
npm run typecheck
```
