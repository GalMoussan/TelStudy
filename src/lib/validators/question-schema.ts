import { QuestionSetFileSchema } from '../../../shared/types/question';
import type { Question } from '../../../shared/types/question';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type ValidationResult =
  | { valid: true; questions: Question[] }
  | { valid: false; errors: string[] };

export async function validateQuestionFile(file: File): Promise<ValidationResult> {
  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, errors: ['File exceeds 5MB limit'] };
  }

  // Extension check
  if (!file.name.toLowerCase().endsWith('.json')) {
    return { valid: false, errors: ['File must be a .json file'] };
  }

  // Parse JSON
  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    return { valid: false, errors: ['File is not valid JSON'] };
  }

  // Zod validation
  const result = QuestionSetFileSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.errors.map((err) => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    });
    return { valid: false, errors };
  }

  return { valid: true, questions: result.data };
}
