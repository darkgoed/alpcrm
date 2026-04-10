import type { ReactNode } from 'react';
import Link from 'next/link';
import { MessageSquareText, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  footerText: string;
  footerHref: string;
  footerLabel: string;
  accent?: 'login' | 'register';
}

const highlights = [
  { icon: ShieldCheck, title: 'Operação segura', text: 'Permissões por workspace, sessão persistente e autenticação centralizada.' },
  { icon: MessageSquareText, title: 'Inbox unificada', text: 'Converse, distribua e acompanhe atendimento em tempo real.' },
  { icon: Sparkles, title: 'Automação pronta', text: 'Ative flows com regras, palavras-chave e respostas assistidas.' },
];

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  footerText,
  footerHref,
  footerLabel,
  accent = 'login',
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef5ff_48%,_#f8fafc_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.09)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="hidden max-w-xl space-y-8 lg:block">
          <Badge variant="outline" className="border-primary/20 bg-background/80 px-3 py-1 text-primary shadow-sm backdrop-blur">
            {eyebrow}
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-slate-950 xl:text-5xl">
              CRM omnichannel com foco em operação, velocidade e contexto.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Centralize conversas, automações e indicadores do time em uma experiência limpa, rápida e pronta para escalar.
            </p>
          </div>
          <div className="grid gap-4">
            {highlights.map(({ icon: Icon, title: itemTitle, text }) => (
              <div key={itemTitle} className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon className="size-5" />
                </div>
                <p className="text-base font-semibold text-slate-900">{itemTitle}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-lg">
          <div
            className={cn(
              'rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur xl:p-8',
              accent === 'register' && 'shadow-[0_24px_80px_-32px_rgba(21,128,61,0.35)]',
            )}
          >
            <div className="mb-8 space-y-3 text-center lg:text-left">
              <Badge variant="secondary" className="bg-slate-900 text-white hover:bg-slate-900">
                {eyebrow}
              </Badge>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
                <p className="text-sm leading-6 text-slate-600">{description}</p>
              </div>
            </div>
            {children}
            <p className="mt-6 text-center text-sm text-slate-500 lg:text-left">
              {footerText}{' '}
              <Link href={footerHref} className="font-semibold text-primary transition-colors hover:text-primary/80">
                {footerLabel}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
