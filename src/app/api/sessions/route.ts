import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('id, set_name, grade, correct_count, total_count, completed_at')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
}
