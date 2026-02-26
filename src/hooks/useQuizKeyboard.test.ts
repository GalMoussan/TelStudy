import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useQuizKeyboard } from './useQuizKeyboard';

describe('T020 — Keyboard Navigation: useQuizKeyboard', () => {
  it('calls onSelectOption(0) when "1" pressed', () => {
    // Acceptance: "Pressing '1' selects the first option"
    const onSelectOption = vi.fn();
    const onNext = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext, disabled: false }));
    fireEvent.keyDown(window, { key: '1' });
    expect(onSelectOption).toHaveBeenCalledWith(0);
  });

  it('calls onSelectOption(1) when "2" pressed', () => {
    // Acceptance: "Pressing '2' selects the second option"
    const onSelectOption = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext: vi.fn(), disabled: false }));
    fireEvent.keyDown(window, { key: '2' });
    expect(onSelectOption).toHaveBeenCalledWith(1);
  });

  it('calls onSelectOption(3) when "4" pressed', () => {
    // Acceptance: "Pressing '4' selects the fourth option"
    const onSelectOption = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext: vi.fn(), disabled: false }));
    fireEvent.keyDown(window, { key: '4' });
    expect(onSelectOption).toHaveBeenCalledWith(3);
  });

  it('calls onNext when Enter pressed', () => {
    // Acceptance: "Pressing Enter when explanation is showing advances to next question"
    const onNext = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption: vi.fn(), onNext, disabled: false }));
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onNext).toHaveBeenCalled();
  });

  it('does nothing when disabled=true', () => {
    // Acceptance: "'disabled' prop pauses all keyboard handling during API calls"
    const onSelectOption = vi.fn();
    const onNext = vi.fn();
    renderHook(() => useQuizKeyboard({ onSelectOption, onNext, disabled: true }));
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onSelectOption).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('removes event listener on unmount', () => {
    // Acceptance: "Keyboard handler is removed on component unmount (no memory leak)"
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() =>
      useQuizKeyboard({ onSelectOption: vi.fn(), onNext: vi.fn(), disabled: false })
    );
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
