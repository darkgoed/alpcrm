'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  useRoles,
  usePermissions,
  createRole,
  updateRolePermissions,
  deleteRole,
  type Role,
  type Permission,
} from '@/hooks/useRoles';

interface PermissionMeta {
  label: string;
  description: string;
  group: string;
}

const PERMISSION_META: Record<string, PermissionMeta> = {
  view_all_conversations: {
    label: 'Ver todas as conversas',
    description: 'Acessa filas e conversas fora da carteira própria.',
    group: 'Atendimento',
  },
  assign_conversation: {
    label: 'Atribuir conversas',
    description: 'Distribui atendimento entre agentes e equipes.',
    group: 'Atendimento',
  },
  respond_conversation: {
    label: 'Responder conversas',
    description: 'Envia mensagens e interage com contatos.',
    group: 'Atendimento',
  },
  close_conversation: {
    label: 'Fechar e reabrir conversas',
    description: 'Controla encerramento e reabertura manual.',
    group: 'Atendimento',
  },
  manage_internal_notes: {
    label: 'Notas internas',
    description: 'Permite registrar contexto interno nas conversas.',
    group: 'Atendimento',
  },
  initiate_outbound_conversation: {
    label: 'Iniciar outbound',
    description: 'Abre conversas ativas usando templates aprovados.',
    group: 'Atendimento',
  },
  manage_users: {
    label: 'Gerenciar agentes',
    description: 'Convida, edita, desativa e redefine senha de usuários.',
    group: 'Equipe',
  },
  manage_roles: {
    label: 'Gerenciar roles',
    description: 'Cria roles e controla permissões do workspace.',
    group: 'Equipe',
  },
  manage_teams: {
    label: 'Gerenciar equipes',
    description: 'Cria times e altera membros vinculados.',
    group: 'Equipe',
  },
  manage_contacts: {
    label: 'Gerenciar contatos',
    description: 'Edita cadastro, etiquetas e dados do CRM.',
    group: 'CRM',
  },
  manage_pipelines: {
    label: 'Gerenciar pipelines',
    description: 'Configura stages e movimentação comercial.',
    group: 'CRM',
  },
  manage_flows: {
    label: 'Gerenciar automações',
    description: 'Cria, edita, ativa e remove fluxos de automação.',
    group: 'Automação',
  },
  manage_whatsapp_accounts: {
    label: 'Contas WhatsApp',
    description: 'Conecta números, tokens e configurações da conta.',
    group: 'Configurações',
  },
  manage_templates: {
    label: 'Templates HSM',
    description: 'Sincroniza, cria e remove templates oficiais.',
    group: 'Configurações',
  },
  manage_interactive_templates: {
    label: 'Templates interativos',
    description: 'Controla mensagens interativas reutilizáveis.',
    group: 'Configurações',
  },
  manage_quick_replies: {
    label: 'Respostas rápidas',
    description: 'Mantém atalhos de texto usados pelo time.',
    group: 'Configurações',
  },
  manage_workspace_settings: {
    label: 'Configurações gerais',
    description: 'Altera preferências centrais do workspace.',
    group: 'Configurações',
  },
  manage_follow_up_rules: {
    label: 'Regras de follow-up',
    description: 'Define automações de reengajamento por inatividade.',
    group: 'Configurações',
  },
  view_audit_logs: {
    label: 'Ver auditoria',
    description: 'Consulta histórico de alterações e rastreabilidade.',
    group: 'Configurações',
  },
  manage_workspace: {
    label: 'Administração ampla',
    description: 'Mantém compatibilidade com a permissão legada mais ampla.',
    group: 'Configurações',
  },
};

function formatFallbackLabel(key: string) {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildPermissionGroups(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>();

  for (const permission of permissions) {
    const group = PERMISSION_META[permission.key]?.group ?? 'Outras';
    const current = groups.get(group) ?? [];
    current.push(permission);
    groups.set(group, current);
  }

  return Array.from(groups.entries())
    .map(([label, items]) => ({
      label,
      items: items.sort((a, b) => {
        const left = PERMISSION_META[a.key]?.label ?? formatFallbackLabel(a.key);
        const right = PERMISSION_META[b.key]?.label ?? formatFallbackLabel(b.key);
        return left.localeCompare(right, 'pt-BR');
      }),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

function PermissionCheckbox({
  permission,
  active,
  disabled,
  onToggle,
}: {
  permission: Permission;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const meta = PERMISSION_META[permission.key];

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background px-3 py-3 transition-colors hover:bg-accent/40">
      <input
        type="checkbox"
        checked={active}
        disabled={disabled}
        onChange={onToggle}
        className="mt-1 rounded border-input accent-primary"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {meta?.label ?? formatFallbackLabel(permission.key)}
        </p>
        <p className="text-xs text-muted-foreground">
          {meta?.description ?? permission.key}
        </p>
      </div>
    </label>
  );
}

function RoleEditor({
  role,
  permissions,
  canManageRoles,
  onAction,
}: {
  role: Role;
  permissions: Permission[];
  canManageRoles: boolean;
  onAction: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const currentIds = role.rolePermissions.map((rp) => rp.permission.id);
  const groups = useMemo(() => buildPermissionGroups(permissions), [permissions]);

  async function savePermissions(nextPermissionIds: string[]) {
    if (!canManageRoles) return;
    setSaving(true);
    try {
      await updateRolePermissions(role.id, nextPermissionIds);
      onAction();
    } finally {
      setSaving(false);
    }
  }

  async function togglePermission(permissionId: string) {
    const next = currentIds.includes(permissionId)
      ? currentIds.filter((id) => id !== permissionId)
      : [...currentIds, permissionId];

    await savePermissions(next);
  }

  async function setGroupPermissions(groupPermissionIds: string[], enabled: boolean) {
    const next = enabled
      ? [...new Set([...currentIds, ...groupPermissionIds])]
      : currentIds.filter((id) => !groupPermissionIds.includes(id));

    await savePermissions(next);
  }

  async function handleDelete() {
    if (!canManageRoles || !confirm(`Excluir role "${role.name}"?`)) return;
    setSaving(true);
    try {
      await deleteRole(role.id);
      onAction();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-sm">{role.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{currentIds.length} permissões</Badge>
              <Badge variant="outline">{role._count?.userRoles ?? 0} usuários</Badge>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={saving || !canManageRoles}
            title={canManageRoles ? 'Excluir role' : 'Sem permissão para editar roles'}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {groups.map((group, index) => {
          const groupPermissionIds = group.items.map((permission) => permission.id);
          const selectedCount = groupPermissionIds.filter((id) => currentIds.includes(id)).length;
          const allSelected =
            groupPermissionIds.length > 0 && selectedCount === groupPermissionIds.length;

          return (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount}/{groupPermissionIds.length} selecionadas
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving || !canManageRoles}
                  onClick={() => setGroupPermissions(groupPermissionIds, !allSelected)}
                >
                  {allSelected ? 'Limpar grupo' : 'Selecionar grupo'}
                </Button>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {group.items.map((permission) => (
                  <PermissionCheckbox
                    key={permission.id}
                    permission={permission}
                    active={currentIds.includes(permission.id)}
                    disabled={saving || !canManageRoles}
                    onToggle={() => togglePermission(permission.id)}
                  />
                ))}
              </div>

              {index < groups.length - 1 ? <Separator /> : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function RolesSection() {
  const { hasPermission } = useAuth();
  const { roles, isLoading, mutate } = useRoles();
  const { permissions, isLoading: permissionsLoading } = usePermissions();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const canManageRoles = hasPermission('manage_roles');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !canManageRoles) return;

    setCreating(true);
    try {
      await createRole(newName.trim());
      setNewName('');
      mutate();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div>
          <h2 className="text-base font-semibold">Roles e Permissões</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monte perfis mais granulares para atendimento, CRM, automações e configuração.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <ShieldCheck className="mr-1 size-3.5" />
            {permissions.length} permissões disponíveis
          </Badge>
          {!canManageRoles ? (
            <Badge variant="outline">Modo leitura</Badge>
          ) : null}
        </div>
      </div>

      {!canManageRoles ? (
        <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Seu usuário pode visualizar roles, mas só perfis com <strong>Gerenciar roles</strong> podem editar.
        </div>
      ) : null}

      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Nome da nova role (ex: Supervisor)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="max-w-sm"
          disabled={!canManageRoles}
        />
        <Button type="submit" disabled={creating || !newName.trim() || !canManageRoles}>
          {creating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          Criar role
        </Button>
      </form>

      <div className="space-y-4">
        {isLoading || permissionsLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-lg" />
            ))
          : roles.map((role) => (
              <RoleEditor
                key={role.id}
                role={role}
                permissions={permissions}
                canManageRoles={canManageRoles}
                onAction={() => mutate()}
              />
            ))}

        {!isLoading && !permissionsLoading && roles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma role criada.</p>
        ) : null}
      </div>
    </div>
  );
}
