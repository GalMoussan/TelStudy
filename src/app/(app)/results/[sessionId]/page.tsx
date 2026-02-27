import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ResultsClient } from '@/components/analytics/ResultsClient';
import { PageHeader } from '@/components/layout/PageHeader';
import { calculateGrade, classifyQuestion } from '@/lib/grade';
import type { DataPoint, SessionAnalytics, AnalyticsSummary } from '@/types/analytics';
import type { AnswerDetail } from '@/components/analytics/ResultsSummaryTable';
import type { Question } from '../../../../../shared/types/question';

export const metadata: Metadata = {
  title: 'Results — TelStudy',
  description: 'View your quiz performance analytics, grade, and actionable insights.',
};

interface ResultsPageProps {
  params: Promise<{ sessionId: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { sessionId } = await params;

  if (!UUID_REGEX.test(sessionId)) redirect('/dashboard?error=not-found');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify session belongs to this user
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, set_id, set_name, grade, completed_at')
    .eq('id', sessionId)
    .single();

  if (!session || session.user_id !== user.id) redirect('/dashboard?error=not-found');
  if (!session.completed_at) redirect(`/quiz/${sessionId}`);

  // Fetch all answers for this session (including selected/correct indices for accordion)
  const { data: answers } = await supabase
    .from('quiz_answers')
    .select('question_index, is_correct, time_taken_ms, selected_index, correct_answer_index')
    .eq('session_id', sessionId)
    .order('question_index', { ascending: true });

  const rows = answers ?? [];
  const totalCount = rows.length;
  const correctCount = rows.filter((r) => r.is_correct).length;
  const grade = session.grade != null ? Number(session.grade) : calculateGrade(correctCount, totalCount);
  const totalTimeMs = rows.reduce((s, r) => s + r.time_taken_ms, 0);
  const avgTimeMs = totalCount > 0 ? totalTimeMs / totalCount : 0;

  const dataPoints: DataPoint[] = rows.map((r) => ({
    questionIndex: r.question_index,
    timeTakenMs: r.time_taken_ms,
    isCorrect: r.is_correct,
    quadrant: classifyQuestion(r.time_taken_ms, r.is_correct, avgTimeMs),
  }));

  const correctPoints = dataPoints.filter((d) => d.isCorrect);
  const incorrectPoints = dataPoints.filter((d) => !d.isCorrect);

  const summary: AnalyticsSummary = {
    strengthCount: dataPoints.filter((d) => d.quadrant === 'strength').length,
    needsSpeedCount: dataPoints.filter((d) => d.quadrant === 'needs-speed').length,
    recklessCount: dataPoints.filter((d) => d.quadrant === 'reckless').length,
    weaknessCount: dataPoints.filter((d) => d.quadrant === 'weakness').length,
    avgTimeMs,
    fastestCorrectMs:
      correctPoints.length > 0 ? Math.min(...correctPoints.map((d) => d.timeTakenMs)) : null,
    slowestIncorrectMs:
      incorrectPoints.length > 0 ? Math.max(...incorrectPoints.map((d) => d.timeTakenMs)) : null,
  };

  const analytics: SessionAnalytics = {
    sessionId,
    grade,
    correctCount,
    totalCount,
    avgTimeMs,
    dataPoints,
    summary,
  };

  // Load question JSON from storage for accordion display
  let questions: Question[] = [];
  try {
    const { data: fileData } = await supabase.storage
      .from('question-sets')
      .download(`${user.id}/${session.set_id}.json`);
    if (fileData) {
      const text = await fileData.text();
      questions = JSON.parse(text) as Question[];
    }
  } catch {
    // Non-fatal — accordion will show without question text
  }

  const answerDetails: AnswerDetail[] = rows.map((r) => ({
    questionIndex: r.question_index,
    questionText: questions[r.question_index]?.question_text ?? '',
    options: questions[r.question_index]?.options ?? [],
    selectedIndex: r.selected_index,
    correctAnswerIndex: r.correct_answer_index,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`Results — ${session.set_name}`} />
      <ResultsClient analytics={analytics} setId={session.set_id} answerDetails={answerDetails} />
    </div>
  );
}
