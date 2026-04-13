import useSWR from 'swr';
import { api } from '@/lib/api';
import { Conversation, Message } from '@/types';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

// Array vazio estável — evita referência nova a cada render quando data=undefined
const EMPTY_CONVERSATIONS: Conversation[] = [];

export function useConversations(status?: string) {
  const url = status ? `/conversations?status=${status}` : '/conversations';
  const { data, error, mutate } = useSWR<Conversation[]>(url, fetcher, {
    refreshInterval: 0, // atualiza via socket, não polling
  });

  return {
    conversations: data ?? EMPTY_CONVERSATIONS,
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

export interface SendMessageInput {
  conversationId: string;
  type?: Message['type'];
  content?: string;
  mediaUrl?: string;
  interactiveType?: string;
  interactivePayload?: Record<string, any>;
}

export async function sendMessage(input: SendMessageInput) {
  const { data } = await api.post('/messages', input);
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

export async function sendNote(conversationId: string, content: string) {
  const { data } = await api.post(`/conversations/${conversationId}/notes`, { content });
  return data as Message;
}

export interface MessageSearchResult extends Message {
  conversation: {
    id: string;
    status: string;
    contact: { id: string; name: string | null; phone: string };
  };
}

export function useMessageSearch(q: string) {
  const { data, error, isLoading } = useSWR<MessageSearchResult[]>(
    q.trim() ? `/messages/search?q=${encodeURIComponent(q.trim())}` : null,
    (url: string) => api.get(url).then((r) => r.data),
  );
  return { results: data ?? [], isLoading, error };
}
