import { QuestionSetFileSchema } from '../../shared/types/question';
import type { ZodIssue } from 'zod';

export async function validateQuestionFile(file: File): Promise<{ valid: boolean; errors: string[] }> {
  // Check file extension
  if (!file.name.endsWith('.json')) {
    return { valid: false, errors: ['File must be a .json file'] };
  }

  // Read file content
  let parsed: unknown;
  try {
    const content = await file.text();
    parsed = JSON.parse(content);
  } catch {
    return { valid: false, errors: ['File is not valid JSON'] };
  }

  // Validate using Zod schema
  const result = QuestionSetFileSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map((issue: ZodIssue) => issue.message);
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}
