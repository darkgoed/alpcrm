'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownAZ, Bot, Filter, LoaderCircle, Plus, Search, Sparkles, X } from 'lucide-react';
import { createFlow, type Flow, useFlows } from '@/hooks/useAutomation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FlowCard } from '@/features/automation/components/flow-card';
import { FLOW_TRIGGER_LABELS } from '@/features/automation/components/flow-node-summary';

// ─── Create flow dialog (name + trigger only) ──────────────────────────────────

function CreateFlowDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState<Flow['triggerType']>('new_conversation');
  const [triggerValue, setTriggerValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const flow = await createFlow({
        name: name.trim(),
        triggerType,
        triggerValue: triggerType === 'keyword' ? triggerValue.trim() : undefined,
        nodes: [],
      });
      onOpenChange(false);
      router.push(`/automation/${flow.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo flow</DialogTitle>
          <DialogDescription>
            Defina o nome e o gatilho. As etapas são adicionadas no editor canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="flow-name">Nome do flow</Label>
            <Input
              id="flow-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate(); }}
              placeholder="Ex: Boas-vindas, Suporte técnico"
            />
          </div>
          <div className="space-y-2">
            <Label>Gatilho</Label>
            <Select value={triggerType} onValueChange={(v) => setTriggerType(v as Flow['triggerType'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_conversation">Nova conversa</SelectItem>
                <SelectItem value="keyword">Palavra-chave</SelectItem>
                <SelectItem value="always">Toda mensagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {triggerType === 'keyword' && (
            <div className="space-y-2">
              <Label htmlFor="trigger-value">Palavra-chave</Label>
              <Input
                id="trigger-value"
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder="Ex: oi, catálogo, suporte"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => void handleCreate()} disabled={saving || !name.trim()}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {saving ? 'Criando...' : 'Criar e editar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filters + sort ────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'paused';
type TriggerFilter = 'all' | Flow['triggerType'];
type SortKey = 'name' | 'name_desc' | 'steps_desc' | 'steps_asc';

const SORT_LABEL: Record<SortKey, string> = {
  name: 'Nome (A→Z)',
  name_desc: 'Nome (Z→A)',
  steps_desc: 'Mais etapas',
  steps_asc: 'Menos etapas',
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { flows, mutate, isLoading } = useFlows();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [trigger, setTrigger] = useState<TriggerFilter>('all');
  const [sort, setSort] = useState<SortKey>('name');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = flows.filter((f) => {
      if (status === 'active' && !f.isActive) return false;
      if (status === 'paused' && f.isActive) return false;
      if (trigger !== 'all' && f.triggerType !== trigger) return false;
      if (q) {
        const haystack = `${f.name} ${f.triggerValue ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      switch (sort) {
        case 'name':        return a.name.localeCompare(b.name);
        case 'name_desc':   return b.name.localeCompare(a.name);
        case 'steps_desc':  return b.nodes.length - a.nodes.length;
        case 'steps_asc':   return a.nodes.length - b.nodes.length;
      }
    });
  }, [flows, query, sort, status, trigger]);

  const hasAnyFilter = query.trim().length > 0 || status !== 'all' || trigger !== 'all';
  const activeCount = flows.filter((f) => f.isActive).length;
  const totalSteps = flows.reduce((t, f) => t + f.nodes.length, 0);

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setTrigger('all');
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-none bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_60%,#22c55e_100%)] text-white shadow-[0_24px_70px_-32px_rgba(15,118,110,0.45)]">
          <CardHeader className="space-y-4">
            <Badge variant="secondary" className="w-fit bg-white/15 text-white hover:bg-white/15">
              Studio de automação
            </Badge>
            <CardTitle className="text-3xl leading-tight sm:text-4xl">
              Crie flows com regras simples, mensagens e delays sem sair do CRM.
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-emerald-50/85">
              Combine gatilhos por palavra-chave ou nova conversa para acelerar a triagem e reduzir o tempo de primeira resposta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="lg" className="bg-white text-slate-950 hover:bg-slate-100" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Novo flow
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base">Indicadores rápidos</CardTitle>
            </div>
            <CardDescription>Resumo do parque de automações do workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Flows</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{flows.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ativos</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Etapas totais</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{totalSteps}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filter bar ──────────────────────────────────────────────────── */}
      {flows.length > 0 && (
        <Card className="border-border/70 bg-white/70">
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome ou palavra-chave"
                className="pl-9"
              />
            </div>

            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-10 w-40 gap-2">
                <Filter className="size-3.5 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Apenas ativos</SelectItem>
                <SelectItem value="paused">Apenas pausados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={trigger} onValueChange={(v) => setTrigger(v as TriggerFilter)}>
              <SelectTrigger className="h-10 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os gatilhos</SelectItem>
                {(Object.keys(FLOW_TRIGGER_LABELS) as Flow['triggerType'][]).map((t) => (
                  <SelectItem key={t} value={t}>{FLOW_TRIGGER_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-10 w-44 gap-2">
                <ArrowDownAZ className="size-3.5 opacity-60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{SORT_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasAnyFilter && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="size-3.5" />
                Limpar
              </Button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {filtered.length} de {flows.length}
            </span>
          </CardContent>
        </Card>
      )}

      <div className="flex-1">
        {isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={`sk-${i}`} className="border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4">
            {filtered.map((flow) => (
              <FlowCard key={flow.id} flow={flow} onRefresh={mutate} />
            ))}
          </div>
        ) : flows.length > 0 ? (
          <Card className="border-border/70 bg-white/70">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Filter className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum flow corresponde aos filtros aplicados.
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="size-3.5" />
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 bg-white/70">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <Bot className="size-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">Nenhum flow criado</p>
                <p className="text-sm text-muted-foreground">Crie sua primeira automação para organizar o atendimento desde o primeiro contato.</p>
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Criar primeiro flow
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <CreateFlowDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
