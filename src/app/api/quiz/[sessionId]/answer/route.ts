import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Question } from '../../../../../../shared/types/question';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Request body must be valid JSON' } },
      { status: 400 },
    );
  }

  const { question_index, answer_index, time_taken_ms } = body as {
    question_index: unknown;
    answer_index: unknown;
    time_taken_ms: unknown;
  };

  if (
    typeof answer_index !== 'number' ||
    !Number.isInteger(answer_index) ||
    answer_index < 0 ||
    answer_index > 3
  ) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'answer_index must be an integer 0–3' } },
      { status: 400 },
    );
  }

  if (
    typeof question_index !== 'number' ||
    !Number.isInteger(question_index) ||
    question_index < 0
  ) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'question_index must be a non-negative integer' } },
      { status: 400 },
    );
  }

  const timeTakenMs =
    typeof time_taken_ms === 'number' && time_taken_ms >= 0 ? Math.round(time_taken_ms) : 0;

  // Load session and verify ownership (RLS also enforces this)
  const { data: session } = await supabase
    .from('quiz_sessions')
    .select('id, user_id, set_id, completed_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (!session) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // Get question set file path
  const { data: questionSet } = await supabase
    .from('question_sets')
    .select('file_path')
    .eq('id', session.set_id)
    .single();

  if (!questionSet) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // Download questions from storage
  const { data: fileData, error: storageError } = await supabase.storage
    .from('question-sets')
    .download(questionSet.file_path);

  if (storageError || !fileData) {
    return NextResponse.json(
      { error: { code: 'STORAGE_ERROR', message: 'Failed to load questions' } },
      { status: 500 },
    );
  }

  const text = await fileData.text();
  const questions = JSON.parse(text) as Question[];

  const question = questions[question_index];
  if (!question) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'question_index out of range' } },
      { status: 400 },
    );
  }

  const isCorrect = answer_index === question.correct_answer_index;
  const correctIndex = question.correct_answer_index;

  // Insert answer record
  const { error: insertError } = await supabase.from('quiz_answers').insert({
    session_id: sessionId,
    question_index,
    selected_index: answer_index,
    correct_answer_index: correctIndex,
    is_correct: isCorrect,
    time_taken_ms: timeTakenMs,
  });

  if (insertError) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: insertError.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ isCorrect, correctIndex, explanation: question.explanation });
}
