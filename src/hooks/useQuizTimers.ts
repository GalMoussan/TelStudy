'use client';
import { useCallback } from 'react';
import { useTimer } from './useTimer';

interface UseQuizTimersReturn {
  cumulativeElapsed: number;
  perQuestionElapsed: number;
  captureQuestionTime: () => number;
}

export function useQuizTimers(): UseQuizTimersReturn {
  const cumulative = useTimer();
  const perQuestion = useTimer();

  // Returns the current per-question elapsed time WITHOUT resetting
  // Must be called BEFORE dispatching NEXT_QUESTION (capture the value first)
  const captureQuestionTime = useCallback((): number => {
    const captured = perQuestion.elapsed;
    perQuestion.reset();
    return captured;
  }, [perQuestion]);

  return {
    cumulativeElapsed: cumulative.elapsed,
    perQuestionElapsed: perQuestion.elapsed,
    captureQuestionTime,
  };
}
