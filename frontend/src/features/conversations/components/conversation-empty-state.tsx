import Link from 'next/link';
import { ArrowRight, Bot, MessageSquareMore, TimerReset } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConversationEmptyState() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl items-start overflow-y-auto px-4 py-4 lg:items-center lg:px-6">
      <div className="grid w-full gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border border-border/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#0f766e_100%)] text-white shadow-none">
          <CardHeader className="space-y-3 p-5">
            <Badge variant="secondary" className="w-fit bg-white/12 text-white hover:bg-white/12">
              Inbox operacional
            </Badge>
            <CardTitle className="max-w-2xl text-2xl leading-tight">Selecione uma conversa para abrir o histórico e responder sem trocar de contexto.</CardTitle>
            <CardDescription className="max-w-xl text-sm leading-5 text-slate-100/80">
              A fila à esquerda mantém a triagem ativa enquanto você acompanha mensagens, responsáveis e contexto do lead no painel principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <Button asChild variant="secondary" className="h-9 bg-white text-slate-950 hover:bg-slate-100">
              <Link href="/automation">
                Revisar automações
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <Card className="border-border/60 bg-white/70 shadow-none">
            <CardHeader className="space-y-2 p-4">
              <MessageSquareMore className="size-4 text-primary" />
              <CardTitle className="text-base">Atendimento assistido</CardTitle>
              <CardDescription>Abra uma conversa para visualizar timeline, status de entrega e contexto do contato.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/60 bg-white/70 shadow-none">
            <CardHeader className="space-y-2 p-4">
              <TimerReset className="size-4 text-primary" />
              <CardTitle className="text-base">Fila priorizada</CardTitle>
              <CardDescription>O rail lateral atualiza a ordem de prioridade sempre que uma nova mensagem entra.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/60 bg-white/70 shadow-none">
            <CardHeader className="space-y-2 p-4">
              <Bot className="size-4 text-primary" />
              <CardTitle className="text-base">Automação integrada</CardTitle>
              <CardDescription>Combine distribuição manual com flows automáticos sem sair do workspace.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
