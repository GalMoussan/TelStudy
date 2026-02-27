# TelStudy — Deployment Guide

This guide walks through deploying TelStudy to Vercel with Supabase as the backend.

## Prerequisites

- A [Supabase](https://supabase.com) project with the schema from `supabase/migrations/`
- A [Vercel](https://vercel.com) account
- A GitHub repository containing the TelStudy code
- (Optional) Google Cloud Console project for OAuth

---

## Step 1 — Supabase Setup

### 1.1 Run Database Migrations

In your Supabase project dashboard, open the SQL Editor and run:

```sql
-- Run in order:
-- 1. supabase/migrations/001_initial_schema.sql
-- 2. supabase/policies/rls_policies.sql
-- 3. supabase/policies/storage_policies.sql
```

### 1.2 Configure Storage Bucket

In Supabase → Storage, verify the `question-sets` bucket exists and is set to **private**.

### 1.3 Configure Auth Providers

**Email/Password:**
- Supabase → Authentication → Providers → Email: enable

**Google OAuth (optional):**
1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
2. Add Authorized Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Secret into Supabase → Authentication → Providers → Google

### 1.4 Add Redirect URLs

In Supabase → Authentication → URL Configuration, add:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## Step 2 — Vercel Setup

### 2.1 Import Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset will auto-detect as **Next.js**
4. Leave build settings as default (uses `vercel.json`)

### 2.2 Set Environment Variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |

**Security note:** `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_`. It should only be accessible on the server.

### 2.3 Deploy

Click **Deploy**. Vercel will build and deploy your app.

---

## Step 3 — Post-Deployment Verification

After deployment, verify:

1. **Auth works:** Go to `/login`, sign up with email/password
2. **Upload works:** Upload the `tests/fixtures/test-questions.json` file
3. **Quiz works:** Start a quiz from the dashboard
4. **Results work:** Complete a quiz and verify the analytics page loads

---

## Local Development

```bash
# Copy env vars
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm run test:run

# Run type check
npm run typecheck
```

---

## Supabase CLI (Local Development)

For local development with a local Supabase instance:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Stop local Supabase
supabase stop
```

Local Supabase URL: `http://localhost:54321`
Local Anon Key: shown in `supabase start` output
