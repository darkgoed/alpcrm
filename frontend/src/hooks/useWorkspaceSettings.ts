import useSWR from 'swr';
import { api } from '@/lib/api';

export interface WorkspaceSettings {
  workspaceId: string;
  autoCloseHours: number | null;
}

export interface FollowUpRule {
  id: string;
  workspaceId: string;
  name: string;
  message: string;
  delayHours: number;
  isActive: boolean;
  createdAt: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useWorkspaceSettings() {
  const { data, mutate, error } = useSWR<WorkspaceSettings>('/workspaces/settings', fetcher);
  return { settings: data ?? null, mutate, error, isLoading: !data && !error };
}

const EMPTY_RULES: FollowUpRule[] = [];

export function useFollowUpRules() {
  const { data, mutate, error } = useSWR<FollowUpRule[]>('/workspaces/follow-up-rules', fetcher);
  return { rules: data ?? EMPTY_RULES, mutate, error, isLoading: !data && !error };
}

export async function updateSettings(dto: { autoCloseHours: number | null }) {
  const r = await api.patch('/workspaces/settings', dto);
  return r.data as WorkspaceSettings;
}

export async function createFollowUpRule(dto: { name: string; message: string; delayHours: number }) {
  const r = await api.post('/workspaces/follow-up-rules', dto);
  return r.data as FollowUpRule;
}

export async function updateFollowUpRule(id: string, dto: Partial<{ name: string; message: string; delayHours: number; isActive: boolean }>) {
  const r = await api.patch(`/workspaces/follow-up-rules/${id}`, dto);
  return r.data as FollowUpRule;
}

export async function deleteFollowUpRule(id: string) {
  await api.delete(`/workspaces/follow-up-rules/${id}`);
}
