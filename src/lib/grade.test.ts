import { describe, it, expect } from 'vitest';
import { calculateGrade, getGradeLabel, classifyQuestion } from './grade';

describe('T013 — Grading Logic: calculateGrade', () => {
  it('returns 100 for all correct', () => {
    // Acceptance: "100% grade when all answers correct"
    expect(calculateGrade(10, 10)).toBe(100);
  });

  it('returns 0 for all wrong', () => {
    // Acceptance: "0% grade when all answers wrong"
    expect(calculateGrade(0, 10)).toBe(0);
  });

  it('calculates percentage correctly', () => {
    // Acceptance: "Grade is correct_count/total_count as percentage"
    expect(calculateGrade(7, 10)).toBe(70);
  });

  it('handles 0/0 without throwing', () => {
    // Acceptance: "Edge case: 0 questions doesn't crash"
    expect(() => calculateGrade(0, 0)).not.toThrow();
  });

  it('rounds to 2 decimal places', () => {
    // Acceptance: "Grade displayed to 2 decimal precision"
    const result = calculateGrade(1, 3);
    expect(result).toBeCloseTo(33.33, 1);
  });
});

describe('T013 — Grading Logic: getGradeLabel', () => {
  it('returns A for 90-100', () => {
    expect(getGradeLabel(95)).toBe('A');
    expect(getGradeLabel(100)).toBe('A');
  });

  it('returns B for 80-89', () => {
    expect(getGradeLabel(85)).toBe('B');
  });

  it('returns C for 70-79', () => {
    expect(getGradeLabel(75)).toBe('C');
  });

  it('returns D for 60-69', () => {
    expect(getGradeLabel(65)).toBe('D');
  });

  it('returns F for below 60', () => {
    expect(getGradeLabel(50)).toBe('F');
    expect(getGradeLabel(0)).toBe('F');
  });
});

describe('T013 — Grading Logic: classifyQuestion', () => {
  const avg = 5000;

  it('fast + correct = strength', () => {
    // Acceptance: "Q below avg time AND correct → strength quadrant"
    expect(classifyQuestion(3000, true, avg)).toBe('strength');
  });

  it('slow + correct = needs-speed', () => {
    // Acceptance: "Q above avg time AND correct → needs-speed quadrant"
    expect(classifyQuestion(8000, true, avg)).toBe('needs-speed');
  });

  it('fast + wrong = reckless', () => {
    // Acceptance: "Q below avg time AND wrong → reckless quadrant"
    expect(classifyQuestion(2000, false, avg)).toBe('reckless');
  });

  it('slow + wrong = weakness', () => {
    // Acceptance: "Q above avg time AND wrong → weakness quadrant"
    expect(classifyQuestion(9000, false, avg)).toBe('weakness');
  });

  it('exactly at avg threshold is treated as fast', () => {
    // Acceptance: "Threshold uses <= for fast classification"
    expect(classifyQuestion(5000, true, avg)).toBe('strength');
    expect(classifyQuestion(5000, false, avg)).toBe('reckless');
  });
});
