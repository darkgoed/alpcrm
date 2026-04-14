'use client';

import { X, Trash2 } from 'lucide-react';
import { type FlowNodeType } from '@/hooks/useAutomation';
import { useTags } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface NodeDraft {
  clientId: string;
  type: FlowNodeType;
  config: Record<string, unknown>;
  order: number;
}

const TYPE_LABELS: Record<FlowNodeType, string> = {
  message: 'Mensagem',
  delay: 'Delay',
  wait_for_reply: 'Aguardar resposta',
  condition: 'Condição',
  branch: 'Branch',
  tag_contact: 'Tag no contato',
  move_stage: 'Mover no pipeline',
  assign_to: 'Atribuir',
  send_template: 'Enviar template',
  send_interactive: 'Mensagem interativa',
  webhook_call: 'Webhook',
};

const TYPE_COLOR: Record<FlowNodeType, string> = {
  message: 'bg-primary/10 text-primary',
  delay: 'bg-amber-100 text-amber-700',
  wait_for_reply: 'bg-blue-100 text-blue-700',
  condition: 'bg-violet-100 text-violet-700',
  branch: 'bg-violet-100 text-violet-700',
  tag_contact: 'bg-emerald-100 text-emerald-700',
  move_stage: 'bg-sky-100 text-sky-700',
  assign_to: 'bg-pink-100 text-pink-700',
  send_template: 'bg-orange-100 text-orange-700',
  send_interactive: 'bg-teal-100 text-teal-700',
  webhook_call: 'bg-zinc-100 text-zinc-700',
};

interface Props {
  node: NodeDraft;
  index: number;
  total: number;
  onUpdate: (next: NodeDraft) => void;
  onDelete: () => void;
  onClose: () => void;
  // for tag_contact and assign_to
  workspaceUsers?: Array<{ id: string; name: string }>;
  workspaceTeams?: Array<{ id: string; name: string }>;
  pipelineStages?: Array<{ id: string; name: string; pipelineName: string }>;
}

// ─── SendInteractive sub-editor ─────────────────────────────────────────────

function SendInteractiveEditor({
  config: c,
  set,
}: {
  config: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  const itype = String(c.interactiveType ?? 'button');
  const buttons = (c.buttons as Array<{ id: string; title: string }>) ?? [];
  const sections = (c.sections as Array<{ title: string; rows: Array<{ id: string; title: string }> }>) ?? [
    { title: '', rows: [{ id: 'opt_1', title: '' }] },
  ];

  function updateButton(i: number, field: 'id' | 'title', value: string) {
    const next = [...buttons];
    next[i] = { ...next[i], [field]: value };
    set('buttons', next);
  }

  function addButton() {
    if (buttons.length >= 3) return;
    set('buttons', [...buttons, { id: `btn_${Date.now()}`, title: '' }]);
  }

  function removeButton(i: number) {
    set('buttons', buttons.filter((_, idx) => idx !== i));
  }

  function updateRow(si: number, ri: number, field: 'id' | 'title', value: string) {
    const next = sections.map((s, sIdx) =>
      sIdx !== si ? s : { ...s, rows: s.rows.map((r, rIdx) => (rIdx !== ri ? r : { ...r, [field]: value })) },
    );
    set('sections', next);
  }

  function addRow(si: number) {
    const next = sections.map((s, sIdx) =>
      sIdx !== si ? s : { ...s, rows: [...s.rows, { id: `opt_${Date.now()}`, title: '' }] },
    );
    set('sections', next);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={itype} onValueChange={(v) => set('interactiveType', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="button">Botões de resposta (até 3)</SelectItem>
            <SelectItem value="list">Lista de opções</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Corpo da mensagem</Label>
        <Textarea
          value={String(c.body ?? '')}
          onChange={(e) => set('body', e.target.value)}
          placeholder="Escolha uma opção:"
          className="min-h-20 resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Rodapé (opcional)</Label>
        <Input
          value={String(c.footer ?? '')}
          onChange={(e) => set('footer', e.target.value || undefined)}
          placeholder="Texto auxiliar"
        />
      </div>

      {itype === 'button' && (
        <div className="space-y-2">
          <Label>Botões</Label>
          {buttons.map((btn, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={btn.id}
                onChange={(e) => updateButton(i, 'id', e.target.value)}
                placeholder="ID"
                className="w-24 text-xs"
              />
              <Input
                value={btn.title}
                onChange={(e) => updateButton(i, 'title', e.target.value)}
                placeholder="Rótulo"
                className="flex-1 text-xs"
              />
              <button
                onClick={() => removeButton(i)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {buttons.length < 3 && (
            <button
              onClick={addButton}
              className="text-xs text-primary hover:underline"
            >
              + Adicionar botão
            </button>
          )}
        </div>
      )}

      {itype === 'list' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Texto do botão da lista</Label>
            <Input
              value={String(c.buttonText ?? 'Ver opções')}
              onChange={(e) => set('buttonText', e.target.value)}
              placeholder="Ver opções"
            />
          </div>
          {sections.map((section, si) => (
            <div key={si} className="space-y-2 rounded-lg border border-border/60 p-3">
              <Input
                value={section.title}
                onChange={(e) => {
                  const next = sections.map((s, idx) => idx !== si ? s : { ...s, title: e.target.value });
                  set('sections', next);
                }}
                placeholder="Título da seção (opcional)"
                className="text-xs"
              />
              {section.rows.map((row, ri) => (
                <div key={ri} className="flex items-center gap-2">
                  <Input
                    value={row.id}
                    onChange={(e) => updateRow(si, ri, 'id', e.target.value)}
                    placeholder="ID"
                    className="w-24 text-xs"
                  />
                  <Input
                    value={row.title}
                    onChange={(e) => updateRow(si, ri, 'title', e.target.value)}
                    placeholder="Opção"
                    className="flex-1 text-xs"
                  />
                </div>
              ))}
              <button onClick={() => addRow(si)} className="text-xs text-primary hover:underline">
                + Adicionar opção
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FlowNodeEditor({
  node,
  index,
  total,
  onUpdate,
  onDelete,
  onClose,
  workspaceUsers = [],
  workspaceTeams = [],
  pipelineStages = [],
}: Props) {
  const { tags } = useTags();
  const label = TYPE_LABELS[node.type] ?? node.type;
  const colorClass = TYPE_COLOR[node.type] ?? 'bg-muted text-muted-foreground';

  function set(key: string, value: unknown) {
    onUpdate({ ...node, config: { ...node.config, [key]: value } });
  }

  const c = node.config;

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-border/70 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide', colorClass)}>
            {label}
          </span>
          <span className="text-sm text-muted-foreground">
            Etapa {index + 1} de {total}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {node.type === 'message' && (
            <div className="space-y-2">
              <Label>Texto da mensagem</Label>
              <Textarea
                autoFocus
                value={String(c.content ?? '')}
                onChange={(e) => set('content', e.target.value)}
                placeholder="Escreva a mensagem automática... Use {{variavel}} para inserir dados do contato."
                className="min-h-40 resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                {String(c.content ?? '').length} caracteres
              </p>
            </div>
          )}

          {node.type === 'delay' && (
            <div className="space-y-2">
              <Label>Duração do delay (segundos)</Label>
              <Input
                type="number"
                min={1}
                max={3600}
                value={Math.round((Number(c.ms) || 5000) / 1000)}
                onChange={(e) => set('ms', Math.max(1, Number(e.target.value)) * 1000)}
              />
              <p className="text-[11px] text-muted-foreground">
                O bot aguarda antes de executar a próxima etapa.
              </p>
            </div>
          )}

          {node.type === 'wait_for_reply' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Salvar resposta como variável</Label>
                <Input
                  value={String(c.variableName ?? 'reply')}
                  onChange={(e) => set('variableName', e.target.value)}
                  placeholder="Ex: nome, email, escolha"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use {'{{' + String(c.variableName ?? 'reply') + '}}'} nas mensagens seguintes.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Timeout (segundos, opcional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={c.timeoutMs ? Math.round(Number(c.timeoutMs) / 1000) : ''}
                  onChange={(e) =>
                    set('timeoutMs', e.target.value ? Number(e.target.value) * 1000 : undefined)
                  }
                  placeholder="Sem timeout"
                />
                <p className="text-[11px] text-muted-foreground">
                  Se não responder no tempo, o flow é cancelado.
                </p>
              </div>
            </div>
          )}

          {(node.type === 'condition' || node.type === 'branch') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Variável a avaliar</Label>
                <Input
                  value={String(c.field ?? '')}
                  onChange={(e) => set('field', e.target.value)}
                  placeholder="Ex: reply, nome, escolha"
                />
              </div>
              <div className="space-y-2">
                <Label>Operador</Label>
                <Select
                  value={String(c.operator ?? 'eq')}
                  onValueChange={(v) => set('operator', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eq">É igual a</SelectItem>
                    <SelectItem value="neq">É diferente de</SelectItem>
                    <SelectItem value="contains">Contém</SelectItem>
                    <SelectItem value="not_contains">Não contém</SelectItem>
                    <SelectItem value="starts_with">Começa com</SelectItem>
                    <SelectItem value="is_empty">Está vazio</SelectItem>
                    <SelectItem value="is_not_empty">Não está vazio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!['is_empty', 'is_not_empty'].includes(String(c.operator ?? 'eq')) && (
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    value={String(c.value ?? '')}
                    onChange={(e) => set('value', e.target.value)}
                    placeholder="Valor esperado"
                  />
                </div>
              )}
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                Crie edges com label <code>yes</code> e <code>no</code> saindo deste nó.
              </p>
            </div>
          )}

          {node.type === 'tag_contact' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tag</Label>
                <select
                  value={String(c.tagId ?? '')}
                  onChange={(e) => set('tagId', e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Selecione uma tag</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ação</Label>
                <Select value={String(c.action ?? 'add')} onValueChange={(v) => set('action', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Adicionar tag</SelectItem>
                    <SelectItem value="remove">Remover tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {node.type === 'move_stage' && (
            <div className="space-y-2">
              <Label>Stage de destino</Label>
              <select
                value={String(c.stageId ?? '')}
                onChange={(e) => set('stageId', e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione um stage</option>
                {pipelineStages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.pipelineName} → {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {node.type === 'assign_to' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Usuário (opcional)</Label>
                <select
                  value={String(c.userId ?? '')}
                  onChange={(e) => set('userId', e.target.value || undefined)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Nenhum</option>
                  {workspaceUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Time (opcional)</Label>
                <select
                  value={String(c.teamId ?? '')}
                  onChange={(e) => set('teamId', e.target.value || undefined)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Nenhum</option>
                  {workspaceTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {node.type === 'send_template' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do template</Label>
                <Input
                  value={String(c.templateName ?? '')}
                  onChange={(e) => set('templateName', e.target.value)}
                  placeholder="Ex: boas_vindas"
                />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Input
                  value={String(c.languageCode ?? 'pt_BR')}
                  onChange={(e) => set('languageCode', e.target.value)}
                  placeholder="pt_BR"
                />
              </div>
            </div>
          )}

          {node.type === 'send_interactive' && (
            <SendInteractiveEditor config={c} set={set} />
          )}

          {node.type === 'webhook_call' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={String(c.url ?? '')}
                  onChange={(e) => set('url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Método</Label>
                <Select value={String(c.method ?? 'POST')} onValueChange={(v) => set('method', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Salvar resposta como variável (opcional)</Label>
                <Input
                  value={String(c.saveResponseAs ?? '')}
                  onChange={(e) => set('saveResponseAs', e.target.value || undefined)}
                  placeholder="Ex: webhook_result"
                />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/70 px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Remover etapa
        </Button>
      </div>
    </aside>
  );
}
