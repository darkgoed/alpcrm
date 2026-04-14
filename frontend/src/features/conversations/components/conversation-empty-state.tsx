import Link from 'next/link';
import { ArrowRight, Bot, MessageSquareMore, TimerReset } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConversationEmptyState() {
  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl items-start overflow-y-auto px-4 py-6 lg:items-center lg:px-6">
      <div className="grid w-full gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-none bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_60%,#22c55e_100%)] text-white shadow-[0_24px_70px_-32px_rgba(30,64,175,0.45)]">
          <CardHeader className="space-y-4">
            <Badge variant="secondary" className="w-fit bg-white/15 text-white hover:bg-white/15">
              Inbox operacional
            </Badge>
            <CardTitle className="text-3xl leading-tight">Selecione uma conversa para abrir o histórico e responder sem trocar de contexto.</CardTitle>
            <CardDescription className="max-w-xl text-sm leading-6 text-slate-100/85">
              A fila à esquerda mantém a triagem ativa enquanto você acompanha mensagens, responsáveis e contexto do lead no painel principal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" variant="secondary" className="bg-white text-slate-950 hover:bg-slate-100">
              <Link href="/automation">
                Revisar automações
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/70 bg-white/70">
            <CardHeader>
              <MessageSquareMore className="size-5 text-primary" />
              <CardTitle className="text-base">Atendimento assistido</CardTitle>
              <CardDescription>Abra uma conversa para visualizar timeline, status de entrega e contexto do contato.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-white/70">
            <CardHeader>
              <TimerReset className="size-5 text-primary" />
              <CardTitle className="text-base">Fila priorizada</CardTitle>
              <CardDescription>O rail lateral atualiza a ordem de prioridade sempre que uma nova mensagem entra.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-border/70 bg-white/70">
            <CardHeader>
              <Bot className="size-5 text-primary" />
              <CardTitle className="text-base">Automação integrada</CardTitle>
              <CardDescription>Combine distribuição manual com flows automáticos sem sair do workspace.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
