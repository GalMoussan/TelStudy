import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, set_id, set_name, grade, correct_count, total_count, started_at, completed_at')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  return NextResponse.json(session);
}
