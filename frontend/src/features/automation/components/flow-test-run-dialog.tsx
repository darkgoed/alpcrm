'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  LoaderCircle,
  Play,
  RefreshCw,
  Route,
  Send,
  SquareTerminal,
} from 'lucide-react';
import type { Flow } from '@/hooks/useAutomation';
import type { CanvasEdgeDraft } from './flow-canvas';
import type { NodeDraft } from './flow-node-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type SimulationStatus = 'idle' | 'running' | 'waiting' | 'completed' | 'error';

type TraceTone = 'default' | 'success' | 'warning' | 'danger';

interface TraceEntry {
  id: string;
  nodeId: string;
  nodeType: NodeDraft['type'];
  title: string;
  detail: string;
  tone?: TraceTone;
}

interface FlowTestRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flowName: string;
  triggerType: Flow['triggerType'];
  triggerValue: string;
  nodes: NodeDraft[];
  edges: CanvasEdgeDraft[];
  validationErrors: Record<string, string>;
}

function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return fallback;
}

function interpolate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return variables[key] ?? '';
  });
}

function evaluateCondition(
  field: string,
  operator: string,
  value: string,
  variables: Record<string, string>,
): boolean {
  const actual = variables[field] ?? '';

  switch (operator) {
    case 'eq':
      return actual === value;
    case 'neq':
      return actual !== value;
    case 'contains':
      return actual.toLowerCase().includes(value.toLowerCase());
    case 'not_contains':
      return !actual.toLowerCase().includes(value.toLowerCase());
    case 'starts_with':
      return actual.toLowerCase().startsWith(value.toLowerCase());
    case 'is_empty':
      return actual.trim() === '';
    case 'is_not_empty':
      return actual.trim() !== '';
    default:
      return false;
  }
}

function formatDelay(ms: number) {
  if (ms >= 60_000) {
    return `${Math.round(ms / 60_000)} min`;
  }

  return `${Math.round(ms / 1000)} s`;
}

const TYPE_LABELS: Record<NodeDraft['type'], string> = {
  message: 'Mensagem',
  finalize: 'Finalizar',
  delay: 'Delay',
  wait_for_reply: 'Aguardar resposta',
  condition: 'Condição',
  branch: 'Branch',
  tag_contact: 'Tag no contato',
  move_stage: 'Mover no pipeline',
  assign_to: 'Atribuir',
  send_template: 'Enviar template',
  send_interactive: 'Mensagem interativa',
  webhook_call: 'Webhook',
};

function parseVariables(raw: string): {
  variables: Record<string, string>;
  error: string | null;
} {
  if (!raw.trim()) {
    return { variables: {}, error: null };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { variables: {}, error: 'Use um objeto JSON simples.' };
    }

    const normalized = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, stringValue(value)]),
    );

    return { variables: normalized, error: null };
  } catch {
    return { variables: {}, error: 'JSON inválido para variáveis.' };
  }
}

export function FlowTestRunDialog({
  open,
  onOpenChange,
  flowName,
  triggerType,
  triggerValue,
  nodes,
  edges,
  validationErrors,
}: FlowTestRunDialogProps) {
  const [variablesInput, setVariablesInput] = useState(
    '{\n  "contactName": "Maria",\n  "reply": "Sim"\n}',
  );
  const [replyInput, setReplyInput] = useState('Sim');
  const [replyIdInput, setReplyIdInput] = useState('btn_sim');
  const [replyTitleInput, setReplyTitleInput] = useState('Sim');
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [waitingNodeId, setWaitingNodeId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const parsedVariables = useMemo(
    () => parseVariables(variablesInput),
    [variablesInput],
  );

  const graph = useMemo(() => {
    const nodeById = new Map(nodes.map((node) => [node.clientId, node]));
    const outgoing = new Map<string, CanvasEdgeDraft[]>();
    const incoming = new Map<string, number>(nodes.map((node) => [node.clientId, 0]));

    edges.forEach((edge) => {
      const current = outgoing.get(edge.fromClientId) ?? [];
      current.push(edge);
      outgoing.set(edge.fromClientId, current);
      incoming.set(edge.toClientId, (incoming.get(edge.toClientId) ?? 0) + 1);
    });

    const roots = nodes
      .filter((node) => (incoming.get(node.clientId) ?? 0) === 0)
      .sort((left, right) => left.order - right.order);

    return { nodeById, outgoing, roots };
  }, [edges, nodes]);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setTrace([]);
      setVariables({});
      setCurrentNodeId(null);
      setWaitingNodeId(null);
      setRunError(null);
    }
  }, [open]);

  function pushTrace(
    entry: Omit<TraceEntry, 'id'>,
    nextTrace?: TraceEntry[],
  ): TraceEntry[] {
    const built: TraceEntry = {
      ...entry,
      id: `${entry.nodeId}-${nextTrace?.length ?? trace.length}-${entry.title}`,
    };
    const target = nextTrace ? [...nextTrace, built] : [...trace, built];
    if (!nextTrace) {
      setTrace(target);
    }
    return target;
  }

  function resolveEdgeTarget(
    fromClientId: string,
    label: string | null,
  ): string | null {
    const candidates = graph.outgoing.get(fromClientId) ?? [];
    const matched = candidates.find((edge) => (edge.label ?? null) === label);

    if (matched) {
      return matched.toClientId;
    }

    if (label !== null) {
      const unlabeled = candidates.find((edge) => edge.label == null);
      if (unlabeled) return unlabeled.toClientId;
    }

    if (candidates.length > 0) {
      return [...candidates]
        .sort((left, right) => {
          const leftNode = graph.nodeById.get(left.toClientId);
          const rightNode = graph.nodeById.get(right.toClientId);
          return (leftNode?.order ?? 0) - (rightNode?.order ?? 0);
        })[0]?.toClientId ?? null;
    }

    const orderedNodes = [...nodes].sort((left, right) => left.order - right.order);
    const currentIndex = orderedNodes.findIndex((node) => node.clientId === fromClientId);
    return currentIndex >= 0 ? orderedNodes[currentIndex + 1]?.clientId ?? null : null;
  }

  function runUntilPause(
    startNodeId: string,
    initialVariables: Record<string, string>,
    initialTrace: TraceEntry[] = [],
  ) {
    let nextTrace = initialTrace;
    let nextVariables = { ...initialVariables };
    let nodeId: string | null = startNodeId;

    for (let step = 0; step < 50 && nodeId; step++) {
      const node = graph.nodeById.get(nodeId);

      if (!node) {
        setStatus('error');
        setRunError('Fluxo inválido: nó de destino não encontrado.');
        setTrace(
          pushTrace(
            {
              nodeId,
              nodeType: 'finalize',
              title: 'Falha de simulação',
              detail: 'O canvas aponta para um nó inexistente.',
              tone: 'danger',
            },
            nextTrace,
          ),
        );
        return;
      }

      switch (node.type) {
        case 'message': {
          const text = interpolate(stringValue(node.config.content), nextVariables);
          const imageUrl = interpolate(stringValue(node.config.imageUrl), nextVariables).trim();

          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: imageUrl
                ? `Legenda: ${text || '(sem legenda)'}\nImagem: ${imageUrl}`
                : text || 'Mensagem vazia',
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'delay': {
          const delayMs = Number(node.config.ms) || 5000;
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `Aguardaria ${formatDelay(delayMs)} antes da próxima etapa.`,
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'wait_for_reply': {
          const variableName = stringValue(node.config.variableName, 'reply');
          const timeout = Number(node.config.timeoutMs || 0);
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `Pausa aguardando resposta do cliente para salvar em {{${variableName}}}.${timeout ? ` Timeout: ${formatDelay(timeout)}.` : ''}`,
              tone: 'warning',
            },
            nextTrace,
          );
          setTrace(nextTrace);
          setVariables(nextVariables);
          setWaitingNodeId(node.clientId);
          setCurrentNodeId(node.clientId);
          setStatus('waiting');
          setRunError(null);
          return;
        }
        case 'condition':
        case 'branch': {
          const field = stringValue(node.config.field);
          const operator = stringValue(node.config.operator, 'eq');
          const expected = stringValue(node.config.value);
          const matched = evaluateCondition(field, operator, expected, nextVariables);
          const branchLabel = matched ? 'yes' : 'no';
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `Avaliação ${field || '(sem campo)'} ${operator} ${expected || '(vazio)'} => ${branchLabel}.`,
              tone: matched ? 'success' : 'warning',
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, branchLabel);
          break;
        }
        case 'tag_contact': {
          const action = stringValue(node.config.action, 'add') === 'remove' ? 'Remover' : 'Adicionar';
          const tagId = stringValue(node.config.tagId || node.config.tagName, 'sem tag');
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `${action} tag ${tagId}.`,
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'move_stage': {
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `Mover contato para o stage ${stringValue(node.config.stageId, 'não configurado')}.`,
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'assign_to': {
          const userId = stringValue(node.config.userId);
          const teamId = stringValue(node.config.teamId);
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `Atribuir conversa${userId ? ` ao usuário ${userId}` : ''}${teamId ? `${userId ? ' e' : ' ao'} time ${teamId}` : ''}.`,
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'send_template': {
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `Enviar template ${stringValue(node.config.templateName, 'não configurado')} (${stringValue(node.config.languageCode, 'pt_BR')}).`,
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'send_interactive': {
          const body = interpolate(stringValue(node.config.body), nextVariables);
          const interactiveType = stringValue(node.config.interactiveType, 'button');
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `${interactiveType === 'list' ? 'Lista' : 'Botões'}: ${body || 'mensagem sem corpo'}.`,
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'webhook_call': {
          const method = stringValue(node.config.method, 'POST').toUpperCase();
          const url = stringValue(node.config.url, 'não configurada');
          const saveResponseAs = stringValue(node.config.saveResponseAs);
          if (saveResponseAs) {
            nextVariables = {
              ...nextVariables,
              [saveResponseAs]: '{"ok":true}',
            };
          }
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: `${method} ${url}${saveResponseAs ? ` e salvar resposta em {{${saveResponseAs}}}.` : '.'}`,
            },
            nextTrace,
          );
          nodeId = resolveEdgeTarget(node.clientId, null);
          break;
        }
        case 'finalize': {
          nextTrace = pushTrace(
            {
              nodeId: node.clientId,
              nodeType: node.type,
              title: TYPE_LABELS[node.type],
              detail: 'Encerraria o flow e desativaria o bot da conversa.',
              tone: 'success',
            },
            nextTrace,
          );
          setTrace(nextTrace);
          setVariables(nextVariables);
          setCurrentNodeId(node.clientId);
          setWaitingNodeId(null);
          setStatus('completed');
          setRunError(null);
          return;
        }
      }
    }

    setTrace(nextTrace);
    setVariables(nextVariables);
    setCurrentNodeId(nodeId);
    setWaitingNodeId(null);
    setStatus('completed');
    setRunError(null);
  }

  function handleStart() {
    if (nodes.length === 0) {
      setStatus('error');
      setRunError('Adicione pelo menos um nó antes de simular.');
      return;
    }

    if (Object.keys(validationErrors).length > 0) {
      setStatus('error');
      setRunError('Corrija os erros de validação antes de rodar o simulador.');
      return;
    }

    if (parsedVariables.error) {
      setStatus('error');
      setRunError(parsedVariables.error);
      return;
    }

    const root = graph.roots[0] ?? [...nodes].sort((left, right) => left.order - right.order)[0];
    if (!root) {
      setStatus('error');
      setRunError('Não foi possível encontrar o nó inicial.');
      return;
    }

    setStatus('running');
    setTrace([]);
    setVariables(parsedVariables.variables);
    setWaitingNodeId(null);
    setCurrentNodeId(root.clientId);
    setRunError(null);

    const bootstrapTrace: TraceEntry[] = [];
    bootstrapTrace.push({
      id: 'start',
      nodeId: root.clientId,
      nodeType: root.type,
      title: 'Disparo do flow',
      detail: `Trigger ${triggerType}${triggerValue ? ` (${triggerValue})` : ''}. Nó inicial: ${TYPE_LABELS[root.type]}.`,
      tone: 'success',
    });

    if (graph.roots.length > 1) {
      bootstrapTrace.push({
        id: 'multiple-roots',
        nodeId: root.clientId,
        nodeType: root.type,
        title: 'Múltiplas raízes',
        detail: 'O canvas tem mais de um nó sem entrada. A simulação usou o primeiro por ordem.',
        tone: 'warning',
      });
    }

    runUntilPause(root.clientId, parsedVariables.variables, bootstrapTrace);
  }

  function handleContinue() {
    if (!waitingNodeId) return;

    const waitingNode = graph.nodeById.get(waitingNodeId);
    const variableName = stringValue(waitingNode?.config.variableName, 'reply');
    const nextVariables = {
      ...variables,
      [variableName]: replyInput,
      reply: replyInput,
      ...(replyIdInput.trim() ? { replyId: replyIdInput.trim() } : {}),
      ...(replyTitleInput.trim() ? { replyTitle: replyTitleInput.trim() } : {}),
    };

    const labels = [
      replyIdInput.trim() || null,
      replyTitleInput.trim() || null,
      replyInput.trim() || null,
      null,
    ].filter((label, index, values) => values.indexOf(label) === index);

    let nextNodeId: string | null = null;
    for (const label of labels) {
      nextNodeId = resolveEdgeTarget(waitingNodeId, label);
      if (nextNodeId) break;
    }

    const updatedTrace = pushTrace(
      {
        nodeId: waitingNodeId,
        nodeType: 'wait_for_reply',
        title: 'Resposta simulada',
        detail: `Texto="${replyInput || '(vazio)'}"${replyIdInput ? ` id=${replyIdInput}` : ''}${replyTitleInput ? ` title=${replyTitleInput}` : ''}.`,
        tone: 'success',
      },
      trace,
    );

    if (!nextNodeId) {
      setTrace(updatedTrace);
      setVariables(nextVariables);
      setWaitingNodeId(null);
      setCurrentNodeId(waitingNodeId);
      setStatus('completed');
      setRunError(null);
      return;
    }

    setStatus('running');
    setTrace(updatedTrace);
    setVariables(nextVariables);
    setWaitingNodeId(null);
    setCurrentNodeId(nextNodeId);
    runUntilPause(nextNodeId, nextVariables, updatedTrace);
  }

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden p-0">
        <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="border-b border-border/60 bg-muted/20 p-6 lg:border-b-0 lg:border-r">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2">
                <SquareTerminal className="size-4 text-primary" />
                Simulador de Flow
              </DialogTitle>
              <DialogDescription>
                Teste o comportamento do canvas atual sem enviar mensagens reais.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                <p className="text-sm font-medium text-foreground">{flowName || 'Flow sem nome'}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Trigger: {triggerType}{triggerValue ? ` (${triggerValue})` : ''}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Variáveis iniciais
                </p>
                <Textarea
                  value={variablesInput}
                  onChange={(event) => setVariablesInput(event.target.value)}
                  className="min-h-40 resize-none font-mono text-xs"
                  placeholder='{"contactName":"Maria"}'
                />
                {parsedVariables.error && (
                  <p className="text-xs text-destructive">{parsedVariables.error}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Resposta simulada
                </p>
                <Input
                  value={replyInput}
                  onChange={(event) => setReplyInput(event.target.value)}
                  placeholder="Texto da resposta"
                />
                <Input
                  value={replyIdInput}
                  onChange={(event) => setReplyIdInput(event.target.value)}
                  placeholder="replyId opcional"
                />
                <Input
                  value={replyTitleInput}
                  onChange={(event) => setReplyTitleInput(event.target.value)}
                  placeholder="replyTitle opcional"
                />
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleStart}
                  disabled={status === 'running'}
                >
                  {status === 'running' ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
                  Rodar test run
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleContinue}
                  disabled={status !== 'waiting'}
                >
                  <Send className="size-4" />
                  Continuar com resposta
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStatus('idle');
                    setTrace([]);
                    setVariables({});
                    setCurrentNodeId(null);
                    setWaitingNodeId(null);
                    setRunError(null);
                  }}
                >
                  <RefreshCw className="size-4" />
                  Limpar simulação
                </Button>
              </div>

              {hasValidationErrors && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertTriangle className="size-4" />
                    Há {Object.keys(validationErrors).length} erro(s) no flow.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Corrija o canvas antes de confiar no resultado do test run.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Route className="size-3.5" />
                  {nodes.length} nós
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'capitalize',
                    status === 'completed' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    status === 'waiting' && 'border-amber-200 bg-amber-50 text-amber-700',
                    status === 'error' && 'border-destructive/20 bg-destructive/5 text-destructive',
                  )}
                >
                  {status === 'idle' && 'Pronto'}
                  {status === 'running' && 'Executando'}
                  {status === 'waiting' && 'Aguardando resposta'}
                  {status === 'completed' && 'Concluído'}
                  {status === 'error' && 'Com erro'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {waitingNodeId ? 'O simulador pausou em wait_for_reply.' : 'Sem chamadas externas ou persistência real.'}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
              <ScrollArea className="min-h-0 px-6 py-5">
                <div className="space-y-3">
                  {runError && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {runError}
                    </div>
                  )}

                  {trace.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-5 py-6 text-sm text-muted-foreground">
                      Rode o test run para ver a trilha de execução do flow atual.
                    </div>
                  ) : (
                    trace.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={cn(
                          'rounded-2xl border border-border/60 bg-background p-4 shadow-sm',
                          entry.tone === 'success' && 'border-emerald-200 bg-emerald-50/70',
                          entry.tone === 'warning' && 'border-amber-200 bg-amber-50/70',
                          entry.tone === 'danger' && 'border-destructive/20 bg-destructive/5',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Passo {index + 1}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{entry.title}</p>
                          </div>
                          <Badge variant="outline">{TYPE_LABELS[entry.nodeType]}</Badge>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {entry.detail}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="border-t border-border/60 bg-muted/20 px-6 py-5 xl:border-l xl:border-t-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Estado atual
                    </p>
                    <div className="mt-3 rounded-xl border border-border/60 bg-background px-4 py-3">
                      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Bot className="size-4 text-primary" />
                        {currentNodeId ? `Nó atual: ${currentNodeId}` : 'Sem nó ativo'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {waitingNodeId ? 'Aguardando a continuação manual da resposta.' : 'Execução local do builder.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Variáveis resolvidas
                    </p>
                    <div className="mt-3 rounded-xl border border-border/60 bg-background px-4 py-3">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6 text-muted-foreground">
                        {JSON.stringify(variables, null, 2) || '{}'}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <BadgeCheck className="size-4 text-emerald-600" />
                      Cobertura do test run
                    </p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      O simulador percorre nós, resolve branches, interpolação e respostas de espera. Ele não dispara Meta, webhook externo nem gravações no banco.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
