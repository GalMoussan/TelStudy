import { QuestionSetListSkeleton } from '@/components/dashboard/QuestionSetListSkeleton';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Question Sets" />
      <QuestionSetListSkeleton />
    </div>
  );
}
