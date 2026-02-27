'use client';
import { useEffect, useRef } from 'react';

interface UseQuizKeyboardProps {
  onSelectOption: (index: number) => void;
  onNext: () => void;
  disabled: boolean;
}

const KEY_MAP: Record<string, number> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
};

export function useQuizKeyboard({ onSelectOption, onNext, disabled }: UseQuizKeyboardProps) {
  // Use refs so the listener doesn't need to be re-registered when callbacks change
  const onSelectOptionRef = useRef(onSelectOption);
  const onNextRef = useRef(onNext);
  const disabledRef = useRef(disabled);

  onSelectOptionRef.current = onSelectOption;
  onNextRef.current = onNext;
  disabledRef.current = disabled;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabledRef.current) return;

      if (e.key in KEY_MAP) {
        onSelectOptionRef.current(KEY_MAP[e.key]!);
        return;
      }

      if (e.key === 'Enter') {
        onNextRef.current();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // empty deps — refs always carry latest values
}
