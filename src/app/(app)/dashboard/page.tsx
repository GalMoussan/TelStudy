import { PageHeader } from '@/components/layout/PageHeader';
import { QuestionSetList } from '@/components/dashboard/QuestionSetList';
import { UploadButton } from '@/components/dashboard/UploadButton';
import { ErrorBanner } from '@/components/ui';

export const metadata = { title: 'My Question Sets — TelStudy' };

interface DashboardPageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-found': 'The requested quiz session was not found or does not belong to your account.',
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong.') : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="My Question Sets" action={<UploadButton />} />
      {errorMessage && <ErrorBanner message={errorMessage} dismissible />}
      <QuestionSetList />
    </div>
  );
}
