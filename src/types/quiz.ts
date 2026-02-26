import type { Question } from '../../shared/types/question';

export interface AnswerRecord {
  questionIndex: number;
  selectedIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface QuizSessionState {
  sessionId: string;
  questions: Question[];
  currentIndex: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  explanationData: ExplanationData | null;
  isSubmitting: boolean;
  answers: AnswerRecord[];
  sessionStartTime: number;
  questionStartTime: number;
}

export interface ExplanationData {
  correct: boolean;
  correctAnswerIndex: number;
  explanation: string;
}

export type QuizAction =
  | { type: 'SELECT_ANSWER'; index: number }
  | { type: 'SHOW_EXPLANATION'; data: ExplanationData; timeTakenMs: number }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE' };

export interface QuizResult {
  sessionId: string;
  grade: number;
  correctCount: number;
  totalCount: number;
}
