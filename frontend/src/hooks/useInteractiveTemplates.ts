'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type { InteractivePayload } from '@/types';

export type InteractiveTemplateType = 'reply_buttons' | 'list' | 'cta_url';

export interface InteractiveTemplate {
  id: string;
  name: string;
  content: string;
  interactiveType: InteractiveTemplateType;
  interactivePayload: InteractivePayload;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useInteractiveTemplates() {
  const { data, error, mutate, isLoading } = useSWR<InteractiveTemplate[]>(
    '/interactive-templates',
    fetcher,
    { refreshInterval: 0 },
  );

  return {
    templates: data ?? [],
    error,
    mutate,
    isLoading,
  };
}

export async function createInteractiveTemplate(
  dto: Pick<
    InteractiveTemplate,
    'name' | 'content' | 'interactiveType' | 'interactivePayload'
  >,
) {
  const res = await api.post('/interactive-templates', dto);
  return res.data as InteractiveTemplate;
}

export async function updateInteractiveTemplate(
  id: string,
  dto: Partial<
    Pick<
      InteractiveTemplate,
      'name' | 'content' | 'interactiveType' | 'interactivePayload'
    >
  >,
) {
  const res = await api.patch(`/interactive-templates/${id}`, dto);
  return res.data as InteractiveTemplate;
}

export async function deleteInteractiveTemplate(id: string) {
  await api.delete(`/interactive-templates/${id}`);
}
