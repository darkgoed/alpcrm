'use client';

import { useState } from 'react';
import { Edit2, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  useQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  type QuickReply,
} from '@/hooks/useQuickReplies';

// ─── Formulário de criação ────────────────────────────────────────────────────

function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ shortcut: '', title: '', body: '' });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await createQuickReply(form); setForm({ shortcut: '', title: '', body: '' }); onCreated(); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Atalho (ex: saudacao)"
          value={form.shortcut}
          onChange={(e) => setForm({ ...form, shortcut: e.target.value })}
          required
        />
        <Input
          placeholder="Título interno"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <textarea
        placeholder="Corpo da resposta. Use {{contact_name}}, {{agent_name}}"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={3}
        required
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
      />
      <Button type="submit" disabled={saving || !form.shortcut || !form.title || !form.body}>
        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
        Criar resposta rápida
      </Button>
    </form>
  );
}

// ─── Item de resposta rápida ──────────────────────────────────────────────────

function QuickReplyItem({ qr, onAction }: { qr: QuickReply; onAction: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ shortcut: qr.shortcut, title: qr.title, body: qr.body });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await updateQuickReply(qr.id, form); setEditing(false); onAction(); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm('Excluir esta resposta rápida?')) return;
    setSaving(true);
    try { await deleteQuickReply(qr.id); onAction(); }
    finally { setSaving(false); }
  }

  if (editing) {
    return (
      <div className="space-y-2 rounded-lg border border-primary/30 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Input value={form.shortcut} onChange={(e) => setForm({ ...form, shortcut: e.target.value })} />
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-border p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-primary font-mono">/{qr.shortcut}</code>
          <span className="text-sm font-medium">{qr.title}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{qr.body}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={saving}>
          <Edit2 className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDelete} disabled={saving}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function QuickRepliesSection() {
  const { quickReplies, isLoading, mutate } = useQuickReplies();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Respostas Rápidas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie atalhos para textos frequentes. No chat, digite <code className="text-xs bg-muted px-1 rounded">/</code> para buscar.
          Use <code className="text-xs bg-muted px-1 rounded">{"{{contact_name}}"}</code> e <code className="text-xs bg-muted px-1 rounded">{"{{agent_name}}"}</code> como variáveis.
        </p>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : <><Plus className="size-4 mr-1" />Nova resposta</>}
        </Button>
      </div>

      {showForm && (
        <CreateForm onCreated={() => { mutate(); setShowForm(false); }} />
      )}

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
          : quickReplies.map((qr) => (
              <QuickReplyItem key={qr.id} qr={qr} onAction={() => mutate()} />
            ))}
        {!isLoading && quickReplies.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma resposta rápida criada.</p>
        )}
      </div>
    </div>
  );
}
