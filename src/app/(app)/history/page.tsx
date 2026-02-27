import { PageHeader } from '@/components/layout/PageHeader';
import { SessionHistoryList } from '@/components/history/SessionHistoryList';

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Session History" />
      <SessionHistoryList />
    </div>
  );
}
