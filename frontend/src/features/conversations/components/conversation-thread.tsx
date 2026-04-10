'use client';

import { useEffect, useRef, useState, use } from 'react';
import {
  Kanban,
  LoaderCircle,
  Lock,
  MessageSquare,
  PhoneCall,
  RotateCcw,
  SendHorizonal,
  Sparkles,
  Tag,
  UserRoundCheck,
  X,
} from 'lucide-react';
import {
  closeConversation,
  reopenConversation,
  sendMessage,
  sendNote,
  useConversation,
} from '@/hooks/useConversations';
import { joinConversation, leaveConversation, useSocket } from '@/hooks/useSocket';
import type { Message } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ConversationMessageBubble } from './message-bubble';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConversationThreadPageProps {
  params: Promise<{ id: string }>;
}

interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
}

interface ContactTag {
  tag: { id: string; name: string; color: string | null };
}

interface ContactPipelineEntry {
  pipeline: { id: string; name: string };
  stage: { id: string; name: string };
}

interface ContactDetail {
  contactTags: ContactTag[];
  contactPipelines: ContactPipelineEntry[];
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

// ─── @Mention dropdown ────────────────────────────────────────────────────────

function MentionDropdown({
  users,
  query,
  onSelect,
}: {
  users: WorkspaceUser[];
  query: string;
  onSelect: (user: WorkspaceUser) => void;
}) {
  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(query.toLowerCase()),
  );
  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 z-20 mb-1 min-w-48 rounded-xl border border-border/70 bg-background shadow-lg">
      {filtered.map((u) => (
        <button
          key={u.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(u);
          }}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent first:rounded-t-xl last:rounded-b-xl"
        >
          <Avatar className="size-6 border border-border/70">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
              {getInitials(u.name)}
            </AvatarFallback>
          </Avatar>
          {u.name}
        </button>
      ))}
    </div>
  );
}

export function ConversationThread({ params }: ConversationThreadPageProps) {
  const { id } = use(params);
  const { conversation, isLoading, mutate } = useConversation(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'message' | 'note'>('message');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention state
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [contactDetail, setContactDetail] = useState<ContactDetail | null>(null);

  // Load workspace users for @mention
  useEffect(() => {
    api.get<WorkspaceUser[]>('/users').then((r) => setUsers(r.data)).catch(() => null);
  }, []);

  // Load contact details (tags, pipeline stages)
  useEffect(() => {
    if (!conversation?.contact.id) return;
    api.get<ContactDetail>(`/contacts/${conversation.contact.id}`)
      .then((r) => setContactDetail(r.data))
      .catch(() => null);
  }, [conversation?.contact.id]);

  useEffect(() => {
    if (conversation?.messages) {
      setMessages([...conversation.messages].sort((l, r) => new Date(l.createdAt).getTime() - new Date(r.createdAt).getTime()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    joinConversation(id);
    return () => leaveConversation(id);
  }, [id]);

  useSocket({
    onNewMessage: ({ conversationId, message }) => {
      if (conversationId !== id) return;
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    },
    onMessageStatus: ({ conversationId, messageId, status }) => {
      if (conversationId !== id) return;
      setMessages((current) =>
        current.map((item) => (item.id === messageId ? { ...item, status: status as Message['status'] } : item)),
      );
    },
  });

  // ─── Handle textarea input for @mention detection ─────────────────────────

  function handleTextChange(value: string) {
    setText(value);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const match = before.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function handleMentionSelect(user: WorkspaceUser) {
    const cursor = textareaRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const replaced = before.replace(/@\w*$/, `@${user.name} `);
    setText(replaced + after);
    setMentionQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  // ─── Send ─────────────────────────────────────────────────────────────────

  async function handleSend() {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setText('');
    setMentionQuery(null);

    if (mode === 'note') {
      try {
        const note = await sendNote(id, content);
        setMessages((current) => (current.some((m) => m.id === note.id) ? current : [...current, note]));
      } catch {
        // silently restore text on error
        setText(content);
      } finally {
        setSending(false);
        textareaRef.current?.focus();
      }
      return;
    }

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: id,
      senderType: 'user',
      senderId: null,
      type: 'text',
      content,
      mediaUrl: null,
      status: 'sent',
      externalId: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);

    try {
      const persisted = (await sendMessage(id, content)) as Message;
      setMessages((current) => current.map((item) => (item.id === optimisticMessage.id ? persisted : item)));
      void mutate();
    } catch {
      setMessages((current) => current.map((item) => (item.id === optimisticMessage.id ? { ...item, status: 'failed' } : item)));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function handleClose() {
    await closeConversation(id);
    await mutate();
  }

  async function handleReopen() {
    await reopenConversation(id);
    await mutate();
  }

  if (isLoading || !conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const contactName = conversation.contact.name ?? conversation.contact.phone;
  const isClosed = conversation.status === 'closed';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border border-border/70">
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(contactName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold text-foreground">{contactName}</h1>
                <Badge variant={isClosed ? 'muted' : 'success'}>{isClosed ? 'Fechada' : 'Em atendimento'}</Badge>
                {conversation.isBotActive ? <Badge variant="outline">Bot ativo</Badge> : null}
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {conversation.contact.phone}
                {conversation.assignedUser ? ` • ${conversation.assignedUser.name}` : ''}
                {conversation.team ? ` • ${conversation.team.name}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline">
              <PhoneCall className="size-4" />
              Ligar
            </Button>
            <Button variant="outline">
              <UserRoundCheck className="size-4" />
              Atribuir
            </Button>
            {isClosed ? (
              <Button onClick={handleReopen}>
                <RotateCcw className="size-4" />
                Reabrir conversa
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleClose}>
                <X className="size-4" />
                Fechar conversa
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6">
        <Card className="flex min-h-0 flex-col border-border/70 bg-white/70">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
            <ScrollArea className="min-h-0 flex-1 rounded-2xl border border-border/70 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <ConversationMessageBubble key={message.id} message={message} />
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <div className="rounded-2xl border border-border/70 bg-background p-3 shadow-sm">
              {isClosed ? (
                <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  <span>Conversa encerrada. Reabra para continuar respondendo.</span>
                  <Button onClick={handleReopen}>Reabrir</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Mode toggle */}
                  <div className="flex gap-1 rounded-xl border border-border/70 bg-muted/30 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('message')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        mode === 'message'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <MessageSquare className="size-3.5" />
                      Mensagem
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('note')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        mode === 'note'
                          ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-200'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Lock className="size-3.5" />
                      Nota interna
                    </button>
                  </div>

                  {mode === 'note' && (
                    <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                      Notas internas são visíveis apenas para operadores. Use @nome para mencionar um colega.
                    </p>
                  )}

                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={text}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                        if (event.key === 'Escape') setMentionQuery(null);
                      }}
                      placeholder={
                        mode === 'note'
                          ? 'Adicione uma nota interna... Use @nome para mencionar operadores.'
                          : 'Digite uma mensagem. Enter envia, Shift + Enter cria nova linha.'
                      }
                      className={cn(
                        'min-h-24 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0',
                        mode === 'note' && 'text-amber-900 placeholder:text-amber-400',
                      )}
                    />

                    {/* @mention dropdown */}
                    {mentionQuery !== null && mode === 'note' && (
                      <MentionDropdown
                        users={users}
                        query={mentionQuery}
                        onSelect={handleMentionSelect}
                      />
                    )}
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      {mode === 'note' ? 'Nota visível só para a equipe.' : 'Fluxo rápido com envio otimista e atualização em tempo real.'}
                    </p>
                    <Button
                      onClick={() => void handleSend()}
                      disabled={!text.trim() || sending}
                      variant={mode === 'note' ? 'outline' : 'default'}
                      className={mode === 'note' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : ''}
                    >
                      {sending ? <LoaderCircle className="size-4 animate-spin" /> : mode === 'note' ? <Lock className="size-4" /> : <SendHorizonal className="size-4" />}
                      {mode === 'note' ? 'Salvar nota' : 'Enviar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-border/70 bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Contexto do atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contato</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{contactName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{conversation.contact.phone}</p>
              {conversation.contact.email ? <p className="mt-1 text-sm text-muted-foreground">{conversation.contact.email}</p> : null}
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Responsável</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{conversation.assignedUser?.name ?? 'Sem responsável definido'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{conversation.team?.name ?? 'Sem time vinculado'}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>{messages.length} mensagens registradas</li>
                <li>Status: {conversation.status}</li>
                <li>Bot: {conversation.isBotActive ? 'ativo' : 'inativo'}</li>
              </ul>
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="size-3.5 text-muted-foreground" />
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tags</p>
              </div>
              {contactDetail?.contactTags && contactDetail.contactTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {contactDetail.contactTags.map(({ tag }) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs"
                      style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma tag atribuída.</p>
              )}
            </div>

            {/* Pipeline */}
            {contactDetail?.contactPipelines && contactDetail.contactPipelines.length > 0 && (
              <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Kanban className="size-3.5 text-muted-foreground" />
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pipeline</p>
                </div>
                <div className="space-y-2">
                  {contactDetail.contactPipelines.map(({ pipeline, stage }) => (
                    <div key={pipeline.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">{pipeline.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">{stage.name}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
