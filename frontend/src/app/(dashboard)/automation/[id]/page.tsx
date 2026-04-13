'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  GitBranch,
  LoaderCircle,
  MessageSquarePlus,
  Plus,
  Power,
  Save,
  Tag,
  Webhook,
  Workflow,
} from 'lucide-react';
import {
  useFlow,
  updateFlow,
  toggleFlow,
  type Flow,
  type FlowNodeType,
} from '@/hooks/useAutomation';
import { usePipelines, useTags } from '@/hooks/useContacts';
import { useTeams } from '@/hooks/useTeams';
import { useAgents } from '@/hooks/useAgents';
import { FlowNodeEditor, type NodeDraft } from '@/features/automation/components/flow-node-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Node type config ───────────────────────────────────────────────────────────

const NODE_GROUPS = [
  {
    label: 'Mensagens',
    items: [
      { type: 'message' as FlowNodeType, label: 'Mensagem de texto', icon: MessageSquarePlus, color: 'text-primary' },
      { type: 'send_template' as FlowNodeType, label: 'Enviar template', icon: Workflow, color: 'text-orange-500' },
    ],
  },
  {
    label: 'Controle de fluxo',
    items: [
      { type: 'delay' as FlowNodeType, label: 'Delay', icon: Clock3, color: 'text-amber-500' },
      { type: 'wait_for_reply' as FlowNodeType, label: 'Aguardar resposta', icon: MessageSquarePlus, color: 'text-blue-500' },
      { type: 'branch' as FlowNodeType, label: 'Branch / Condição', icon: GitBranch, color: 'text-violet-500' },
    ],
  },
  {
    label: 'Ações CRM',
    items: [
      { type: 'tag_contact' as FlowNodeType, label: 'Tag no contato', icon: Tag, color: 'text-emerald-500' },
      { type: 'move_stage' as FlowNodeType, label: 'Mover no pipeline', icon: Workflow, color: 'text-sky-500' },
      { type: 'assign_to' as FlowNodeType, label: 'Atribuir', icon: Bot, color: 'text-pink-500' },
    ],
  },
  {
    label: 'Integrações',
    items: [
      { type: 'webhook_call' as FlowNodeType, label: 'Webhook', icon: Webhook, color: 'text-zinc-500' },
    ],
  },
] as const;

const TYPE_COLORS: Record<FlowNodeType, string> = {
  message: 'border-primary/40 bg-primary/5',
  delay: 'border-amber-300 bg-amber-50',
  wait_for_reply: 'border-blue-300 bg-blue-50',
  condition: 'border-violet-300 bg-violet-50',
  branch: 'border-violet-300 bg-violet-50',
  tag_contact: 'border-emerald-300 bg-emerald-50',
  move_stage: 'border-sky-300 bg-sky-50',
  assign_to: 'border-pink-300 bg-pink-50',
  send_template: 'border-orange-300 bg-orange-50',
  webhook_call: 'border-zinc-300 bg-zinc-50',
};

const TYPE_LABELS: Record<FlowNodeType, string> = {
  message: 'Mensagem',
  delay: 'Delay',
  wait_for_reply: 'Aguardar resposta',
  condition: 'Condição',
  branch: 'Branch',
  tag_contact: 'Tag',
  move_stage: 'Mover stage',
  assign_to: 'Atribuir',
  send_template: 'Template',
  webhook_call: 'Webhook',
};

function defaultConfig(type: FlowNodeType): Record<string, unknown> {
  switch (type) {
    case 'message': return { content: '' };
    case 'delay': return { ms: 5000 };
    case 'wait_for_reply': return { variableName: 'reply' };
    case 'condition':
    case 'branch': return { field: 'reply', operator: 'eq', value: '' };
    case 'tag_contact': return { tagId: '', action: 'add' };
    case 'move_stage': return { stageId: '' };
    case 'assign_to': return {};
    case 'send_template': return { templateName: '', languageCode: 'pt_BR' };
    case 'webhook_call': return { url: '', method: 'POST' };
    default: return {};
  }
}

function nodePreview(node: NodeDraft): string {
  const c = node.config;
  switch (node.type) {
    case 'message': return String(c.content || 'Mensagem sem conteúdo').slice(0, 60);
    case 'delay': return `Aguardar ${Math.round((Number(c.ms) || 0) / 1000)}s`;
    case 'wait_for_reply': return `Esperar resposta → ${'{{' + String(c.variableName || 'reply') + '}}'}`;
    case 'condition':
    case 'branch': return `Se ${String(c.field || '?')} ${String(c.operator || 'eq')} "${String(c.value || '')}"`;
    case 'tag_contact': return `${c.action === 'remove' ? 'Remover' : 'Adicionar'} tag`;
    case 'move_stage': return `Mover para stage`;
    case 'assign_to': return `Atribuir conversa`;
    case 'send_template': return `Template: ${String(c.templateName || '?')}`;
    case 'webhook_call': return `POST ${String(c.url || '?').slice(0, 40)}`;
    default: return node.type;
  }
}

// ─── SVG arrow ──────────────────────────────────────────────────────────────────

function FlowArrow() {
  return (
    <div className="flex flex-col items-center py-0.5" aria-hidden>
      <svg width="16" height="32" viewBox="0 0 16 32" fill="none" className="text-border">
        <line x1="8" y1="0" x2="8" y2="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
        <polygon points="8,32 3,20 13,20" fill="currentColor" />
      </svg>
    </div>
  );
}

// ─── Trigger chip ────────────────────────────────────────────────────────────────

function TriggerChip({ triggerType, triggerValue }: { triggerType: string; triggerValue: string }) {
  const labels: Record<string, string> = {
    new_conversation: 'Nova conversa',
    keyword: `Palavra-chave: "${triggerValue || '—'}"`,
    always: 'Toda mensagem',
    tag_applied: 'Tag aplicada',
    stage_changed: 'Mudança de stage',
    button_reply: `Button reply: "${triggerValue || '—'}"`,
  };

  return (
    <div className="flex w-72 items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Gatilho
        </span>
        <p className="mt-1 text-xs text-muted-foreground">{labels[triggerType] ?? triggerType}</p>
      </div>
    </div>
  );
}

// ─── Node chip ───────────────────────────────────────────────────────────────────

function NodeChip({
  node,
  index,
  selected,
  onSelect,
}: {
  node: NodeDraft;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const colorClass = TYPE_COLORS[node.type] ?? 'border-border bg-background';
  const preview = nodePreview(node);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-72 items-start gap-3 rounded-2xl border-2 p-4 text-left shadow-sm transition-all hover:shadow-md',
        colorClass,
        selected && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
            {TYPE_LABELS[node.type]}
          </span>
          <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{preview}</p>
      </div>
    </button>
  );
}

// ─── Add node dropdown ──────────────────────────────────────────────────────────

function AddNodeMenu({ onAdd }: { onAdd: (type: FlowNodeType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-72 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/70 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <Plus className="size-3.5" />
          Adicionar etapa
          <ChevronDown className="size-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52">
        {NODE_GROUPS.map((group) => (
          <div key={group.label}>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {group.label}
            </DropdownMenuLabel>
            {group.items.map((item) => (
              <DropdownMenuItem key={item.type} onClick={() => onAdd(item.type)}>
                <item.icon className={cn('size-4', item.color)} />
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Canvas page ─────────────────────────────────────────────────────────────────

export default function AutomationCanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { flow, mutate } = useFlow(id);
  const { tags } = useTags();
  const { pipelines } = usePipelines();
  const { teams } = useTeams();
  const { agents } = useAgents();

  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<Flow['triggerType']>('new_conversation');
  const [triggerValue, setTriggerValue] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [nodes, setNodes] = useState<NodeDraft[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Derive all pipeline stages flat
  const pipelineStages = useMemo(
    () =>
      pipelines.flatMap((p) =>
        p.stages.map((s) => ({ id: s.id, name: s.name, pipelineName: p.name })),
      ),
    [pipelines],
  );

  const workspaceUsers = useMemo(
    () => agents.map((a) => ({ id: a.id, name: a.name })),
    [agents],
  );

  const workspaceTeams = useMemo(
    () => teams.map((t) => ({ id: t.id, name: t.name })),
    [teams],
  );

  // Hydrate from flow
  useEffect(() => {
    if (!flow) return;
    setName(flow.name);
    setTriggerType(flow.triggerType);
    setTriggerValue(flow.triggerValue ?? '');
    setSelectedTagId(flow.triggerType === 'tag_applied' ? flow.triggerValue ?? '' : '');
    setSelectedStageId(flow.triggerType === 'stage_changed' ? flow.triggerValue ?? '' : '');
    setNodes(
      flow.nodes.map((n, i) => ({
        clientId: n.id,
        type: n.type,
        config: n.config,
        order: n.order ?? i,
      })),
    );
  }, [flow]);

  useEffect(() => {
    if (triggerType !== 'stage_changed') { setSelectedPipelineId(''); return; }
    const stageId = selectedStageId || (flow?.triggerType === 'stage_changed' ? flow.triggerValue ?? '' : '');
    if (!stageId) return;
    const ownerPipeline = pipelines.find((p) => p.stages.some((s) => s.id === stageId));
    if (ownerPipeline) setSelectedPipelineId(ownerPipeline.id);
  }, [flow?.triggerType, flow?.triggerValue, pipelines, selectedStageId, triggerType]);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId) ?? null;

  function addNode(type: FlowNodeType) {
    const clientId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNodes((cur) => [...cur, { clientId, type, config: defaultConfig(type), order: cur.length }]);
    setSelectedIndex(nodes.length);
  }

  function removeNode(index: number) {
    setNodes((cur) => cur.filter((_, i) => i !== index).map((n, i) => ({ ...n, order: i })));
    setSelectedIndex(null);
  }

  function updateNode(index: number, next: NodeDraft) {
    setNodes((cur) => cur.map((n, i) => (i === index ? next : n)));
  }

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const triggerVal =
        triggerType === 'keyword' ? triggerValue.trim()
          : triggerType === 'tag_applied' ? selectedTagId || undefined
          : triggerType === 'stage_changed' ? selectedStageId || undefined
          : undefined;

      await updateFlow(id, {
        name: name.trim(),
        triggerType,
        triggerValue: triggerVal,
        nodes: nodes.map((n) => ({ clientId: n.clientId, type: n.type, config: n.config, order: n.order })),
      });
      await mutate();
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    if (toggling) return;
    setToggling(true);
    try { await toggleFlow(id); await mutate(); }
    finally { setToggling(false); }
  }

  if (!flow) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedNode = selectedIndex !== null ? nodes[selectedIndex] ?? null : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ─── Toolbar ──────────────────────────────────────────────────────── */}
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur">
        <Link
          href="/automation"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Automação
        </Link>
        <Separator orientation="vertical" className="h-5" />

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-44 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium outline-none hover:border-border focus:border-border focus:bg-background"
          placeholder="Nome do flow"
        />

        <Select value={triggerType} onValueChange={(v) => setTriggerType(v as Flow['triggerType'])}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new_conversation">Nova conversa</SelectItem>
            <SelectItem value="keyword">Palavra-chave</SelectItem>
            <SelectItem value="button_reply">Button reply</SelectItem>
            <SelectItem value="always">Toda mensagem</SelectItem>
            <SelectItem value="tag_applied">Tag aplicada</SelectItem>
            <SelectItem value="stage_changed">Mudança de stage</SelectItem>
          </SelectContent>
        </Select>

        {(triggerType === 'keyword' || triggerType === 'button_reply') && (
          <Input
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            placeholder={triggerType === 'keyword' ? 'Ex: oi, suporte' : 'Payload do botão'}
            className="h-8 w-36 text-xs"
          />
        )}
        {triggerType === 'tag_applied' && (
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            className="h-8 w-40 rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">Selecione a tag</option>
            {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        {triggerType === 'stage_changed' && (
          <>
            <select
              value={selectedPipelineId}
              onChange={(e) => { setSelectedPipelineId(e.target.value); setSelectedStageId(''); }}
              className="h-8 w-36 rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Pipeline</option>
              {pipelines.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="h-8 w-36 rounded-md border border-input bg-background px-3 text-xs"
              disabled={!selectedPipeline}
            >
              <option value="">Stage</option>
              {selectedPipeline?.stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Badge variant={flow.isActive ? 'success' : 'muted'} className="hidden sm:flex">
            {flow.isActive ? 'Ativo' : 'Pausado'}
          </Badge>
          <Separator orientation="vertical" className="h-5" />
          <Button variant="outline" size="sm" onClick={() => void handleToggle()} disabled={toggling}>
            {toggling ? <LoaderCircle className="size-3.5 animate-spin" /> : <Power className="size-3.5" />}
            {flow.isActive ? 'Pausar' : 'Ativar'}
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
            {saving ? <LoaderCircle className="size-3.5 animate-spin" />
              : savedFeedback ? <Check className="size-3.5" />
              : <Save className="size-3.5" />}
            {saving ? 'Salvando…' : savedFeedback ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>
      </header>

      {/* ─── Canvas + Right panel ──────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] bg-[length:24px_24px] p-12">
          <div className="flex flex-col items-center">
            <TriggerChip triggerType={triggerType} triggerValue={triggerValue} />

            {nodes.map((node, index) => (
              <div key={node.clientId} className="flex flex-col items-center">
                <FlowArrow />
                <NodeChip
                  node={node}
                  index={index}
                  selected={selectedIndex === index}
                  onSelect={() => setSelectedIndex(selectedIndex === index ? null : index)}
                />
              </div>
            ))}

            <div className="flex flex-col items-center">
              <FlowArrow />
              <AddNodeMenu onAdd={addNode} />
            </div>
          </div>
        </div>

        {/* Right panel */}
        {selectedNode !== null && selectedIndex !== null && (
          <FlowNodeEditor
            node={selectedNode}
            index={selectedIndex}
            total={nodes.length}
            onUpdate={(next) => updateNode(selectedIndex, next)}
            onDelete={() => removeNode(selectedIndex)}
            onClose={() => setSelectedIndex(null)}
            workspaceUsers={workspaceUsers}
            workspaceTeams={workspaceTeams}
            pipelineStages={pipelineStages}
          />
        )}
      </div>
    </div>
  );
}
