'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  Check,
  Clock3,
  LoaderCircle,
  MessageSquarePlus,
  Power,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useFlow, updateFlow, toggleFlow, type FlowNode } from '@/hooks/useAutomation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NodeDraft {
  type: 'message' | 'delay';
  config: { content?: string; ms?: number };
  order: number;
}

// ─── SVG Arrow ─────────────────────────────────────────────────────────────────

function FlowArrow() {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <svg width="16" height="36" viewBox="0 0 16 36" fill="none" className="text-border">
        <line x1="8" y1="0" x2="8" y2="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
        <polygon points="8,36 3,24 13,24" fill="currentColor" />
      </svg>
    </div>
  );
}

// ─── Node chip on canvas ────────────────────────────────────────────────────────

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
  const isMessage = node.type === 'message';
  const preview = isMessage
    ? (node.config.content?.slice(0, 60) || 'Mensagem sem conteúdo') + (node.config.content && node.config.content.length > 60 ? '…' : '')
    : `Aguardar ${Math.round((node.config.ms ?? 0) / 1000)}s`;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-64 items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md',
        selected
          ? isMessage
            ? 'border-primary shadow-primary/20'
            : 'border-amber-400 shadow-amber-200/50'
          : 'border-border/70 hover:border-border',
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-xl',
          isMessage ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600',
        )}
      >
        {isMessage ? <MessageSquarePlus className="size-4" /> : <Clock3 className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              isMessage ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700',
            )}
          >
            {isMessage ? 'Mensagem' : 'Delay'}
          </span>
          <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{preview}</p>
      </div>
    </button>
  );
}

// ─── Trigger chip ───────────────────────────────────────────────────────────────

function TriggerChip({ triggerType, triggerValue }: { triggerType: string; triggerValue: string }) {
  return (
    <div className="flex w-64 items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Gatilho
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          {triggerType === 'keyword'
            ? `Palavra-chave: "${triggerValue || '—'}"`
            : triggerType === 'new_conversation'
              ? 'Nova conversa'
              : 'Toda mensagem'}
        </p>
      </div>
    </div>
  );
}

// ─── Node editor panel (right) ──────────────────────────────────────────────────

function NodeEditorPanel({
  node,
  index,
  total,
  onUpdate,
  onDelete,
  onClose,
}: {
  node: NodeDraft;
  index: number;
  total: number;
  onUpdate: (next: NodeDraft) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const isMessage = node.type === 'message';

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border/70 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
              isMessage ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700',
            )}
          >
            {isMessage ? 'Mensagem' : 'Delay'}
          </span>
          <span className="text-sm text-muted-foreground">Etapa {index + 1} de {total}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {isMessage ? (
            <div className="space-y-2">
              <Label>Texto da mensagem</Label>
              <Textarea
                autoFocus
                value={node.config.content ?? ''}
                onChange={(e) => onUpdate({ ...node, config: { content: e.target.value } })}
                placeholder="Escreva a mensagem automática..."
                className="min-h-40 resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                {(node.config.content ?? '').length} caracteres
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="delay-seconds">Duração do delay (segundos)</Label>
              <Input
                id="delay-seconds"
                type="number"
                min={1}
                max={3600}
                value={Math.round((node.config.ms ?? 5000) / 1000)}
                onChange={(e) =>
                  onUpdate({ ...node, config: { ms: Math.max(1, Number(e.target.value)) * 1000 } })
                }
              />
              <p className="text-[11px] text-muted-foreground">
                O bot aguardará antes de executar a próxima etapa.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 px-4 py-3">
        <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="size-4" />
          Remover etapa
        </Button>
      </div>
    </aside>
  );
}

// ─── Canvas Page ─────────────────────────────────────────────────────────────────

export default function AutomationCanvasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { flow, mutate } = useFlow(id);

  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<'new_conversation' | 'keyword' | 'always'>('new_conversation');
  const [triggerValue, setTriggerValue] = useState('');
  const [nodes, setNodes] = useState<NodeDraft[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Hydrate from fetched flow
  useEffect(() => {
    if (!flow) return;
    setName(flow.name);
    setTriggerType(flow.triggerType);
    setTriggerValue(flow.triggerValue ?? '');
    setNodes(
      flow.nodes.map((n) => ({
        type: n.type === 'delay' ? 'delay' : 'message',
        config: n.config,
        order: n.order,
      })),
    );
  }, [flow]);

  function addNode(type: NodeDraft['type']) {
    setNodes((current) => [
      ...current,
      { type, config: type === 'message' ? { content: '' } : { ms: 5000 }, order: current.length },
    ]);
    setSelectedIndex(nodes.length); // select the new node
  }

  function removeNode(index: number) {
    setNodes((current) =>
      current.filter((_, i) => i !== index).map((n, i) => ({ ...n, order: i })),
    );
    setSelectedIndex(null);
  }

  function updateNode(index: number, next: NodeDraft) {
    setNodes((current) => current.map((n, i) => (i === index ? next : n)));
  }

  async function handleSave() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await updateFlow(id, {
        name: name.trim(),
        triggerType,
        triggerValue: triggerType === 'keyword' ? triggerValue.trim() : undefined,
        nodes,
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
    try {
      await toggleFlow(id);
      await mutate();
    } finally {
      setToggling(false);
    }
  }

  if (!flow) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const selectedNode = selectedIndex !== null ? nodes[selectedIndex] : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ─── Toolbar ─────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 py-2.5 backdrop-blur">
        <Link
          href="/automation"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Automação
        </Link>
        <Separator orientation="vertical" className="h-5" />

        {/* Flow name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-48 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-foreground outline-none ring-0 hover:border-border focus:border-border focus:bg-background"
          placeholder="Nome do flow"
        />

        {/* Trigger */}
        <Select value={triggerType} onValueChange={(v) => setTriggerType(v as typeof triggerType)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new_conversation">Nova conversa</SelectItem>
            <SelectItem value="keyword">Palavra-chave</SelectItem>
            <SelectItem value="always">Toda mensagem</SelectItem>
          </SelectContent>
        </Select>

        {triggerType === 'keyword' && (
          <Input
            value={triggerValue}
            onChange={(e) => setTriggerValue(e.target.value)}
            placeholder="Ex: oi, catálogo"
            className="h-8 w-36 text-xs"
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          <Badge variant={flow.isActive ? 'success' : 'muted'} className="hidden sm:flex">
            {flow.isActive ? 'Ativo' : 'Pausado'}
          </Badge>

          <Button variant="outline" size="sm" onClick={() => addNode('message')}>
            <MessageSquarePlus className="size-3.5" />
            <span className="hidden sm:inline">Mensagem</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => addNode('delay')}>
            <Clock3 className="size-3.5" />
            <span className="hidden sm:inline">Delay</span>
          </Button>

          <Separator orientation="vertical" className="h-5" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleToggle()}
            disabled={toggling}
          >
            {toggling ? <LoaderCircle className="size-3.5 animate-spin" /> : <Power className="size-3.5" />}
            {flow.isActive ? 'Pausar' : 'Ativar'}
          </Button>

          <Button size="sm" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
            {saving ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : savedFeedback ? (
              <Check className="size-3.5" />
            ) : (
              <Save className="size-3.5" />
            )}
            {saving ? 'Salvando...' : savedFeedback ? 'Salvo!' : 'Salvar'}
          </Button>
        </div>
      </header>

      {/* ─── Canvas + Right panel ─────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle,_#e2e8f0_1px,_transparent_1px)] bg-[length:24px_24px] p-12">
          <div className="flex flex-col items-center">
            {/* Trigger chip */}
            <TriggerChip triggerType={triggerType} triggerValue={triggerValue} />

            {nodes.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-3">
                <FlowArrow />
                <button
                  onClick={() => addNode('message')}
                  className="flex w-64 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/70 px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <MessageSquarePlus className="size-4" />
                  Adicionar primeira etapa
                </button>
              </div>
            ) : (
              <>
                {nodes.map((node, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <FlowArrow />
                    <NodeChip
                      node={node}
                      index={index}
                      selected={selectedIndex === index}
                      onSelect={() => setSelectedIndex(selectedIndex === index ? null : index)}
                    />
                  </div>
                ))}

                {/* Add more nodes at the end */}
                <div className="flex flex-col items-center">
                  <FlowArrow />
                  <button
                    onClick={() => addNode('message')}
                    className="flex w-64 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/70 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <MessageSquarePlus className="size-3.5" />
                    Adicionar etapa
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right panel — node editor */}
        {selectedNode !== null && selectedIndex !== null && (
          <NodeEditorPanel
            node={selectedNode}
            index={selectedIndex}
            total={nodes.length}
            onUpdate={(next) => updateNode(selectedIndex, next)}
            onDelete={() => removeNode(selectedIndex)}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
