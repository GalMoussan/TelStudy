import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const { data, error } = await supabase
    .from('question_sets')
    .select('id, name, question_count, created_at, file_path')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 },
    );

  return NextResponse.json(data ?? []);
}

export async function POST() {
  // Implemented by T008
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED' } }, { status: 501 });
}
