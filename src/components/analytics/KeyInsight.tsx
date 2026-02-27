import { generateInsight } from '@/lib/insights';
import type { AnalyticsSummary } from '@/types/analytics';

interface KeyInsightProps {
  summary: AnalyticsSummary;
}

export function KeyInsight({ summary }: KeyInsightProps) {
  const insight = generateInsight(summary);

  return (
    <div
      data-testid="key-insight"
      className="border-l-4 border-[var(--accent)] bg-[var(--surface)] px-4 py-3"
    >
      <p className="text-xs font-mono font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
        Key Insight
      </p>
      <p className="text-sm text-[var(--text)] leading-relaxed">{insight}</p>
    </div>
  );
}
