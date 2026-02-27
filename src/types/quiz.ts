import type { Question } from '../../shared/types/question';

export interface AnswerRecord {
  questionIndex: number;
  selectedIndex: number;
  correctAnswerIndex: number;
  isCorrect: boolean;
  timeTakenMs: number;
  explanation: string;
}

export interface QuizSessionState {
  currentIndex: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  isSubmitting: boolean;
  isComplete: boolean;
  answers: AnswerRecord[];
  wrongAttempts: number[];    // indices tried and confirmed wrong this question
  reviewIndex: number | null; // null = active quiz, number = reviewing that past answer
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
  | { type: 'MARK_WRONG_ATTEMPT'; index: number }
  | { type: 'SHOW_EXPLANATION'; data: ExplanationData; timeTakenMs: number; recordedIndex?: number }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE' }
  | { type: 'ENTER_REVIEW'; index: number }
  | { type: 'EXIT_REVIEW' }
  | { type: 'PREV_REVIEW' }
  | { type: 'NEXT_REVIEW' };

export interface QuizResult {
  sessionId: string;
  grade: number;
  correctCount: number;
  totalCount: number;
}
