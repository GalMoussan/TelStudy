// Placeholder for KeyInsight component
// Implementation coming in Phase 2
interface KeyInsightProps {
  summary: {
    avgTimeMs: number;
    fastestCorrectMs: number;
    slowestIncorrectMs: number;
    strengthCount: number;
    needsSpeedCount: number;
    recklessCount: number;
    weaknessCount: number;
  };
}

export function KeyInsight({ summary }: KeyInsightProps) {
  return null;
}
