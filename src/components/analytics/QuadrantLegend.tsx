import type { AnalyticsSummary } from '@/types/analytics';

interface QuadrantLegendProps {
  summary: AnalyticsSummary;
}

const QUADRANTS = [
  {
    key: 'strengthCount' as const,
    label: 'Strength',
    description: 'Fast and correct — your comfort zone',
    color: 'text-[var(--success)]',
    border: 'border-[var(--success)]',
  },
  {
    key: 'needsSpeedCount' as const,
    label: 'Needs Speed',
    description: 'Correct but slow — build familiarity',
    color: 'text-[#facc15]',
    border: 'border-[#facc15]',
  },
  {
    key: 'recklessCount' as const,
    label: 'Reckless',
    description: 'Fast but wrong — slow down here',
    color: 'text-[#fb923c]',
    border: 'border-[#fb923c]',
  },
  {
    key: 'weaknessCount' as const,
    label: 'Weakness',
    description: 'Slow and wrong — prioritize here',
    color: 'text-[var(--error)]',
    border: 'border-[var(--error)]',
  },
];

export function QuadrantLegend({ summary }: QuadrantLegendProps) {
  return (
    <div
      className="grid grid-cols-2 gap-3"
      data-testid="quadrant-legend"
    >
      {QUADRANTS.map(({ key, label, description, color, border }) => (
        <div
          key={key}
          className={`border-l-2 ${border} pl-3 py-1`}
        >
          <p className={`text-sm font-mono font-semibold ${color}`}>
            {summary[key]} — {label}
          </p>
          <p className="text-xs text-[var(--muted)] mt-0.5">{description}</p>
        </div>
      ))}
    </div>
  );
}
