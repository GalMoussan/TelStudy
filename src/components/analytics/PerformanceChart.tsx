'use client';
import {
  ComposedChart,
  Bar,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DataPoint } from '@/types/analytics';
import { PerformanceTooltip } from './PerformanceTooltip';

interface PerformanceChartProps {
  dataPoints: DataPoint[];
  avgTimeMs: number;
}

export function PerformanceChart({ dataPoints, avgTimeMs }: PerformanceChartProps) {
  const avgTimeSec = avgTimeMs / 1000;

  const chartData = dataPoints.map((d) => ({
    ...d,
    timeSeconds: parseFloat((d.timeTakenMs / 1000).toFixed(2)),
    label: `Q${d.questionIndex + 1}`,
  }));

  return (
    <div data-testid="performance-chart">
      <p className="text-xs text-[var(--muted)] font-mono mb-2">
        Time per question (seconds)
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `${v}s`}
            tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<PerformanceTooltip />} />
          <ReferenceLine
            y={avgTimeSec}
            stroke="#555"
            strokeDasharray="3 3"
            label={{ value: 'Avg', position: 'insideTopRight', fill: '#666', fontSize: 10 }}
          />
          <Bar dataKey="timeSeconds" maxBarSize={40}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isCorrect ? 'var(--success)' : 'var(--error)'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
