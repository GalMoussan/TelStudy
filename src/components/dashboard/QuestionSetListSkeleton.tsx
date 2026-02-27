export function QuestionSetListSkeleton() {
  return (
    <div className="space-y-3" data-testid="question-set-list-skeleton">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse border border-[var(--border)] bg-[var(--surface)] px-4 py-4 flex items-center justify-between"
        >
          <div className="space-y-2 flex-1">
            <div className="h-3 w-48 bg-[var(--border)] rounded-sm" />
            <div className="h-3 w-24 bg-[var(--border)] rounded-sm opacity-60" />
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-[var(--border)] rounded-sm" />
            <div className="h-7 w-16 bg-[var(--border)] rounded-sm opacity-60" />
          </div>
        </div>
      ))}
    </div>
  );
}
