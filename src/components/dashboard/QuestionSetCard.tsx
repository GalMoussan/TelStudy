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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
    const { session_id } = (await res.json()) as { session_id: string };
    router.push(`/quiz/${session_id}`);
  }

  return (
    <Card className="flex items-center justify-between gap-4" data-testid="question-set-card">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--text)]">{set.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="default">{set.question_count} questions</Badge>
          <span className="text-xs text-[var(--muted)]">{formattedDate}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={handleStart}
          data-testid="start-quiz-btn"
        >
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
