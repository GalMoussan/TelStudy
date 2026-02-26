export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export type ApiResponse<T> = T | ApiErrorResponse;

// Question Sets API
export interface QuestionSetListItem {
  id: string;
  name: string;
  question_count: number;
  created_at: string;
}

export interface CreateQuestionSetResponse {
  id: string;
  name: string;
  question_count: number;
}

// Quiz API
export interface StartQuizResponse {
  session_id: string;
  questions: import('../../shared/types/question').Question[];
  total: number;
}

export interface SubmitAnswerResponse {
  correct: boolean;
  correct_answer_index: number;
  explanation: string;
}

export interface CompleteQuizResponse {
  grade: number;
  correct_count: number;
  total_count: number;
}

// Sessions API
export interface SessionHistoryItem {
  id: string;
  set_name: string;
  grade: number;
  correct_count: number;
  total_count: number;
  completed_at: string;
}
