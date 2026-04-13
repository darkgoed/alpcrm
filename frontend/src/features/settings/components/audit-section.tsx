'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, any> | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

const ENTITY_LABELS: Record<string, string> = {
  conversation: 'Conversa',
  contact: 'Contato',
  user: 'Usuário',
  role: 'Role',
  team: 'Equipe',
  template: 'Template',
  flow: 'Fluxo',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  close: 'bg-amber-100 text-amber-700',
  assign: 'bg-purple-100 text-purple-700',
  login: 'bg-gray-100 text-gray-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function AuditSection() {
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = new URLSearchParams();
  if (entity) params.set('entity', entity);
  if (from) params.set('from', new Date(from).toISOString());
  if (to) params.set('to', new Date(to + 'T23:59:59').toISOString());
  params.set('take', '100');

  const { data, isLoading } = useSWR<AuditLog[]>(
    `/workspaces/audit-logs?${params.toString()}`,
    (url: string) => api.get(url).then((r) => r.data),
  );

  const logs = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Auditoria</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico de ações realizadas no workspace.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">Todos os tipos</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <Input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-40 h-9 text-sm"
          placeholder="De"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-40 h-9 text-sm"
          placeholder="Até"
        />
        {(entity || from || to) && (
          <Button size="sm" variant="ghost" onClick={() => { setEntity(''); setFrom(''); setTo(''); }}>
            Limpar
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Data</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Ator</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Ação</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Entidade</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              : logs.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Nenhum log encontrado.
                  </td>
                </tr>
              )
              : logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      {log.user ? (
                        <span className="text-sm">{log.user.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      {ENTITY_LABELS[log.entity] ?? log.entity}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                      {log.entityId.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
