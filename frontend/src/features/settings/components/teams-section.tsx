'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useTeams,
  createTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  type Team,
} from '@/hooks/useTeams';
import { useAgents } from '@/hooks/useAgents';

const TEAM_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ─── Card de equipe ───────────────────────────────────────────────────────────

function TeamCard({ team, onAction }: { team: Team; onAction: () => void }) {
  const { agents } = useAgents();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const memberIds = team.teamUsers.map((tu) => tu.user.id);
  const nonMembers = agents.filter(
    (a) => !memberIds.includes(a.id) && a.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAdd(userId: string) {
    setLoading(true);
    try { await addTeamMember(team.id, userId); onAction(); } finally { setLoading(false); }
  }

  async function handleRemove(userId: string) {
    setLoading(true);
    try { await removeTeamMember(team.id, userId); onAction(); } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm(`Excluir equipe "${team.name}"?`)) return;
    setLoading(true);
    try { await deleteTeam(team.id); onAction(); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="size-3 rounded-full shrink-0"
              style={{ background: team.color ?? '#6366f1' }}
            />
            <CardTitle className="text-sm">{team.name}</CardTitle>
            {team.description && (
              <span className="text-xs text-muted-foreground">— {team.description}</span>
            )}
          </div>
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={loading}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Membros atuais */}
        <div className="flex flex-wrap gap-1">
          {team.teamUsers.length === 0 && (
            <span className="text-xs text-muted-foreground">Sem membros.</span>
          )}
          {team.teamUsers.map((tu) => (
            <Badge key={tu.user.id} variant="secondary" className="gap-1">
              {tu.user.name}
              <button
                onClick={() => handleRemove(tu.user.id)}
                disabled={loading}
                className="ml-1 opacity-60 hover:opacity-100"
              >
                <UserMinus className="size-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Adicionar membro */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar agente para adicionar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        {search && (
          <div className="flex flex-wrap gap-1">
            {nonMembers.slice(0, 6).map((agent) => (
              <button
                key={agent.id}
                onClick={() => { handleAdd(agent.id); setSearch(''); }}
                disabled={loading}
                className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs hover:border-primary hover:text-primary transition-colors"
              >
                <UserPlus className="size-3" /> {agent.name}
              </button>
            ))}
            {nonMembers.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhum agente encontrado.</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Seção principal ──────────────────────────────────────────────────────────

export function TeamsSection() {
  const { teams, isLoading, mutate } = useTeams();
  const [form, setForm] = useState({ name: '', description: '', color: TEAM_COLORS[0] });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await createTeam(form);
      setForm({ name: '', description: '', color: TEAM_COLORS[0] });
      setShowForm(false);
      mutate();
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Equipes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Organize agentes em equipes para roteamento e visibilidade.
        </p>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : <><Plus className="size-4 mr-1" />Nova equipe</>}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Nome da equipe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Descrição (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Cor:</span>
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`size-5 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <Button type="submit" disabled={creating || !form.name.trim()}>
                {creating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Criar equipe
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))
          : teams.map((team) => (
              <TeamCard key={team.id} team={team} onAction={() => mutate()} />
            ))}
        {!isLoading && teams.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma equipe criada.</p>
        )}
      </div>
    </div>
  );
}
