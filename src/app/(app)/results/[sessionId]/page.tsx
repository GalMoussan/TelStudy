// Stub — T014 will implement the full results page

interface ResultsPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { sessionId } = await params;

  return (
    <div className="text-sm text-[var(--muted)]">
      Results for session: {sessionId}
    </div>
  );
}
