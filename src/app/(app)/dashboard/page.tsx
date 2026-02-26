import { PageHeader } from '@/components/layout/PageHeader';

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="My Question Sets" />
      <div className="text-sm text-[var(--muted)]">Upload a question set to get started.</div>
    </div>
  );
}
