interface QuizTimerProps {
  cumulativeMs: number;
  perQuestionMs: number;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function QuizTimer({ cumulativeMs, perQuestionMs }: QuizTimerProps) {
  return (
    <div className="flex gap-6 font-mono text-xs text-[var(--muted)]" data-testid="quiz-timer">
      <span>
        This question: <span className="text-[var(--text)]" data-testid="per-question-timer">{formatTime(perQuestionMs)}</span>
      </span>
      <span>
        Total: <span className="text-[var(--text)]" data-testid="cumulative-timer">{formatTime(cumulativeMs)}</span>
      </span>
    </div>
  );
}
