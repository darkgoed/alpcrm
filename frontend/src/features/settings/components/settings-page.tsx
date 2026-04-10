'use client';

import { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, Save, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useWorkspaceSettings,
  useFollowUpRules,
  updateSettings,
  createFollowUpRule,
  updateFollowUpRule,
  deleteFollowUpRule,
} from '@/hooks/useWorkspaceSettings';
import { SettingsShell } from './settings-shell';

// ─── Auto-close Settings ─────────────────────────────────────────────────────

function AutoCloseSection() {
  const { settings, isLoading, mutate } = useWorkspaceSettings();
  const [hours, setHours] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings !== null) {
      setHours(settings.autoCloseHours != null ? String(settings.autoCloseHours) : '');
    }
  }, [settings?.autoCloseHours]);

  async function handleSave() {
    setSaving(true);
    try {
      const parsed = hours.trim() === '' ? null : parseInt(hours, 10);
      await updateSettings({ autoCloseHours: parsed && !isNaN(parsed) ? parsed : null });
      await mutate();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <CardTitle className="text-base">Encerramento automático</CardTitle>
        </div>
        <CardDescription>
          Conversas sem atividade por mais de X horas serão encerradas automaticamente.
          Deixe em branco para desativar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-48" />
        ) : (
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              placeholder="Horas (ex: 24)"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-48"
            />
            <span className="text-sm text-muted-foreground">horas sem resposta</span>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="size-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
        {settings?.autoCloseHours != null && (
          <p className="mt-2 text-xs text-muted-foreground">
            Ativo: conversas encerram após <strong>{settings.autoCloseHours}h</strong> sem mensagem.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Follow-up Rules ─────────────────────────────────────────────────────────

interface NewRuleForm {
  name: string;
  message: string;
  delayHours: string;
}

function FollowUpSection() {
  const { rules, isLoading, mutate } = useFollowUpRules();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewRuleForm>({ name: '', message: '', delayHours: '' });
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    const delay = parseInt(form.delayHours, 10);
    if (!form.name || !form.message || isNaN(delay) || delay < 1) return;
    setCreating(true);
    try {
      await createFollowUpRule({ name: form.name, message: form.message, delayHours: delay });
      await mutate();
      setForm({ name: '', message: '', delayHours: '' });
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setTogglingId(id);
    try {
      await updateFollowUpRule(id, { isActive: !current });
      await mutate();
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteFollowUpRule(id);
      await mutate();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="size-4 text-primary" />
            <CardTitle className="text-base">Follow-up automático</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            Nova regra
          </Button>
        </div>
        <CardDescription>
          Mensagens enviadas automaticamente quando o contato não responde após X horas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && (
          <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Nova regra</p>
            <Input
              placeholder="Nome da regra (ex: Lembrete 24h)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Mensagem a enviar"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                placeholder="Horas sem resposta"
                value={form.delayHours}
                onChange={(e) => setForm({ ...form, delayHours: e.target.value })}
                className="w-48"
              />
              <span className="text-sm text-muted-foreground">horas</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? 'Criando...' : 'Criar regra'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <BellRing className="mx-auto mb-3 size-8 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">Nenhuma regra criada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie regras para reengajar contatos que pararam de responder.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-background px-4 py-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{rule.name}</p>
                    <Badge variant={rule.isActive ? 'success' : 'muted'}>
                      {rule.isActive ? 'Ativo' : 'Pausado'}
                    </Badge>
                    <Badge variant="secondary">
                      <Clock className="mr-1 size-3" />
                      {rule.delayHours}h
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{rule.message}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    disabled={togglingId === rule.id}
                    onClick={() => handleToggle(rule.id, rule.isActive)}
                    title={rule.isActive ? 'Pausar' : 'Ativar'}
                  >
                    {rule.isActive ? (
                      <ToggleRight className="size-4 text-primary" />
                    ) : (
                      <ToggleLeft className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:text-destructive"
                    disabled={deletingId === rule.id}
                    onClick={() => handleDelete(rule.id)}
                    title="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <SettingsShell>
      <div className="space-y-6">
        <AutoCloseSection />
        <Separator />
        <FollowUpSection />
      </div>
    </SettingsShell>
  );
}
