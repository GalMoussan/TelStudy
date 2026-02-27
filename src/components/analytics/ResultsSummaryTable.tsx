import { Badge } from '@/components/ui';
import type { DataPoint, QuadrantLabel } from '@/types/analytics';

interface ResultsSummaryTableProps {
  dataPoints: DataPoint[];
}

const QUADRANT_VARIANT: Record<QuadrantLabel, 'default' | 'success' | 'warning' | 'error'> = {
  strength: 'success',
  'needs-speed': 'warning',
  reckless: 'warning',
  weakness: 'error',
};

function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ResultsSummaryTable({ dataPoints }: ResultsSummaryTableProps) {
  if (dataPoints.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] text-center py-4">No question data available.</p>
    );
  }

  return (
    <div className="overflow-x-auto" data-testid="results-summary-table">
      <table className="w-full text-sm font-mono border-collapse">
        <thead>
          <tr className="border-b border-[var(--border)] text-[var(--muted)] text-left">
            <th className="py-2 pr-4 font-normal">Q</th>
            <th className="py-2 pr-4 font-normal">Result</th>
            <th className="py-2 pr-4 font-normal">Time</th>
            <th className="py-2 font-normal">Quadrant</th>
          </tr>
        </thead>
        <tbody>
          {dataPoints.map((point) => (
            <tr
              key={point.questionIndex}
              className="border-b border-[var(--border)] last:border-0"
            >
              <td className="py-2 pr-4 text-[var(--muted)]">#{point.questionIndex + 1}</td>
              <td className="py-2 pr-4">
                <span
                  className={point.isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'}
                >
                  {point.isCorrect ? '✓' : '✗'}
                </span>
              </td>
              <td className="py-2 pr-4 text-[var(--text)]">{formatTime(point.timeTakenMs)}</td>
              <td className="py-2">
                <Badge variant={QUADRANT_VARIANT[point.quadrant]}>
                  {point.quadrant}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
