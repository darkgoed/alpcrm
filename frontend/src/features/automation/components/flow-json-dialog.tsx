'use client';

import { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, PencilLine } from 'lucide-react';
import {
  type Flow,
  type FlowNodeType,
} from '@/hooks/useAutomation';
import type { NodeDraft } from '@/features/automation/components/flow-node-editor';
import type { CanvasEdgeDraft } from '@/features/automation/components/flow-canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface FlowJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: {
    name: string;
    triggerType: Flow['triggerType'];
    triggerValue: string;
    nodes: NodeDraft[];
    edges: CanvasEdgeDraft[];
  };
  onApply: (next: {
    name: string;
    triggerType: Flow['triggerType'];
    triggerValue: string;
    nodes: NodeDraft[];
    edges: CanvasEdgeDraft[];
  }) => void;
}

const FLOW_NODE_TYPES = new Set<FlowNodeType>([
  'message',
  'finalize',
  'condition',
  'delay',
  'wait_for_reply',
  'branch',
  'tag_contact',
  'move_stage',
  'assign_to',
  'send_template',
  'send_interactive',
  'webhook_call',
]);

const FLOW_TRIGGER_TYPES = new Set<Flow['triggerType']>([
  'new_conversation',
  'keyword',
  'always',
  'tag_applied',
  'stage_changed',
  'button_reply',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createNodeId(index: number) {
  return `json-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function toJsonString(value: FlowJsonDialogProps['value']) {
  return JSON.stringify(
    {
      name: value.name,
      triggerType: value.triggerType,
      triggerValue: value.triggerValue || '',
      nodes: value.nodes.map((node) => ({
        clientId: node.clientId,
        type: node.type,
        config: node.config,
        order: node.order,
        positionX: node.positionX,
        positionY: node.positionY,
      })),
      edges: value.edges.map((edge) => ({
        fromClientId: edge.fromClientId,
        toClientId: edge.toClientId,
        label: edge.label ?? '',
      })),
    },
    null,
    2,
  );
}

function parseFlowJson(
  raw: string,
  current: FlowJsonDialogProps['value'],
): FlowJsonDialogProps['value'] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('JSON inválido.');
  }

  if (!isRecord(parsed)) {
    throw new Error('Use um objeto JSON com name, triggerType, nodes e edges.');
  }

  const triggerType =
    typeof parsed.triggerType === 'string' && FLOW_TRIGGER_TYPES.has(parsed.triggerType as Flow['triggerType'])
      ? (parsed.triggerType as Flow['triggerType'])
      : current.triggerType;

  const name = typeof parsed.name === 'string' ? parsed.name : current.name;
  const triggerValue =
    typeof parsed.triggerValue === 'string'
      ? parsed.triggerValue
      : parsed.triggerValue == null
        ? ''
        : current.triggerValue;

  const rawNodes = parsed.nodes;
  if (!Array.isArray(rawNodes)) {
    throw new Error('`nodes` deve ser um array.');
  }

  const nodes = rawNodes.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Nó ${index + 1} inválido.`);
    }

    const type = entry.type;
    if (typeof type !== 'string' || !FLOW_NODE_TYPES.has(type as FlowNodeType)) {
      throw new Error(`Nó ${index + 1} com tipo inválido.`);
    }

    const config = isRecord(entry.config) ? entry.config : {};
    const rawClientId = typeof entry.clientId === 'string'
      ? entry.clientId
      : typeof entry.id === 'string'
        ? entry.id
        : '';

    return {
      clientId: rawClientId || createNodeId(index),
      type: type as FlowNodeType,
      config,
      order: typeof entry.order === 'number' && Number.isFinite(entry.order) ? entry.order : index,
      positionX: typeof entry.positionX === 'number' && Number.isFinite(entry.positionX) ? entry.positionX : undefined,
      positionY: typeof entry.positionY === 'number' && Number.isFinite(entry.positionY) ? entry.positionY : undefined,
    } satisfies NodeDraft;
  });

  const nodeIds = new Set(nodes.map((node) => node.clientId));
  const rawEdges = parsed.edges;
  if (rawEdges != null && !Array.isArray(rawEdges)) {
    throw new Error('`edges` deve ser um array.');
  }

  const edges = (rawEdges ?? []).map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Aresta ${index + 1} inválida.`);
    }

    const fromClientId =
      typeof entry.fromClientId === 'string'
        ? entry.fromClientId
        : typeof entry.fromNodeId === 'string'
          ? entry.fromNodeId
          : '';
    const toClientId =
      typeof entry.toClientId === 'string'
        ? entry.toClientId
        : typeof entry.toNodeId === 'string'
          ? entry.toNodeId
          : '';

    if (!fromClientId || !toClientId) {
      throw new Error(`Aresta ${index + 1} deve ter origem e destino.`);
    }

    if (!nodeIds.has(fromClientId) || !nodeIds.has(toClientId)) {
      throw new Error(`Aresta ${index + 1} aponta para um nó inexistente.`);
    }

    return {
      fromClientId,
      toClientId,
      label: typeof entry.label === 'string' && entry.label.trim() ? entry.label : undefined,
    } satisfies CanvasEdgeDraft;
  });

  return {
    name,
    triggerType,
    triggerValue,
    nodes: [...nodes].sort((left, right) => left.order - right.order),
    edges,
  };
}

export function FlowJsonDialog({ open, onOpenChange, value, onApply }: FlowJsonDialogProps) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const serializedValue = useMemo(() => toJsonString(value), [value]);

  useEffect(() => {
    if (!open) return;
    setRaw(serializedValue);
    setError(null);
  }, [open, serializedValue]);

  function handleApply() {
    setApplying(true);
    try {
      const next = parseFlowJson(raw, value);
      onApply(next);
      onOpenChange(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aplicar o JSON.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="size-4 text-primary" />
            Editar flow via JSON
          </DialogTitle>
          <DialogDescription>
            Cole a estrutura do flow e aplique no canvas imediatamente. O save continua separado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Textarea
            value={raw}
            onChange={(event) => {
              setRaw(event.target.value);
              if (error) setError(null);
            }}
            className="min-h-[460px] resize-y font-mono text-xs"
            placeholder='{"name":"Boas-vindas","triggerType":"new_conversation","nodes":[],"edges":[]}'
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={applying}>
            {applying ? <LoaderCircle className="size-4 animate-spin" /> : <PencilLine className="size-4" />}
            Aplicar no canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
