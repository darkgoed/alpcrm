'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

export interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  body: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useQuickReplies(search?: string) {
  const key = search ? `/quick-replies?search=${encodeURIComponent(search)}` : '/quick-replies';
  const { data, error, mutate, isLoading } = useSWR<QuickReply[]>(key, fetcher);
  return { quickReplies: data ?? [], error, mutate, isLoading };
}

export async function createQuickReply(dto: { shortcut: string; title: string; body: string }) {
  const res = await api.post('/quick-replies', dto);
  return res.data as QuickReply;
}

export async function updateQuickReply(id: string, dto: Partial<{ shortcut: string; title: string; body: string }>) {
  const res = await api.patch(`/quick-replies/${id}`, dto);
  return res.data as QuickReply;
}

export async function deleteQuickReply(id: string) {
  await api.delete(`/quick-replies/${id}`);
}
