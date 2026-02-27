import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const TEST_USER = {
  email: `test-${Date.now()}@telstudy-e2e.test`,
  password: 'TestPassword123!',
};

/**
 * Create a Supabase admin client for test data management.
 * Uses service role key — never exposed to browser.
 */
export function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Sign up a test user via the UI and wait for dashboard to load.
 */
export async function signUpViaUI(page: Page, email: string, password: string) {
  await page.goto('/signup');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign up/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/**
 * Log in a test user via the UI and wait for dashboard to load.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/**
 * Sign out via the UI.
 */
export async function signOutViaUI(page: Page) {
  await page.getByRole('button', { name: /sign out|log out/i }).click();
  await page.waitForURL('**/login**', { timeout: 10000 });
}
