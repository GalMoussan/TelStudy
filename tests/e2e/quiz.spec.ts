import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { getAdminClient, loginViaUI } from '../fixtures/auth';
import { deleteTestUser } from '../fixtures/cleanup';

const uniqueEmail = () => `e2e-quiz-${Date.now()}@telstudy-e2e.test`;
const PASSWORD = 'TestPassword123!';
const FIXTURE_PATH = path.join(__dirname, '../fixtures/test-questions.json');

async function setupUserAndQuestionSet() {
  const admin = getAdminClient();
  const email = uniqueEmail();
  const { data: userData } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  const userId = userData.user?.id;
  if (!userId) throw new Error('Failed to create test user');

  // Upload question set directly via storage + DB
  const fileContent = fs.readFileSync(FIXTURE_PATH, 'utf-8');
  const setId = crypto.randomUUID();
  const filePath = `question-sets/${userId}/${setId}.json`;

  await admin.storage.from('question-sets').upload(filePath, fileContent, {
    contentType: 'application/json',
  });

  await admin.from('question_sets').insert({
    id: setId,
    user_id: userId,
    name: 'E2E Quiz Fixture',
    file_path: filePath,
    question_count: 5,
  });

  return { email, userId, setId };
}

test.describe('Quiz — Full Quiz Flow', () => {
  test('answers all 5 questions and reaches results page', async ({ page }) => {
    const { email, userId } = await setupUserAndQuestionSet();

    try {
      await loginViaUI(page, email, PASSWORD);

      // Start quiz from dashboard
      await page.getByRole('button', { name: /start quiz/i }).first().click();
      await page.waitForURL('**/quiz/**', { timeout: 10000 });

      // Answer all 5 questions
      for (let i = 0; i < 5; i++) {
        // Verify question text is visible (some content in a heading or paragraph)
        await expect(page.locator('[data-testid="quiz-card"]').or(
          page.locator('h2, h3, p').filter({ hasText: /\?/ })
        )).toBeVisible({ timeout: 5000 });

        // Select option 1 (index 0) for all questions
        const optionButtons = page.locator('[data-testid^="option-"]').or(
          page.getByRole('button').filter({ hasText: /^[A-D]\./ })
        );
        await optionButtons.first().click();

        // Wait for explanation to appear
        await expect(page.locator('[data-testid="explanation-panel"]')).toBeVisible({
          timeout: 10000,
        });

        // Advance to next question or finish
        const nextBtn = page.locator('[data-testid="next-btn"]');
        await nextBtn.click();
      }

      // Should redirect to results page
      await page.waitForURL('**/results/**', { timeout: 15000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('explanation panel appears after each answer', async ({ page }) => {
    const { email, userId } = await setupUserAndQuestionSet();

    try {
      await loginViaUI(page, email, PASSWORD);
      await page.getByRole('button', { name: /start quiz/i }).first().click();
      await page.waitForURL('**/quiz/**', { timeout: 10000 });

      // Before answering, explanation should not be visible
      await expect(page.locator('[data-testid="explanation-panel"]')).not.toBeVisible();

      // Select first option
      await page.locator('[data-testid^="option-"]').or(
        page.getByRole('button').filter({ hasText: /^[A-D]\./ })
      ).first().click();

      // Explanation must appear
      await expect(page.locator('[data-testid="explanation-panel"]')).toBeVisible({
        timeout: 10000,
      });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
