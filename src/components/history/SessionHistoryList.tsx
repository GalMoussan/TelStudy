'use client';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { SessionHistoryItem } from './SessionHistoryItem';
import { EmptyState, ErrorBanner } from '@/components/ui';

function HistorySkeleton() {
  return (
    <div className="animate-pulse space-y-2" data-testid="history-skeleton">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-[var(--border)] bg-[var(--surface)] px-4 py-3 flex justify-between"
        >
          <div className="space-y-2 flex-1">
            <div className="h-3 w-48 bg-[var(--border)] rounded-sm" />
            <div className="h-3 w-24 bg-[var(--border)] rounded-sm opacity-60" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-4 w-12 bg-[var(--border)] rounded-sm ml-auto" />
            <div className="h-3 w-8 bg-[var(--border)] rounded-sm ml-auto opacity-60" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SessionHistoryList() {
  const { data: sessions, isLoading, error } = useSessionHistory();

  if (isLoading) return <HistorySkeleton />;

  if (error) {
    return <ErrorBanner message="Failed to load session history." />;
  }

  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState message="No completed quizzes yet. Take a quiz to see your history here." />
    );
  }

  return (
    <div className="space-y-2" data-testid="session-history-list">
      {sessions.map((session) => (
        <SessionHistoryItem key={session.id} session={session} />
      ))}
    </div>
  );
}
