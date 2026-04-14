'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink,
  List,
  Loader2,
  Plus,
  Save,
  SquareMousePointer,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { InteractiveListSection, InteractivePayload } from '@/types';
import {
  createInteractiveTemplate,
  deleteInteractiveTemplate,
  updateInteractiveTemplate,
  useInteractiveTemplates,
  type InteractiveTemplate,
  type InteractiveTemplateType,
} from '@/hooks/useInteractiveTemplates';

type ReplyButton = { id: string; title: string };
type TemplateFormState = {
  name: string;
  interactiveType: InteractiveTemplateType;
  headerText: string;
  body: string;
  footer: string;
  buttonText: string;
  url: string;
  buttons: ReplyButton[];
  sections: InteractiveListSection[];
};

function newReplyButton(): ReplyButton {
  return { id: crypto.randomUUID(), title: '' };
}

function newListRow() {
  return { id: crypto.randomUUID(), title: '', description: '' };
}

function newListSection(): InteractiveListSection {
  return {
    title: '',
    rows: [newListRow()],
  };
}

function createEmptyForm(): TemplateFormState {
  return {
    name: '',
    interactiveType: 'reply_buttons',
    headerText: '',
    body: '',
    footer: '',
    buttonText: '',
    url: '',
    buttons: [newReplyButton(), newReplyButton()],
    sections: [newListSection()],
  };
}

function buildPayload(form: TemplateFormState): {
  content: string;
  interactiveType: InteractiveTemplateType;
  interactivePayload: InteractivePayload;
} {
  if (!form.name.trim()) {
    throw new Error('Informe um nome interno para o template.');
  }

  if (!form.body.trim()) {
    throw new Error('Informe o corpo da mensagem.');
  }

  if (form.interactiveType === 'reply_buttons') {
    const buttons = form.buttons
      .map((button) => ({
        id: button.id.trim(),
        title: button.title.trim(),
      }))
      .filter((button) => button.id && button.title);

    if (buttons.length === 0) {
      throw new Error('Adicione pelo menos um botão de resposta.');
    }

    return {
      content: form.body.trim(),
      interactiveType: 'reply_buttons',
      interactivePayload: {
        headerText: form.headerText.trim() || undefined,
        body: form.body.trim(),
        footer: form.footer.trim() || undefined,
        buttons,
      },
    };
  }

  if (form.interactiveType === 'list') {
    const sections = form.sections
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

    if (!form.buttonText.trim()) {
      throw new Error('Informe o texto do botão da lista.');
    }

    if (sections.length === 0) {
      throw new Error('Adicione pelo menos uma seção com opções.');
    }

    return {
      content: form.body.trim(),
      interactiveType: 'list',
      interactivePayload: {
        headerText: form.headerText.trim() || undefined,
        body: form.body.trim(),
        footer: form.footer.trim() || undefined,
        buttonText: form.buttonText.trim(),
        sections,
      },
    };
  }

  if (!form.buttonText.trim() || !form.url.trim()) {
    throw new Error('CTA URL exige texto de botão e URL.');
  }

  return {
    content: form.body.trim(),
    interactiveType: 'cta_url',
    interactivePayload: {
      headerText: form.headerText.trim() || undefined,
      body: form.body.trim(),
      footer: form.footer.trim() || undefined,
      buttonText: form.buttonText.trim(),
      url: form.url.trim(),
    },
  };
}

function formFromTemplate(template: InteractiveTemplate): TemplateFormState {
  return {
    name: template.name,
    interactiveType: template.interactiveType,
    headerText: template.interactivePayload.headerText ?? '',
    body: template.content,
    footer: template.interactivePayload.footer ?? '',
    buttonText: template.interactivePayload.buttonText ?? '',
    url: template.interactivePayload.url ?? '',
    buttons:
      template.interactivePayload.buttons?.length
        ? template.interactivePayload.buttons.map((button) => ({
            id: button.id,
            title: button.title,
          }))
        : [newReplyButton(), newReplyButton()],
    sections:
      template.interactivePayload.sections?.length
        ? template.interactivePayload.sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description ?? '',
            })),
          }))
        : [newListSection()],
  };
}

function TemplatePreview({ template }: { template: InteractiveTemplate }) {
  const payload = template.interactivePayload;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{template.name}</p>
        <p className="text-xs text-muted-foreground">
          {template.interactiveType === 'reply_buttons'
            ? 'Botões de resposta'
            : template.interactiveType === 'list'
              ? 'Lista'
              : 'CTA URL'}
        </p>
      </div>

      <div className="space-y-1.5 text-sm">
        {payload.headerText ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {payload.headerText}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-foreground">{template.content}</p>
        {payload.footer ? (
          <p className="text-xs text-muted-foreground">{payload.footer}</p>
        ) : null}
      </div>

      {template.interactiveType === 'reply_buttons' ? (
        <div className="flex flex-wrap gap-2">
          {payload.buttons?.map((button) => (
            <div
              key={button.id}
              className="rounded-lg border border-border/70 bg-background px-3 py-2 text-xs"
            >
              <p className="font-medium text-foreground">{button.title}</p>
              <p className="text-muted-foreground">{button.id}</p>
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
                  <div key={row.id} className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="text-muted-foreground">{row.id}</p>
                    {row.description ? (
                      <p className="text-muted-foreground">{row.description}</p>
                    ) : null}
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
          <span className="text-muted-foreground">{payload.url}</span>
        </div>
      ) : null}
    </div>
  );
}

function TemplateForm({
  initialTemplate,
  onSaved,
  onCancel,
}: {
  initialTemplate?: InteractiveTemplate | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TemplateFormState>(createEmptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialTemplate ? formFromTemplate(initialTemplate) : createEmptyForm());
    setError(null);
  }, [initialTemplate]);

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    try {
      const payload = buildPayload(form);
      const dto = {
        name: form.name.trim(),
        content: payload.content,
        interactiveType: payload.interactiveType,
        interactivePayload: payload.interactivePayload,
      };

      if (initialTemplate) {
        await updateInteractiveTemplate(initialTemplate.id, dto);
      } else {
        await createInteractiveTemplate(dto);
      }

      onSaved();
      setForm(createEmptyForm());
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Não foi possível salvar o template.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {initialTemplate ? 'Editar template interativo' : 'Novo template interativo'}
          </p>
          <p className="text-xs text-muted-foreground">
            Para iniciar um flow por botão de resposta, use no botão um `actionId` e configure um flow com gatilho `button_reply` usando esse mesmo valor.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nome interno</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            placeholder="Ex: Menu principal"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tipo</label>
          <Select
            value={form.interactiveType}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                interactiveType: value as InteractiveTemplateType,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reply_buttons">Botões de resposta</SelectItem>
              <SelectItem value="list">Lista</SelectItem>
              <SelectItem value="cta_url">CTA URL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Header</label>
          <Input
            value={form.headerText}
            onChange={(e) =>
              setForm((current) => ({ ...current, headerText: e.target.value }))
            }
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Corpo</label>
          <Textarea
            value={form.body}
            onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
            placeholder="Texto principal enviado ao contato"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Footer</label>
          <Input
            value={form.footer}
            onChange={(e) =>
              setForm((current) => ({ ...current, footer: e.target.value }))
            }
            placeholder="Opcional"
          />
        </div>
      </div>

      {form.interactiveType === 'reply_buttons' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Botões de resposta</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  buttons:
                    current.buttons.length >= 3
                      ? current.buttons
                      : [...current.buttons, newReplyButton()],
                }))
              }
              disabled={form.buttons.length >= 3}
            >
              <Plus className="mr-1 size-4" />
              Botão
            </Button>
          </div>
          <div className="space-y-2">
            {form.buttons.map((button, index) => (
              <div
                key={button.id}
                className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Input
                  value={button.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      buttons: current.buttons.map((item, currentIndex) =>
                        currentIndex === index
                          ? { ...item, title: e.target.value }
                          : item,
                      ),
                    }))
                  }
                  placeholder="Texto do botão"
                />
                <Input
                  value={button.id}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      buttons: current.buttons.map((item, currentIndex) =>
                        currentIndex === index
                          ? { ...item, id: e.target.value }
                          : item,
                      ),
                    }))
                  }
                  placeholder="actionId / gatilho"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      buttons:
                        current.buttons.length === 1
                          ? current.buttons
                          : current.buttons.filter((_, currentIndex) => currentIndex !== index),
                    }))
                  }
                  disabled={form.buttons.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {form.interactiveType === 'list' ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Texto do botão</label>
            <Input
              value={form.buttonText}
              onChange={(e) =>
                setForm((current) => ({ ...current, buttonText: e.target.value }))
              }
              placeholder="Ex: Ver opções"
            />
          </div>

          {form.sections.map((section, sectionIndex) => (
            <div key={`${sectionIndex}-${section.title}`} className="space-y-3 rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={section.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      sections: current.sections.map((item, currentIndex) =>
                        currentIndex === sectionIndex
                          ? { ...item, title: e.target.value }
                          : item,
                      ),
                    }))
                  }
                  placeholder="Título da seção"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      sections:
                        current.sections.length === 1
                          ? current.sections
                          : current.sections.filter((_, currentIndex) => currentIndex !== sectionIndex),
                    }))
                  }
                  disabled={form.sections.length === 1}
                >
                  Remover
                </Button>
              </div>

              <div className="space-y-2">
                {section.rows.map((row, rowIndex) => (
                  <div key={row.id} className="grid gap-2 rounded-lg bg-muted/30 p-3 sm:grid-cols-3">
                    <Input
                      value={row.title}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          sections: current.sections.map((item, currentIndex) =>
                            currentIndex === sectionIndex
                              ? {
                                  ...item,
                                  rows: item.rows.map((currentRow, currentRowIndex) =>
                                    currentRowIndex === rowIndex
                                      ? { ...currentRow, title: e.target.value }
                                      : currentRow,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Título"
                    />
                    <Input
                      value={row.id}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          sections: current.sections.map((item, currentIndex) =>
                            currentIndex === sectionIndex
                              ? {
                                  ...item,
                                  rows: item.rows.map((currentRow, currentRowIndex) =>
                                    currentRowIndex === rowIndex
                                      ? { ...currentRow, id: e.target.value }
                                      : currentRow,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                      placeholder="actionId / gatilho"
                    />
                    <Input
                      value={row.description ?? ''}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          sections: current.sections.map((item, currentIndex) =>
                            currentIndex === sectionIndex
                              ? {
                                  ...item,
                                  rows: item.rows.map((currentRow, currentRowIndex) =>
                                    currentRowIndex === rowIndex
                                      ? { ...currentRow, description: e.target.value }
                                      : currentRow,
                                  ),
                                }
                              : item,
                          ),
                        }))
                      }
                      placeholder="Descrição opcional"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      sections: current.sections.map((item, currentIndex) =>
                        currentIndex === sectionIndex
                          ? { ...item, rows: [...item.rows, newListRow()] }
                          : item,
                      ),
                    }))
                  }
                >
                  <Plus className="mr-1 size-4" />
                  Opção
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setForm((current) => ({
                ...current,
                sections: [...current.sections, newListSection()],
              }))
            }
          >
            <Plus className="mr-1 size-4" />
            Seção
          </Button>
        </div>
      ) : null}

      {form.interactiveType === 'cta_url' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Texto do botão</label>
            <Input
              value={form.buttonText}
              onChange={(e) =>
                setForm((current) => ({ ...current, buttonText: e.target.value }))
              }
              placeholder="Ex: Abrir site"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL</label>
            <Input
              value={form.url}
              onChange={(e) => setForm((current) => ({ ...current, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          {initialTemplate ? 'Salvar alterações' : 'Criar template'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function InteractiveTemplatesSection() {
  const { templates, isLoading, mutate } = useInteractiveTemplates();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InteractiveTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(template: InteractiveTemplate) {
    if (!confirm(`Excluir o template interativo "${template.name}"?`)) {
      return;
    }

    setDeletingId(template.id);
    try {
      await deleteInteractiveTemplate(template.id);
      await mutate();
    } finally {
      setDeletingId(null);
    }
  }

  function openCreateForm() {
    setEditingTemplate(null);
    setShowForm(true);
  }

  function openEditForm(template: InteractiveTemplate) {
    setEditingTemplate(template);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTemplate(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Template Interativo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre mensagens interativas internas do CRM para que o operador apenas selecione e envie no chat.
            Botões de resposta e opções de lista usam `actionId`; CTA URL abre o link informado.
          </p>
        </div>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="mr-1 size-4" />
          Novo template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SquareMousePointer className="size-4 text-primary" />
            <CardTitle className="text-base">Uso dos botões</CardTitle>
          </div>
          <CardDescription>
            Resposta/lista: o contato responde no WhatsApp e o sistema recebe o `actionId`.
            Para iniciar um flow, configure o flow com gatilho `button_reply` usando exatamente esse mesmo `actionId`.
            CTA URL: o contato toca no botão e abre o link.
          </CardDescription>
        </CardHeader>
      </Card>

      {showForm ? (
        <TemplateForm
          initialTemplate={editingTemplate}
          onSaved={() => {
            closeForm();
            void mutate();
          }}
          onCancel={closeForm}
        />
      ) : null}

      <Separator />

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-xl" />
          ))
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <SquareMousePointer className="mx-auto mb-3 size-8 text-muted-foreground opacity-40" />
            <p className="text-sm font-medium text-foreground">Não existe nenhum template</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crie um template interativo para disponibilizar no chat do operador.
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {template.interactiveType === 'cta_url' ? (
                        <ExternalLink className="size-4 text-primary" />
                      ) : template.interactiveType === 'list' ? (
                        <List className="size-4 text-primary" />
                      ) : (
                        <SquareMousePointer className="size-4 text-primary" />
                      )}
                      <p className="truncate text-sm font-medium text-foreground">{template.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {template.interactiveType === 'reply_buttons'
                        ? 'Botões de resposta'
                        : template.interactiveType === 'list'
                          ? 'Lista interativa'
                          : 'CTA URL'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditForm(template)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={deletingId === template.id}
                      onClick={() => void handleDelete(template)}
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <TemplatePreview template={template} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
