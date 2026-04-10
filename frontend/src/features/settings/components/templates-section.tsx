'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  useTemplates,
  createTemplate,
  refreshTemplate,
  deleteTemplate,
  type MessageTemplate,
  type TemplateCategory,
} from '@/hooks/useTemplates';
import { useWhatsappAccounts } from '@/hooks/useWhatsappAccounts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utilidade' },
  { value: 'AUTHENTICATION', label: 'Autenticação' },
];

const LANGUAGES = [
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'en_US', label: 'English (US)' },
  { value: 'es', label: 'Español' },
];

function StatusBadge({ status }: { status: MessageTemplate['status'] }) {
  if (status === 'APPROVED')
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="size-3" />
        Aprovado
      </Badge>
    );
  if (status === 'REJECTED')
    return (
      <Badge variant="warning" className="gap-1 border-destructive/30 bg-destructive/10 text-destructive">
        <AlertCircle className="size-3" />
        Rejeitado
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="size-3" />
      Pendente
    </Badge>
  );
}

// ─── Card de template ─────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onChanged,
}: {
  template: MessageTemplate;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshTemplate(template.id);
      onChanged();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir o template "${template.name}"? Ele também será removido da Meta.`)) return;
    setDeleting(true);
    try {
      await deleteTemplate(template.id);
      onChanged();
    } finally {
      setDeleting(false);
    }
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === template.category)?.label ?? template.category;

  return (
    <div className="rounded-xl border border-border/70 bg-background">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground font-mono">{template.name}</p>
            <Badge variant="outline" className="text-xs">{template.language}</Badge>
            <Badge variant="secondary" className="text-xs">{categoryLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{template.whatsappAccount.name || template.whatsappAccount.phoneNumber}</p>
        </div>
        <StatusBadge status={template.status} />
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            title="Atualizar status"
            disabled={refreshing}
            onClick={handleRefresh}
          >
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={handleDelete}
            title="Excluir"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          <Separator />
          <div className="px-4 py-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Corpo do template</p>
              <pre className="rounded-lg bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {template.body}
              </pre>
            </div>
            {template.rejectedReason && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-xs font-semibold text-destructive mb-0.5">Motivo da rejeição</p>
                <p className="text-xs text-muted-foreground">{template.rejectedReason}</p>
              </div>
            )}
            {template.metaId && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Meta ID:</span> {template.metaId}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Formulário de novo template ──────────────────────────────────────────────

interface NewTemplateForm {
  whatsappAccountId: string;
  name: string;
  category: TemplateCategory;
  language: string;
  body: string;
}

function NewTemplateForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { accounts } = useWhatsappAccounts();
  const [form, setForm] = useState<NewTemplateForm>({
    whatsappAccountId: '',
    name: '',
    category: 'MARKETING',
    language: 'pt_BR',
    body: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof NewTemplateForm>(key: K, value: NewTemplateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  // Preview: substitui {{1}}, {{2}} por exemplos
  const preview = form.body.replace(/\{\{(\d+)\}\}/g, (_, n) => `[variável ${n}]`);

  async function handleSave() {
    if (!form.whatsappAccountId) return setError('Selecione uma conta WhatsApp');
    if (!form.name) return setError('Informe o nome do template');
    if (!form.body) return setError('Informe o corpo do template');

    setSaving(true);
    try {
      await createTemplate(form);
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao criar template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground">Novo template HSM</p>

      {/* Conta WhatsApp */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Conta WhatsApp</label>
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={form.whatsappAccountId}
          onChange={(e) => set('whatsappAccountId', e.target.value)}
        >
          <option value="">Selecione uma conta...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || a.phoneNumber} ({a.phoneNumber})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Nome <span className="text-muted-foreground/60">(snake_case)</span>
          </label>
          <Input
            placeholder="ex: lembrete_pagamento"
            value={form.name}
            onChange={(e) => set('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
          />
        </div>

        {/* Categoria */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Categoria</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) => set('category', e.target.value as TemplateCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Idioma */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Idioma</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.language}
            onChange={(e) => set('language', e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Corpo */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Corpo{' '}
          <span className="text-muted-foreground/60">
            — use {'{{1}}'}, {'{{2}}'} para variáveis
          </span>
        </label>
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-y"
          placeholder={'Olá {{1}}, seu pedido {{2}} está pronto!'}
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
        />
      </div>

      {/* Preview */}
      {form.body && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Preview</p>
          <div className="rounded-lg bg-background border border-border/70 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
            {preview}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          {saving ? 'Enviando para Meta...' : 'Criar e enviar para Meta'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function TemplatesSection() {
  const { templates, isLoading, mutate } = useTemplates();
  const [showForm, setShowForm] = useState(false);

  function handleCreated() {
    void mutate();
    setShowForm(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <CardTitle className="text-base">Templates HSM</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            Novo template
          </Button>
        </div>
        <CardDescription>
          Templates pré-aprovados pela Meta para iniciar conversas fora da janela de 24h.
          O status é atualizado automaticamente a cada hora.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && (
          <NewTemplateForm
            onCreated={handleCreated}
            onCancel={() => setShowForm(false)}
          />
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : templates.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <FileText className="mx-auto mb-3 size-8 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">Nenhum template cadastrado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie templates para enviar mensagens ativas (outbound) para contatos.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onChanged={() => void mutate()} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
