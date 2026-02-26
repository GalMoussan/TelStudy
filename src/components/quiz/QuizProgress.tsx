interface QuizProgressProps {
  current: number; // 1-indexed (current question number)
  total: number;
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = Math.round(((current - 1) / total) * 100);

  return (
    <div className="mb-4" data-testid="quiz-progress">
      <div className="mb-1 flex justify-between">
        <span className="font-mono text-xs text-[var(--muted)]">
          Question {current} of {total}
        </span>
        <span className="font-mono text-xs text-[var(--muted)]">{pct}%</span>
      </div>
      <div className="h-1 w-full bg-[var(--border)]">
        <div
          className="h-1 bg-[var(--accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
