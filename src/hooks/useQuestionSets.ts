'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QuestionSetListItem } from '@/types';

export function useQuestionSets() {
  return useQuery({
    queryKey: ['question-sets'],
    queryFn: async (): Promise<QuestionSetListItem[]> => {
      const res = await fetch('/api/question-sets');
      if (!res.ok) throw new Error('Failed to fetch question sets');
      return res.json() as Promise<QuestionSetListItem[]>;
    },
  });
}

export function useDeleteQuestionSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/question-sets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json()) as { error: { message: string } };
        throw new Error(body.error?.message ?? 'Delete failed');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-sets'] });
    },
  });
}
