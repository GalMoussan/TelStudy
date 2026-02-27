import { ResultsPageSkeleton } from '@/components/analytics/ResultsPageSkeleton';

export default function ResultsLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <ResultsPageSkeleton />
    </div>
  );
}
