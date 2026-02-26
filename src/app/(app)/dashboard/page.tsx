import { PageHeader } from '@/components/layout/PageHeader';
import { QuestionSetList } from '@/components/dashboard/QuestionSetList';
import { UploadButton } from '@/components/dashboard/UploadButton';

export const metadata = { title: 'My Question Sets — TelStudy' };

export default async function DashboardPage() {
  return (
    <div>
      <PageHeader title="My Question Sets" action={<UploadButton />} />
      <QuestionSetList />
    </div>
  );
}
