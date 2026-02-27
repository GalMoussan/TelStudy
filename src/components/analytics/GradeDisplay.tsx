import { getGradeLabel } from '@/lib/grade';

interface GradeDisplayProps {
  grade: number;
  correctCount: number;
  totalCount: number;
}

export function GradeDisplay({ grade, correctCount, totalCount }: GradeDisplayProps) {
  const label = getGradeLabel(grade);
  const isPassing = grade >= 70;

  return (
    <div className="flex flex-col items-center gap-2 py-6" data-testid="grade-display">
      <span
        className={`text-6xl font-mono font-bold ${
          isPassing ? 'text-[var(--success)]' : 'text-[var(--error)]'
        }`}
      >
        {grade.toFixed(0)}%
      </span>
      <span
        className={`text-2xl font-mono font-semibold ${
          isPassing ? 'text-[var(--success)]' : 'text-[var(--error)]'
        }`}
      >
        {label}
      </span>
      <span className="text-sm text-[var(--muted)] font-mono">
        {correctCount} / {totalCount} correct
      </span>
    </div>
  );
}
