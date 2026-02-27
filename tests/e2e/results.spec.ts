import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { getAdminClient, loginViaUI } from '../fixtures/auth';
import { deleteTestUser } from '../fixtures/cleanup';

const uniqueEmail = () => `e2e-results-${Date.now()}@telstudy-e2e.test`;
const PASSWORD = 'TestPassword123!';
const FIXTURE_PATH = path.join(__dirname, '../fixtures/test-questions.json');

async function completeQuizSession() {
  const admin = getAdminClient();
  const email = uniqueEmail();
  const { data: userData } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  const userId = userData.user?.id;
  if (!userId) throw new Error('Failed to create test user');

  // Upload question set
  const fileContent = fs.readFileSync(FIXTURE_PATH, 'utf-8');
  const questions = JSON.parse(fileContent) as Array<{ correct_answer_index: number }>;
  const setId = crypto.randomUUID();
  const filePath = `question-sets/${userId}/${setId}.json`;

  await admin.storage.from('question-sets').upload(filePath, fileContent, {
    contentType: 'application/json',
  });
  await admin.from('question_sets').insert({
    id: setId,
    user_id: userId,
    name: 'E2E Results Fixture',
    file_path: filePath,
    question_count: questions.length,
  });

  // Create a completed quiz session
  const sessionId = crypto.randomUUID();
  const correctCount = 3; // 3 out of 5 correct
  await admin.from('quiz_sessions').insert({
    id: sessionId,
    user_id: userId,
    set_id: setId,
    completed_at: new Date().toISOString(),
    grade: 60,
    correct_count: correctCount,
    total_count: questions.length,
  });

  // Insert quiz answers
  const answers = questions.map((q, i) => ({
    session_id: sessionId,
    question_index: i,
    answer_index: i < correctCount ? q.correct_answer_index : (q.correct_answer_index + 1) % 4,
    is_correct: i < correctCount,
    time_taken_ms: 3000 + i * 500,
  }));
  await admin.from('quiz_answers').insert(answers);

  return { email, userId, sessionId };
}

test.describe('Results — Post-Quiz Analytics', () => {
  test('grade percentage is visible', async ({ page }) => {
    const { email, userId, sessionId } = await completeQuizSession();

    try {
      await loginViaUI(page, email, PASSWORD);
      await page.goto(`/results/${sessionId}`);

      await expect(page.locator('[data-testid="grade-display"]')).toBeVisible({ timeout: 10000 });
      // Grade text should contain a percentage number
      await expect(page.locator('[data-testid="grade-display"]')).toContainText(/%/);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('Recharts SVG element renders', async ({ page }) => {
    const { email, userId, sessionId } = await completeQuizSession();

    try {
      await loginViaUI(page, email, PASSWORD);
      await page.goto(`/results/${sessionId}`);

      // Recharts renders a <svg> element inside the chart container
      await expect(page.locator('svg').first()).toBeVisible({ timeout: 10000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('quadrant legend is visible', async ({ page }) => {
    const { email, userId, sessionId } = await completeQuizSession();

    try {
      await loginViaUI(page, email, PASSWORD);
      await page.goto(`/results/${sessionId}`);

      // Quadrant legend contains "Strength" and "Weakness" labels
      await expect(page.getByText(/strength/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/weakness/i).first()).toBeVisible({ timeout: 10000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('Back to Dashboard link navigates to dashboard', async ({ page }) => {
    const { email, userId, sessionId } = await completeQuizSession();

    try {
      await loginViaUI(page, email, PASSWORD);
      await page.goto(`/results/${sessionId}`);

      await page.getByRole('link', { name: /back to dashboard/i }).click();
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
      await expect(page.getByRole('heading', { name: /my question sets/i })).toBeVisible();
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
