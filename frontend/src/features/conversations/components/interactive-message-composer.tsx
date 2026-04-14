'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, List, Loader2, SquareMousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  useInteractiveTemplates,
  type InteractiveTemplate,
} from '@/hooks/useInteractiveTemplates';

interface InteractiveComposerPayload {
  interactiveType: 'reply_buttons' | 'list' | 'cta_url';
  content: string;
  interactivePayload: Record<string, any>;
}

function TemplateKindIcon({
  template,
  className,
}: {
  template: InteractiveTemplate;
  className?: string;
}) {
  if (template.interactiveType === 'cta_url') {
    return <ExternalLink className={className} />;
  }

  if (template.interactiveType === 'list') {
    return <List className={className} />;
  }

  return <SquareMousePointer className={className} />;
}

function TemplatePreview({ template }: { template: InteractiveTemplate }) {
  const payload = template.interactivePayload;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{template.name}</p>
        {payload.headerText ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {payload.headerText}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-sm text-foreground">{template.content}</p>
        {payload.footer ? (
          <p className="text-xs text-muted-foreground">{payload.footer}</p>
        ) : null}
      </div>

      {template.interactiveType === 'reply_buttons' ? (
        <div className="flex flex-wrap gap-2">
          {payload.buttons?.map((button) => (
            <div key={button.id} className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs">
              {button.title}
            </div>
          ))}
        </div>
      ) : null}

      {template.interactiveType === 'list' ? (
        <div className="space-y-2">
          <div className="inline-flex rounded-lg border border-border/70 bg-background px-3 py-2 text-xs font-medium text-foreground">
            {payload.buttonText ?? 'Abrir lista'}
          </div>
          {payload.sections?.map((section) => (
            <div key={section.title} className="rounded-lg border border-border/70 bg-background p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {section.title}
              </p>
              <div className="mt-2 space-y-2">
                {section.rows.map((row) => (
                  <div key={row.id} className="rounded-md bg-muted/50 px-3 py-2 text-xs text-foreground">
                    {row.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {template.interactiveType === 'cta_url' ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs">
          <ExternalLink className="size-3.5 text-primary" />
          <span className="font-medium text-foreground">
            {payload.buttonText ?? 'Abrir link'}
          </span>
          <span className="truncate text-muted-foreground">{payload.url}</span>
        </div>
      ) : null}
    </div>
  );
}

export function InteractiveMessageComposer({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (payload: InteractiveComposerPayload) => Promise<void>;
}) {
  const { templates, isLoading } = useInteractiveTemplates();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }

    if (!selectedId && templates.length > 0) {
      setSelectedId(templates[0].id);
    }
  }, [open, selectedId, templates]);

  const selectedTemplate =
    templates.find((template) => template.id === selectedId) ?? null;

  async function handleSend() {
    if (!selectedTemplate) {
      setError('Selecione um template interativo.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await onSubmit({
        interactiveType: selectedTemplate.interactiveType,
        content: selectedTemplate.content,
        interactivePayload: selectedTemplate.interactivePayload,
      });
      setOpen(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          err?.message ??
          'Não foi possível enviar o template interativo.',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="h-8 gap-1.5 px-2.5 text-xs">
          <SquareMousePointer className="size-4" />
          Interativo
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Template interativo</DialogTitle>
          <DialogDescription>
            O operador não cria manualmente aqui. Selecione um template cadastrado em Configurações.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <SquareMousePointer className="mx-auto mb-3 size-8 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">Não existe nenhum template</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cadastre um template interativo em Configurações para disponibilizar no chat.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <ScrollArea className="max-h-[420px] rounded-xl border border-border/70">
              <div className="space-y-1 p-2">
                {templates.map((template) => {
                  const selected = template.id === selectedTemplate?.id;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedId(template.id)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                        selected
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-accent text-muted-foreground',
                      )}
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background">
                        <TemplateKindIcon template={template} className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {template.name}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {template.content}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {selectedTemplate ? <TemplatePreview template={selectedTemplate} /> : null}
          </div>
        )}

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || templates.length === 0}
          >
            {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Enviar template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
