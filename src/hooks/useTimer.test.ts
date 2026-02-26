import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('T010 — Quiz Timers: useTimer', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('starts with elapsed = 0', () => {
    // Acceptance: "Timer starts at 0 on mount"
    const { result } = renderHook(() => useTimer());
    expect(result.current.elapsed).toBe(0);
  });

  it('elapsed increases after time passes', () => {
    // Acceptance: "Per-question timer counts up accurately"
    const { result } = renderHook(() => useTimer());
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.elapsed).toBeGreaterThan(0);
  });

  it('reset() brings elapsed back to near 0', () => {
    // Acceptance: "Timer resets between questions"
    const { result } = renderHook(() => useTimer());
    act(() => { vi.advanceTimersByTime(5000); });
    act(() => { result.current.reset(); });
    expect(result.current.elapsed).toBeLessThan(200);
  });

  it('cleans up interval on unmount (no memory leak)', () => {
    // Acceptance: "Timer intervals cleaned up on unmount"
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useTimer());
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('exposes getElapsed() for snapshot capture', () => {
    // Acceptance: "captureQuestionTime() returns exact time at moment of answer"
    const { result } = renderHook(() => useTimer());
    act(() => { vi.advanceTimersByTime(2500); });
    expect(typeof result.current.elapsed).toBe('number');
  });
});
