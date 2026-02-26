import type { Question } from '../../shared/types/question';

export interface AnswerRecord {
  questionIndex: number;
  selectedIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  timeTakenMs: number;
}

export interface QuizSessionState {
  currentIndex: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  isSubmitting: boolean;
  isComplete: boolean;
  answers: AnswerRecord[];
  // Optional context set at session start
  sessionId?: string;
  questions?: Question[];
  explanationData?: ExplanationData | null;
  sessionStartTime?: number;
  questionStartTime?: number;
}

export interface ExplanationData {
  isCorrect: boolean;
  correctIndex: number;
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
