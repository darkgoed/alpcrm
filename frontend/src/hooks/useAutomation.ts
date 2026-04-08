import useSWR from 'swr';
import { api } from '@/lib/api';

export interface FlowNode {
  id: string;
  flowId: string;
  type: 'message' | 'condition' | 'delay';
  config: Record<string, any>;
  order: number;
  nextId: string | null;
}

export interface Flow {
  id: string;
  workspaceId: string;
  name: string;
  isActive: boolean;
  triggerType: 'new_conversation' | 'keyword' | 'always';
  triggerValue: string | null;
  nodes: FlowNode[];
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useFlows() {
  const { data, mutate, error } = useSWR<Flow[]>('/automation/flows', fetcher);
  return { flows: data ?? [], mutate, error, isLoading: !data && !error };
}

export async function createFlow(payload: Partial<Flow>): Promise<Flow> {
  const r = await api.post('/automation/flows', payload);
  return r.data;
}

export async function updateFlow(id: string, payload: Partial<Flow>): Promise<Flow> {
  const r = await api.put(`/automation/flows/${id}`, payload);
  return r.data;
}

export async function deleteFlow(id: string) {
  await api.delete(`/automation/flows/${id}`);
}

export async function toggleFlow(id: string): Promise<Flow> {
  const r = await api.patch(`/automation/flows/${id}/toggle`);
  return r.data;
}
