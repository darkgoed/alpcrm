'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { KeyRound, Loader2, LogOut, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
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

interface TwoFactorStatus {
  enabled: boolean;
  pendingSetup: boolean;
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
  const { data: twoFactorStatus, mutate: mutateTwoFactor } = useSWR<TwoFactorStatus>(
    '/auth/2fa/status',
    fetcher,
  );
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);

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

  async function handleStartTwoFactorSetup() {
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setTwoFactorSecret(data.secret);
      await mutateTwoFactor();
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleEnableTwoFactor() {
    setTwoFactorLoading(true);
    setTwoFactorMessage(null);
    try {
      await api.post('/auth/2fa/enable', { code: twoFactorCode });
      setTwoFactorSecret(null);
      setTwoFactorCode('');
      setTwoFactorMessage('2FA ativado com sucesso.');
      await mutateTwoFactor();
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : 'Não foi possível ativar o 2FA.';
      setTwoFactorMessage(message);
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleDisableTwoFactor() {
    const currentPassword = window.prompt('Confirme sua senha atual para desativar o 2FA:');
    if (!currentPassword) return;

    setTwoFactorLoading(true);
    setTwoFactorMessage(null);
    try {
      await api.post('/auth/2fa/disable', { current_password: currentPassword });
      setTwoFactorSecret(null);
      setTwoFactorCode('');
      setTwoFactorMessage('2FA desativado.');
      await mutateTwoFactor();
    } catch (error) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : 'Não foi possível desativar o 2FA.';
      setTwoFactorMessage(message);
    } finally {
      setTwoFactorLoading(false);
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
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            <CardTitle className="text-base">2FA opcional</CardTitle>
          </div>
          <CardDescription>
            Ative códigos TOTP de 6 dígitos em um app autenticador para reforçar o login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Status atual: {twoFactorStatus?.enabled ? 'ativado' : 'desativado'}.
          </p>
          {!twoFactorStatus?.enabled && !twoFactorSecret ? (
            <Button variant="outline" size="sm" onClick={handleStartTwoFactorSetup} disabled={twoFactorLoading}>
              {twoFactorLoading ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}
              Configurar 2FA
            </Button>
          ) : null}
          {twoFactorSecret ? (
            <div className="space-y-3 rounded-xl border border-border/70 px-4 py-3">
              <p className="text-sm font-medium text-foreground">1. Cadastre esta chave no autenticador</p>
              <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs">{twoFactorSecret}</code>
              <p className="text-sm font-medium text-foreground">2. Informe o código gerado</p>
              <div className="flex items-center gap-2">
                <input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" onClick={handleEnableTwoFactor} disabled={twoFactorLoading}>
                  {twoFactorLoading ? 'Validando...' : 'Ativar'}
                </Button>
              </div>
            </div>
          ) : null}
          {twoFactorStatus?.enabled ? (
            <Button variant="outline" size="sm" onClick={handleDisableTwoFactor} disabled={twoFactorLoading}>
              Desativar 2FA
            </Button>
          ) : null}
          {twoFactorMessage ? <p className="text-xs text-muted-foreground">{twoFactorMessage}</p> : null}
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
