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
    wrongAttempts: [],
    reviewIndex: null,
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

    case 'MARK_WRONG_ATTEMPT': {
      if (state.showExplanation || state.isSubmitting) return state;
      // No-op if already tracked
      if (state.wrongAttempts.includes(action.index)) return state;
      return { ...state, wrongAttempts: [...state.wrongAttempts, action.index] };
    }

    case 'SET_SUBMITTING': {
      return { ...state, isSubmitting: action.value };
    }

    case 'SHOW_EXPLANATION': {
      const answerRecord: AnswerRecord = {
        questionIndex: state.currentIndex,
        // Use explicitly passed recordedIndex if provided, else fall back to selectedAnswer
        selectedIndex: action.recordedIndex ?? state.selectedAnswer ?? -1,
        correctAnswerIndex: action.data.correctIndex,
        isCorrect: action.data.isCorrect,
        timeTakenMs: action.timeTakenMs,
        explanation: action.data.explanation,
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
        wrongAttempts: [],
        reviewIndex: null,
        questionStartTime: Date.now(),
      };
    }

    case 'COMPLETE': {
      return { ...state, isComplete: true };
    }

    case 'ENTER_REVIEW': {
      return { ...state, reviewIndex: action.index };
    }

    case 'EXIT_REVIEW': {
      return { ...state, reviewIndex: null };
    }

    case 'PREV_REVIEW': {
      if (state.reviewIndex === null || state.reviewIndex === 0) return state;
      return { ...state, reviewIndex: state.reviewIndex - 1 };
    }

    case 'NEXT_REVIEW': {
      if (state.reviewIndex === null || state.reviewIndex >= state.currentIndex - 1) return state;
      return { ...state, reviewIndex: state.reviewIndex + 1 };
    }

    default:
      return state;
  }
}

export function useQuizReducer(initialState: QuizSessionState) {
  return useReducer(quizReducer, initialState);
}
