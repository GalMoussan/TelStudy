// Stub — T009 will implement the full quiz page

interface QuizPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { sessionId } = await params;

  return (
    <div className="text-sm text-[var(--muted)]">
      Quiz session: {sessionId}
    </div>
  );
}
