'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  type NodeProps,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { Bot, Clock3, GitBranch, MessageSquarePlus, Power, Tag, Webhook, Workflow, Send } from 'lucide-react';
import { type FlowNodeType } from '@/hooks/useAutomation';
import { type NodeDraft } from './flow-node-editor';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CanvasEdgeDraft = {
  fromClientId: string;
  toClientId: string;
  label?: string;
};

interface FlowCanvasProps {
  nodes: NodeDraft[];
  edges: CanvasEdgeDraft[];
  triggerType: string;
  triggerValue: string;
  selectedClientId: string | null;
  onNodeSelect: (clientId: string | null) => void;
  onNodesChange: (nodes: NodeDraft[]) => void;
  onEdgesChange: (edges: CanvasEdgeDraft[]) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const NODE_W = 280;
const NODE_H = 108;
const TRIGGER_H = 72;

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
} & Record<string, unknown>;

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
      .slice(0, 6);
  }

  const buttons = (node.config.buttons as Array<{ title?: string; id?: string }>) ?? [];
  return buttons
    .map((button, index) => ({
      id: `reply:${index}`,
      label: String(button.title ?? button.id ?? '').trim(),
    }))
    .filter((button) => button.label)
    .slice(0, 6);
}

function FlowNode({ data, selected }: NodeProps & { data: FlowNodeData }) {
  const colorClass = TYPE_COLOR[data.type] ?? TYPE_COLOR.message;
  const Icon = TYPE_ICON[data.type] ?? MessageSquarePlus;
  const isBranch = BRANCH_TYPES.includes(data.type);
  const incomingLabels = (data.incomingLabels ?? []).filter(Boolean);
  const interactiveReplies = interactiveReplyPreview(data);
  const replyHandles = interactiveReplyHandles(data);

  return (
    <div
      className={cn(
        'flex w-[280px] cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 shadow-sm transition-all hover:shadow-md',
        colorClass,
        selected && 'ring-2 ring-primary ring-offset-2',
      )}
    >
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
          <span className="text-[10px] opacity-60">#{data.order + 1}</span>
        </div>
        <p className="mt-1 truncate text-xs opacity-80">{nodePreview(data)}</p>
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

// ─── Dagre layout ──────────────────────────────────────────────────────────────

function getLayoutedElements(rfNodes: Node[], rfEdges: Edge[]) {
  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 70 });

  rfNodes.forEach((n) =>
    g.setNode(n.id, { width: NODE_W, height: n.type === 'triggerNode' ? TRIGGER_H : NODE_H }),
  );
  rfEdges.forEach((e) => g.setEdge(e.source, e.target));

  Dagre.layout(g);

  return rfNodes.map((n) => {
    const pos = g.node(n.id);
    const h = n.type === 'triggerNode' ? TRIGGER_H : NODE_H;
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - h / 2 } };
  });
}

// ─── Conversion helpers ────────────────────────────────────────────────────────

function toRFNodes(
  nodes: NodeDraft[],
  edges: CanvasEdgeDraft[],
  triggerType: string,
  triggerValue: string,
  selectedClientId: string | null,
): Node[] {
  const trigger: Node = {
    id: '__trigger__',
    type: 'triggerNode',
    position: { x: 0, y: 0 },
    data: { triggerType, triggerValue } as TriggerNodeData,
    deletable: false,
    selectable: false,
  };

  const flowNodes: Node[] = nodes.map((n) => ({
    id: n.clientId,
    type: 'flowNode',
    position: { x: 0, y: 0 },
    data: { ...n, selected: n.clientId === selectedClientId } as FlowNodeData,
    selected: n.clientId === selectedClientId,
  }));

  return [trigger, ...flowNodes];
}

function toRFEdges(nodes: NodeDraft[], edges: CanvasEdgeDraft[]): Edge[] {
  const nodeMap = new Map(nodes.map((node) => [node.clientId, node]));
  const rfEdges: Edge[] = edges.map((e) => ({
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

  // If no edges saved yet, create linear chain from order
  if (rfEdges.length === 0 && nodes.length > 0) {
    // trigger → first node
    rfEdges.push({
      id: `__trigger__→${nodes[0].clientId}`,
      source: '__trigger__',
      target: nodes[0].clientId,
      sourceHandle: 'out',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#6b7280', strokeDasharray: '5 3' },
    });
    // node → node
    for (let i = 0; i < nodes.length - 1; i++) {
      rfEdges.push({
        id: `${nodes[i].clientId}→${nodes[i + 1].clientId}`,
        source: nodes[i].clientId,
        target: nodes[i + 1].clientId,
        sourceHandle: 'out',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#6b7280', strokeDasharray: '5 3' },
      });
    }
  } else if (rfEdges.length > 0 && nodes.length > 0) {
    // Always ensure trigger connects to the first node that has no incoming edge
    const hasIncoming = new Set(rfEdges.map((e) => e.target));
    const firstWithoutIncoming = nodes.find((n) => !hasIncoming.has(n.clientId));
    if (firstWithoutIncoming) {
      rfEdges.unshift({
        id: `__trigger__→${firstWithoutIncoming.clientId}`,
        source: '__trigger__',
        target: firstWithoutIncoming.clientId,
        sourceHandle: 'out',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#6b7280', strokeDasharray: '5 3' },
      });
    }
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

// ─── Main canvas ───────────────────────────────────────────────────────────────

function FlowCanvasInner({
  nodes: nodeDrafts,
  edges: savedEdges,
  triggerType,
  triggerValue,
  selectedClientId,
  onNodeSelect,
  onNodesChange,
  onEdgesChange,
}: FlowCanvasProps) {
  const initialized = useRef(false);

  const initialRFNodes = useMemo(
    () => toRFNodes(nodeDrafts, savedEdges, triggerType, triggerValue, selectedClientId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const initialRFEdges = useMemo(
    () => toRFEdges(nodeDrafts, savedEdges),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const layouted = useMemo(() => {
    const ln = getLayoutedElements(initialRFNodes, initialRFEdges);
    return { nodes: ln, edges: initialRFEdges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [rfNodes, setRFNodes, onRFNodesChange] = useNodesState(layouted.nodes);
  const [rfEdges, setRFEdges, onRFEdgesChange] = useEdgesState(layouted.edges);
  const lastSyncedEdgesRef = useRef(serializeEdgeSnapshot(layouted.edges));

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
          ? {
              ...node,
              data: {
                ...(nodeDraftMap.get(node.id) ?? node.data),
                selected: node.id === selectedClientId,
                incomingLabels: (node.data as FlowNodeData).incomingLabels ?? [],
              } as FlowNodeData,
              selected: node.id === selectedClientId,
            }
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
              position: { x: 100, y: lastY + 120 },
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

  // Keep canvas edges aligned with the persisted draft state after save/reload.
  useEffect(() => {
    const nextEdges = toRFEdges(nodeDrafts, savedEdges);
    const nextSnapshot = serializeEdgeSnapshot(nextEdges);
    const currentSnapshot = serializeEdgeSnapshot(rfEdges);

    if (nextSnapshot === currentSnapshot || nextSnapshot === lastSyncedEdgesRef.current) return;

    lastSyncedEdgesRef.current = nextSnapshot;
    setRFEdges(nextEdges);
  }, [nodeDrafts, rfEdges, savedEdges, setRFEdges]);

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

  const onConnect = useCallback(
    (params: Connection) => {
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

      setRFEdges((eds) =>
        addEdge(
          {
            ...params,
            label,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6b7280' },
            labelStyle: { fontSize: 10, fill: '#6b7280' },
            labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
          },
          eds,
        ),
      );
    },
    [rfNodes, setRFEdges],
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

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      onNodesChange={onRFNodesChange}
      onEdgesChange={onRFEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      deleteKeyCode={null}
      className="bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] bg-[length:24px_24px]"
    >
      <Background gap={24} size={1} color="#e2e8f0" />
      <Controls />
      <MiniMap nodeStrokeWidth={3} zoomable pannable />
      <Panel position="bottom-center">
        <p className="rounded-full border border-border/50 bg-white/80 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur">
          Clique num nó para editar · Arraste handles para conectar · Shift+clique para selecionar múltiplos
        </p>
      </Panel>
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
