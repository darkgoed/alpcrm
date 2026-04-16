'use client';

import Link from 'next/link';
import { ArrowUpRight, Bot, Clock3, MessageSquareMore, TrendingUp, Users2 } from 'lucide-react';
import type { Conversation } from '@/types';
import type { Flow } from '@/hooks/useAutomation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/dateUtils';

interface DashboardOverviewProps {
  conversations: Conversation[];
  flows: Flow[];
}

const metricCards = [
  {
    title: 'Conversas abertas',
    icon: MessageSquareMore,
    helper: 'Em atendimento agora',
    getValue: (conversations: Conversation[]) => conversations.filter((item) => item.status === 'open').length,
  },
  {
    title: 'Backlog fechado',
    icon: Clock3,
    helper: 'Finalizadas no workspace',
    getValue: (conversations: Conversation[]) => conversations.filter((item) => item.status === 'closed').length,
  },
  {
    title: 'Contatos ativos',
    icon: Users2,
    helper: 'Com última interação recente',
    getValue: (conversations: Conversation[]) => new Set(conversations.map((item) => item.contactId)).size,
  },
  {
    title: 'Flows ativados',
    icon: Bot,
    helper: 'Automação rodando',
    getValue: (_conversations: Conversation[], flows: Flow[]) => flows.filter((item) => item.isActive).length,
  },
];

export function DashboardOverview({ conversations, flows }: DashboardOverviewProps) {
  const recentConversations = [...conversations]
    .sort((left, right) => {
      const leftDate = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
      const rightDate = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;
      return rightDate - leftDate;
    })
    .slice(0, 5);

  const activeFlows = flows.filter((item) => item.isActive);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#22c55e_100%)] text-white shadow-[0_24px_70px_-32px_rgba(30,64,175,0.45)]">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit bg-white/15 text-white hover:bg-white/15">
              Visão geral da operação
            </Badge>
            <CardTitle className="text-3xl leading-tight sm:text-4xl">
              Atendimento, automação e distribuição em uma única superfície.
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 text-slate-100/85">
              Monitore a saúde da fila, ajuste flows e acompanhe os pontos de pressão do time comercial em poucos cliques.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="bg-white text-slate-950 hover:bg-slate-100">
              <Link href="/conversations">
                Abrir inbox
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="/automation">Ajustar automações</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/70">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle className="text-base">Sinais do dia</CardTitle>
            </div>
            <CardDescription>Leitura rápida da operação para priorização.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Atendimento</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{conversations.filter((item) => item.status === 'open').length}</p>
              <p className="mt-1 text-sm text-muted-foreground">conversas aguardando ou em progresso.</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Automação</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{activeFlows.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">flows ativos distribuindo mensagens e tempo de resposta.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ title, icon: Icon, helper, getValue }) => (
          <Card key={title} className="border-border/70 bg-white/70">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardDescription>{title}</CardDescription>
                <CardTitle className="text-3xl">{getValue(conversations, flows)}</CardTitle>
              </div>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-white/70">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Conversas recentes</CardTitle>
              <CardDescription>Leads e clientes com atividade mais recente no WhatsApp.</CardDescription>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-primary">
              <Link href="/conversations">Ver inbox</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentConversations.map((conversation) => {
              const name = conversation.contact.name ?? conversation.contact.phone;
              return (
                <Link
                  key={conversation.id}
                  href={`/conversations/${conversation.id}`}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{name}</p>
                    <p className="min-w-0 overflow-hidden text-xs text-muted-foreground break-words [overflow-wrap:anywhere] line-clamp-2">
                      {conversation.messages[0]?.content ?? 'Sem prévia disponível'}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge variant={conversation.status === 'open' ? 'success' : 'muted'}>
                      {conversation.status === 'open' ? 'Aberta' : 'Fechada'}
                    </Badge>
                    {conversation.lastMessageAt ? (
                      <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(conversation.lastMessageAt)}</span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-white/70">
          <CardHeader>
            <CardTitle className="text-base">Flows em destaque</CardTitle>
            <CardDescription>Regras prontas para acelerar triagem e boas-vindas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {flows.slice(0, 4).map((flow) => (
              <div key={flow.id} className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{flow.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {flow.triggerType === 'keyword'
                        ? `Palavra-chave: ${flow.triggerValue ?? 'não definida'}`
                        : flow.triggerType === 'new_conversation'
                          ? 'Disparo em nova conversa'
                          : 'Disparo em toda mensagem'}
                    </p>
                  </div>
                  <Badge variant={flow.isActive ? 'success' : 'muted'}>
                    {flow.isActive ? 'Ativo' : 'Pausado'}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {flow.nodes.slice(0, 3).map((node) => (
                    <Badge
                      key={node.id}
                      variant="outline"
                      className={cn(node.type === 'delay' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}
                    >
                      {node.type === 'delay' ? 'Delay' : 'Mensagem'}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
