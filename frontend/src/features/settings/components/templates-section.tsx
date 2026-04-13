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
  type TemplateButton,
  type TemplateButtonType,
  type TemplateCategory,
  type TemplateHeaderFormat,
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

const HEADER_FORMATS: { value: TemplateHeaderFormat; label: string }[] = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'IMAGE', label: 'Imagem' },
  { value: 'VIDEO', label: 'Vídeo' },
  { value: 'DOCUMENT', label: 'Documento' },
];

const BUTTON_TYPES: { value: TemplateButtonType; label: string }[] = [
  { value: 'QUICK_REPLY', label: 'Resposta rápida' },
  { value: 'URL', label: 'URL CTA' },
  { value: 'PHONE_NUMBER', label: 'Ligar' },
];

const REJECTION_REASON_LABELS: Record<string, string> = {
  ABUSIVE_CONTENT: 'Conteúdo abusivo ou sensível.',
  INVALID_FORMAT: 'Formato inválido para o template.',
  PROMOTIONAL_CONTENT: 'Conteúdo promocional fora das regras da categoria.',
  TAG_CONTENT_MISMATCH: 'O conteúdo não combina com a categoria do template.',
  SCAM: 'Conteúdo classificado como golpe ou fraude.',
  POLICY_VIOLATION: 'Violação de política da Meta.',
};

function formatRejectedReason(reason: string) {
  const normalized = reason.trim();
  const label = REJECTION_REASON_LABELS[normalized];

  if (!label) {
    return {
      summary: normalized.replaceAll('_', ' '),
      detail: null,
    };
  }

  return {
    summary: label,
    detail: normalized,
  };
}

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
  const headerLabel = template.headerFormat
    ? HEADER_FORMATS.find((item) => item.value === template.headerFormat)?.label ?? template.headerFormat
    : null;
  const rejection = template.rejectedReason
    ? formatRejectedReason(template.rejectedReason)
    : null;

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

      {rejection && !expanded && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p className="text-xs font-semibold text-destructive">Motivo da rejeição</p>
            <p className="text-xs text-muted-foreground">{rejection.summary}</p>
          </div>
        </div>
      )}

      {expanded && (
        <>
          <Separator />
          <div className="px-4 py-3 space-y-3">
            {template.headerFormat && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Header</p>
                <div className="rounded-lg bg-muted px-3 py-2 text-xs space-y-1">
                  <p><span className="font-medium">Formato:</span> {headerLabel}</p>
                  {template.headerText && <p className="whitespace-pre-wrap">{template.headerText}</p>}
                  {template.headerMediaHandle && (
                    <p className="break-all text-muted-foreground">Handle: {template.headerMediaHandle}</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Corpo do template</p>
              <pre className="rounded-lg bg-muted px-3 py-2 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {template.body}
              </pre>
            </div>
            {template.footerText && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Footer</p>
                <p className="rounded-lg bg-muted px-3 py-2 text-xs whitespace-pre-wrap">{template.footerText}</p>
              </div>
            )}
            {(template.buttons?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Botões</p>
                <div className="space-y-1.5">
                  {template.buttons?.map((button, index) => (
                    <div key={`${button.type}-${index}`} className="rounded-lg bg-muted px-3 py-2 text-xs">
                      <p className="font-medium">
                        {BUTTON_TYPES.find((item) => item.value === button.type)?.label ?? button.type}: {button.text}
                      </p>
                      {button.url && <p className="break-all text-muted-foreground">{button.url}</p>}
                      {button.phoneNumber && <p className="text-muted-foreground">{button.phoneNumber}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {template.variableExamples && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Exemplos de variáveis</p>
                <div className="rounded-lg bg-muted px-3 py-2 text-xs space-y-1">
                  {template.variableExamples.headerText?.length ? (
                    <p>Header: {template.variableExamples.headerText.join(', ')}</p>
                  ) : null}
                  {template.variableExamples.bodyText?.length ? (
                    <p>Body: {template.variableExamples.bodyText.join(', ')}</p>
                  ) : null}
                  {template.variableExamples.buttonText?.length ? (
                    <p>Botões: {template.variableExamples.buttonText.join(', ')}</p>
                  ) : null}
                </div>
              </div>
            )}
            {rejection && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-xs font-semibold text-destructive mb-0.5">Motivo da rejeição</p>
                <p className="text-xs text-muted-foreground">{rejection.summary}</p>
                {rejection.detail ? (
                  <p className="mt-1 text-[11px] font-mono text-muted-foreground/80">
                    Código Meta: {rejection.detail}
                  </p>
                ) : null}
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
  headerFormat: TemplateHeaderFormat | '';
  headerText: string;
  headerMediaHandle: string;
  body: string;
  footerText: string;
  buttons: TemplateButton[];
  variableExamples: {
    headerText: string;
    bodyText: string;
    buttonText: string;
  };
}

function NewTemplateForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { accounts } = useWhatsappAccounts();
  const [form, setForm] = useState<NewTemplateForm>({
    whatsappAccountId: '',
    name: '',
    category: 'MARKETING',
    language: 'pt_BR',
    headerFormat: '',
    headerText: '',
    headerMediaHandle: '',
    body: '',
    footerText: '',
    buttons: [],
    variableExamples: {
      headerText: '',
      bodyText: '',
      buttonText: '',
    },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof NewTemplateForm>(key: K, value: NewTemplateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  // Preview: substitui {{1}}, {{2}} por exemplos
  const preview = form.body.replace(/\{\{(\d+)\}\}/g, (_, n) => `[variável ${n}]`);

  function setButton(index: number, patch: Partial<TemplateButton>) {
    set('buttons', form.buttons.map((button, current) => (
      current === index ? { ...button, ...patch } : button
    )));
  }

  function addButton() {
    if (form.buttons.length >= 3) return;
    set('buttons', [...form.buttons, { type: 'QUICK_REPLY', text: '' }]);
  }

  function removeButton(index: number) {
    set('buttons', form.buttons.filter((_, current) => current !== index));
  }

  function parseExamples(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    if (!form.whatsappAccountId) return setError('Selecione uma conta WhatsApp');
    if (!form.name) return setError('Informe o nome do template');
    if (!form.body) return setError('Informe o corpo do template');
    if (form.headerFormat === 'TEXT' && !form.headerText) {
      return setError('Informe o texto do header');
    }
    if (form.headerFormat && form.headerFormat !== 'TEXT' && !form.headerMediaHandle) {
      return setError('Informe o media handle do header');
    }
    if (form.buttons.some((button) => !button.text)) {
      return setError('Todos os botões precisam de texto');
    }

    setSaving(true);
    try {
      await createTemplate({
        whatsappAccountId: form.whatsappAccountId,
        name: form.name,
        category: form.category,
        language: form.language,
        headerFormat: form.headerFormat || undefined,
        headerText: form.headerText || undefined,
        headerMediaHandle: form.headerMediaHandle || undefined,
        body: form.body,
        footerText: form.footerText || undefined,
        buttons: form.buttons.length ? form.buttons : undefined,
        variableExamples: {
          headerText: parseExamples(form.variableExamples.headerText),
          bodyText: parseExamples(form.variableExamples.bodyText),
          buttonText: parseExamples(form.variableExamples.buttonText),
        },
      });
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

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Header</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.headerFormat}
            onChange={(e) => set('headerFormat', e.target.value as TemplateHeaderFormat | '')}
          >
            <option value="">Sem header</option>
            {HEADER_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>{format.label}</option>
            ))}
          </select>
        </div>
      </div>

      {form.headerFormat === 'TEXT' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Texto do header</label>
          <Input
            placeholder="Ex: Pedido {{1}}"
            value={form.headerText}
            onChange={(e) => set('headerText', e.target.value)}
          />
        </div>
      )}

      {form.headerFormat && form.headerFormat !== 'TEXT' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Media handle do header
          </label>
          <Input
            placeholder="Handle retornado pela Meta para IMAGE/VIDEO/DOCUMENT"
            value={form.headerMediaHandle}
            onChange={(e) => set('headerMediaHandle', e.target.value)}
          />
        </div>
      )}

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

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Footer</label>
        <Input
          placeholder="Ex: Responda SAIR para não receber mais mensagens"
          value={form.footerText}
          onChange={(e) => set('footerText', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Botões</label>
          <Button type="button" size="sm" variant="ghost" onClick={addButton} disabled={form.buttons.length >= 3}>
            <Plus className="size-4" />
            Adicionar botão
          </Button>
        </div>
        {form.buttons.map((button, index) => (
          <div key={index} className="rounded-lg border border-border/70 bg-background p-3 space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={button.type}
                onChange={(e) => setButton(index, { type: e.target.value as TemplateButtonType, url: undefined, phoneNumber: undefined })}
              >
                {BUTTON_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <Input
                placeholder="Texto do botão"
                value={button.text}
                onChange={(e) => setButton(index, { text: e.target.value })}
              />
              <Button type="button" size="icon" variant="ghost" onClick={() => removeButton(index)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            {button.type === 'URL' && (
              <Input
                placeholder="https://exemplo.com/pedido/{{1}}"
                value={button.url ?? ''}
                onChange={(e) => setButton(index, { url: e.target.value })}
              />
            )}
            {button.type === 'PHONE_NUMBER' && (
              <Input
                placeholder="+5511999999999"
                value={button.phoneNumber ?? ''}
                onChange={(e) => setButton(index, { phoneNumber: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Exemplos header</label>
          <Input
            placeholder="Maria, Pedido 42"
            value={form.variableExamples.headerText}
            onChange={(e) => set('variableExamples', { ...form.variableExamples, headerText: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Exemplos body</label>
          <Input
            placeholder="Maria, #1234"
            value={form.variableExamples.bodyText}
            onChange={(e) => set('variableExamples', { ...form.variableExamples, bodyText: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Exemplos botões URL</label>
          <Input
            placeholder="1234"
            value={form.variableExamples.buttonText}
            onChange={(e) => set('variableExamples', { ...form.variableExamples, buttonText: e.target.value })}
          />
        </div>
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
