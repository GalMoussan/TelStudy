import { describe, it, expect } from 'vitest';
import { quizReducer } from './useQuizReducer';
import type { QuizSessionState, QuizAction } from '@/types/quiz';

function makeState(overrides: Partial<QuizSessionState> = {}): QuizSessionState {
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

describe('T009 — Quiz Engine: quizReducer', () => {
  describe('SELECT_ANSWER', () => {
    it('sets selectedAnswer to the given index', () => {
      // Acceptance: "Selecting an option highlights it"
      const state = makeState();
      const next = quizReducer(state, { type: 'SELECT_ANSWER', index: 2 });
      expect(next.selectedAnswer).toBe(2);
    });

    it('ignores select when showExplanation is true', () => {
      // Acceptance: "Cannot change answer after explanation shown"
      const state = makeState({ selectedAnswer: 0, showExplanation: true });
      const next = quizReducer(state, { type: 'SELECT_ANSWER', index: 3 });
      expect(next.selectedAnswer).toBe(0);
    });

    it('ignores select when isSubmitting is true', () => {
      // Acceptance: "Buttons disabled during API submission"
      const state = makeState({ isSubmitting: true });
      const next = quizReducer(state, { type: 'SELECT_ANSWER', index: 1 });
      expect(next.selectedAnswer).toBeNull();
    });
  });

  describe('SET_SUBMITTING', () => {
    it('toggles isSubmitting flag', () => {
      // Acceptance: "Submit button disabled while request in flight"
      const state = makeState();
      expect(quizReducer(state, { type: 'SET_SUBMITTING', value: true }).isSubmitting).toBe(true);
      expect(quizReducer(state, { type: 'SET_SUBMITTING', value: false }).isSubmitting).toBe(false);
    });
  });

  describe('SHOW_EXPLANATION', () => {
    it('sets showExplanation, clears isSubmitting, appends answer record', () => {
      // Acceptance: "ExplanationPanel appears after answer submitted"
      const state = makeState({ selectedAnswer: 1, isSubmitting: true });
      const data = { isCorrect: true, correctIndex: 1, explanation: 'Test explanation' };
      const next = quizReducer(state, { type: 'SHOW_EXPLANATION', data, timeTakenMs: 4000 });
      expect(next.showExplanation).toBe(true);
      expect(next.isSubmitting).toBe(false);
      expect(next.answers).toHaveLength(1);
      expect(next.answers[0]?.timeTakenMs).toBe(4000);
    });
  });

  describe('NEXT_QUESTION', () => {
    it('increments currentIndex and resets per-question state', () => {
      // Acceptance: "Next Question button advances to next question"
      const state = makeState({ currentIndex: 0, selectedAnswer: 2, showExplanation: true });
      const next = quizReducer(state, { type: 'NEXT_QUESTION' });
      expect(next.currentIndex).toBe(1);
      expect(next.selectedAnswer).toBeNull();
      expect(next.showExplanation).toBe(false);
    });
  });

  describe('COMPLETE', () => {
    it('sets isComplete to true', () => {
      // Acceptance: "Quiz completes after last question"
      const next = quizReducer(makeState(), { type: 'COMPLETE' });
      expect(next.isComplete).toBe(true);
    });
  });
});
