export type QuadrantLabel = 'strength' | 'needs-speed' | 'reckless' | 'weakness';

export interface DataPoint {
  questionIndex: number;
  timeTakenMs: number;
  isCorrect: boolean;
  quadrant: QuadrantLabel;
}

export interface AnalyticsSummary {
  strengthCount: number;
  needsSpeedCount: number;
  recklessCount: number;
  weaknessCount: number;
  avgTimeMs: number;
  fastestCorrectMs: number | null;
  slowestIncorrectMs: number | null;
}

export interface SessionAnalytics {
  sessionId: string;
  grade: number;
  correctCount: number;
  totalCount: number;
  avgTimeMs: number;
  dataPoints: DataPoint[];
  summary: AnalyticsSummary;
}
