'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, ChevronDown, ChevronUp, Clock3, LoaderCircle, MessageSquareText, PencilLine, Power, Trash2 } from 'lucide-react';
import { deleteFlow, toggleFlow, type Flow } from '@/hooks/useAutomation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FlowCardProps {
  flow: Flow;
  onEdit?: () => void;
  onRefresh: () => unknown;
}

export function FlowCard({ flow, onEdit, onRefresh }: FlowCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loadingAction, setLoadingAction] = useState<'toggle' | 'delete' | null>(null);

  async function handleToggle() {
    setLoadingAction('toggle');
    try {
      await toggleFlow(flow.id);
      await onRefresh();
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleDelete() {
    setLoadingAction('delete');
    try {
      await deleteFlow(flow.id);
      await onRefresh();
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <Card className="border-border/70 bg-white/70">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">{flow.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {flow.triggerType === 'keyword'
                  ? `Disparo por palavra-chave: ${flow.triggerValue ?? 'não definida'}`
                  : flow.triggerType === 'new_conversation'
                    ? 'Disparo em nova conversa'
                    : 'Disparo em toda mensagem'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={flow.isActive ? 'success' : 'muted'}>{flow.isActive ? 'Ativo' : 'Pausado'}</Badge>
            <Badge variant="outline">{flow.nodes.length} etapa(s)</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleToggle} disabled={loadingAction !== null}>
            {loadingAction === 'toggle' ? <LoaderCircle className="size-4 animate-spin" /> : <Power className="size-4" />}
            {flow.isActive ? 'Pausar' : 'Ativar'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/automation/${flow.id}`}>
              <PencilLine className="size-4" />
              Editar
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => setExpanded((current) => !current)}>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {expanded ? 'Ocultar' : 'Ver etapas'}
          </Button>
          <Button variant="ghost" onClick={() => void handleDelete()} disabled={loadingAction !== null}>
            {loadingAction === 'delete' ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded ? (
        <CardContent className="space-y-3">
          {flow.nodes.map((node, index) => (
            <div key={node.id} className="rounded-2xl border border-border/70 bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={node.type === 'delay' ? 'outline' : 'success'}>
                  {node.type === 'delay' ? 'Delay' : 'Mensagem'}
                </Badge>
                <span className="text-sm font-medium text-foreground">Etapa {index + 1}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                {node.type === 'delay' ? <Clock3 className="mt-0.5 size-4 text-sky-600" /> : <MessageSquareText className="mt-0.5 size-4 text-emerald-600" />}
                <p>
                  {node.type === 'delay'
                    ? `${Math.round((node.config.ms ?? 0) / 1000)} segundos`
                    : (node.config.content ?? 'Mensagem sem conteúdo')}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
