'use client';

import { useState } from 'react';
import { Copy, KeyRound, Loader2, Plus, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAgents,
  inviteAgent,
  deactivateAgent,
  resetAgentPassword,
  assignRole,
  removeRole,
  type Agent,
} from '@/hooks/useAgents';
import { useRoles as useRolesHook } from '@/hooks/useRoles';

// ─── Formulário de convite ────────────────────────────────────────────────────

function InviteForm({ onCreated }: { onCreated: () => void }) {
  const { roles } = useRolesHook();
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '' });
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await inviteAgent({
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        roleId: form.roleId || undefined,
      } as any);
      setTempPassword(result.temporaryPassword);
      setForm({ name: '', email: '', password: '', roleId: '' });
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  if (tempPassword) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
        <p className="text-sm font-medium text-amber-800">
          Agente criado! Anote a senha temporária abaixo — ela não será exibida novamente.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono border border-amber-200 text-amber-900">
            {tempPassword}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(tempPassword)}
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <Button size="sm" onClick={() => setTempPassword(null)}>Convidar outro agente</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="password"
          placeholder="Senha (deixe em branco para gerar)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
          value={form.roleId}
          onChange={(e) => setForm({ ...form, roleId: e.target.value })}
        >
          <option value="">Sem role inicial</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
        Convidar agente
      </Button>
    </form>
  );
}

// ─── Card de agente ───────────────────────────────────────────────────────────

function AgentCard({ agent, onAction }: { agent: Agent; onAction: () => void }) {
  const { roles } = useRolesHook();
  const [loading, setLoading] = useState(false);
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  async function handleDeactivate() {
    setLoading(true);
    try { await deactivateAgent(agent.id); onAction(); } finally { setLoading(false); }
  }

  async function handleReset() {
    setLoading(true);
    try {
      const res = await resetAgentPassword(agent.id);
      setTempPwd(res.temporaryPassword);
    } finally { setLoading(false); }
  }

  async function handleRoleToggle(roleId: string, has: boolean) {
    setLoading(true);
    try {
      if (has) await removeRole(agent.id, roleId);
      else await assignRole(agent.id, roleId);
      onAction();
    } finally { setLoading(false); }
  }

  const agentRoleIds = agent.userRoles.map((ur) => ur.role.id);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{agent.name}</p>
          <p className="text-xs text-muted-foreground">{agent.email}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {agent.userRoles.map((ur) => (
              <Badge key={ur.role.id} variant="secondary" className="text-xs">{ur.role.name}</Badge>
            ))}
            {agent.mustChangePassword && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Troca de senha pendente</Badge>
            )}
            {!agent.isActive && (
              <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Desativado</Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" variant="ghost" onClick={handleReset} disabled={loading} title="Redefinir senha">
            <KeyRound className="size-4" />
          </Button>
          {agent.isActive && (
            <Button size="sm" variant="ghost" onClick={handleDeactivate} disabled={loading} title="Desativar">
              <UserX className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {tempPwd && (
        <div className="flex items-center gap-2 rounded bg-amber-50 border border-amber-200 px-3 py-2">
          <code className="flex-1 text-xs font-mono text-amber-900">{tempPwd}</code>
          <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(tempPwd!)}>
            <Copy className="size-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setTempPwd(null)}>✕</Button>
        </div>
      )}

      {/* Role assignment */}
      <div className="flex flex-wrap gap-1 pt-1">
        {roles.map((role) => {
          const has = agentRoleIds.includes(role.id);
          return (
            <button
              key={role.id}
              onClick={() => handleRoleToggle(role.id, has)}
              disabled={loading}
              className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                has
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {role.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function AgentsSection() {
  const { agents, isLoading, mutate } = useAgents();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Agentes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os operadores do workspace, roles e senhas.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Convidar agente</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancelar' : <><Plus className="size-4 mr-1" />Novo</>}
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent>
            <InviteForm onCreated={() => { mutate(); setShowForm(false); }} />
          </CardContent>
        )}
      </Card>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))
          : agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onAction={() => mutate()} />
            ))}
        {!isLoading && agents.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum agente cadastrado.</p>
        )}
      </div>
    </div>
  );
}
