'use client';
import type { DataPoint } from '@/types/analytics';

interface PerformanceTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
}

export function PerformanceTooltip({ active, payload }: PerformanceTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-mono space-y-1">
      <p className="text-[var(--accent)] font-semibold">Q{point.questionIndex + 1}</p>
      <p className="text-[var(--text)]">Time: {(point.timeTakenMs / 1000).toFixed(1)}s</p>
      <p className={point.isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}>
        {point.isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
      </p>
      <p className="text-[var(--muted)] capitalize">Quadrant: {point.quadrant}</p>
    </div>
  );
}
