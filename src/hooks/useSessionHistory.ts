'use client';
import { useQuery } from '@tanstack/react-query';
import type { SessionHistoryItem } from '@/types/api';

async function fetchSessionHistory(): Promise<SessionHistoryItem[]> {
  const res = await fetch('/api/sessions');
  if (!res.ok) throw new Error('Failed to load session history');
  return res.json() as Promise<SessionHistoryItem[]>;
}

export function useSessionHistory() {
  return useQuery({
    queryKey: ['session-history'],
    queryFn: fetchSessionHistory,
  });
}
