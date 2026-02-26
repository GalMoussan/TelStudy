import { describe, it, expect } from 'vitest';
import { validateQuestionFile } from '../question-schema';

const VALID_JSON = JSON.stringify([
  {
    question_text: 'What is 2+2?',
    options: ['1', '2', '3', '4'],
    correct_answer_index: 3,
    explanation: 'Basic addition.',
  },
]);

describe('T005 — Shared Types: QuestionSetFileSchema', () => {
  it('accepts a valid question set array', async () => {
    // Acceptance: "Zod schema validates correct JSON question sets"
    const file = new File([VALID_JSON], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(true);
  });

  it('rejects empty array with "at least 1 question" message', async () => {
    // Acceptance: "Uploading [] shows 'Question set must contain at least 1 question'"
    const file = new File(['[]'], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/at least 1/i);
  });
});

describe('T008 — JSON Upload: validateQuestionFile', () => {
  it('rejects non-.json file extension', async () => {
    // Acceptance: "Uploading a .txt file shows 'File must be a .json file'"
    const file = new File([VALID_JSON], 'test.txt', { type: 'text/plain' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/\.json/i);
  });

  it('rejects malformed JSON with parse error message', async () => {
    // Acceptance: "Uploading a non-JSON file shows 'File is not valid JSON'"
    const file = new File(['{not valid json'], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/not valid JSON/i);
  });

  it('rejects question with wrong number of options', async () => {
    // Acceptance: "Zod schema rejects questions with != 4 options"
    const bad = JSON.stringify([{
      question_text: 'Q?',
      options: ['a', 'b'],
      correct_answer_index: 0,
      explanation: 'E',
    }]);
    const file = new File([bad], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
  });

  it('rejects correct_answer_index out of 0-3 range', async () => {
    // Acceptance: "correct_answer_index must be 0-3"
    const bad = JSON.stringify([{
      question_text: 'Q?',
      options: ['a', 'b', 'c', 'd'],
      correct_answer_index: 5,
      explanation: 'E',
    }]);
    const file = new File([bad], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
  });

  it('rejects question missing required fields', async () => {
    // Acceptance: "Missing fields produce field-specific error messages"
    const bad = JSON.stringify([{ question_text: 'Only text' }]);
    const file = new File([bad], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('T019 — Edge Cases: upload validation', () => {
  it('returns errors array (not throws) for all invalid inputs', async () => {
    // Acceptance: "No silent failures — all errors returned as messages"
    const file = new File(['totally invalid'], 'test.json', { type: 'application/json' });
    const result = await validateQuestionFile(file);
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
