'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
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
  Send,
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
import { FlowCanvas, type CanvasEdgeDraft } from '@/features/automation/components/flow-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      { type: 'send_interactive' as FlowNodeType, label: 'Mensagem interativa', icon: Send, color: 'text-teal-500' },
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
    case 'send_interactive': return {
      interactiveType: 'button',
      body: '',
      buttons: [
        { id: 'btn_sim', title: 'Sim' },
        { id: 'btn_nao', title: 'Não' },
      ],
    };
    case 'webhook_call': return { url: '', method: 'POST' };
    default: return {};
  }
}

// ─── Add node dropdown ──────────────────────────────────────────────────────────

function AddNodeMenu({ onAdd }: { onAdd: (type: FlowNodeType) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Adicionar nó
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
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

// ─── Page ────────────────────────────────────────────────────────────────────────

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
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdgeDraft[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const pipelineStages = useMemo(
    () => pipelines.flatMap((p) => p.stages.map((s) => ({ id: s.id, name: s.name, pipelineName: p.name }))),
    [pipelines],
  );
  const workspaceUsers = useMemo(() => agents.map((a) => ({ id: a.id, name: a.name })), [agents]);
  const workspaceTeams = useMemo(() => teams.map((t) => ({ id: t.id, name: t.name })), [teams]);

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
    setCanvasEdges(
      flow.edges.map((e) => ({
        fromClientId: e.fromNodeId,
        toClientId: e.toNodeId,
        label: e.label ?? undefined,
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
  }

  function removeNode(clientId: string) {
    setNodes((cur) => cur.filter((n) => n.clientId !== clientId).map((n, i) => ({ ...n, order: i })));
    setCanvasEdges((cur) => cur.filter((e) => e.fromClientId !== clientId && e.toClientId !== clientId));
    if (selectedClientId === clientId) setSelectedClientId(null);
  }

  function updateNode(clientId: string, next: NodeDraft) {
    setNodes((cur) => cur.map((n) => (n.clientId === clientId ? next : n)));
  }

  const handleEdgesChange = useCallback((edges: CanvasEdgeDraft[]) => {
    setCanvasEdges(edges);
  }, []);

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
        edges: canvasEdges,
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

  const selectedNode = nodes.find((n) => n.clientId === selectedClientId) ?? null;

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

        <Separator orientation="vertical" className="h-5" />
        <AddNodeMenu onAdd={addNode} />

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

      {/* ─── Canvas + Right panel ─────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1">
          <FlowCanvas
            nodes={nodes}
            edges={flow.edges}
            triggerType={triggerType}
            triggerValue={triggerValue}
            selectedClientId={selectedClientId}
            onNodeSelect={setSelectedClientId}
            onNodesChange={setNodes}
            onEdgesChange={handleEdgesChange}
          />
        </div>

        {selectedNode !== null && selectedClientId !== null && (
          <FlowNodeEditor
            node={selectedNode}
            index={nodes.findIndex((n) => n.clientId === selectedClientId)}
            total={nodes.length}
            onUpdate={(next) => updateNode(selectedClientId, next)}
            onDelete={() => removeNode(selectedClientId)}
            onClose={() => setSelectedClientId(null)}
            workspaceUsers={workspaceUsers}
            workspaceTeams={workspaceTeams}
            pipelineStages={pipelineStages}
          />
        )}
      </div>
    </div>
  );
}
