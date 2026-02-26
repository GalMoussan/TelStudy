'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

interface UseTimerReturn {
  elapsed: number;
  reset: () => void;
}

export function useTimer(): UseTimerReturn {
  const startRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100); // 100ms interval for smooth display, accurate time from Date.now()

    return () => clearInterval(id);
  }, []);

  const reset = useCallback(() => {
    startRef.current = Date.now();
    setElapsed(0);
  }, []);

  return { elapsed, reset };
}
