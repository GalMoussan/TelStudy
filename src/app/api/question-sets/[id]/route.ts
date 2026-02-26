import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // Get the set to find the file path (verify ownership)
  const { data: set, error: fetchError } = await supabase
    .from('question_sets')
    .select('id, file_path, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !set) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // Extra ownership check beyond RLS
  if (set.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  // Delete file from storage
  await supabase.storage.from('question-sets').remove([set.file_path]);

  // Delete DB row (cascades to quiz_sessions → quiz_answers)
  const { error: deleteError } = await supabase
    .from('question_sets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: deleteError.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
