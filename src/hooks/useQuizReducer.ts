import { useReducer } from 'react';
import type { QuizSessionState, QuizAction, AnswerRecord } from '@/types/quiz';
import type { Question } from '../../shared/types/question';

export function createInitialState(sessionId: string, questions: Question[]): QuizSessionState {
  return {
    sessionId,
    questions,
    currentIndex: 0,
    selectedAnswer: null,
    showExplanation: false,
    explanationData: null,
    isSubmitting: false,
    isComplete: false,
    answers: [],
    sessionStartTime: Date.now(),
    questionStartTime: Date.now(),
  };
}

export function quizReducer(state: QuizSessionState, action: QuizAction): QuizSessionState {
  switch (action.type) {
    case 'SELECT_ANSWER': {
      // Guard: ignore if explanation showing or submitting
      if (state.showExplanation || state.isSubmitting) return state;
      return { ...state, selectedAnswer: action.index };
    }

    case 'SET_SUBMITTING': {
      return { ...state, isSubmitting: action.value };
    }

    case 'SHOW_EXPLANATION': {
      // ExplanationData uses: isCorrect, correctIndex, explanation
      const answerRecord: AnswerRecord = {
        questionIndex: state.currentIndex,
        selectedIndex: state.selectedAnswer ?? -1,
        correctAnswerIndex: action.data.correctIndex,
        isCorrect: action.data.isCorrect,
        timeTakenMs: action.timeTakenMs,
      };

      return {
        ...state,
        showExplanation: true,
        isSubmitting: false,
        explanationData: action.data,
        answers: [...state.answers, answerRecord],
      };
    }

    case 'NEXT_QUESTION': {
      // Guard: no-op if explanation not showing
      if (!state.showExplanation) return state;
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        selectedAnswer: null,
        showExplanation: false,
        explanationData: null,
        questionStartTime: Date.now(),
      };
    }

    case 'COMPLETE': {
      return { ...state, isComplete: true };
    }

    default:
      return state;
  }
}

export function useQuizReducer(initialState: QuizSessionState) {
  return useReducer(quizReducer, initialState);
}
