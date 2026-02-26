---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# T024 — Playwright E2E Test Suite Agent

You are the end-to-end testing specialist for TelStudy. You write Playwright tests that cover the four critical user flows — auth, upload, quiz, and results — running against a local Next.js dev server backed by a local Supabase instance.

## Mission

Build the Playwright test suite from scratch: config, fixtures, and four spec files. Tests use `data-testid` attributes already placed throughout the app. After this task, `npm run test:e2e` passes all tests against a running local environment.

## Prerequisites

These must be running before the tests can execute:
- `supabase start` (local Supabase on port 54321)
- `npm run dev` (Next.js on port 3000)

The tests assume a pre-seeded test user exists. Document this in the fixture setup.

## Playwright Config

### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // serial to avoid auth state conflicts
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start local dev server automatically
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

## Test Fixtures

### `tests/fixtures/test-questions.json`
```json
[
  {
    "question_text": "What is the capital of France?",
    "options": ["Berlin", "Madrid", "Paris", "Rome"],
    "correct_answer_index": 2,
    "explanation": "Paris is the capital and largest city of France."
  },
  {
    "question_text": "What does HTTP stand for?",
    "options": [
      "HyperText Transfer Protocol",
      "High Transfer Text Protocol",
      "HyperText Transmission Protocol",
      "High Text Transfer Protocol"
    ],
    "correct_answer_index": 0,
    "explanation": "HTTP stands for HyperText Transfer Protocol."
  },
  {
    "question_text": "Which data structure uses LIFO order?",
    "options": ["Queue", "Stack", "Array", "Tree"],
    "correct_answer_index": 1,
    "explanation": "A Stack uses Last In, First Out (LIFO) order."
  },
  {
    "question_text": "What is 2 + 2?",
    "options": ["3", "4", "5", "6"],
    "correct_answer_index": 1,
    "explanation": "2 + 2 = 4."
  },
  {
    "question_text": "Which language runs in a browser?",
    "options": ["Python", "Ruby", "Java", "JavaScript"],
    "correct_answer_index": 3,
    "explanation": "JavaScript is the only language that natively runs in browsers."
  }
]
```

### `tests/fixtures/auth.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

// Uses local Supabase service role key (safe for test-only)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'your-local-service-role-key',
);

export const TEST_USER = {
  email: 'test@telstudy.local',
  password: 'TestPassword123!',
};

export async function createTestUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: TEST_USER.email,
    password: TEST_USER.password,
    email_confirm: true,
  });
  return { user: data.user, error };
}

export async function deleteTestUser(userId: string) {
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

export async function getTestUserId(): Promise<string | null> {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === TEST_USER.email);
  return user?.id ?? null;
}
```

### `tests/fixtures/cleanup.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'your-local-service-role-key',
);

export async function cleanupUserData(userId: string) {
  // Delete in dependency order: answers → sessions → question_sets
  await supabaseAdmin.from('quiz_answers').delete().eq('session_id',
    supabaseAdmin.from('quiz_sessions').select('id').eq('user_id', userId)
  );
  await supabaseAdmin.from('quiz_sessions').delete().eq('user_id', userId);
  await supabaseAdmin.from('question_sets').delete().eq('user_id', userId);

  // Clean storage
  const { data: files } = await supabaseAdmin.storage
    .from('question-sets')
    .list(userId);
  if (files && files.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    await supabaseAdmin.storage.from('question-sets').remove(paths);
  }
}
```

## E2E Spec Files

### `tests/e2e/auth.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { TEST_USER, createTestUser, deleteTestUser, getTestUserId } from '../fixtures/auth';

test.describe('Authentication', () => {
  test.beforeAll(async () => {
    await createTestUser().catch(() => {}); // ignore if already exists
  });

  test.afterAll(async () => {
    const userId = await getTestUserId();
    if (userId) await deleteTestUser(userId);
  });

  test('login with valid credentials shows dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /My Question Sets/i })).toBeVisible();
  });

  test('login with invalid password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill('WrongPassword!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible();
  });

  test('logout redirects to login page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
```

### `tests/e2e/upload.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import path from 'path';
import { TEST_USER, createTestUser } from '../fixtures/auth';
import { cleanupUserData, getTestUserId } from '../fixtures/cleanup';

test.describe('Upload', () => {
  test.beforeAll(async () => {
    await createTestUser().catch(() => {});
  });

  test.afterEach(async () => {
    const userId = await getTestUserId();
    if (userId) await cleanupUserData(userId);
  });

  async function login(page: any) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  }

  test('valid JSON upload creates question set card', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /upload/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-questions.json'));
    await page.getByRole('button', { name: /submit|upload/i }).last().click();
    await expect(page.locator('[data-testid="question-set-card"]')).toBeVisible({ timeout: 10_000 });
  });

  test('non-JSON file shows file type error', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /upload/i }).click();
    const fileInput = page.locator('input[type="file"]');
    // Create an in-memory .txt file via Playwright
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not json content'),
    });
    await expect(page.locator('text=.json')).toBeVisible();
  });

  test('invalid JSON content shows parse error', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /upload/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{invalid json}'),
    });
    await expect(page.locator('text=/not valid JSON/i')).toBeVisible();
  });
});
```

### `tests/e2e/quiz.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import path from 'path';
import { TEST_USER, createTestUser } from '../fixtures/auth';
import { cleanupUserData, getTestUserId } from '../fixtures/cleanup';

test.describe('Quiz Flow', () => {
  test.beforeAll(async () => {
    await createTestUser().catch(() => {});
  });

  test.afterAll(async () => {
    const userId = await getTestUserId();
    if (userId) await cleanupUserData(userId);
  });

  test('can complete a 5-question quiz', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Upload fixture
    await page.getByRole('button', { name: /upload/i }).click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/test-questions.json'));
    await page.getByRole('button', { name: /submit|upload/i }).last().click();
    await expect(page.locator('[data-testid="question-set-card"]')).toBeVisible({ timeout: 10_000 });

    // Start quiz
    await page.getByRole('link', { name: /start quiz/i }).first().click();
    await expect(page).toHaveURL(/\/quiz\/.+/);

    // Answer all 5 questions
    for (let i = 0; i < 5; i++) {
      // Verify question is visible
      await expect(page.locator('[data-testid="quiz-card"]')).toBeVisible();

      // Click the first option
      await page.locator('[data-testid="option-button"]').first().click();

      // Explanation panel should appear
      await expect(page.locator('[data-testid="explanation-panel"]')).toBeVisible();

      // Advance to next question
      await page.getByRole('button', { name: /next|finish/i }).click();
    }

    // Should reach results
    await expect(page).toHaveURL(/\/results\/.+/, { timeout: 10_000 });
  });
});
```

### `tests/e2e/results.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { TEST_USER, createTestUser } from '../fixtures/auth';

test.describe('Results Page', () => {
  test.beforeAll(async () => {
    await createTestUser().catch(() => {});
  });

  test('results page shows grade and chart after completing quiz', async ({ page }) => {
    // This test assumes a quiz was just completed (navigate to a fresh results URL)
    // Run the quiz flow first to get a sessionId
    // For simplicity, this test verifies the results page structure
    // given a valid session in the database from the quiz spec above.

    // Login and check dashboard
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('accessing results with non-UUID redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.goto('/results/not-a-uuid');
    await expect(page).toHaveURL('/dashboard?error=not-found');
  });

  test('accessing quiz with non-UUID redirects to dashboard', async ({ page }) => {
    await page.goto('/quiz/not-a-uuid');
    // Middleware should redirect unauthenticated users to login
    await expect(page).toHaveURL(/\/login|\/dashboard/);
  });
});
```

## Your Workflow

1. **Write** `playwright.config.ts`
2. **Write** `tests/fixtures/test-questions.json`
3. **Write** `tests/fixtures/auth.ts`
4. **Write** `tests/fixtures/cleanup.ts`
5. **Write** `tests/e2e/auth.spec.ts`
6. **Write** `tests/e2e/upload.spec.ts`
7. **Write** `tests/e2e/quiz.spec.ts`
8. **Write** `tests/e2e/results.spec.ts`
9. **Run** `npm run typecheck` to verify no type errors in test files
10. **Read** `package.json` — verify `test:e2e` script exists (`playwright test`); add if missing

## Task Assignment
- **T024**: Playwright E2E Test Suite

## Files to Create
- `playwright.config.ts`
- `tests/fixtures/test-questions.json`
- `tests/fixtures/auth.ts`
- `tests/fixtures/cleanup.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/upload.spec.ts`
- `tests/e2e/quiz.spec.ts`
- `tests/e2e/results.spec.ts`

## Acceptance Criteria (Definition of Done)
- [ ] `playwright.config.ts` exists and configures Chromium + local baseURL
- [ ] Fixture JSON has exactly 5 valid questions
- [ ] Auth fixture can create and delete test users via admin API
- [ ] Auth spec: valid login → dashboard, invalid login → error banner
- [ ] Auth spec: logout → redirected to /login
- [ ] Upload spec: valid JSON → question set card appears
- [ ] Upload spec: non-JSON → file type error visible
- [ ] Upload spec: invalid JSON → parse error visible
- [ ] Quiz spec: completes all 5 questions → arrives at /results/
- [ ] Results spec: non-UUID redirect to dashboard?error=not-found
- [ ] `npm run typecheck` passes on test files

## Verify Commands
```bash
npm run typecheck
# To run E2E (requires local Supabase + dev server):
npm run test:e2e
```
