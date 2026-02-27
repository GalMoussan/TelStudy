import Link from 'next/link';
import type { SessionHistoryItem as SessionHistoryItemType } from '@/types/api';

interface SessionHistoryItemProps {
  session: SessionHistoryItemType;
}

export function SessionHistoryItem({ session }: SessionHistoryItemProps) {
  const isPassing = session.grade >= 70;
  const formattedDate = new Date(session.completed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/results/${session.id}`}
      className="block border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      data-testid="session-history-item"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--text)]">{session.set_name}</p>
          <p className="mt-0.5 text-xs text-[var(--muted)] font-mono">{formattedDate}</p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-sm font-mono font-semibold ${
              isPassing ? 'text-[var(--success)]' : 'text-[var(--error)]'
            }`}
          >
            {session.grade.toFixed(0)}%
          </p>
          <p className="text-xs text-[var(--muted)] font-mono">
            {session.correct_count}/{session.total_count}
          </p>
        </div>
      </div>
    </Link>
  );
}
