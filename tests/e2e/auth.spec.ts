import { test, expect } from '@playwright/test';
import { getAdminClient, signUpViaUI, loginViaUI, signOutViaUI } from '../fixtures/auth';
import { deleteTestUser } from '../fixtures/cleanup';

const uniqueEmail = () => `e2e-auth-${Date.now()}@telstudy-e2e.test`;
const PASSWORD = 'TestPassword123!';

test.describe('Auth — Email Signup and Login', () => {
  test('signup with email/password → dashboard loads', async ({ page }) => {
    const email = uniqueEmail();
    let userId: string | null = null;

    try {
      await signUpViaUI(page, email, PASSWORD);
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.getByRole('heading', { name: /my question sets/i })).toBeVisible();

      // Capture user id for cleanup
      const admin = getAdminClient();
      const { data } = await admin.auth.admin.listUsers();
      const user = data.users.find((u) => u.email === email);
      userId = user?.id ?? null;
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('login with valid credentials → dashboard', async ({ page }) => {
    const email = uniqueEmail();
    let userId: string | null = null;

    try {
      // Create user via admin so we can log in
      const admin = getAdminClient();
      const { data } = await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      });
      userId = data.user?.id ?? null;

      await loginViaUI(page, email, PASSWORD);
      await expect(page).toHaveURL(/dashboard/);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('logout → redirected to login', async ({ page }) => {
    const email = uniqueEmail();
    let userId: string | null = null;

    try {
      const admin = getAdminClient();
      const { data } = await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      });
      userId = data.user?.id ?? null;

      await loginViaUI(page, email, PASSWORD);
      await signOutViaUI(page);
      await expect(page).toHaveURL(/login/);
    } finally {
      if (userId) await deleteTestUser(userId);
    }
  });

  test('login with invalid credentials → error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('notexist@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/login/);
    const errorEl = page.locator('[data-testid="error-banner"], [role="alert"]');
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });
});
