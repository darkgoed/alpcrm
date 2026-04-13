'use client';

import { useState } from 'react';
import { Link2, List, Plus, SquareMousePointer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { InteractiveListSection } from '@/types';

type InteractiveKind = 'reply_buttons' | 'list' | 'cta_url';

interface InteractiveComposerPayload {
  interactiveType: InteractiveKind;
  content: string;
  interactivePayload: Record<string, any>;
}

function newButton() {
  return { id: crypto.randomUUID(), title: '' };
}

function newRow() {
  return { id: crypto.randomUUID(), title: '', description: '' };
}

function newSection(): InteractiveListSection {
  return {
    title: '',
    rows: [newRow()],
  };
}

export function InteractiveMessageComposer({
  disabled,
  onSubmit,
}: {
  disabled?: boolean;
  onSubmit: (payload: InteractiveComposerPayload) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<InteractiveKind>('reply_buttons');
  const [headerText, setHeaderText] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [url, setUrl] = useState('');
  const [buttons, setButtons] = useState([newButton(), newButton()]);
  const [sections, setSections] = useState<InteractiveListSection[]>([newSection()]);

  function reset() {
    setKind('reply_buttons');
    setHeaderText('');
    setBody('');
    setFooter('');
    setButtonText('');
    setUrl('');
    setButtons([newButton(), newButton()]);
    setSections([newSection()]);
    setError(null);
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    try {
      if (!body.trim()) throw new Error('Informe o corpo da mensagem.');

      if (kind === 'reply_buttons') {
        const sanitizedButtons = buttons
          .map((button) => ({ id: button.id.trim(), title: button.title.trim() }))
          .filter((button) => button.id && button.title);

        if (sanitizedButtons.length === 0) {
          throw new Error('Adicione ao menos um reply button.');
        }

        await onSubmit({
          interactiveType: kind,
          content: body.trim(),
          interactivePayload: {
            headerText: headerText.trim() || undefined,
            body: body.trim(),
            footer: footer.trim() || undefined,
            buttons: sanitizedButtons,
          },
        });
      }

      if (kind === 'list') {
        const sanitizedSections = sections
          .map((section) => ({
            title: section.title.trim(),
            rows: section.rows
              .map((row) => ({
                id: row.id.trim(),
                title: row.title.trim(),
                description: row.description?.trim() || undefined,
              }))
              .filter((row) => row.id && row.title),
          }))
          .filter((section) => section.title && section.rows.length > 0);

        if (!buttonText.trim()) {
          throw new Error('Informe o texto do botão da lista.');
        }
        if (sanitizedSections.length === 0) {
          throw new Error('Adicione ao menos uma seção com opções.');
        }

        await onSubmit({
          interactiveType: kind,
          content: body.trim(),
          interactivePayload: {
            headerText: headerText.trim() || undefined,
            body: body.trim(),
            footer: footer.trim() || undefined,
            buttonText: buttonText.trim(),
            sections: sanitizedSections,
          },
        });
      }

      if (kind === 'cta_url') {
        if (!buttonText.trim() || !url.trim()) {
          throw new Error('CTA URL exige texto de botão e URL.');
        }

        await onSubmit({
          interactiveType: kind,
          content: body.trim(),
          interactivePayload: {
            headerText: headerText.trim() || undefined,
            body: body.trim(),
            footer: footer.trim() || undefined,
            buttonText: buttonText.trim(),
            url: url.trim(),
          },
        });
      }

      setOpen(false);
      reset();
    } catch (err: any) {
      setError(err?.message ?? 'Nao foi possivel montar a mensagem interativa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <SquareMousePointer className="size-4" />
          Interativo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mensagem interativa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { value: 'reply_buttons', label: 'Reply buttons', icon: SquareMousePointer },
              { value: 'list', label: 'Lista', icon: List },
              { value: 'cta_url', label: 'CTA URL', icon: Link2 },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value as InteractiveKind)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm transition-colors',
                  kind === value
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border/70 text-muted-foreground hover:bg-accent',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Header</label>
              <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Corpo</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Texto principal da mensagem" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Footer</label>
              <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          {kind === 'reply_buttons' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Botões</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => buttons.length < 3 && setButtons((current) => [...current, newButton()])}
                  disabled={buttons.length >= 3}
                >
                  <Plus className="size-4" />
                  Adicionar
                </Button>
              </div>

              {buttons.map((button, index) => (
                <div key={button.id} className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    value={button.title}
                    onChange={(e) =>
                      setButtons((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, title: e.target.value } : item,
                        ),
                      )
                    }
                    placeholder="Titulo do botao"
                  />
                  <Input
                    value={button.id}
                    onChange={(e) =>
                      setButtons((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, id: e.target.value } : item,
                        ),
                      )
                    }
                    placeholder="ID da resposta"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setButtons((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                    disabled={buttons.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {kind === 'list' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Texto do botão</label>
                <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Ver opcoes" />
              </div>

              {sections.map((section, sectionIndex) => (
                <div key={`${sectionIndex}-${section.title}`} className="space-y-3 rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        setSections((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === sectionIndex ? { ...item, title: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Titulo da secao"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setSections((current) => current.filter((_, currentIndex) => currentIndex !== sectionIndex))}
                      disabled={sections.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {section.rows.map((row, rowIndex) => (
                    <div key={row.id} className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <Input
                        value={row.title}
                        onChange={(e) =>
                          setSections((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === sectionIndex
                                ? {
                                    ...item,
                                    rows: item.rows.map((rowItem, currentRowIndex) =>
                                      currentRowIndex === rowIndex ? { ...rowItem, title: e.target.value } : rowItem,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        placeholder="Titulo"
                      />
                      <Input
                        value={row.id}
                        onChange={(e) =>
                          setSections((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === sectionIndex
                                ? {
                                    ...item,
                                    rows: item.rows.map((rowItem, currentRowIndex) =>
                                      currentRowIndex === rowIndex ? { ...rowItem, id: e.target.value } : rowItem,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        placeholder="ID"
                      />
                      <Input
                        value={row.description ?? ''}
                        onChange={(e) =>
                          setSections((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === sectionIndex
                                ? {
                                    ...item,
                                    rows: item.rows.map((rowItem, currentRowIndex) =>
                                      currentRowIndex === rowIndex
                                        ? { ...rowItem, description: e.target.value }
                                        : rowItem,
                                    ),
                                  }
                                : item,
                            ),
                          )
                        }
                        placeholder="Descricao"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setSections((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === sectionIndex
                                ? {
                                    ...item,
                                    rows: item.rows.filter((_, currentRowIndex) => currentRowIndex !== rowIndex),
                                  }
                                : item,
                            ),
                          )
                        }
                        disabled={section.rows.length === 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setSections((current) =>
                        current.map((item, currentIndex) =>
                          currentIndex === sectionIndex
                            ? { ...item, rows: [...item.rows, newRow()] }
                            : item,
                        ),
                      )
                    }
                  >
                    <Plus className="size-4" />
                    Adicionar linha
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSections((current) => [...current, newSection()])}
              >
                <Plus className="size-4" />
                Adicionar secao
              </Button>
            </div>
          ) : null}

          {kind === 'cta_url' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Texto do botão</label>
                <Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Abrir link" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            Enviar interativo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
