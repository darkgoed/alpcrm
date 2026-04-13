'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  useRoles,
  usePermissions,
  createRole,
  updateRolePermissions,
  deleteRole,
  type Role,
} from '@/hooks/useRoles';

// ─── Permissões agrupadas por domínio ────────────────────────────────────────

const PERMISSION_GROUPS = [
  {
    label: 'Conversas',
    keys: ['view_all_conversations', 'assign_conversation', 'respond_conversation', 'close_conversation'],
  },
  {
    label: 'Usuários & Roles',
    keys: ['manage_users', 'manage_roles'],
  },
  {
    label: 'Equipes',
    keys: ['manage_teams'],
  },
  {
    label: 'WhatsApp',
    keys: ['manage_whatsapp_accounts'],
  },
  {
    label: 'Contatos & Pipeline',
    keys: ['manage_contacts', 'manage_pipelines'],
  },
  {
    label: 'Automação & Workspace',
    keys: ['manage_flows', 'manage_workspace'],
  },
];

const PERM_LABEL: Record<string, string> = {
  view_all_conversations:   'Ver todas as conversas',
  assign_conversation:      'Atribuir conversa',
  respond_conversation:     'Responder conversa',
  close_conversation:       'Fechar/reabrir conversa',
  manage_users:             'Gerenciar agentes',
  manage_roles:             'Gerenciar roles',
  manage_teams:             'Gerenciar equipes',
  manage_whatsapp_accounts: 'Gerenciar contas WhatsApp',
  manage_contacts:          'Gerenciar contatos',
  manage_pipelines:         'Gerenciar pipelines',
  manage_flows:             'Gerenciar automações',
  manage_workspace:         'Configurações do workspace',
};

// ─── Editor de role ───────────────────────────────────────────────────────────

function RoleEditor({ role, onAction }: { role: Role; onAction: () => void }) {
  const { permissions } = usePermissions();
  const [saving, setSaving] = useState(false);

  const currentIds = role.rolePermissions.map((rp) => rp.permission.id);

  async function togglePermission(permId: string) {
    const next = currentIds.includes(permId)
      ? currentIds.filter((id) => id !== permId)
      : [...currentIds, permId];

    setSaving(true);
    try { await updateRolePermissions(role.id, next); onAction(); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm(`Excluir role "${role.name}"?`)) return;
    setSaving(true);
    try { await deleteRole(role.id); onAction(); } finally { setSaving(false); }
  }

  const permByKey = Object.fromEntries(permissions.map((p) => [p.key, p]));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{role.name}</CardTitle>
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={saving}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-muted-foreground mb-2">{group.label}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {group.keys.map((key) => {
                const perm = permByKey[key];
                if (!perm) return null;
                const active = currentIds.includes(perm.id);
                return (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={saving}
                      onChange={() => togglePermission(perm.id)}
                      className="rounded border-input accent-primary"
                    />
                    <span className="text-sm">{PERM_LABEL[key] ?? key}</span>
                  </label>
                );
              })}
            </div>
            <Separator className="mt-3" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function RolesSection() {
  const { roles, isLoading, mutate } = useRoles();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try { await createRole(newName.trim()); setNewName(''); mutate(); } finally { setCreating(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Roles e Permissões</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie roles customizadas e configure as permissões por domínio.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          placeholder="Nome da nova role (ex: Supervisor)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
          Criar role
        </Button>
      </form>

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))
          : roles.map((role) => (
              <RoleEditor key={role.id} role={role} onAction={() => mutate()} />
            ))}
        {!isLoading && roles.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma role criada.</p>
        )}
      </div>
    </div>
  );
}
