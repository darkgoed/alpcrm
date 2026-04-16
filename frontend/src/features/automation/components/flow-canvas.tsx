'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  MarkerType,
  Panel,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { AlertTriangle, Bot, Check, Clock3, GhostIcon, GitBranch, MessageSquarePlus, Power, Tag, Webhook, Workflow, Send } from 'lucide-react';
import { type FlowNodeType } from '@/hooks/useAutomation';
import { type NodeDraft } from './flow-node-editor';
import { FlowCanvasControls, MINIMAP_NODE_COLOR } from './flow-canvas-controls';
import { cn } from '@/lib/utils';

// ─── Test run types ────────────────────────────────────────────────────────────

export type NodeRunStatus = 'idle' | 'pending' | 'running' | 'completed' | 'dead_end' | 'orphan';

export interface FlowCanvasRunState {
  active: boolean;
  runningNodeId: string | null;
  completedIds: string[];
  deadEnds: string[];
  orphans: string[];
  stepIndex: number;
  totalSteps: number;
  status: 'running' | 'done';
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CanvasEdgeDraft = {
  fromClientId: string;
  toClientId: string;
  label?: string;
};

interface FlowCanvasProps {
  nodes: NodeDraft[];
  edges: CanvasEdgeDraft[];
  syncKey: number;
  triggerType: string;
  triggerValue: string;
  viewport?: Viewport;
  selectedClientId: string | null;
  nodeErrors?: Record<string, string>; // clientId → error message
  runState?: FlowCanvasRunState;
  onNodeSelect: (clientId: string | null) => void;
  onNodesChange: (nodes: NodeDraft[]) => void;
  onEdgesChange: (edges: CanvasEdgeDraft[]) => void;
  onViewportChange?: (viewport: Viewport) => void;
}

function resolveRunStatus(clientId: string, runState?: FlowCanvasRunState): NodeRunStatus {
  if (!runState?.active) return 'idle';
  if (runState.runningNodeId === clientId) return 'running';
  if (runState.completedIds.includes(clientId)) return 'completed';
  if (runState.deadEnds.includes(clientId)) return 'dead_end';
  if (runState.orphans.includes(clientId)) return 'orphan';
  return 'pending';
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const NODE_W = 280;
const NODE_H = 108;
const TRIGGER_H = 72;
const MAX_INTERACTIVE_LIST_OUTPUTS = 10;
const COMPONENT_GAP_X = 180;

const TYPE_COLOR: Record<FlowNodeType | 'trigger', string> = {
  trigger: 'border-primary/40 bg-primary/5 text-primary',
  message: 'border-primary/40 bg-primary/5 text-primary',
  finalize: 'border-rose-300 bg-rose-50 text-rose-700',
  delay: 'border-amber-300 bg-amber-50 text-amber-700',
  wait_for_reply: 'border-blue-300 bg-blue-50 text-blue-700',
  condition: 'border-violet-300 bg-violet-50 text-violet-700',
  branch: 'border-violet-300 bg-violet-50 text-violet-700',
  tag_contact: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  move_stage: 'border-sky-300 bg-sky-50 text-sky-700',
  assign_to: 'border-pink-300 bg-pink-50 text-pink-700',
  send_template: 'border-orange-300 bg-orange-50 text-orange-700',
  send_interactive: 'border-teal-300 bg-teal-50 text-teal-700',
  webhook_call: 'border-zinc-300 bg-zinc-50 text-zinc-700',
};

const TYPE_LABEL: Record<FlowNodeType, string> = {
  message: 'Mensagem',
  finalize: 'Finalizar',
  delay: 'Delay',
  wait_for_reply: 'Aguardar resposta',
  condition: 'Condição',
  branch: 'Branch',
  tag_contact: 'Tag no contato',
  move_stage: 'Mover stage',
  assign_to: 'Atribuir',
  send_template: 'Template',
  send_interactive: 'Interativa',
  webhook_call: 'Webhook',
};

const TYPE_ICON: Record<FlowNodeType | 'trigger', React.ComponentType<{ className?: string }>> = {
  trigger: Bot,
  message: MessageSquarePlus,
  finalize: Power,
  delay: Clock3,
  wait_for_reply: MessageSquarePlus,
  condition: GitBranch,
  branch: GitBranch,
  tag_contact: Tag,
  move_stage: Workflow,
  assign_to: Bot,
  send_template: Workflow,
  send_interactive: Send,
  webhook_call: Webhook,
};

function nodePreview(node: NodeDraft): string {
  const c = node.config;
  switch (node.type) {
    case 'message': {
      const hasImage = Boolean(String(c.imageUrl || '').trim());
      const text = String(c.content || '').trim();
      if (hasImage && text) return `Imagem + ${text.slice(0, 38)}`;
      if (hasImage) return 'Imagem';
      return String(c.content || 'Mensagem vazia').slice(0, 50);
    }
    case 'finalize': return 'Encerrar flow';
    case 'delay': return `Aguardar ${Math.round((Number(c.ms) || 0) / 1000)}s`;
    case 'wait_for_reply': return `Esperar → {{${String(c.variableName || 'reply')}}}`;
    case 'condition':
    case 'branch': return `Se {{${String(c.field || '?')}}} ${String(c.operator || 'eq')} "${String(c.value || '')}"`;
    case 'tag_contact': return `${c.action === 'remove' ? 'Remover' : 'Adicionar'} tag`;
    case 'move_stage': return 'Mover para stage';
    case 'assign_to': return 'Atribuir conversa';
    case 'send_template': return `Template: ${String(c.templateName || '?')}`;
    case 'send_interactive': return `${String(c.interactiveType || 'button')} — ${String(c.body || '').slice(0, 40)}`;
    case 'webhook_call': return `${String(c.method || 'POST')} ${String(c.url || '').slice(0, 40)}`;
    default: return node.type;
  }
}

// ─── Custom node ───────────────────────────────────────────────────────────────

const BRANCH_TYPES: FlowNodeType[] = ['branch', 'condition'];

type FlowNodeData = NodeDraft & {
  selected: boolean;
  incomingLabels?: string[];
  errorMessage?: string;
  runStatus?: NodeRunStatus;
  runStepNumber?: number;
} & Record<string, unknown>;

type RemovableEdgeData = {
  onRemove?: (edgeId: string) => void;
};

function interactiveReplyPreview(node: FlowNodeData): string[] {
  if (node.type !== 'send_interactive') return [];

  if (String(node.config.interactiveType ?? 'button') === 'list') {
    const sections = (node.config.sections as Array<{ rows?: Array<{ title?: string }> }>) ?? [];
    return sections
      .flatMap((section) => section.rows ?? [])
      .map((row) => String(row.title ?? '').trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  const buttons = (node.config.buttons as Array<{ title?: string; id?: string }>) ?? [];
  return buttons
    .map((button) => String(button.title ?? button.id ?? '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function interactiveReplyHandles(node: FlowNodeData): Array<{ id: string; label: string }> {
  if (node.type !== 'send_interactive') return [];

  if (String(node.config.interactiveType ?? 'button') === 'list') {
    const sections = (node.config.sections as Array<{ rows?: Array<{ title?: string }> }>) ?? [];
    return sections
      .flatMap((section) => section.rows ?? [])
      .map((row, index) => ({
        id: `reply:${index}`,
        label: String(row.title ?? '').trim(),
      }))
      .filter((row) => row.label)
      .slice(0, MAX_INTERACTIVE_LIST_OUTPUTS);
  }

  const buttons = (node.config.buttons as Array<{ title?: string; id?: string }>) ?? [];
  return buttons
    .map((button, index) => ({
      id: `reply:${index}`,
      label: String(button.title ?? button.id ?? '').trim(),
    }))
    .filter((button) => button.label)
    .slice(0, 3);
}

function FlowNode({ data, selected }: NodeProps & { data: FlowNodeData }) {
  const colorClass = TYPE_COLOR[data.type] ?? TYPE_COLOR.message;
  const Icon = TYPE_ICON[data.type] ?? MessageSquarePlus;
  const isBranch = BRANCH_TYPES.includes(data.type);
  const incomingLabels = (data.incomingLabels ?? []).filter(Boolean);
  const interactiveReplies = interactiveReplyPreview(data);
  const replyHandles = interactiveReplyHandles(data);
  const hasError = Boolean(data.errorMessage);
  const runStatus = data.runStatus ?? 'idle';

  return (
    <div
      className={cn(
        'relative flex w-[280px] cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 shadow-sm transition-all hover:shadow-md',
        colorClass,
        selected && 'ring-2 ring-primary ring-offset-2',
        hasError && 'ring-2 ring-destructive ring-offset-2',
        runStatus === 'pending' && 'opacity-60',
        runStatus === 'running' && 'ring-4 ring-primary/70 ring-offset-2 shadow-lg shadow-primary/30 animate-pulse',
        runStatus === 'completed' && 'ring-2 ring-emerald-500 ring-offset-2',
        runStatus === 'dead_end' && 'ring-2 ring-amber-500 ring-offset-2',
        runStatus === 'orphan' && 'opacity-40 ring-2 ring-zinc-400 ring-offset-1 grayscale',
      )}
    >
      {runStatus === 'running' && typeof data.runStepNumber === 'number' ? (
        <span className="absolute -left-3 -top-3 flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white shadow">
          {data.runStepNumber}
        </span>
      ) : null}
      {runStatus === 'completed' ? (
        <span className="absolute -left-3 -top-3 flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      ) : null}
      {runStatus === 'dead_end' ? (
        <span className="absolute -left-3 -top-3 flex size-7 items-center justify-center rounded-full bg-amber-500 text-white shadow">
          <AlertTriangle className="size-3.5" strokeWidth={2.5} />
        </span>
      ) : null}
      {runStatus === 'orphan' ? (
        <span className="absolute -left-3 -top-3 flex size-7 items-center justify-center rounded-full bg-zinc-500 text-white shadow">
          <GhostIcon className="size-3.5" strokeWidth={2.5} />
        </span>
      ) : null}
      <Handle
        type="target"
        position={Position.Top}
        className="!size-3 !border-2 !border-white !bg-primary"
      />

      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/60">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {TYPE_LABEL[data.type]}
          </span>
        </div>
        <p className="mt-1 truncate text-xs opacity-80">{nodePreview(data)}</p>
        {hasError && (
          <p className="mt-1 truncate text-[10px] font-medium text-destructive">{data.errorMessage}</p>
        )}
        {interactiveReplies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {interactiveReplies.map((reply) => (
              <span key={reply} className="max-w-full truncate rounded-full bg-white/70 px-2 py-0.5 text-[10px]">
                {reply}
              </span>
            ))}
          </div>
        )}
        {incomingLabels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {incomingLabels.map((label) => (
              <span
                key={label}
                className="max-w-full truncate rounded-full border border-white/70 bg-white/60 px-2 py-0.5 text-[10px] font-medium"
              >
                Reply: {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {isBranch ? (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            style={{ left: '30%' }}
            className="!size-3 !border-2 !border-white !bg-emerald-500"
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            style={{ left: '70%' }}
            className="!size-3 !border-2 !border-white !bg-rose-400"
          />
        </>
      ) : replyHandles.length > 0 ? (
        <>
          {replyHandles.map((reply, index) => (
            <Handle
              key={reply.id}
              id={reply.id}
              type="source"
              position={Position.Bottom}
              style={{ left: `${((index + 1) / (replyHandles.length + 1)) * 100}%` }}
              className="!size-3 !border-2 !border-white !bg-teal-500"
            />
          ))}
        </>
      ) : (
        <Handle
          id="out"
          type="source"
          position={Position.Bottom}
          className="!size-3 !border-2 !border-white !bg-primary"
        />
      )}
    </div>
  );
}

// ─── Trigger node ──────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  new_conversation: 'Nova conversa',
  keyword: 'Palavra-chave',
  always: 'Toda mensagem',
  tag_applied: 'Tag aplicada',
  stage_changed: 'Mudança de stage',
  button_reply: 'Button reply',
};

type TriggerNodeData = { triggerType: string; triggerValue: string };

function TriggerNode({ data }: NodeProps & { data: TriggerNodeData }) {
  return (
    <div className="flex w-[280px] items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Gatilho
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          {TRIGGER_LABELS[data.triggerType] ?? data.triggerType}
          {data.triggerValue ? ` — "${data.triggerValue}"` : ''}
        </p>
      </div>
      <Handle
        id="out"
        type="source"
        position={Position.Bottom}
        className="!size-3 !border-2 !border-white !bg-primary"
      />
    </div>
  );
}

const nodeTypes = {
  flowNode: FlowNode,
  triggerNode: TriggerNode,
};

function RemovableEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
}: EdgeProps<Edge<RemovableEdgeData>>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });

  const labelText = typeof label === 'string' && label ? label : null;
  const isYes = labelText === 'yes';
  const isNo = labelText === 'no';

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {labelText && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            className={cn(
              'pointer-events-none absolute rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-sm',
              isYes && 'border-emerald-300 bg-emerald-50 text-emerald-700',
              isNo && 'border-rose-300 bg-rose-50 text-rose-700',
              !isYes && !isNo && 'border-border bg-white text-muted-foreground',
            )}
          >
            {isYes ? 'Sim' : isNo ? 'Não' : labelText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = {
  removable: RemovableEdge,
};

// ─── Dagre layout ──────────────────────────────────────────────────────────────

function getLayoutedElements(rfNodes: Node[], rfEdges: Edge[]) {
  const nodeById = new Map(rfNodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, Set<string>>();

  rfNodes.forEach((node) => {
    adjacency.set(node.id, new Set());
  });

  rfEdges.forEach((edge) => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  const orderValue = (node: Node) =>
    node.id === '__trigger__'
      ? -1
      : node.type === 'flowNode'
        ? (node.data as FlowNodeData).order
        : Number.MAX_SAFE_INTEGER;

  const sortedNodeIds = [...nodeById.keys()].sort((leftId, rightId) => {
    const left = nodeById.get(leftId);
    const right = nodeById.get(rightId);
    if (!left || !right) return leftId.localeCompare(rightId);

    const orderDiff = orderValue(left) - orderValue(right);
    if (orderDiff !== 0) return orderDiff;
    return left.id.localeCompare(right.id);
  });

  const visited = new Set<string>();
  const components: Node[][] = [];

  sortedNodeIds.forEach((nodeId) => {
    if (visited.has(nodeId)) return;

    const stack = [nodeId];
    const componentIds: string[] = [];
    visited.add(nodeId);

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (!currentId) continue;

      componentIds.push(currentId);

      [...(adjacency.get(currentId) ?? [])]
        .sort((leftId, rightId) => {
          const left = nodeById.get(leftId);
          const right = nodeById.get(rightId);
          if (!left || !right) return leftId.localeCompare(rightId);

          const orderDiff = orderValue(left) - orderValue(right);
          if (orderDiff !== 0) return orderDiff;
          return left.id.localeCompare(right.id);
        })
        .forEach((neighborId) => {
          if (visited.has(neighborId)) return;
          visited.add(neighborId);
          stack.push(neighborId);
        });
    }

    components.push(
      componentIds
        .map((componentId) => nodeById.get(componentId))
        .filter((node): node is Node => Boolean(node))
        .sort((left, right) => {
          const orderDiff = orderValue(left) - orderValue(right);
          if (orderDiff !== 0) return orderDiff;
          return left.id.localeCompare(right.id);
        }),
    );
  });

  const positionedNodes = new Map<string, Node>();
  let offsetX = 0;

  components.forEach((componentNodes) => {
    const componentNodeIds = new Set(componentNodes.map((node) => node.id));
    const componentEdges = rfEdges.filter(
      (edge) => componentNodeIds.has(edge.source) && componentNodeIds.has(edge.target),
    );
    const g = new Dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 70 });

    componentNodes.forEach((node) =>
      g.setNode(node.id, {
        width: NODE_W,
        height: node.type === 'triggerNode' ? TRIGGER_H : NODE_H,
      }),
    );
    componentEdges.forEach((edge) => g.setEdge(edge.source, edge.target));

    Dagre.layout(g);

    const layoutedComponent = componentNodes.map((node) => {
      const rawPosition = g.node(node.id) ?? {
        x: NODE_W / 2,
        y: (node.type === 'triggerNode' ? TRIGGER_H : NODE_H) / 2,
      };
      const height = node.type === 'triggerNode' ? TRIGGER_H : NODE_H;

      return {
        ...node,
        position: {
          x: rawPosition.x - NODE_W / 2,
          y: rawPosition.y - height / 2,
        },
      };
    });

    const minX = Math.min(...layoutedComponent.map((node) => node.position.x));
    const maxX = Math.max(...layoutedComponent.map((node) => node.position.x + NODE_W));

    layoutedComponent.forEach((node) => {
      positionedNodes.set(node.id, {
        ...node,
        position: {
          x: node.position.x - minX + offsetX,
          y: node.position.y,
        },
      });
    });

    offsetX += maxX - minX + COMPONENT_GAP_X;
  });

  return rfNodes.map((node) => positionedNodes.get(node.id) ?? node);
}

function sortNodeDrafts(nodes: NodeDraft[]): NodeDraft[] {
  return [...nodes].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.clientId.localeCompare(b.clientId);
  });
}

function sortCanvasEdges(edges: CanvasEdgeDraft[], nodes: NodeDraft[]): CanvasEdgeDraft[] {
  const orderById = new Map(nodes.map((node) => [node.clientId, node.order]));
  return [...edges].sort((a, b) => {
    const sourceOrder = (orderById.get(a.fromClientId) ?? Number.MAX_SAFE_INTEGER)
      - (orderById.get(b.fromClientId) ?? Number.MAX_SAFE_INTEGER);
    if (sourceOrder !== 0) return sourceOrder;

    const targetOrder = (orderById.get(a.toClientId) ?? Number.MAX_SAFE_INTEGER)
      - (orderById.get(b.toClientId) ?? Number.MAX_SAFE_INTEGER);
    if (targetOrder !== 0) return targetOrder;

    return (a.label ?? '').localeCompare(b.label ?? '');
  });
}

function resolveRootNode(nodes: NodeDraft[], edges: CanvasEdgeDraft[]): NodeDraft | null {
  if (nodes.length === 0) return null;

  const sortFn = (left: NodeDraft, right: NodeDraft) => {
    if (left.order !== right.order) return left.order - right.order;
    return left.clientId.localeCompare(right.clientId);
  };

  // When edges exist, only nodes that participate in the graph are root candidates.
  // This prevents a newly added (unconnected) node from stealing the trigger edge.
  const connectedIds = new Set<string>();
  edges.forEach((edge) => {
    connectedIds.add(edge.fromClientId);
    connectedIds.add(edge.toClientId);
  });

  const candidates = edges.length > 0
    ? nodes.filter((node) => connectedIds.has(node.clientId))
    : nodes;

  const pool = candidates.length > 0 ? candidates : nodes;

  const incomingCount = new Map(pool.map((node) => [node.clientId, 0]));
  edges.forEach((edge) => {
    if (incomingCount.has(edge.toClientId)) {
      incomingCount.set(edge.toClientId, (incomingCount.get(edge.toClientId) ?? 0) + 1);
    }
  });

  return [...pool]
    .filter((node) => (incomingCount.get(node.clientId) ?? 0) === 0)
    .sort(sortFn)[0] ?? [...pool].sort(sortFn)[0] ?? null;
}

function withDefaultEdgeProps(
  edge: Edge,
  onRemove: (edgeId: string) => void,
): Edge<RemovableEdgeData> {
  return {
    ...edge,
    type: 'removable',
    animated: false,
    style: { stroke: '#6b7280', strokeWidth: 1.5, ...(edge.style ?? {}) },
    labelStyle: { fontSize: 10, fill: '#6b7280', ...(edge.labelStyle ?? {}) },
    labelBgStyle: { fill: 'white', fillOpacity: 0.8, ...(edge.labelBgStyle ?? {}) },
    data: { ...(edge.data as RemovableEdgeData | undefined), onRemove },
  };
}

// ─── Conversion helpers ────────────────────────────────────────────────────────

function toRFNodes(
  nodes: NodeDraft[],
  edges: CanvasEdgeDraft[],
  triggerType: string,
  triggerValue: string,
  selectedClientId: string | null,
  nodeErrors?: Record<string, string>,
): Node[] {
  const sortedNodes = sortNodeDrafts(nodes);
  const trigger: Node = {
    id: '__trigger__',
    type: 'triggerNode',
    position: { x: 0, y: 0 },
    data: { triggerType, triggerValue } as TriggerNodeData,
    deletable: false,
    selectable: false,
  };

  const flowNodes: Node[] = sortedNodes.map((n) => ({
    id: n.clientId,
    type: 'flowNode',
    position: { x: n.positionX ?? 0, y: n.positionY ?? 0 },
    data: {
      ...n,
      selected: n.clientId === selectedClientId,
      errorMessage: nodeErrors?.[n.clientId],
    } as FlowNodeData,
    selected: n.clientId === selectedClientId,
  }));

  return [trigger, ...flowNodes];
}

function toRFEdges(nodes: NodeDraft[], edges: CanvasEdgeDraft[], showTriggerEdge = true): Edge[] {
  const sortedNodes = sortNodeDrafts(nodes);
  const sortedEdges = sortCanvasEdges(edges, sortedNodes);
  const nodeMap = new Map(sortedNodes.map((node) => [node.clientId, node]));
  const rootNode = resolveRootNode(sortedNodes, sortedEdges);
  const rfEdges: Edge[] = sortedEdges.map((e) => ({
    id: `${e.fromClientId}→${e.toClientId}→${e.label ?? 'out'}`,
    source: e.fromClientId,
    target: e.toClientId,
    label: e.label ?? undefined,
    sourceHandle: resolveSourceHandle(nodeMap.get(e.fromClientId), e.label),
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#6b7280' },
    labelStyle: { fontSize: 10, fill: '#6b7280' },
    labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
  }));

  if (rootNode && showTriggerEdge) {
    rfEdges.push({
      id: `__trigger__→${rootNode.clientId}`,
      source: '__trigger__',
      target: rootNode.clientId,
      sourceHandle: 'out',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#6b7280', strokeDasharray: '5 3' },
    });
  }

  return rfEdges;
}

function resolveSourceHandle(node: NodeDraft | undefined, label?: string): string {
  if (!label) return 'out';
  if (label === 'yes' || label === 'no') return label;
  if (!node || node.type !== 'send_interactive') return 'out';

  const replies = interactiveReplyHandles(node as FlowNodeData);
  return replies.find((reply) => reply.label === label)?.id ?? 'out';
}

function serializeEdgeSnapshot(edges: Array<Pick<Edge, 'source' | 'target' | 'sourceHandle' | 'label'>>) {
  return JSON.stringify(
    edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? 'out',
      label: typeof edge.label === 'string' ? edge.label : '',
    })),
  );
}

function hasSavedNodePositions(nodes: NodeDraft[]) {
  if (nodes.length === 0) return false;
  return nodes.every((node) => Number.isFinite(node.positionX) && Number.isFinite(node.positionY));
}

// ─── Main canvas ───────────────────────────────────────────────────────────────

function FlowCanvasInner({
  nodes: nodeDrafts,
  edges: savedEdges,
  syncKey,
  triggerType,
  triggerValue,
  viewport,
  selectedClientId,
  nodeErrors,
  runState,
  onNodeSelect,
  onNodesChange,
  onEdgesChange,
  onViewportChange,
}: FlowCanvasProps) {
  const reactFlow = useReactFlow();
  const initialized = useRef(false);
  const removeEdgeRef = useRef<(edgeId: string) => void>(() => {});
  const [isTriggerEdgeVisible, setIsTriggerEdgeVisible] = useState(() => savedEdges.length > 0);
  const hasPersistedPositions = useMemo(() => hasSavedNodePositions(nodeDrafts), [nodeDrafts]);

  const initialRFNodes = useMemo(
    () => toRFNodes(nodeDrafts, savedEdges, triggerType, triggerValue, selectedClientId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const initialRFEdges = useMemo(
    () => toRFEdges(nodeDrafts, savedEdges, isTriggerEdgeVisible),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const layouted = useMemo(() => {
    const ln = hasPersistedPositions ? initialRFNodes : getLayoutedElements(initialRFNodes, initialRFEdges);
    return { nodes: ln, edges: initialRFEdges };
  }, [hasPersistedPositions, initialRFEdges, initialRFNodes]);

  const [rfNodes, setRFNodes, onRFNodesChange] = useNodesState(layouted.nodes);
  const [rfEdges, setRFEdges, onRFEdgesChange] = useEdgesState(layouted.edges);
  const lastSyncedEdgesRef = useRef(serializeEdgeSnapshot(layouted.edges));
  const initialLayoutSyncRef = useRef<number | null>(null);

  const removeEdgeById = useCallback((edgeId: string) => {
    if (edgeId.startsWith('__trigger__→')) {
      setIsTriggerEdgeVisible(false);
    }
    setRFEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
  }, [setRFEdges]);

  removeEdgeRef.current = removeEdgeById;

  // Sync nodes added/removed from parent into rfNodes
  useEffect(() => {
    const draftIds = new Set(nodeDrafts.map((n) => n.clientId));
    const nodeDraftMap = new Map(nodeDrafts.map((node) => [node.clientId, node]));
    setRFNodes((cur) => {
      const curFlowIds = new Set(cur.filter((n) => n.type === 'flowNode').map((n) => n.id));
      // Remove deleted
      let next = cur.filter((n) => n.type !== 'flowNode' || draftIds.has(n.id));
      next = next.map((node) =>
        node.type === 'flowNode'
          ? (() => {
              const draftNode = nodeDraftMap.get(node.id);
              const hasDraftPosition =
                draftNode &&
                Number.isFinite(draftNode.positionX) &&
                Number.isFinite(draftNode.positionY);
              return {
                ...node,
                position: hasDraftPosition
                  ? { x: draftNode.positionX as number, y: draftNode.positionY as number }
                  : node.position,
                data: {
                  ...(draftNode ?? node.data),
                  selected: node.id === selectedClientId,
                  incomingLabels: (node.data as FlowNodeData).incomingLabels ?? [],
                } as FlowNodeData,
                selected: node.id === selectedClientId,
              };
            })()
          : node,
      );
      // Add new
      nodeDrafts
        .filter((n) => !curFlowIds.has(n.clientId))
        .forEach((n) => {
          const lastY = next.length > 0 ? Math.max(...next.map((nd) => nd.position.y)) : 0;
          next = [
            ...next,
            {
              id: n.clientId,
              type: 'flowNode',
              position: {
                x: n.positionX ?? 100,
                y: n.positionY ?? lastY + 120,
              },
              data: { ...n, selected: false } as FlowNodeData,
              selected: false,
            },
          ];
        });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeDrafts, selectedClientId]);

  // Sync selected state into rfNodes
  useEffect(() => {
    setRFNodes((nds) =>
      nds.map((n) =>
        n.type === 'flowNode'
          ? { ...n, data: { ...n.data, selected: n.id === selectedClientId }, selected: n.id === selectedClientId }
          : n,
      ),
    );
  }, [selectedClientId, setRFNodes]);

  // Sync nodeErrors into rfNodes for visual highlighting
  useEffect(() => {
    if (!nodeErrors) return;
    setRFNodes((nds) =>
      nds.map((n) =>
        n.type === 'flowNode'
          ? { ...n, data: { ...n.data, errorMessage: nodeErrors[n.id] ?? undefined } }
          : n,
      ),
    );
  }, [nodeErrors, setRFNodes]);

  // Sync test-run status into rfNodes for visual highlighting
  useEffect(() => {
    setRFNodes((nds) =>
      nds.map((n) => {
        if (n.type !== 'flowNode') return n;
        const status = resolveRunStatus(n.id, runState);
        const stepNumber = runState?.runningNodeId === n.id
          ? (runState.stepIndex ?? 0) + 1
          : undefined;
        return {
          ...n,
          data: { ...n.data, runStatus: status, runStepNumber: stepNumber } as FlowNodeData,
        };
      }),
    );
  }, [runState, setRFNodes]);

  useEffect(() => {
    const incomingLabelsByNode = new Map<string, string[]>();

    rfEdges
      .filter((edge) => edge.source !== '__trigger__')
      .forEach((edge) => {
        const label = typeof edge.label === 'string' && edge.label
          ? edge.label
          : edge.sourceHandle && edge.sourceHandle !== 'out'
            ? edge.sourceHandle
            : null;

        if (!label) return;
        const current = incomingLabelsByNode.get(edge.target) ?? [];
        if (!current.includes(label)) current.push(label);
        incomingLabelsByNode.set(edge.target, current);
      });

    setRFNodes((cur) =>
      cur.map((node) =>
        node.type === 'flowNode'
          ? {
              ...node,
              data: {
                ...node.data,
                incomingLabels: incomingLabelsByNode.get(node.id) ?? [],
              } as FlowNodeData,
            }
          : node,
      ),
    );
  }, [rfEdges, setRFNodes]);

  useEffect(() => {
    const nextEdges = toRFEdges(nodeDrafts, savedEdges, isTriggerEdgeVisible);
    const nextSnapshot = serializeEdgeSnapshot(nextEdges);
    if (nextSnapshot === lastSyncedEdgesRef.current) return;

    lastSyncedEdgesRef.current = nextSnapshot;
    setRFEdges(nextEdges);
    setRFNodes((currentNodes) => currentNodes);
  }, [nodeDrafts, savedEdges, setRFEdges, setRFNodes, isTriggerEdgeVisible]);

  useEffect(() => {
    setIsTriggerEdgeVisible(savedEdges.length > 0);
  }, [savedEdges.length, syncKey]);

  // Emit edges to parent whenever they change (skip trigger-to-first edge)
  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    const drafts: CanvasEdgeDraft[] = rfEdges
      .filter((e) => e.source !== '__trigger__')
      .map((e) => ({
        fromClientId: e.source,
        toClientId: e.target,
        label: typeof e.label === 'string' && e.label ? e.label
          : (e.sourceHandle !== 'out' && e.sourceHandle) ? e.sourceHandle
          : undefined,
      }));
    lastSyncedEdgesRef.current = serializeEdgeSnapshot(rfEdges);
    onEdgesChange(drafts);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfEdges]);

  const syncNodePositions = useCallback((nextNodes: Node[]) => {
    const positions = new Map(
      nextNodes
        .filter((node): node is Node<FlowNodeData> => node.type === 'flowNode')
        .map((node) => [node.id, node.position]),
    );

    onNodesChange(
      sortNodeDrafts(nodeDrafts).map((node) => ({
        ...node,
        positionX: positions.get(node.clientId)?.x ?? node.positionX,
        positionY: positions.get(node.clientId)?.y ?? node.positionY,
      })),
    );
  }, [nodeDrafts, onNodesChange]);

  useEffect(() => {
    initialLayoutSyncRef.current = null;
  }, [syncKey]);

  useEffect(() => {
    if (hasPersistedPositions) return;
    if (initialLayoutSyncRef.current === syncKey) return;

    initialLayoutSyncRef.current = syncKey;
    syncNodePositions(rfNodes);
  }, [hasPersistedPositions, rfNodes, syncKey, syncNodePositions]);

  const handleRFNodesChange = useCallback((changes: NodeChange<Node>[]) => {
    onRFNodesChange(changes);

    const positionChanges = new Map<string, { x: number; y: number }>();

    changes.forEach((change) => {
      if (change.type !== 'position' || !change.position) return;
      positionChanges.set(change.id, change.position);
    });

    if (positionChanges.size === 0) return;

    onNodesChange(
      sortNodeDrafts(nodeDrafts).map((node) => {
        const nextPosition = positionChanges.get(node.clientId);
        if (!nextPosition) return node;
        return {
          ...node,
          positionX: nextPosition.x,
          positionY: nextPosition.y,
        };
      }),
    );
  }, [nodeDrafts, onNodesChange, onRFNodesChange]);

  const syncViewport = useCallback(() => {
    onViewportChange?.(reactFlow.getViewport());
  }, [onViewportChange, reactFlow]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === '__trigger__' && params.target) {
        setIsTriggerEdgeVisible(true);
        const rootTargetId = params.target;
        onNodesChange(
          sortNodeDrafts(nodeDrafts)
            .sort((left, right) => {
              if (left.clientId === rootTargetId) return -1;
              if (right.clientId === rootTargetId) return 1;
              return 0;
            })
            .map((node, index) => ({
              ...node,
              order: index,
            })),
        );
        return;
      }

      let label =
        params.sourceHandle === 'yes' ? 'yes'
          : params.sourceHandle === 'no' ? 'no'
          : undefined;

      if (!label && params.source && params.sourceHandle?.startsWith('reply:')) {
        const sourceNode = rfNodes.find((node) => node.id === params.source);
        if (sourceNode?.type === 'flowNode') {
          const replies = interactiveReplyHandles(sourceNode.data as FlowNodeData);
          label = replies.find((reply) => reply.id === params.sourceHandle)?.label;
        }
      }

      setRFEdges((eds) => {
        const filtered = eds.filter((edge) => {
          if (edge.source !== params.source) return true;
          return (edge.sourceHandle ?? 'out') !== (params.sourceHandle ?? 'out');
        });

        return addEdge(
          {
            ...params,
            label,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6b7280' },
            labelStyle: { fontSize: 10, fill: '#6b7280' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
          },
          filtered,
        );
      });
    },
    [nodeDrafts, onNodesChange, rfNodes, setRFEdges],
  );

  const onEdgeDoubleClick = useCallback(
    (_: MouseEvent, edge: Edge) => {
      removeEdgeById(edge.id);
    },
    [removeEdgeById],
  );

  const displayEdges = useMemo(
    () => rfEdges.map((edge) => withDefaultEdgeProps(edge, removeEdgeRef.current)),
    [rfEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'flowNode') {
        onNodeSelect(node.id === selectedClientId ? null : node.id);
      }
    },
    [selectedClientId, onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const handleAutoOrganize = useCallback(() => {
    const layouted = getLayoutedElements(rfNodes, rfEdges);
    setRFNodes(layouted);
    syncNodePositions(layouted);
    requestAnimationFrame(() => {
      reactFlow.fitView({ padding: 0.3, duration: 400 });
    });
  }, [rfEdges, rfNodes, reactFlow, setRFNodes, syncNodePositions]);

  const handleCenter = useCallback(() => {
    reactFlow.fitView({ padding: 0.3, duration: 400 });
  }, [reactFlow]);

  useEffect(() => {
    const runningId = runState?.runningNodeId;
    if (!runningId) return;
    const target = rfNodes.find((node) => node.id === runningId);
    if (!target) return;
    reactFlow.setCenter(
      target.position.x + NODE_W / 2,
      target.position.y + NODE_H / 2,
      { zoom: 1, duration: 400 },
    );
  }, [reactFlow, rfNodes, runState?.runningNodeId]);

  const handleJumpToError = useCallback(() => {
    const firstErrorId = nodeErrors ? Object.keys(nodeErrors)[0] : undefined;
    if (!firstErrorId) return;
    const target = rfNodes.find((node) => node.id === firstErrorId);
    if (!target) return;
    reactFlow.setCenter(
      target.position.x + NODE_W / 2,
      target.position.y + NODE_H / 2,
      { zoom: 1.1, duration: 400 },
    );
    onNodeSelect(firstErrorId);
  }, [nodeErrors, onNodeSelect, reactFlow, rfNodes]);

  const minimapNodeColor = useCallback((node: Node) => {
    if (node.type === 'triggerNode') return '#3b82f6';
    const data = node.data as FlowNodeData;
    return MINIMAP_NODE_COLOR[data.type] ?? '#94a3b8';
  }, []);

  const errorCount = nodeErrors ? Object.keys(nodeErrors).length : 0;

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={displayEdges}
      onNodesChange={handleRFNodesChange}
      onEdgesChange={onRFEdgesChange}
      onConnect={onConnect}
      onEdgeDoubleClick={onEdgeDoubleClick}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onNodeDragStop={(_, node, nodes) => syncNodePositions(nodes)}
      onMoveEnd={syncViewport}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      snapToGrid
      snapGrid={[20, 20]}
      nodesDraggable
      deleteKeyCode={null}
      className="bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] bg-[length:24px_24px]"
    >
      <Background gap={24} size={1} color="#e2e8f0" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeStrokeWidth={3}
        nodeColor={minimapNodeColor}
        nodeBorderRadius={6}
        maskColor="rgba(15, 23, 42, 0.06)"
        zoomable
        pannable
      />
      <Panel position="top-right">
        <FlowCanvasControls
          errorCount={errorCount}
          onAutoOrganize={handleAutoOrganize}
          onCenter={handleCenter}
          onJumpToError={handleJumpToError}
        />
      </Panel>
      {runState?.active ? (
        <Panel position="top-left">
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
            <span
              className={cn(
                'flex size-2 rounded-full',
                runState.status === 'running' ? 'bg-primary animate-pulse' : 'bg-emerald-500',
              )}
            />
            <span className="font-medium text-foreground">
              {runState.status === 'running'
                ? `Passo ${Math.min(runState.stepIndex + 1, runState.totalSteps)} / ${runState.totalSteps}`
                : `Concluído · ${runState.totalSteps} nós`}
            </span>
            {runState.deadEnds.length > 0 ? (
              <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-700">
                <AlertTriangle className="size-3" />
                {runState.deadEnds.length} dead-end{runState.deadEnds.length > 1 ? 's' : ''}
              </span>
            ) : null}
            {runState.orphans.length > 0 ? (
              <span className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-zinc-700">
                <GhostIcon className="size-3" />
                {runState.orphans.length} isolado{runState.orphans.length > 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </ReactFlow>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
