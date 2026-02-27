import type { AnalyticsSummary } from '@/types/analytics';

/**
 * Generate a single actionable insight sentence from quadrant summary stats.
 * Priority order for ties: weakness > reckless > needs-speed > strength.
 */
export function generateInsight(summary: AnalyticsSummary): string {
  const { strengthCount, needsSpeedCount, recklessCount, weaknessCount } = summary;
  const total = strengthCount + needsSpeedCount + recklessCount + weaknessCount;

  // Edge: no data yet
  if (total === 0) {
    return 'Complete a quiz to see your performance insights.';
  }

  // Edge: all correct (no incorrect answers)
  if (recklessCount === 0 && weaknessCount === 0) {
    return 'Perfect score! Review any questions that took longer than average to build speed.';
  }

  // Edge: all incorrect (no correct answers)
  if (strengthCount === 0 && needsSpeedCount === 0) {
    return 'Revisit the material before your next attempt — accuracy needs work across the board.';
  }

  // Find dominant quadrant (tie-breaking: weakness > reckless > needs-speed > strength)
  const candidates: Array<{ label: string; count: number; priority: number }> = [
    { label: 'weakness', count: weaknessCount, priority: 4 },
    { label: 'reckless', count: recklessCount, priority: 3 },
    { label: 'needs-speed', count: needsSpeedCount, priority: 2 },
    { label: 'strength', count: strengthCount, priority: 1 },
  ];

  const dominant = candidates.reduce((best, candidate) => {
    if (candidate.count > best.count) return candidate;
    if (candidate.count === best.count && candidate.priority > best.priority) return candidate;
    return best;
  });

  switch (dominant.label) {
    case 'strength':
      return 'You answered most questions correctly and quickly — keep it up!';
    case 'needs-speed':
      return 'You answered correctly but are spending too long — try to build familiarity to improve speed.';
    case 'reckless':
      return 'You answered quickly but made errors — slow down and read each question carefully.';
    case 'weakness':
      return 'Most errors came from slow, incorrect answers — prioritize understanding the core concepts.';
    default:
      return 'Review your results to identify areas for improvement.';
  }
}
