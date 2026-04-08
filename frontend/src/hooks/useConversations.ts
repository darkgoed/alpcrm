import useSWR from 'swr';
import { api } from '@/lib/api';
import { Conversation } from '@/types';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useConversations(status?: string) {
  const url = status ? `/conversations?status=${status}` : '/conversations';
  const { data, error, mutate } = useSWR<Conversation[]>(url, fetcher, {
    refreshInterval: 0, // atualiza via socket, não polling
  });

  return {
    conversations: data ?? [],
    isLoading: !data && !error,
    mutate,
  };
}

export function useConversation(id: string | null) {
  const { data, error, mutate } = useSWR<Conversation>(
    id ? `/conversations/${id}` : null,
    fetcher,
  );

  return { conversation: data, isLoading: !data && !error, mutate };
}

export async function sendMessage(conversationId: string, content: string) {
  const { data } = await api.post('/messages', {
    conversationId,
    type: 'text',
    content,
  });
  return data;
}

export async function assignConversation(id: string, userId?: string, teamId?: string) {
  const { data } = await api.patch(`/conversations/${id}/assign`, { userId, teamId });
  return data;
}

export async function closeConversation(id: string) {
  const { data } = await api.patch(`/conversations/${id}/close`);
  return data;
}

export async function reopenConversation(id: string) {
  const { data } = await api.patch(`/conversations/${id}/reopen`);
  return data;
}
