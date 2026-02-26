import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyInsight } from '../KeyInsight';

const BASE_SUMMARY = {
  avgTimeMs: 3000,
  fastestCorrectMs: 1000,
  slowestIncorrectMs: 8000,
  strengthCount: 5,
  needsSpeedCount: 2,
  recklessCount: 1,
  weaknessCount: 2,
};

describe('T016 — Quadrant Analysis: KeyInsight component', () => {
  it('renders the "Key Insight" label', () => {
    // Acceptance: "KeyInsight renders with left white border accent"
    render(<KeyInsight summary={BASE_SUMMARY} />);
    expect(screen.getByText(/key insight/i)).toBeInTheDocument();
  });

  it('has data-testid="key-insight"', () => {
    // Acceptance: "data-testid='key-insight' on KeyInsight container"
    const { container } = render(<KeyInsight summary={BASE_SUMMARY} />);
    expect(container.querySelector('[data-testid="key-insight"]')).toBeTruthy();
  });

  it('renders a non-empty insight message', () => {
    // Acceptance: "generateInsight returns non-empty string for all quadrant distributions"
    render(<KeyInsight summary={BASE_SUMMARY} />);
    const insight = document.querySelector('[data-testid="key-insight"] p:last-child');
    expect(insight?.textContent?.length).toBeGreaterThan(10);
  });

  it('renders correct insight for perfect score', () => {
    // Acceptance: "All correct → perfect score message shown"
    render(<KeyInsight summary={{ ...BASE_SUMMARY, recklessCount: 0, weaknessCount: 0 }} />);
    expect(screen.getByText(/perfect score/i)).toBeInTheDocument();
  });
});
