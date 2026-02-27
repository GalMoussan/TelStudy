import { describe, it, expect } from 'vitest';
import { quizReducer, createInitialState } from './useQuizReducer';
import type { QuizSessionState, QuizAction } from '@/types/quiz';
import type { Question } from '../../shared/types/question';

const SAMPLE_QUESTIONS: Question[] = [
  { question_text: 'Q1?', options: ['A', 'B', 'C', 'D'], correct_answer_index: 0, explanation: 'E1' },
  { question_text: 'Q2?', options: ['A', 'B', 'C', 'D'], correct_answer_index: 1, explanation: 'E2' },
];

function makeState(overrides: Partial<QuizSessionState> = {}): QuizSessionState {
  return {
    sessionId: 'test-session',
    questions: SAMPLE_QUESTIONS,
    currentIndex: 0,
    selectedAnswer: null,
    showExplanation: false,
    explanationData: null,
    isSubmitting: false,
    isComplete: false,
    answers: [],
    sessionStartTime: Date.now(),
    questionStartTime: Date.now(),
    ...overrides,
  };
}

describe('T023 — Unit Tests: createInitialState', () => {
  it('returns correct initial state shape', () => {
    const state = createInitialState('abc-123', SAMPLE_QUESTIONS);
    expect(state.sessionId).toBe('abc-123');
    expect(state.questions).toBe(SAMPLE_QUESTIONS);
    expect(state.currentIndex).toBe(0);
    expect(state.selectedAnswer).toBeNull();
    expect(state.showExplanation).toBe(false);
    expect(state.explanationData).toBeNull();
    expect(state.isSubmitting).toBe(false);
    expect(state.isComplete).toBe(false);
    expect(state.answers).toEqual([]);
  });

  it('sets sessionStartTime and questionStartTime to current time', () => {
    const before = Date.now();
    const state = createInitialState('session-1', SAMPLE_QUESTIONS);
    const after = Date.now();
    expect(state.sessionStartTime).toBeGreaterThanOrEqual(before);
    expect(state.sessionStartTime).toBeLessThanOrEqual(after);
    expect(state.questionStartTime).toBeGreaterThanOrEqual(before);
    expect(state.questionStartTime).toBeLessThanOrEqual(after);
  });
});

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

    it('is a no-op when showExplanation is false', () => {
      const state = makeState({ currentIndex: 0, showExplanation: false });
      const next = quizReducer(state, { type: 'NEXT_QUESTION' });
      expect(next).toBe(state);
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
