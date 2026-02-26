import { describe, it, expect } from 'vitest';
import { generateInsight } from './insights';

const BASE = { avgTimeMs: 3000, fastestCorrectMs: 1000, slowestIncorrectMs: 8000 };

describe('T016 — Quadrant Analysis: generateInsight', () => {
  it('returns "Complete a quiz" when all counts are zero', () => {
    // Acceptance: "Empty summary (all zeros) → 'Complete a quiz...' message"
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 0, recklessCount: 0, weaknessCount: 0 });
    expect(result).toMatch(/complete a quiz/i);
  });

  it('returns perfect score message when no incorrect answers', () => {
    // Acceptance: "All correct (no incorrect) → perfect score message"
    const result = generateInsight({ ...BASE, strengthCount: 5, needsSpeedCount: 5, recklessCount: 0, weaknessCount: 0 });
    expect(result).toMatch(/perfect score/i);
  });

  it('returns revisit message when all wrong', () => {
    // Acceptance: "All incorrect (no correct) → revisit material message"
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 0, recklessCount: 5, weaknessCount: 5 });
    expect(result).toMatch(/revisit/i);
  });

  it('returns strength insight for dominant strength', () => {
    // Acceptance: "Dominant strength → 'correctly and quickly' insight"
    const result = generateInsight({ ...BASE, strengthCount: 8, needsSpeedCount: 1, recklessCount: 0, weaknessCount: 1 });
    expect(result).toMatch(/correctly and quickly/i);
  });

  it('returns needs-speed insight for dominant needs-speed', () => {
    // Acceptance: "Dominant needs-speed → 'spending too long' insight"
    const result = generateInsight({ ...BASE, strengthCount: 1, needsSpeedCount: 8, recklessCount: 0, weaknessCount: 1 });
    expect(result).toMatch(/spending too long/i);
  });

  it('returns reckless insight for dominant reckless', () => {
    // Acceptance: "Dominant reckless → 'slow down' insight"
    const result = generateInsight({ ...BASE, strengthCount: 1, needsSpeedCount: 0, recklessCount: 8, weaknessCount: 1 });
    expect(result).toMatch(/slow down/i);
  });

  it('returns weakness insight for dominant weakness', () => {
    // Acceptance: "Dominant weakness → 'prioritize understanding' insight"
    const result = generateInsight({ ...BASE, strengthCount: 1, needsSpeedCount: 0, recklessCount: 1, weaknessCount: 8 });
    expect(result).toMatch(/prioritize understanding/i);
  });

  it('breaks ties: weakness beats needs-speed', () => {
    // Acceptance: "Tied weakness+needs-speed → weakness wins (priority order)"
    const result = generateInsight({ ...BASE, strengthCount: 0, needsSpeedCount: 4, recklessCount: 0, weaknessCount: 4 });
    expect(result).toMatch(/prioritize understanding/i);
  });

  it('returns a non-empty string for any valid input', () => {
    // Acceptance: "generateInsight returns non-empty string for all quadrant distributions"
    const result = generateInsight({ ...BASE, strengthCount: 3, needsSpeedCount: 2, recklessCount: 1, weaknessCount: 4 });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
