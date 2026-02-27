import { getAdminClient } from './auth';

/**
 * Delete all question sets (and cascade: sessions, answers) for a given user.
 */
export async function cleanupUserData(userId: string) {
  const admin = getAdminClient();

  // Delete quiz answers first (FK constraint)
  const { data: sessions } = await admin
    .from('quiz_sessions')
    .select('id')
    .eq('user_id', userId);

  if (sessions && sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    await admin.from('quiz_answers').delete().in('session_id', sessionIds);
    await admin.from('quiz_sessions').delete().in('id', sessionIds);
  }

  // Delete question sets (storage files are cleaned up by DB trigger or manually)
  const { data: questionSets } = await admin
    .from('question_sets')
    .select('id, file_path')
    .eq('user_id', userId);

  if (questionSets && questionSets.length > 0) {
    const filePaths = questionSets.map((q) => q.file_path).filter(Boolean);
    if (filePaths.length > 0) {
      await admin.storage.from('question-sets').remove(filePaths);
    }
    await admin.from('question_sets').delete().eq('user_id', userId);
  }
}

/**
 * Delete a test user account entirely.
 */
export async function deleteTestUser(userId: string) {
  const admin = getAdminClient();
  await cleanupUserData(userId);
  await admin.auth.admin.deleteUser(userId);
}
