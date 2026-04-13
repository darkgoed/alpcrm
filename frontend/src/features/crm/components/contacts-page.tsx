'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Briefcase, Building2, CheckCircle2, Layers3, Loader2, Mail, Phone, Plus, Save, Search, Tag as TagIcon, Trash2, Upload, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgents } from '@/hooks/useAgents';
import {
  useContacts,
  usePipelines,
  useSavedSegments,
  useTags,
  createContact,
  updateContact,
  deleteContact,
  mergeContact,
  addTag,
  removeTag,
  createTag,
  saveSegment,
  deleteSegment,
  applyBulkContactAction,
  importPreview,
  importConfirm,
  type Contact,
  type ContactFilters,
  type Tag,
  type ImportPreviewResult,
} from '@/hooks/useContacts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
const LIFECYCLE_OPTIONS = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'customer', label: 'Cliente' },
  { value: 'inactive', label: 'Inativo' },
] as const;

function getLifecycleLabel(stage: Contact['lifecycleStage']) {
  return LIFECYCLE_OPTIONS.find((option) => option.value === stage)?.label ?? stage;
}

function getLifecycleBadgeVariant(stage: Contact['lifecycleStage']): React.ComponentProps<typeof Badge>['variant'] {
  if (stage === 'customer') return 'success';
  if (stage === 'inactive') return 'secondary';
  return 'outline';
}

type CustomFieldDraft = {
  id: string;
  key: string;
  value: string;
};

function createCustomFieldDraft(key = '', value = ''): CustomFieldDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key,
    value,
  };
}

function getCustomFieldDrafts(customFields: Contact['customFields'] | undefined) {
  return Object.entries(customFields ?? {}).map(([key, value]) =>
    createCustomFieldDraft(key, value),
  );
}

function normalizeCustomFields(rows: CustomFieldDraft[]) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const key = row.key.trim();
    const value = row.value.trim();
    if (!key || !value) return acc;
    acc[key] = value;
    return acc;
  }, {});
}

function CustomFieldsEditor({
  rows,
  onChange,
}: {
  rows: CustomFieldDraft[];
  onChange: (rows: CustomFieldDraft[]) => void;
}) {
  function handleRowChange(id: string, field: 'key' | 'value', value: string) {
    onChange(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function handleRemoveRow(id: string) {
    onChange(rows.filter((row) => row.id !== id));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Campos customizados
        </p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onChange([...rows, createCustomFieldDraft()])}
        >
          <Plus className="size-3" />
          Adicionar campo
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
          Nenhum campo customizado definido.
        </p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="grid gap-2 md:grid-cols-[0.9fr_1.1fr_auto]">
            <Input
              placeholder="Campo"
              value={row.key}
              onChange={(e) => handleRowChange(row.id, 'key', e.target.value)}
            />
            <Input
              placeholder="Valor"
              value={row.value}
              onChange={(e) => handleRowChange(row.id, 'value', e.target.value)}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-10 shrink-0 text-muted-foreground"
              onClick={() => handleRemoveRow(row.id)}
              title="Remover campo"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Tag Badge ───────────────────────────────────────────────────────────────

function TagBadge({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: tag.color + '55', background: tag.color + '18', color: tag.color }}
    >
      {tag.name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100">×</button>
      )}
    </span>
  );
}

// ─── Create Contact Dialog ────────────────────────────────────────────────────

function CreateContactForm({
  agents,
  onCreated,
}: {
  agents: Array<{ id: string; name: string; isActive: boolean }>;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    phone: '',
    name: '',
    email: '',
    company: '',
    ownerId: '',
    lifecycleStage: 'lead' as Contact['lifecycleStage'],
  });
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.phone) return;
    setLoading(true);
    try {
      await createContact({
        phone: form.phone,
        name: form.name || undefined,
        email: form.email || undefined,
        company: form.company || undefined,
        customFields: normalizeCustomFields(customFields),
        ownerId: form.ownerId || undefined,
        lifecycleStage: form.lifecycleStage,
      });
      onCreated();
      setForm({
        phone: '',
        name: '',
        email: '',
        company: '',
        ownerId: '',
        lifecycleStage: 'lead',
      });
      setCustomFields([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">Novo contato</p>
      <Input placeholder="Telefone (obrigatório)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
      <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <Input placeholder="Empresa / organização" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
      <div className="grid gap-3 md:grid-cols-2">
        <select
          value={form.lifecycleStage}
          onChange={(e) => setForm({ ...form, lifecycleStage: e.target.value as Contact['lifecycleStage'] })}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {LIFECYCLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={form.ownerId}
          onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Sem owner</option>
          {agents
            .filter((agent) => agent.isActive)
            .map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
        </select>
      </div>
      <CustomFieldsEditor rows={customFields} onChange={setCustomFields} />
      <Button type="submit" size="sm" disabled={loading || !form.phone}>
        {loading ? 'Criando...' : 'Criar contato'}
      </Button>
    </form>
  );
}

// ─── Import CSV Section ───────────────────────────────────────────────────────

function ImportCsvSection({ onImported, onCancel }: { onImported: () => void; onCancel: () => void }) {
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreview(null);
    setLoading(true);
    try {
      const result = await importPreview(file);
      setPreview(result);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao processar o arquivo');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setConfirming(true);
    try {
      const { count } = await importConfirm(preview.toCreate);
      setImportedCount(count);
      setDone(true);
      setTimeout(() => onImported(), 600);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao importar contatos');
    } finally {
      setConfirming(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border/70 bg-muted/30 p-6 text-center space-y-3">
        <CheckCircle2 className="mx-auto size-8 text-green-500" />
        <p className="text-sm font-semibold text-foreground">Importação enviada!</p>
        <p className="text-xs text-muted-foreground">
          {importedCount} contato{importedCount !== 1 ? 's' : ''} sendo processados em segundo plano.
        </p>
        <Button size="sm" variant="ghost" onClick={onCancel}>Fechar</Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-5 space-y-4">
      <p className="text-sm font-semibold text-foreground">Importar contatos via CSV</p>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Arquivo CSV — colunas: <code className="font-mono text-foreground">phone</code> (obrigatório),{' '}
          <code className="font-mono text-foreground">name</code>,{' '}
          <code className="font-mono text-foreground">email</code>
        </label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent cursor-pointer"
        />
        <p className="text-xs text-muted-foreground">Separador: vírgula ou ponto-e-vírgula. Telefone no formato E.164 (ex: +5511999999999)</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Analisando arquivo...
        </div>
      )}

      {preview && !loading && (
        <div className="space-y-3">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-center">
              <p className="text-lg font-bold text-foreground">{preview.toCreate.length}</p>
              <p className="text-xs text-muted-foreground">para importar</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-center">
              <p className="text-lg font-bold text-amber-500">{preview.duplicates.length}</p>
              <p className="text-xs text-muted-foreground">duplicados</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-center">
              <p className="text-lg font-bold text-destructive">{preview.invalid.length}</p>
              <p className="text-xs text-muted-foreground">inválidos</p>
            </div>
          </div>

          {/* Prévia da tabela */}
          {preview.toCreate.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Prévia — primeiros {Math.min(5, preview.toCreate.length)} de {preview.toCreate.length}
              </p>
              <div className="rounded-lg border border-border/70 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Telefone</th>
                      <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Nome</th>
                      <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.toCreate.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="px-3 py-1.5 font-mono">{row.phone}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.name ?? '—'}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{row.email ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Linhas inválidas */}
          {preview.invalid.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              <p className="text-xs font-semibold text-destructive">
                Linhas inválidas (serão ignoradas)
              </p>
              {preview.invalid.slice(0, 3).map((inv, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  Linha {inv.row}:{' '}
                  <span className="font-mono">{inv.phone || '(vazio)'}</span> — {inv.reason}
                </p>
              ))}
              {preview.invalid.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  ... e mais {preview.invalid.length - 3} linha(s)
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        {preview && preview.toCreate.length > 0 && (
          <Button size="sm" onClick={handleConfirm} disabled={confirming}>
            {confirming && <Loader2 className="size-4 animate-spin" />}
            {confirming
              ? 'Importando...'
              : `Importar ${preview.toCreate.length} contato${preview.toCreate.length !== 1 ? 's' : ''}`}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Contact Row ─────────────────────────────────────────────────────────────

function ContactRow({
  contact,
  agents,
  tags,
  contacts,
  selected,
  onDelete,
  onTagAdded,
  onTagRemoved,
  onUpdated,
  onToggleSelected,
}: {
  contact: Contact;
  agents: Array<{ id: string; name: string; isActive: boolean }>;
  tags: Tag[];
  contacts: Contact[];
  selected: boolean;
  onDelete: () => void;
  onTagAdded: () => void;
  onTagRemoved: () => void;
  onUpdated: () => void;
  onToggleSelected: () => void;
}) {
  const name = contact.name ?? contact.phone;
  const initials = name.slice(0, 2).toUpperCase();
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    company: contact.company ?? '',
    ownerId: contact.owner?.id ?? '',
    lifecycleStage: contact.lifecycleStage,
  });
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>(
    getCustomFieldDrafts(contact.customFields),
  );
  const appliedTagIds = new Set(contact.contactTags.map((ct) => ct.tag.id));
  const mergeCandidates = contacts.filter((candidate) => candidate.id !== contact.id);

  useEffect(() => {
    setDraft({
      company: contact.company ?? '',
      ownerId: contact.owner?.id ?? '',
      lifecycleStage: contact.lifecycleStage,
    });
    setCustomFields(getCustomFieldDrafts(contact.customFields));
  }, [contact.company, contact.customFields, contact.lifecycleStage, contact.owner?.id]);

  useEffect(() => {
    if (!mergeCandidates.some((candidate) => candidate.id === mergeTargetId)) {
      setMergeTargetId('');
    }
  }, [mergeCandidates, mergeTargetId]);

  async function handleAddTag(tagId: string) {
    await addTag(contact.id, tagId);
    onTagAdded();
    setShowTagPicker(false);
  }

  async function handleRemoveTag(tagId: string) {
    await removeTag(contact.id, tagId);
    onTagRemoved();
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateContact(contact.id, {
        company: draft.company.trim() || null,
        customFields: normalizeCustomFields(customFields),
        ownerId: draft.ownerId || null,
        lifecycleStage: draft.lifecycleStage,
      });
      onUpdated();
      setShowEditor(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao salvar contato');
    } finally {
      setSaving(false);
    }
  }

  async function handleMerge() {
    if (!mergeTargetId) return;
    setMerging(true);
    setError(null);
    try {
      await mergeContact(contact.id, mergeTargetId);
      setShowMerge(false);
      setMergeTargetId('');
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao mesclar contato');
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className={`rounded-xl border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/30 ${selected ? 'border-primary/40 bg-primary/5' : 'border-border/70 bg-background'}`}>
      <div className="flex items-start gap-4">
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelected}
        className="mt-2 size-4 rounded border-border text-primary"
        aria-label={`Selecionar contato ${name}`}
      />
      <Avatar className="size-10 shrink-0 border border-border/70">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Phone className="size-3" />{contact.phone}</span>
          {contact.email && <span className="flex items-center gap-1"><Mail className="size-3" />{contact.email}</span>}
          {contact.company && <span className="flex items-center gap-1"><Building2 className="size-3" />{contact.company}</span>}
          <span className="flex items-center gap-1"><Briefcase className="size-3" />{contact.owner?.name ?? 'Sem owner'}</span>
          <Badge variant={getLifecycleBadgeVariant(contact.lifecycleStage)} className="text-[10px]">
            {getLifecycleLabel(contact.lifecycleStage)}
          </Badge>
        </div>
        {Object.entries(contact.customFields ?? {}).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Object.entries(contact.customFields).map(([key, value]) => (
              <span
                key={key}
                className="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground"
              >
                <span className="font-medium text-foreground">{key}:</span> {value}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {contact.contactTags.map(({ tag }) => (
            <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id)} />
          ))}
          <div className="relative">
            <Button
              size="icon"
              variant="ghost"
              className="size-6"
              onClick={() => setShowTagPicker((v) => !v)}
              title="Adicionar tag"
            >
              <TagIcon className="size-3" />
            </Button>
            {showTagPicker && (
              <div className="absolute left-0 top-7 z-10 min-w-40 rounded-xl border border-border/70 bg-background p-2 shadow-lg">
                {tags.filter((t) => !appliedTagIds.has(t.id)).length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">Todas as tags aplicadas</p>
                ) : (
                  tags
                    .filter((t) => !appliedTagIds.has(t.id))
                    .map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleAddTag(t.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-accent"
                      >
                        <span className="size-2 rounded-full" style={{ background: t.color }} />
                        {t.name}
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setShowEditor((current) => !current)}
          >
            {showEditor ? 'Fechar CRM' : 'Editar CRM'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={() => setShowMerge((current) => !current)}
            disabled={mergeCandidates.length === 0}
          >
            {showMerge ? 'Cancelar merge' : 'Mesclar'}
          </Button>
        </div>
      </div>

        <Button
          size="icon"
          variant="ghost"
          className="size-8 shrink-0 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Excluir"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {showEditor && (
        <div className="mt-3 space-y-3 border-t border-border/70 pt-3">
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.9fr_auto]">
            <Input
              placeholder="Empresa / organização"
              value={draft.company}
              onChange={(e) => setDraft((current) => ({ ...current, company: e.target.value }))}
            />
            <select
              value={draft.lifecycleStage}
              onChange={(e) =>
                setDraft((current) => ({
                  ...current,
                  lifecycleStage: e.target.value as Contact['lifecycleStage'],
                }))
              }
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {LIFECYCLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={draft.ownerId}
              onChange={(e) => setDraft((current) => ({ ...current, ownerId: e.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sem owner</option>
              {agents
                .filter((agent) => agent.isActive)
                .map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
            </select>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          <CustomFieldsEditor rows={customFields} onChange={setCustomFields} />
        </div>
      )}

      {showMerge && (
        <div className="mt-3 space-y-3 border-t border-border/70 pt-3">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <select
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Escolha o contato principal</option>
              {mergeCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {(candidate.name ?? candidate.phone)} · {candidate.phone}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleMerge} disabled={merging || !mergeTargetId}>
              {merging ? 'Mesclando...' : 'Confirmar merge'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            O contato atual será removido e conversas, tags, pipelines e estado de automação serão consolidados no contato principal.
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ContactsPage() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLORS[0]);
  const deferredSearch = useDeferredValue(search);

  const { contacts, mutate, isLoading } = useContacts({ search: deferredSearch || undefined, tagId: selectedTag });
  const { tags, mutate: mutateTags } = useTags();
  const { agents } = useAgents();

  async function handleDeleteContact(id: string) {
    await deleteContact(id);
    void mutate();
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName) return;
    await createTag(newTagName, newTagColor);
    await mutateTags();
    setNewTagName('');
    setShowCreateTag(false);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar de filtros */}
      <aside className="w-56 shrink-0 border-r border-border/70 bg-muted/20 flex flex-col">
        <div className="p-4 border-b border-border/70">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtrar por tag</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => setSelectedTag(undefined)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${!selectedTag ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
          >
            Todos os contatos
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.id ? undefined : tag.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${selectedTag === tag.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-accent'}`}
            >
              <span className="size-2 rounded-full" style={{ background: tag.color }} />
              {tag.name}
            </button>
          ))}
          <button
            onClick={() => setShowCreateTag((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent mt-2 border border-dashed border-border"
          >
            <Plus className="size-3" /> Nova tag
          </button>
          {showCreateTag && (
            <form onSubmit={handleCreateTag} className="mt-2 space-y-2">
              <Input
                placeholder="Nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="text-xs h-8"
              />
              <div className="flex gap-1 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className="size-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background: c, borderColor: newTagColor === c ? '#000' : 'transparent' }}
                  />
                ))}
              </div>
              <Button size="sm" type="submit" className="w-full h-7 text-xs" disabled={!newTagName}>
                Criar
              </Button>
            </form>
          )}
        </div>
      </aside>

      {/* Lista principal */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/70 px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou telefone"
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{contacts.length} contato{contacts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowImport((v) => !v); setShowCreate(false); }}
            >
              <Upload className="size-4" />
              Importar CSV
            </Button>
            <Button
              size="sm"
              onClick={() => { setShowCreate((v) => !v); setShowImport(false); }}
            >
              <UserPlus className="size-4" />
              Novo contato
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {showImport && (
            <ImportCsvSection
              onImported={() => { setShowImport(false); void mutate(); }}
              onCancel={() => setShowImport(false)}
            />
          )}
          {showCreate && (
            <CreateContactForm
              agents={agents}
              onCreated={() => {
                setShowCreate(false);
                void mutate();
              }}
            />
          )}

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border border-border/70 p-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : contacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
              <UserPlus className="mx-auto mb-3 size-10 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">Nenhum contato encontrado</p>
              <p className="mt-1 text-xs text-muted-foreground">Crie um novo contato ou ajuste os filtros.</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                agents={agents}
                tags={tags}
                contacts={contacts}
                onDelete={() => handleDeleteContact(contact.id)}
                onTagAdded={() => void mutate()}
                onTagRemoved={() => void mutate()}
                onUpdated={() => void mutate()}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
