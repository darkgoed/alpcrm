'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { KeyRound, Loader2, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return value;
  }
}

export function SecuritySection() {
  const { data, isLoading, mutate } = useSWR<Session[]>('/auth/sessions', fetcher);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const sessions = data ?? [];

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      await api.delete(`/auth/sessions/${id}`);
      await mutate();
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    if (!confirm('Encerrar todas as outras sessões? Você continuará logado neste navegador.')) return;
    setRevokingAll(true);
    try {
      await api.delete('/auth/sessions');
      await mutate();
    } finally {
      setRevokingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <CardTitle className="text-base">Senha</CardTitle>
          </div>
          <CardDescription>Troque sua senha a qualquer momento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/change-password">
            <Button variant="outline" size="sm">
              <KeyRound className="size-4" /> Alterar senha
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <CardTitle className="text-base">Sessões ativas</CardTitle>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeAll}
                disabled={revokingAll}
              >
                {revokingAll ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                Encerrar outras sessões
              </Button>
            )}
          </div>
          <CardDescription>
            Cada sessão representa um refresh token ativo. Encerrar revoga o acesso daquele dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sessão ativa.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Sessão criada em {formatDate(session.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira em {formatDate(session.expiresAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(session.id)}
                    disabled={revokingId === session.id}
                    title="Revogar sessão"
                  >
                    {revokingId === session.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
