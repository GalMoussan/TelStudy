import type { QuadrantLabel } from '@/types/analytics';

export function calculateGrade(correct: number, total: number): number {
  if (total === 0) return 0;
  return parseFloat(((correct / total) * 100).toFixed(2));
}

export function getGradeLabel(grade: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (grade >= 90) return 'A';
  if (grade >= 80) return 'B';
  if (grade >= 70) return 'C';
  if (grade >= 60) return 'D';
  return 'F';
}

/**
 * Classify a question into one of four performance quadrants.
 * Threshold: timeTakenMs <= avgTimeMs counts as "fast".
 */
export function classifyQuestion(
  timeTakenMs: number,
  isCorrect: boolean,
  avgTimeMs: number,
): QuadrantLabel {
  const isFast = timeTakenMs <= avgTimeMs;
  if (isFast && isCorrect) return 'strength';
  if (!isFast && isCorrect) return 'needs-speed';
  if (isFast && !isCorrect) return 'reckless';
  return 'weakness';
}
