import useSWR from 'swr';
import { api } from '@/lib/api';

export interface FlowNode {
  id: string;
  flowId: string;
  type: 'message' | 'condition' | 'delay';
  config: {
    content?: string;
    ms?: number;
  };
  order: number;
  nextId: string | null;
}

export interface Flow {
  id: string;
  workspaceId: string;
  name: string;
  isActive: boolean;
  triggerType:
    | 'new_conversation'
    | 'keyword'
    | 'always'
    | 'tag_applied'
    | 'stage_changed';
  triggerValue: string | null;
  nodes: FlowNode[];
}

export interface FlowPayload {
  name: string;
  triggerType: Flow['triggerType'];
  triggerValue?: string;
  nodes: Array<{
    type: 'message' | 'delay';
    config: FlowNode['config'];
    order: number;
  }>;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const EMPTY_FLOWS: Flow[] = [];

export function useFlows() {
  const { data, mutate, error } = useSWR<Flow[]>('/automation/flows', fetcher);
  return { flows: data ?? EMPTY_FLOWS, mutate, error, isLoading: !data && !error };
}

export function useFlow(id: string | null) {
  const { data, mutate, error } = useSWR<Flow>(id ? `/automation/flows/${id}` : null, fetcher);
  return { flow: data, mutate, isLoading: !data && !error };
}

export async function createFlow(payload: FlowPayload): Promise<Flow> {
  const r = await api.post('/automation/flows', payload);
  return r.data;
}

export async function updateFlow(id: string, payload: FlowPayload): Promise<Flow> {
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
