'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, ChevronDown, ChevronUp, Copy, LoaderCircle, PencilLine, Power, Trash2 } from 'lucide-react';
import {
  createFlow,
  deleteFlow,
  sortFlowNodesFromTrigger,
  toggleFlow,
  type Flow,
} from '@/hooks/useAutomation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  FLOW_TRIGGER_LABELS,
  describeFlowNode,
  getFlowNodeSummary,
} from './flow-node-summary';

interface FlowCardProps {
  flow: Flow;
  onRefresh: () => unknown;
}

type ActionKey = 'toggle' | 'delete' | 'duplicate';

export function FlowCard({ flow, onRefresh }: FlowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingAction, setLoadingAction] = useState<ActionKey | null>(null);
  const orderedNodes = sortFlowNodesFromTrigger(flow);

  const triggerDescription =
    flow.triggerType === 'keyword'
      ? `Palavra-chave: ${flow.triggerValue?.trim() || 'não definida'}`
      : flow.triggerType === 'button_reply'
        ? `Botão: ${flow.triggerValue?.trim() || 'payload não definido'}`
        : flow.triggerType === 'tag_applied'
          ? 'Quando tag é aplicada'
          : flow.triggerType === 'stage_changed'
            ? 'Quando muda de stage'
            : FLOW_TRIGGER_LABELS[flow.triggerType];

  async function run(action: ActionKey, fn: () => Promise<unknown>) {
    setLoadingAction(action);
    try {
      await fn();
      await onRefresh();
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDuplicate() {
    await createFlow({
      name: `${flow.name} (cópia)`,
      triggerType: flow.triggerType,
      triggerValue: flow.triggerValue ?? undefined,
      viewportX: flow.viewportX ?? 0,
      viewportY: flow.viewportY ?? 0,
      viewportZoom: flow.viewportZoom ?? 1,
      nodes: flow.nodes.map((n, i) => ({
        clientId: n.id,
        type: n.type,
        config: n.config,
        order: n.order ?? i,
        positionX: n.positionX ?? undefined,
        positionY: n.positionY ?? undefined,
      })),
      edges: flow.edges.map((e) => ({
        fromClientId: e.fromNodeId,
        toClientId: e.toNodeId,
        label: e.label ?? undefined,
      })),
    });
  }

  const disabled = loadingAction !== null;
  const typeCounts = orderedNodes.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card className={cn('border-border/70 bg-white/70 transition-colors', !flow.isActive && 'opacity-85')}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-2xl',
              flow.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              <Bot className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{flow.name}</CardTitle>
              <p className="truncate text-sm text-muted-foreground">{triggerDescription}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={flow.isActive ? 'success' : 'muted'}>{flow.isActive ? 'Ativo' : 'Pausado'}</Badge>
            <Badge variant="outline">{flow.nodes.length} etapa{flow.nodes.length === 1 ? '' : 's'}</Badge>
            {Object.entries(typeCounts).slice(0, 3).map(([type, count]) => {
              const s = getFlowNodeSummary(type as Flow['nodes'][number]['type']);
              const Icon = s.icon;
              return (
                <Badge key={type} variant="outline" className="gap-1">
                  <Icon className={cn('size-3', s.iconClassName)} />
                  {count}× {s.label}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void run('toggle', () => toggleFlow(flow.id))} disabled={disabled}>
            {loadingAction === 'toggle' ? <LoaderCircle className="size-4 animate-spin" /> : <Power className="size-4" />}
            {flow.isActive ? 'Pausar' : 'Ativar'}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/automation/${flow.id}`}>
              <PencilLine className="size-4" />
              Editar
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void run('duplicate', handleDuplicate)} disabled={disabled} title="Duplicar flow">
            {loadingAction === 'duplicate' ? <LoaderCircle className="size-4 animate-spin" /> : <Copy className="size-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)} disabled={flow.nodes.length === 0}>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {expanded ? 'Ocultar' : 'Ver etapas'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void run('delete', () => deleteFlow(flow.id))}
            disabled={disabled}
            className="text-destructive hover:text-destructive"
            title="Excluir flow"
          >
            {loadingAction === 'delete' ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && orderedNodes.length > 0 && (
        <CardContent className="space-y-2">
          {orderedNodes.map((node, index) => {
            const summary = getFlowNodeSummary(node.type);
            const Icon = summary.icon;
            return (
              <div
                key={node.id}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/70 p-3"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </div>
                <Icon className={cn('mt-0.5 size-4 shrink-0', summary.iconClassName)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{summary.label}</span>
                    <Badge variant={summary.badgeVariant} className="text-[10px]">
                      {index === 0 ? 'Início' : `#${index + 1}`}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {describeFlowNode(node.type, node.config)}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
