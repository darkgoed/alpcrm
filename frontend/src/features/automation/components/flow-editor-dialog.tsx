'use client';

import { useEffect, useState } from 'react';
import { Bot, Clock3, LoaderCircle, MessageSquarePlus, Plus, Trash2 } from 'lucide-react';
import { createFlow, updateFlow, type Flow } from '@/hooks/useAutomation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FlowNodeDraft {
  type: 'message' | 'delay';
  config: {
    content?: string;
    ms?: number;
  };
  order: number;
}

interface FlowEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => unknown;
  flow?: Flow;
}

function buildDraftNodes(flow?: Flow): FlowNodeDraft[] {
  return (
    flow?.nodes.map((node) => ({
      type: node.type === 'delay' ? 'delay' : 'message',
      config: node.config,
      order: node.order,
    })) ?? []
  );
}

export function FlowEditorDialog({ open, onOpenChange, onSaved, flow }: FlowEditorDialogProps) {
  const [name, setName] = useState(flow?.name ?? '');
  const [triggerType, setTriggerType] = useState<Flow['triggerType']>(flow?.triggerType ?? 'new_conversation');
  const [triggerValue, setTriggerValue] = useState(flow?.triggerValue ?? '');
  const [nodes, setNodes] = useState<FlowNodeDraft[]>(buildDraftNodes(flow));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(flow?.name ?? '');
    setTriggerType(flow?.triggerType ?? 'new_conversation');
    setTriggerValue(flow?.triggerValue ?? '');
    setNodes(buildDraftNodes(flow));
  }, [flow, open]);

  function addNode(type: FlowNodeDraft['type']) {
    setNodes((current) => [
      ...current,
      {
        type,
        config: type === 'message' ? { content: '' } : { ms: 5000 },
        order: current.length,
      },
    ]);
  }

  function removeNode(index: number) {
    setNodes((current) => current.filter((_, currentIndex) => currentIndex !== index).map((item, nextIndex) => ({ ...item, order: nextIndex })));
  }

  function updateNode(index: number, nextNode: FlowNodeDraft) {
    setNodes((current) => current.map((item, currentIndex) => (currentIndex === index ? nextNode : item)));
  }

  async function handleSave() {
    if (!name.trim()) return;

    setSaving(true);

    const payload = {
      name: name.trim(),
      triggerType,
      triggerValue: triggerType === 'keyword' ? triggerValue.trim() : undefined,
      nodes,
    };

    try {
      if (flow) {
        await updateFlow(flow.id, payload);
      } else {
        await createFlow(payload);
      }

      await onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{flow ? 'Editar flow' : 'Novo flow'}</DialogTitle>
          <DialogDescription>Monte fluxos de atendimento com mensagens e delays para automatizar o primeiro contato.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Nome do flow</Label>
              <Input id="flow-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Boas-vindas premium" />
            </div>
            <div className="space-y-2">
              <Label>Gatilho</Label>
              <Select value={triggerType} onValueChange={(value) => setTriggerType(value as Flow['triggerType'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gatilho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_conversation">Nova conversa</SelectItem>
                  <SelectItem value="keyword">Palavra-chave</SelectItem>
                  <SelectItem value="always">Toda mensagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {triggerType === 'keyword' ? (
              <div className="space-y-2">
                <Label htmlFor="trigger-value">Palavra-chave</Label>
                <Input
                  id="trigger-value"
                  value={triggerValue}
                  onChange={(event) => setTriggerValue(event.target.value)}
                  placeholder="Ex: oi, catálogo, suporte"
                />
              </div>
            ) : null}

            <Card className="border-border/70 bg-muted/30">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Bot className="size-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Estrutura do flow</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Combine respostas automáticas com delays curtos para criar uma recepção mais natural sem sobrecarregar o time.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Etapas</p>
                <p className="text-xs text-muted-foreground">Configure a sequência das ações do flow.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => addNode('message')}>
                  <MessageSquarePlus className="size-4" />
                  Mensagem
                </Button>
                <Button variant="outline" size="sm" onClick={() => addNode('delay')}>
                  <Clock3 className="size-4" />
                  Delay
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {nodes.length > 0 ? (
                nodes.map((node, index) => (
                  <Card key={`${node.type}-${index}`} className="border-border/70">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={node.type === 'message' ? 'success' : 'outline'}>
                            {node.type === 'message' ? 'Mensagem' : 'Delay'}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">Etapa {index + 1}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeNode(index)} aria-label="Remover etapa">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      {node.type === 'message' ? (
                        <Textarea
                          value={node.config.content ?? ''}
                          onChange={(event) =>
                            updateNode(index, {
                              ...node,
                              config: { content: event.target.value },
                            })
                          }
                          placeholder="Escreva a mensagem automática"
                          className="min-h-28"
                        />
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor={`delay-${index}`}>Delay em segundos</Label>
                          <Input
                            id={`delay-${index}`}
                            type="number"
                            min={1}
                            value={Math.round((node.config.ms ?? 5000) / 1000)}
                            onChange={(event) =>
                              updateNode(index, {
                                ...node,
                                config: { ms: Number(event.target.value) * 1000 },
                              })
                            }
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-background shadow-sm">
                    <Plus className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Nenhuma etapa adicionada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Adicione mensagens ou delays para estruturar o flow.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => void handleSave()} disabled={saving || !name.trim()}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {saving ? 'Salvando...' : 'Salvar flow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
