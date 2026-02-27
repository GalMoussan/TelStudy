import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateGrade, classifyQuestion } from '@/lib/grade';
import type { DataPoint, SessionAnalytics, AnalyticsSummary } from '@/types/analytics';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid session ID format' } },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // Load session and verify ownership
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, grade, correct_count, total_count')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  // Fetch all answers for this session
  const { data: answers, error: answersError } = await supabase
    .from('quiz_answers')
    .select('question_index, selected_index, correct_answer_index, is_correct, time_taken_ms')
    .eq('session_id', sessionId)
    .order('question_index', { ascending: true });

  if (answersError) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: answersError.message } },
      { status: 500 },
    );
  }

  const rows = answers ?? [];
  const totalCount = rows.length;
  const correctCount = rows.filter((r) => r.is_correct).length;
  const grade =
    session.grade != null
      ? session.grade
      : calculateGrade(correctCount, totalCount);

  // Compute average time
  const totalTimeMs = rows.reduce((sum, r) => sum + r.time_taken_ms, 0);
  const avgTimeMs = totalCount > 0 ? totalTimeMs / totalCount : 0;

  // Build data points
  const dataPoints: DataPoint[] = rows.map((r) => ({
    questionIndex: r.question_index,
    timeTakenMs: r.time_taken_ms,
    isCorrect: r.is_correct,
    quadrant: classifyQuestion(r.time_taken_ms, r.is_correct, avgTimeMs),
  }));

  // Build summary
  const summary: AnalyticsSummary = {
    strengthCount: dataPoints.filter((d) => d.quadrant === 'strength').length,
    needsSpeedCount: dataPoints.filter((d) => d.quadrant === 'needs-speed').length,
    recklessCount: dataPoints.filter((d) => d.quadrant === 'reckless').length,
    weaknessCount: dataPoints.filter((d) => d.quadrant === 'weakness').length,
    avgTimeMs,
    fastestCorrectMs:
      dataPoints.filter((d) => d.isCorrect).length > 0
        ? Math.min(...dataPoints.filter((d) => d.isCorrect).map((d) => d.timeTakenMs))
        : null,
    slowestIncorrectMs:
      dataPoints.filter((d) => !d.isCorrect).length > 0
        ? Math.max(...dataPoints.filter((d) => !d.isCorrect).map((d) => d.timeTakenMs))
        : null,
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

  return NextResponse.json(analytics);
}
