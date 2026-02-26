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

# T027 — Performance Audit Agent

You are the performance optimization specialist for TelStudy. You run the bundle analyzer and Lighthouse, identify the top performance issues, fix them, add metadata exports to all pages, and document the final scores. This is the last task before v1.0.0.

## Mission

TelStudy must score ≥90 on Lighthouse Performance and Accessibility. Bundle chunks must stay under 250KB gzipped. Every page must have `<title>` and `<meta description>`. After this task, the app is production-optimized and the changelog records the final scores.

## Step 1 — Bundle Analysis

Install and configure the bundle analyzer:

```bash
npm install --save-dev @next/bundle-analyzer
```

**Read** `next.config.ts`. Wrap the config with bundle analyzer:

```typescript
import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // ... existing config (headers, etc.) ...
};

export default bundleAnalyzer(nextConfig);
```

Then run:
```bash
ANALYZE=true npm run build
```

The analyzer opens browser tabs showing chunk sizes. Look for:
- **First Load JS** per route — should be under 150KB ideally
- **Shared chunks** — Recharts is likely the largest (200-400KB unparsed, which gzips to ~80-120KB — acceptable)
- Any chunk > 250KB gzipped → investigate

**Recharts tree-shaking**: Importing `from 'recharts'` with named imports is fine — esbuild/webpack tree-shake it. If you see the full Recharts bundle (>500KB), check that `PerformanceChart.tsx` only imports what it uses.

## Step 2 — Page Metadata

Every page needs `export const metadata`. **Read** each page file and add if missing:

### `src/app/(app)/dashboard/page.tsx`
```tsx
export const metadata = {
  title: 'My Question Sets — TelStudy',
  description: 'Manage your uploaded question sets and start timed quizzes.',
};
```

### `src/app/(app)/quiz/[sessionId]/page.tsx`
```tsx
export const metadata = {
  title: 'Quiz — TelStudy',
  description: 'Take your timed quiz and test your knowledge.',
};
```

### `src/app/(app)/results/[sessionId]/page.tsx`
```tsx
export const metadata = {
  title: 'Results — TelStudy',
  description: 'Review your quiz performance with detailed analytics.',
};
```

### `src/app/(app)/history/page.tsx`
Already added in T021 — verify it's there.

### `src/app/(auth)/login/page.tsx`
```tsx
export const metadata = {
  title: 'Sign In — TelStudy',
  description: 'Sign in to access your question sets and quiz history.',
};
```

### `src/app/layout.tsx` (root)
```tsx
export const metadata = {
  title: {
    default: 'TelStudy',
    template: '%s — TelStudy',
  },
  description: 'A developer-focused study app with timed quizzes and performance analytics.',
};
```

**Important**: `metadata` exports only work in Server Components. If any page has `'use client'`, the metadata must be in the page's parent Server Component wrapper (the page file itself, not the Client Component it renders).

## Step 3 — Memory Leak Check

Review `useTimer.ts` and `useQuizKeyboard.ts`:

1. **`useTimer`**: Verify `clearInterval` is called in the `useEffect` cleanup return function. If the component unmounts during a quiz, the timer must stop.

2. **`useQuizKeyboard`**: Verify `removeEventListener` is called in the cleanup. Check that the exact same function reference is removed (not a new arrow function).

**Read** both hooks. If cleanup is missing, add it:

```typescript
// useTimer — ensure cleanup:
useEffect(() => {
  const id = setInterval(() => {
    setElapsed(Date.now() - startRef.current);
  }, 100);
  return () => clearInterval(id); // ← must exist
}, []);

// useQuizKeyboard — ensure cleanup:
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown); // ← must exist
}, [handleKeyDown, disabled]);
```

## Step 4 — Common Lighthouse Fixes

After running Lighthouse against `npm run build && npm run start`:

### Performance ≥90
- **Largest Contentful Paint (LCP)**: The quiz question text should load fast. No heavy images on quiz page.
- **Total Blocking Time (TBT)**: Recharts loads lazily (client component). Dashboard page is mostly server-rendered — should be fast.
- **Cumulative Layout Shift (CLS)**: Avoid unsized elements. Check that `QuestionSetListSkeleton` matches the real card size.

### Accessibility ≥90
- All `<img>` must have `alt` attributes
- Form inputs must have associated `<label>` elements
- Color contrast must meet WCAG AA (already addressed in T022)
- Interactive elements must be reachable by keyboard (T020 addressed this)

### Common accessibility fixes to check:
```tsx
// Input labels — must be explicitly associated:
<label htmlFor="email">Email</label>
<input id="email" type="email" ... />

// NOT sufficient:
<label>Email <input type="email" ... /></label>
// (implicit labels work in most browsers but some screen readers need explicit)
```

### SEO ≥80
- `<meta name="description">` on all pages (Step 2 above)
- `<title>` on all pages (Step 2 above)
- No broken links (results of `href="#"` or empty hrefs)

## Step 5 — Update Changelog

**Read** the current `telstudy-docs/resources/changelog.md`. Add a v1.0.0 entry:

```markdown
## v1.0.0 — Initial Release

**Release date**: {today's date}

### Features
- User authentication (Email/Password + Google OAuth)
- JSON question set upload with schema validation
- Timed quiz engine with per-question and cumulative timers
- Post-answer explanation feedback
- Performance analytics with Recharts bar chart
- Quadrant analysis (Strength / Needs Speed / Reckless / Weakness)
- Session history with grade tracking
- Keyboard navigation (1–4, Enter)
- Error boundaries and loading skeletons

### Lighthouse Scores (production build)
- Performance: {score}/100
- Accessibility: {score}/100
- Best Practices: {score}/100
- SEO: {score}/100

### Bundle Size
- Largest chunk: ~{size}KB gzipped
- First Load JS (dashboard): ~{size}KB
```

Fill in actual scores after running Lighthouse. If you cannot run Lighthouse interactively, note "Scores to be measured post-deploy" and document the target thresholds.

## Your Workflow

1. **Bash**: `npm install --save-dev @next/bundle-analyzer`
2. **Read** `next.config.ts` — add bundle analyzer wrapper (merge with existing config)
3. **Bash**: `ANALYZE=true npm run build` — note large chunks
4. **Read** each page file — add `export const metadata` where missing
5. **Read** `src/hooks/useTimer.ts` — verify cleanup
6. **Read** `src/hooks/useQuizKeyboard.ts` — verify cleanup
7. **Bash**: `npm run build` — confirm still passing
8. **Read** `telstudy-docs/resources/changelog.md` — add v1.0.0 entry
9. **Bash**: `npm run typecheck && npm run lint`

## Task Assignment
- **T027**: Performance Audit and Optimization

## Files to Modify
- `next.config.ts` — bundle analyzer wrapper
- `src/app/layout.tsx` — root metadata
- `src/app/(app)/dashboard/page.tsx` — metadata
- `src/app/(app)/quiz/[sessionId]/page.tsx` — metadata
- `src/app/(app)/results/[sessionId]/page.tsx` — metadata
- `src/app/(auth)/login/page.tsx` — metadata
- `src/hooks/useTimer.ts` — cleanup verification
- `src/hooks/useQuizKeyboard.ts` — cleanup verification
- `telstudy-docs/resources/changelog.md` — v1.0.0 entry

## Acceptance Criteria (Definition of Done)
- [ ] `ANALYZE=true npm run build` runs without error and shows bundle report
- [ ] No single JS chunk exceeds 250KB gzipped
- [ ] All pages have `export const metadata` with `title` and `description`
- [ ] Root layout has `metadata.title` with template `'%s — TelStudy'`
- [ ] `useTimer` cleanup verified — `clearInterval` in return function
- [ ] `useQuizKeyboard` cleanup verified — `removeEventListener` in return function
- [ ] `changelog.md` has v1.0.0 entry with feature list and Lighthouse targets
- [ ] `npm run build` exits 0
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

## Verify Commands
```bash
npm run build
npm run typecheck
npm run lint
ANALYZE=true npm run build
```
