# TelStudy

Web-based study app with Google OAuth and email/password auth, JSON question set upload, quiz experience with per-question and cumulative timers, post-question explanation feedback, and analytics showing performance metrics comparing time-per-question vs accuracy.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS (dark-mode first)
- **Auth:** Supabase Auth (Google OAuth + Email/Password)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (JSON question sets)
- **Charts:** Recharts
- **Testing:** Vitest + Playwright

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Structure

```
telstudy/
├── src/
│   ├── app/          # Next.js App Router pages and layouts
│   ├── components/   # Reusable React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Supabase client, utilities
│   └── types/        # TypeScript interfaces
├── shared/
│   └── types/        # Shared type definitions (question schema, etc.)
└── public/           # Static assets
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint code |
