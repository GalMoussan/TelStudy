import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
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
    .select('id, user_id, completed_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // Idempotent — if already completed, return existing grade
  if (session.completed_at) {
    const { data: existing } = await supabase
      .from('quiz_sessions')
      .select('grade, correct_count, total_count')
      .eq('id', sessionId)
      .single();

    if (existing) {
      return NextResponse.json({
        grade: existing.grade,
        correct_count: existing.correct_count,
        total_count: existing.total_count,
      });
    }
  }

  // Aggregate answers for this session
  const { data: answers, error: answersError } = await supabase
    .from('quiz_answers')
    .select('is_correct')
    .eq('session_id', sessionId);

  if (answersError) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: answersError.message } },
      { status: 500 },
    );
  }

  const totalCount = answers?.length ?? 0;
  const correctCount = answers?.filter((a) => a.is_correct).length ?? 0;
  const grade = totalCount > 0 ? parseFloat(((correctCount / totalCount) * 100).toFixed(2)) : 0;

  // Update session row
  const { error: updateError } = await supabase
    .from('quiz_sessions')
    .update({
      completed_at: new Date().toISOString(),
      grade,
      correct_count: correctCount,
      total_count: totalCount,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: updateError.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ grade, correct_count: correctCount, total_count: totalCount });
}
