'use client';
import { useState } from 'react';
import { Badge } from '@/components/ui';
import type { DataPoint, QuadrantLabel } from '@/types/analytics';

export interface AnswerDetail {
  questionIndex: number;
  questionText: string;
  options: string[];
  selectedIndex: number;
  correctAnswerIndex: number;
}

interface ResultsSummaryTableProps {
  dataPoints: DataPoint[];
  answerDetails?: AnswerDetail[];
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

function getOptionClasses(
  index: number,
  selectedIndex: number,
  correctAnswerIndex: number,
): string {
  if (index === correctAnswerIndex && index === selectedIndex) {
    // Correct and selected
    return 'border-[var(--success)] bg-[#052e16] text-[var(--success)]';
  }
  if (index === correctAnswerIndex) {
    // Correct but not selected
    return 'border-[var(--success)] bg-[#052e16] text-[var(--success)]';
  }
  if (index === selectedIndex) {
    // Selected but wrong
    return 'border-[var(--error)] bg-[#1a0000] text-[var(--error)]';
  }
  return 'border-[var(--border)] text-[var(--muted)] opacity-50';
}

export function ResultsSummaryTable({ dataPoints, answerDetails }: ResultsSummaryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (dataPoints.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] text-center py-4">No question data available.</p>
    );
  }

  function toggleRow(questionIndex: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(questionIndex)) {
        next.delete(questionIndex);
      } else {
        next.add(questionIndex);
      }
      return next;
    });
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
            {answerDetails && answerDetails.length > 0 && (
              <th className="py-2 pl-4 font-normal text-right" />
            )}
          </tr>
        </thead>
        <tbody>
          {dataPoints.map((point) => {
            const detail = answerDetails?.find((d) => d.questionIndex === point.questionIndex);
            const isExpanded = expandedRows.has(point.questionIndex);
            const hasDetail = !!detail && detail.options.length > 0;

            return (
              <>
                <tr
                  key={point.questionIndex}
                  className={`border-b border-[var(--border)] ${hasDetail ? 'cursor-pointer hover:bg-[#161616]' : ''}`}
                  onClick={hasDetail ? () => toggleRow(point.questionIndex) : undefined}
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
                  {hasDetail && (
                    <td className="py-2 pl-4 text-right text-[var(--muted)] select-none">
                      {isExpanded ? '▲' : '▼'}
                    </td>
                  )}
                </tr>

                {isExpanded && detail && (
                  <tr key={`${point.questionIndex}-detail`} className="border-b border-[var(--border)]">
                    <td colSpan={5} className="pb-4 pt-2 px-2">
                      {detail.questionText && (
                        <p dir="auto" className="text-xs text-[var(--text)] mb-3 leading-relaxed">
                          {detail.questionText}
                        </p>
                      )}
                      <div className="space-y-1.5">
                        {detail.options.map((option, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2 border px-3 py-2 text-xs ${getOptionClasses(i, detail.selectedIndex, detail.correctAnswerIndex)}`}
                          >
                            <span className="shrink-0 font-semibold">
                              [{['A', 'B', 'C', 'D'][i]}]
                            </span>
                            <span dir="auto" className="leading-relaxed">{option}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
