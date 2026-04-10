import useSWR from 'swr';
import { api } from '@/lib/api';

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  language: string;
  body: string;
  status: TemplateStatus;
  metaId: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
  whatsappAccount: { id: string; name: string; phoneNumber: string };
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useTemplates() {
  const { data, error, isLoading, mutate } = useSWR<MessageTemplate[]>(
    '/templates',
    fetcher,
    { refreshInterval: 0 },
  );
  return {
    templates: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export async function createTemplate(payload: {
  whatsappAccountId: string;
  name: string;
  category: TemplateCategory;
  language: string;
  body: string;
}) {
  const res = await api.post<MessageTemplate>('/templates', payload);
  return res.data;
}

export async function refreshTemplate(id: string) {
  const res = await api.patch<MessageTemplate>(`/templates/${id}/refresh`);
  return res.data;
}

export async function deleteTemplate(id: string) {
  await api.delete(`/templates/${id}`);
}
