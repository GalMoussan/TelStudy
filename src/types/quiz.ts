// Placeholder for quiz types
// Implementation coming in Phase 2

export interface QuizSessionState {
  currentIndex: number;
  selectedAnswer: number | null;
  showExplanation: boolean;
  isSubmitting: boolean;
  isComplete: boolean;
  answers: AnswerRecord[];
}

export interface AnswerRecord {
  questionIndex?: number;
  selectedIndex?: number;
  elapsedMs?: number;
  timeTakenMs?: number;
  isCorrect?: boolean;
  correctIndex?: number;
  explanation?: string;
}

export type QuizAction =
  | { type: 'SELECT_ANSWER'; index: number }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'SHOW_EXPLANATION'; data: { isCorrect: boolean; correctIndex: number; explanation: string }; timeTakenMs: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE' };
