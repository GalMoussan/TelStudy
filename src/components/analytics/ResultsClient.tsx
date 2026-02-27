'use client';
import Link from 'next/link';
import { GradeDisplay } from './GradeDisplay';
import { KeyInsight } from './KeyInsight';
import { PerformanceChart } from './PerformanceChart';
import { QuadrantLegend } from './QuadrantLegend';
import { ResultsSummaryTable } from './ResultsSummaryTable';
import { Button } from '@/components/ui';
import type { SessionAnalytics } from '@/types/analytics';

interface ResultsClientProps {
  analytics: SessionAnalytics;
  setId: string;
}

export function ResultsClient({ analytics, setId }: ResultsClientProps) {
  const { grade, correctCount, totalCount, avgTimeMs, dataPoints, summary } = analytics;

  async function handleRetry() {
    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_id: setId }),
    });
    if (!res.ok) return;
    const { session_id } = (await res.json()) as { session_id: string };
    window.location.href = `/quiz/${session_id}`;
  }

  return (
    <div className="space-y-6">
      {/* Grade */}
      <GradeDisplay grade={grade} correctCount={correctCount} totalCount={totalCount} />

      {/* Stats row */}
      <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--muted)] border-t border-[var(--border)] pt-4">
        <span>Avg time: {(avgTimeMs / 1000).toFixed(1)}s</span>
        <span>Accuracy: {grade.toFixed(0)}%</span>
        <span>Strengths: {summary.strengthCount}</span>
        <span>Weaknesses: {summary.weaknessCount}</span>
      </div>

      {/* Key Insight */}
      <KeyInsight summary={summary} />

      {/* Performance chart */}
      {dataPoints.length > 0 && (
        <PerformanceChart dataPoints={dataPoints} avgTimeMs={avgTimeMs} />
      )}

      {/* Quadrant legend */}
      <QuadrantLegend summary={summary} />

      {/* Summary table */}
      <ResultsSummaryTable dataPoints={dataPoints} />

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard">
            <Button variant="secondary" size="md">
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="primary" size="md" onClick={handleRetry}>
            Retry this set
          </Button>
        </div>
        <Link
          href="/history"
          className="text-xs font-mono text-[var(--muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          View all sessions →
        </Link>
      </div>
    </div>
  );
}
