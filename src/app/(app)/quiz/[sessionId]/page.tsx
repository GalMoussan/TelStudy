import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QuizClient } from '@/components/quiz/QuizClient';
import { QuestionSetFileSchema } from '../../../../../shared/types/question';

interface QuizPageProps {
  params: Promise<{ sessionId: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuizPage({ params }: QuizPageProps) {
  const { sessionId } = await params;

  if (!UUID_REGEX.test(sessionId)) redirect('/dashboard?error=not-found');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch session — verify it exists and belongs to this user
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, set_id, user_id, completed_at')
    .eq('id', sessionId)
    .single();

  if (!session || session.user_id !== user.id) redirect('/dashboard?error=not-found');
  if (session.completed_at) redirect(`/results/${sessionId}`);

  // Get the question set file path
  const { data: questionSetRow } = await supabase
    .from('question_sets')
    .select('file_path')
    .eq('id', session.set_id)
    .single();

  if (!questionSetRow) redirect('/dashboard?error=not-found');

  // Load questions from Supabase Storage
  const { data: fileData } = await supabase.storage
    .from('question-sets')
    .download(questionSetRow.file_path);

  if (!fileData) redirect('/dashboard?error=not-found');

  const raw: unknown = JSON.parse(await fileData.text());
  const parseResult = QuestionSetFileSchema.safeParse(raw);
  if (!parseResult.success) redirect('/dashboard?error=not-found');

  const questions = parseResult.data;

  return (
    <div className="mx-auto max-w-2xl">
      <QuizClient sessionId={sessionId} questions={questions} setId={session.set_id} />
    </div>
  );
}
