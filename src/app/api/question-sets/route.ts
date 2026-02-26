import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { validateQuestionFile } from '@/lib/validators/question-schema';

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

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // Rate limiting: max 10 uploads per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('question_sets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', oneHourAgo);
  if ((count ?? 0) >= 10) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Upload limit reached. Try again later.' } },
      { status: 429 },
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const name = formData.get('name') as string | null;

  if (!file || !name?.trim()) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'file and name are required' } },
      { status: 400 },
    );
  }

  // Server-side validation
  const validation = await validateQuestionFile(file);
  if (!validation.valid) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: validation.errors[0] } },
      { status: 400 },
    );
  }

  const setId = crypto.randomUUID();
  const filePath = `${user.id}/${setId}.json`;

  const fileText = await file.text();
  const questions = JSON.parse(fileText) as unknown[];

  // Upload to storage
  const { error: storageError } = await supabase.storage
    .from('question-sets')
    .upload(filePath, file, { contentType: 'application/json', upsert: false });

  if (storageError) {
    return NextResponse.json(
      { error: { code: 'STORAGE_ERROR', message: storageError.message } },
      { status: 500 },
    );
  }

  // Insert DB record
  const { data: newSet, error: dbError } = await supabase
    .from('question_sets')
    .insert({
      id: setId,
      user_id: user.id,
      name: name.trim(),
      file_path: filePath,
      question_count: questions.length,
    })
    .select()
    .single();

  if (dbError) {
    // Orphan cleanup
    await supabase.storage.from('question-sets').remove([filePath]);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: dbError.message } },
      { status: 500 },
    );
  }

  return NextResponse.json(newSet, { status: 201 });
}
