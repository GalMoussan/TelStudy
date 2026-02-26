export interface QuestionSetRow {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  question_count: number;
  created_at: string;
}

export interface QuizSessionRow {
  id: string;
  user_id: string;
  set_id: string;
  set_name: string;
  started_at: string;
  completed_at: string | null;
  grade: number | null;
  correct_count: number | null;
  total_count: number | null;
}

export interface QuizAnswerRow {
  id: string;
  session_id: string;
  question_index: number;
  selected_index: number;
  correct_answer_index: number;
  is_correct: boolean;
  time_taken_ms: number;
}
