import type { CanvasEdgeDraft } from './flow-canvas';
import type { NodeDraft } from './flow-node-editor';

export interface TestRunPlan {
  steps: string[];
  deadEnds: string[];
  orphans: string[];
  rootId: string | null;
}

function labelPriority(label?: string): number {
  if (!label) return 100;
  if (label === 'yes') return 0;
  if (label === 'no') return 1;
  const match = /^reply:(\d+)$/.exec(label);
  if (match) return 10 + Number(match[1]);
  return 50;
}

export function planTestRun(
  nodes: NodeDraft[],
  edges: CanvasEdgeDraft[],
): TestRunPlan {
  if (nodes.length === 0) {
    return { steps: [], deadEnds: [], orphans: [], rootId: null };
  }

  const nodeById = new Map(nodes.map((node) => [node.clientId, node]));
  const outgoing = new Map<string, CanvasEdgeDraft[]>();
  const incoming = new Map<string, number>();

  nodes.forEach((node) => {
    outgoing.set(node.clientId, []);
    incoming.set(node.clientId, 0);
  });
  edges.forEach((edge) => {
    outgoing.get(edge.fromClientId)?.push(edge);
    incoming.set(edge.toClientId, (incoming.get(edge.toClientId) ?? 0) + 1);
  });
  outgoing.forEach((list) => {
    list.sort((a, b) => labelPriority(a.label) - labelPriority(b.label));
  });

  const sorted = [...nodes].sort((a, b) => a.order - b.order);
  const root =
    sorted.find((node) => (incoming.get(node.clientId) ?? 0) === 0) ?? sorted[0];
  const rootId = root?.clientId ?? null;

  const steps: string[] = [];
  const deadEnds: string[] = [];
  const visited = new Set<string>();

  function walk(clientId: string) {
    if (visited.has(clientId)) return;
    visited.add(clientId);

    const node = nodeById.get(clientId);
    if (!node) return;

    steps.push(clientId);

    const out = outgoing.get(clientId) ?? [];
    if (out.length === 0 && node.type !== 'finalize') {
      deadEnds.push(clientId);
      return;
    }

    out.forEach((edge) => walk(edge.toClientId));
  }

  if (rootId) walk(rootId);

  const orphans = nodes
    .filter((node) => !visited.has(node.clientId))
    .map((node) => node.clientId);

  return { steps, deadEnds, orphans, rootId };
}
