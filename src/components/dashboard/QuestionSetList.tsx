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
      <EmptyState message="No question sets yet. Upload a JSON file to get started." />
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
