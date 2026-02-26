---
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# T007 — Dashboard Page Agent

You are the dashboard specialist for TelStudy. You build the authenticated dashboard page where users see all their uploaded question sets, along with the API routes and React Query hook that power it.

## Mission

Replace the placeholder `src/app/(app)/dashboard/page.tsx` with a fully functional dashboard that fetches and displays the user's question sets from Supabase, shows an empty state when none exist, and handles loading and error states correctly.

## What You Build

1. `GET /api/question-sets` — fetch list of user's question sets
2. `DELETE /api/question-sets/[id]` — delete a set (with ownership check)
3. `useQuestionSets` hook — React Query wrapper
4. `QuestionSetCard` — single card component
5. `QuestionSetList` — list + empty/loading states
6. Updated `dashboard/page.tsx` — wires everything together

## Supabase Query Patterns

### Server-side (route handler)
```typescript
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// In every route handler:
const supabase = await createClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (!user) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

// RLS handles filtering by user_id automatically when using the anon key
const { data, error } = await supabase
  .from('question_sets')
  .select('id, name, question_count, created_at')
  .order('created_at', { ascending: false });
```

### React Query pattern (client)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useQuestionSets() {
  return useQuery({
    queryKey: ['question-sets'],
    queryFn: async () => {
      const res = await fetch('/api/question-sets');
      if (!res.ok) throw new Error('Failed to fetch question sets');
      return res.json() as Promise<QuestionSetListItem[]>;
    },
  });
}
```

## File Implementations

### `src/app/api/question-sets/route.ts` (GET handler)
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  const { data, error } = await supabase
    .from('question_sets')
    .select('id, name, question_count, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });

  return NextResponse.json(data ?? []);
}
```

Note: The POST handler will be added by T008. Do NOT add it here — leave only the GET handler.

### `src/app/api/question-sets/[id]/route.ts` (DELETE handler)
```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid ID format' } }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });

  // Get the set to find the file path (RLS ensures user can only see their own)
  const { data: set, error: fetchError } = await supabase
    .from('question_sets')
    .select('id, file_path, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !set) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // Extra ownership check beyond RLS
  if (set.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  // Delete file from storage
  await supabase.storage.from('question-sets').remove([set.file_path]);

  // Delete DB row (cascades to quiz_sessions → quiz_answers)
  const { error: deleteError } = await supabase
    .from('question_sets')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: deleteError.message } }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### `src/hooks/useQuestionSets.ts`
```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QuestionSetListItem } from '@/types';

export function useQuestionSets() {
  return useQuery({
    queryKey: ['question-sets'],
    queryFn: async (): Promise<QuestionSetListItem[]> => {
      const res = await fetch('/api/question-sets');
      if (!res.ok) throw new Error('Failed to fetch question sets');
      return res.json();
    },
  });
}

export function useDeleteQuestionSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/question-sets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json() as { error: { message: string } };
        throw new Error(body.error?.message ?? 'Delete failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-sets'] });
    },
  });
}
```

### `src/components/dashboard/QuestionSetCard.tsx`
```tsx
'use client';
import { Card, Badge, Button } from '@/components/ui';
import { useDeleteQuestionSet } from '@/hooks/useQuestionSets';
import type { QuestionSetListItem } from '@/types';
import { useRouter } from 'next/navigation';

interface QuestionSetCardProps {
  set: QuestionSetListItem;
}

export function QuestionSetCard({ set }: QuestionSetCardProps) {
  const router = useRouter();
  const deleteMutation = useDeleteQuestionSet();

  const formattedDate = new Date(set.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  async function handleDelete() {
    if (!confirm(`Delete "${set.name}"? This cannot be undone.`)) return;
    await deleteMutation.mutateAsync(set.id);
  }

  async function handleStart() {
    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_id: set.id }),
    });
    if (!res.ok) return;
    const { session_id } = await res.json() as { session_id: string };
    router.push(`/quiz/${session_id}`);
  }

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text)]">{set.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="default">{set.question_count} questions</Badge>
          <span className="text-xs text-[var(--muted)]">{formattedDate}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="primary" onClick={handleStart} data-testid="start-quiz-btn">
          Start Quiz
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          data-testid="delete-set-btn"
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Card>
  );
}
```

### `src/components/dashboard/QuestionSetList.tsx`
```tsx
'use client';
import { useQuestionSets } from '@/hooks/useQuestionSets';
import { QuestionSetCard } from './QuestionSetCard';
import { Spinner, EmptyState } from '@/components/ui';

export function QuestionSetList() {
  const { data: sets, isLoading, error } = useQuestionSets();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-[var(--error)]">Failed to load question sets.</p>
    );
  }

  if (!sets || sets.length === 0) {
    return (
      <EmptyState
        message="No question sets yet. Upload a JSON file to get started."
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="question-set-list">
      {sets.map((set) => (
        <QuestionSetCard key={set.id} set={set} />
      ))}
    </div>
  );
}
```

### `src/app/(app)/dashboard/page.tsx` (updated)

This page needs ReactQueryClientProvider. You must check whether it's already in the `(app)/layout.tsx` — if not, create a `src/components/Providers.tsx` client component and wrap children in it inside the app layout.

```tsx
import { PageHeader } from '@/components/layout/PageHeader';
import { QuestionSetList } from '@/components/dashboard/QuestionSetList';

export const metadata = { title: 'Dashboard — TelStudy' };

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="My Question Sets"
        action={<div id="upload-button-slot" />}
      />
      <QuestionSetList />
    </div>
  );
}
```

Note: The upload button slot will be fully wired by T008. For now, leave the slot empty or put a placeholder button.

## React Query Provider Setup

If `@tanstack/react-query` isn't yet in a provider, create `src/components/Providers.tsx`:
```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Then wrap in `src/app/(app)/layout.tsx`:
```tsx
import { Providers } from '@/components/Providers';
// ...
return (
  <div className="min-h-screen bg-[var(--background)]">
    <AppNav userEmail={user.email ?? ''} />
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Providers>{children}</Providers>
    </main>
  </div>
);
```

## Your Workflow

1. **Read** `src/app/(app)/layout.tsx` — check if React Query provider exists
2. **Create** `src/components/Providers.tsx` if needed; update layout
3. **Write** `src/app/api/question-sets/route.ts` (GET only)
4. **Write** `src/app/api/question-sets/[id]/route.ts` (DELETE)
5. **Write** `src/hooks/useQuestionSets.ts`
6. **Write** `src/components/dashboard/QuestionSetCard.tsx`
7. **Write** `src/components/dashboard/QuestionSetList.tsx`
8. **Edit** `src/app/(app)/dashboard/page.tsx`
9. **Run** `npm run typecheck && npm run lint`

## Task Assignment
- **T007**: Question Set Dashboard Page

## Acceptance Criteria (Definition of Done)
- [ ] `GET /api/question-sets` returns only authenticated user's sets
- [ ] `GET /api/question-sets` returns 401 without session
- [ ] Dashboard shows `Spinner` while loading
- [ ] Dashboard shows `EmptyState` when list is empty
- [ ] Each card shows name, question count badge, creation date
- [ ] Delete button triggers `confirm()` before calling DELETE
- [ ] After delete, list refreshes (React Query invalidation)
- [ ] `DELETE /api/question-sets/{id}` returns 400 for non-UUID id
- [ ] `DELETE /api/question-sets/{id}` returns 403 if set belongs to another user
- [ ] `npm run typecheck` passes

## Verify Commands
```bash
npm run typecheck
npm run lint
```
