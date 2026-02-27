export function ResultsPageSkeleton() {
  return (
    <div className="animate-pulse space-y-6" data-testid="results-page-skeleton">
      {/* Grade display placeholder */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-16 w-28 bg-[var(--border)] rounded-sm" />
        <div className="h-8 w-8 bg-[var(--border)] rounded-sm opacity-60" />
        <div className="h-4 w-24 bg-[var(--border)] rounded-sm opacity-40" />
      </div>

      {/* Stats row placeholder */}
      <div className="flex gap-4 border-t border-[var(--border)] pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-20 bg-[var(--border)] rounded-sm" />
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="h-64 w-full bg-[var(--border)] rounded-sm opacity-40" />

      {/* Table rows placeholder */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-full bg-[var(--border)] rounded-sm opacity-30" />
        ))}
      </div>
    </div>
  );
}
