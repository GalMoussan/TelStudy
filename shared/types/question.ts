export interface Question {
  question_text: string;
  options: [string, string, string, string];
  correct_answer_index: number;
  explanation: string;
}

export interface QuestionSet {
  id: string;
  user_id: string;
  name: string;
  questions: Question[];
  created_at: string;
}
