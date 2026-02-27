import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QuestionSetFileSchema } from '../../../../../shared/types/question';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } },
      { status: 400 },
    );
  }

  const { set_id } = body as { set_id: unknown };

  if (typeof set_id !== 'string' || !set_id.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'set_id is required' } },
      { status: 400 },
    );
  }

  // Load question set and verify ownership
  const { data: questionSet } = await supabase
    .from('question_sets')
    .select('id, name, file_path, user_id')
    .eq('id', set_id)
    .single();

  if (!questionSet) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (questionSet.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  // Load questions from storage
  const { data: fileData, error: storageError } = await supabase.storage
    .from('question-sets')
    .download(questionSet.file_path);

  if (storageError || !fileData) {
    return NextResponse.json(
      { error: { code: 'STORAGE_ERROR', message: 'Failed to load questions' } },
      { status: 500 },
    );
  }

  const raw: unknown = JSON.parse(await fileData.text());
  const parseResult = QuestionSetFileSchema.safeParse(raw);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid question set format' } },
      { status: 422 },
    );
  }

  const questions = parseResult.data;

  // Create session row
  const { data: session, error: insertError } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: user.id,
      set_id: questionSet.id,
      set_name: questionSet.name,
    })
    .select('id')
    .single();

  if (insertError || !session) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: insertError?.message ?? 'Failed to create session' } },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { session_id: session.id, questions, total: questions.length },
    { status: 201 },
  );
}
