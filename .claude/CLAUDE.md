# TelStudy — Project Conventions

## What This Is
Dark-mode-first web study app where users upload JSON question sets and take timed quizzes with post-session performance analytics. Stack: Next.js 14 App Router + Supabase + Recharts + Tailwind CSS, deployed to Vercel.

## Stack
- **Framework**: Next.js 14 (App Router) — TypeScript strict mode, `noUncheckedIndexedAccess`
- **Styling**: Tailwind CSS — `darkMode: 'class'`, `dark` on `<html>` always
- **Auth**: Supabase Auth via `@supabase/ssr` — cookie-based sessions, Google OAuth + Email/Password
- **Database**: Supabase (PostgreSQL) — RLS enforces per-user data isolation at DB layer
- **Storage**: Supabase Storage — `question-sets` bucket (private), paths: `question-sets/{userId}/{setId}.json`
- **Validation**: Zod — schemas in `shared/types/question.ts` and `src/lib/validators/`
- **Server state**: TanStack React Query v5 — React Query cache, invalidation on mutations
- **Charts**: Recharts — `ComposedChart`, `Bar`, `Cell`, `ReferenceLine`, `ResponsiveContainer`
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Deployment**: Vercel

## Directory Structure
```
telstudy/
├── src/
│   ├── app/
│   │   ├── (auth)/           # login/, signup/ — no AppNav
│   │   │   └── layout.tsx    # centered auth card layout
│   │   ├── (app)/            # dashboard/, quiz/[sessionId]/, results/[sessionId]/, history/
│   │   │   └── layout.tsx    # AppNav + user session
│   │   ├── auth/callback/    # OAuth code exchange
│   │   │   └── route.ts
│   │   ├── api/              # Route handlers (server-only)
│   │   │   ├── question-sets/
│   │   │   ├── quiz/
│   │   │   ├── analytics/
│   │   │   └── sessions/
│   │   ├── actions/auth.ts   # signOut Server Action
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/               # Button, Card, Badge, Spinner, ErrorBanner, EmptyState
│   │   ├── layout/           # AppNav, PageHeader, AppErrorBoundary
│   │   ├── dashboard/        # QuestionSetCard, QuestionSetList, UploadModal, UploadButton
│   │   ├── quiz/             # QuizCard, OptionButton, QuizProgress, QuizTimer, QuizClient, ExplanationPanel
│   │   ├── analytics/        # GradeDisplay, PerformanceChart, QuadrantLegend, ResultsClient, KeyInsight
│   │   └── history/          # SessionHistoryItem, SessionHistoryList
│   ├── hooks/
│   │   ├── useQuizReducer.ts
│   │   ├── useTimer.ts
│   │   ├── useQuizTimers.ts
│   │   ├── useQuizKeyboard.ts
│   │   ├── useQuestionSets.ts
│   │   └── useSessionHistory.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts     # createBrowserClient
│   │   │   └── server.ts     # createServerClient (cookies)
│   │   ├── validators/
│   │   │   └── question-schema.ts
│   │   ├── grade.ts
│   │   └── insights.ts
│   └── types/
│       ├── index.ts          # barrel re-export
│       ├── quiz.ts           # QuizSessionState, AnswerRecord, QuizAction, QuizResult
│       ├── api.ts            # ApiError, ApiResponse<T>
│       ├── db.ts             # QuestionSetRow, QuizSessionRow, QuizAnswerRow
│       └── analytics.ts      # DataPoint, QuadrantLabel, SessionAnalytics
├── shared/
│   └── types/
│       └── question.ts       # QuestionSchema (Zod), Question, QuestionSet
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── policies/
│       ├── rls_policies.sql
│       └── storage_policies.sql
├── middleware.ts              # Session refresh + auth redirect
├── .claude/
│   ├── CLAUDE.md             # This file
│   └── agents/               # T001–T027 agent definitions
└── docs/
    └── deployment.md
```

## Key Conventions

### Auth API Pattern
```typescript
// Every API route must start with this:
const supabase = createServerClient(cookies());
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
```

### Supabase Client
```typescript
// Browser (client components):
import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Server (route handlers, server components):
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
const supabase = createServerClient(url, anonKey, { cookies: { getAll: () => cookieStore.getAll(), setAll: ... } });
```

### Error Response Format
```typescript
{ error: { code: 'ERROR_CODE', message: 'Human readable' } }  // error
{ data: T }  // success (or unwrapped T for arrays)
```

### Design Tokens (globals.css)
```css
--background: #0a0a0a;   /* page background */
--surface: #111111;       /* card/panel background */
--border: #222222;        /* borders */
--text: #e5e5e5;          /* primary text */
--muted: #666666;         /* secondary text */
--accent: #ffffff;        /* high emphasis */
--success: #22c55e;       /* correct answers */
--error: #ef4444;         /* incorrect answers */
```

### Design Rules (Developer Minimalist)
- NO `transition-`, `animate-` (except `animate-pulse` on skeletons)
- NO rounded-xl, no shadows, no gradients
- Dark background on everything — never white or light gray as a base
- `rounded` or `rounded-sm` only
- All interactive elements: `focus-visible:outline-white focus-visible:outline-2`

### Task / Branch Naming
- Branch: `feat/TXXX-task-name`
- Commit: `[Phase X] TXXX: Brief description`
- Task statuses: PENDING → IN_PROGRESS → IN_REVIEW → DONE

## Commands
```bash
npm run dev       # localhost:3000
npm run build     # production build
npm run typecheck # tsc --noEmit
npm run test      # vitest unit tests
npm run test:run  # vitest single run
npm run test:e2e  # playwright
npm run lint      # eslint
```

## Docs Repo
Full task specs, architecture, and planning at:
`/Users/galmoussan/projects/claude/TelStudy/telstudy-docs/`
