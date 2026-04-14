import useSWR from 'swr';
import { api } from '@/lib/api';

export type FlowNodeType =
  | 'message'
  | 'finalize'
  | 'condition'
  | 'delay'
  | 'wait_for_reply'
  | 'branch'
  | 'tag_contact'
  | 'move_stage'
  | 'assign_to'
  | 'send_template'
  | 'send_interactive'
  | 'webhook_call';

export interface FlowNode {
  id: string;
  flowId: string;
  type: FlowNodeType;
  config: Record<string, unknown>;
  order: number;
  nextId: string | null;
}

export interface FlowEdge {
  id: string;
  flowId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
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
    | 'stage_changed'
    | 'button_reply';
  triggerValue: string | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNodeDraft {
  clientId: string;
  type: FlowNodeType;
  config: Record<string, unknown>;
  order: number;
}

export interface FlowEdgeDraft {
  fromClientId: string;
  toClientId: string;
  label?: string;
}

export interface FlowPayload {
  name: string;
  triggerType: Flow['triggerType'];
  triggerValue?: string;
  nodes: Array<{
    clientId?: string;
    type: FlowNodeType;
    config: Record<string, unknown>;
    order: number;
  }>;
  edges?: FlowEdgeDraft[];
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

export function sortFlowNodesFromTrigger(flow: Pick<Flow, 'nodes' | 'edges'>): FlowNode[] {
  if (flow.nodes.length <= 1 || flow.edges.length === 0) {
    return [...flow.nodes].sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id.localeCompare(b.id);
    });
  }

  const nodeById = new Map(flow.nodes.map((node) => [node.id, node]));
  const incomingCount = new Map(flow.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, FlowEdge[]>();

  flow.edges.forEach((edge) => {
    incomingCount.set(edge.toNodeId, (incomingCount.get(edge.toNodeId) ?? 0) + 1);
    const current = outgoing.get(edge.fromNodeId) ?? [];
    current.push(edge);
    outgoing.set(edge.fromNodeId, current);
  });

  const compareNodeIds = (leftId: string, rightId: string) => {
    const left = nodeById.get(leftId);
    const right = nodeById.get(rightId);
    if (!left || !right) return leftId.localeCompare(rightId);
    if (left.order !== right.order) return left.order - right.order;
    return left.id.localeCompare(right.id);
  };

  const roots = flow.nodes
    .filter((node) => (incomingCount.get(node.id) ?? 0) === 0)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id.localeCompare(b.id);
    });

  const visited = new Set<string>();
  const ordered: FlowNode[] = [];

  const visit = (nodeId: string) => {
    if (visited.has(nodeId)) return;
    const node = nodeById.get(nodeId);
    if (!node) return;

    visited.add(nodeId);
    ordered.push(node);

    const nextEdges = [...(outgoing.get(nodeId) ?? [])].sort((a, b) => {
      const labelCompare = (a.label ?? '').localeCompare(b.label ?? '');
      if (labelCompare !== 0) return labelCompare;
      return compareNodeIds(a.toNodeId, b.toNodeId);
    });

    nextEdges.forEach((edge) => visit(edge.toNodeId));
  };

  roots.forEach((root) => visit(root.id));

  flow.nodes
    .slice()
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.id.localeCompare(b.id);
    })
    .forEach((node) => visit(node.id));

  return ordered;
}
