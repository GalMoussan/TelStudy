import { z } from 'zod';

export const QuestionSchema = z.object({
  question_text: z.string().min(1, 'Question text cannot be empty'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .length(4, 'Exactly 4 options required'),
  correct_answer_index: z
    .number()
    .int()
    .min(0, 'Index must be 0-3')
    .max(3, 'Index must be 0-3'),
  explanation: z.string().min(1, 'Explanation cannot be empty'),
});

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionSetFileSchema = z
  .array(QuestionSchema)
  .min(1, 'Question set must contain at least 1 question');

export type QuestionSetFile = z.infer<typeof QuestionSetFileSchema>;

// DB row type (includes metadata from question_sets table)
export interface QuestionSetRow {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  question_count: number;
  created_at: string;
}
