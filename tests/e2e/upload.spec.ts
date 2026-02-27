import { test, expect } from '@playwright/test';
import * as path from 'path';
import { getAdminClient, loginViaUI } from '../fixtures/auth';
import { deleteTestUser } from '../fixtures/cleanup';

const uniqueEmail = () => `e2e-upload-${Date.now()}@telstudy-e2e.test`;
const PASSWORD = 'TestPassword123!';
const FIXTURE_PATH = path.join(__dirname, '../fixtures/test-questions.json');

async function setupUser() {
  const admin = getAdminClient();
  const email = uniqueEmail();
  const { data } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  return { email, userId: data.user?.id ?? null };
}

test.describe('Upload — JSON Question Set', () => {
  test('valid JSON creates a question set card', async ({ page }) => {
    const { email, userId } = await setupUser();

    try {
      await loginViaUI(page, email, PASSWORD);

      // Open upload modal
      await page.getByRole('button', { name: /upload/i }).click();

      // Fill in name and select file
      const nameInput = page.getByPlaceholder(/question set name/i).or(
        page.getByLabel(/name/i)
      );
      await nameInput.fill('E2E Test Set');

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(FIXTURE_PATH);

      // Submit
      await page.getByRole('button', { name: /upload|submit/i }).last().click();

      // Card should appear in dashboard list
      await expect(page.getByText('E2E Test Set')).toBeVisible({ timeout: 10000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('upload invalid schema JSON → error shown', async ({ page }) => {
    const { email, userId } = await setupUser();

    try {
      await loginViaUI(page, email, PASSWORD);
      await page.getByRole('button', { name: /upload/i }).click();

      const nameInput = page.getByPlaceholder(/question set name/i).or(
        page.getByLabel(/name/i)
      );
      await nameInput.fill('Bad Set');

      // Create an in-memory file with wrong schema
      const badContent = JSON.stringify([{ wrong_field: 'oops' }]);
      const buffer = Buffer.from(badContent);

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'bad.json',
        mimeType: 'application/json',
        buffer,
      });

      await page.getByRole('button', { name: /upload|submit/i }).last().click();

      const errorEl = page.locator('[data-testid="upload-error"], [role="alert"]');
      await expect(errorEl).toBeVisible({ timeout: 5000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('upload non-JSON file → "not valid JSON" error', async ({ page }) => {
    const { email, userId } = await setupUser();

    try {
      await loginViaUI(page, email, PASSWORD);
      await page.getByRole('button', { name: /upload/i }).click();

      const nameInput = page.getByPlaceholder(/question set name/i).or(
        page.getByLabel(/name/i)
      );
      await nameInput.fill('Text File');

      const buffer = Buffer.from('this is not json at all');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'invalid.json',
        mimeType: 'application/json',
        buffer,
      });

      await page.getByRole('button', { name: /upload|submit/i }).last().click();

      const errorEl = page.locator('[data-testid="upload-error"], [role="alert"]');
      await expect(errorEl).toBeVisible({ timeout: 5000 });
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });
});
