'use client';

import { useEffect, useRef, useState, use } from 'react';
import {
  Kanban,
  LoaderCircle,
  Lock,
  MessageSquare,
  Paperclip,
  PhoneCall,
  RotateCcw,
  SendHorizonal,
  Sparkles,
  Tag,
  UserRoundCheck,
  X,
} from 'lucide-react';
import {
  assignConversation,
  closeConversation,
  reopenConversation,
  sendMessage,
  type SendMessageInput,
  sendNote,
  useConversation,
} from '@/hooks/useConversations';
import { useQuickReplies, type QuickReply } from '@/hooks/useQuickReplies';
import { joinConversation, leaveConversation, useSocket } from '@/hooks/useSocket';
import type { Message } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ConversationMessageBubble } from './message-bubble';
import { InteractiveMessageComposer } from './interactive-message-composer';
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

interface WorkspaceTeam {
  id: string;
  name: string;
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

function AssignmentDialog({
  conversationId,
  assignedUserId,
  assignedUserName,
  teamId,
  teamName,
  onAssigned,
}: {
  conversationId: string;
  assignedUserId: string | null;
  assignedUserName: string | null;
  teamId: string | null;
  teamName: string | null;
  onAssigned: () => Promise<void>;
}) {
  const NONE_VALUE = '__none__';
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [teams, setTeams] = useState<WorkspaceTeam[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(assignedUserId ?? NONE_VALUE);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teamId ?? NONE_VALUE);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSelectedUserId(assignedUserId ?? NONE_VALUE);
    setSelectedTeamId(teamId ?? NONE_VALUE);
    setLoadingOptions(true);
    setError(null);

    Promise.all([
      api.get<WorkspaceUser[]>('/users'),
      api.get<WorkspaceTeam[]>('/teams'),
    ])
      .then(([usersResponse, teamsResponse]) => {
        setUsers(usersResponse.data);
        setTeams(teamsResponse.data);
      })
      .catch((err: any) => {
        setError(
          err?.response?.data?.message ??
            'Nao foi possivel carregar usuarios e times.',
        );
      })
      .finally(() => setLoadingOptions(false));
  }, [open, assignedUserId, teamId]);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      await assignConversation(
        conversationId,
        selectedUserId === NONE_VALUE ? undefined : selectedUserId,
        selectedTeamId === NONE_VALUE ? undefined : selectedTeamId,
      );
      await onAssigned();
      setOpen(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? 'Nao foi possivel atualizar a atribuicao.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserRoundCheck className="size-4" />
          Atribuir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir conversa</DialogTitle>
          <DialogDescription>
            Defina o operador e o time responsaveis por este atendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              {assignedUserName ?? 'Sem operador atribuido'}
            </p>
            <p className="mt-1 text-muted-foreground">
              {teamName ?? 'Sem time vinculado'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Operador</label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loadingOptions || saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um operador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sem operador</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Time</label>
            <Select
              value={selectedTeamId}
              onValueChange={setSelectedTeamId}
              disabled={loadingOptions || saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Sem time</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={loadingOptions || saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Salvar atribuicao
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConversationThread({ params }: ConversationThreadPageProps) {
  const { id } = use(params);
  const { conversation, isLoading, mutate } = useConversation(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'message' | 'note'>('message');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention state
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [contactDetail, setContactDetail] = useState<ContactDetail | null>(null);

  // Quick replies
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quickReplySearch, setQuickReplySearch] = useState<string | null>(null);
  const { quickReplies } = useQuickReplies(quickReplySearch ?? undefined);
  const filteredQR = quickReplySearch !== null
    ? quickReplies.filter(
        (qr) =>
          qr.shortcut.includes(quickReplySearch) ||
          qr.title.toLowerCase().includes(quickReplySearch.toLowerCase()),
      ).slice(0, 5)
    : [];

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
    if (sendError) setSendError(null);
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, cursor);

    // @mention detection
    const mentionMatch = before.match(/@(\w*)$/);
    setMentionQuery(mentionMatch ? mentionMatch[1] : null);

    // Quick reply detection: starts with /
    const qrMatch = value.match(/^\/(\S*)$/);
    setQuickReplySearch(qrMatch ? qrMatch[1] : null);
  }

  function applyQuickReply(qr: QuickReply) {
    setText(qr.body);
    setQuickReplySearch(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  async function handleFileUpload(file: File) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', id);
    setSending(true);
    setSendError(null);
    try {
      const res = await api.post('/messages/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const persisted = res.data as Message;
      setMessages((current) => [...current, persisted]);
    } catch (err: any) {
      setSendError(
        err?.response?.data?.message ?? 'Nao foi possivel enviar o arquivo.',
      );
    } finally {
      setSending(false);
    }
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
    setSendError(null);
    setText('');
    setMentionQuery(null);

    if (mode === 'note') {
      try {
        const note = await sendNote(id, content);
        setMessages((current) => (current.some((m) => m.id === note.id) ? current : [...current, note]));
      } catch (err: any) {
        setText(content);
        setSendError(
          err?.response?.data?.message ??
            'Nao foi possivel salvar a nota interna.',
        );
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
      mimeType: null,
      fileName: null,
      fileSize: null,
      interactiveType: null,
      interactivePayload: null,
      status: 'sent',
      externalId: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);

    try {
      const persisted = (await sendMessage({
        conversationId: id,
        type: 'text',
        content,
      })) as Message;
      setMessages((current) => current.map((item) => (item.id === optimisticMessage.id ? persisted : item)));
      void mutate();
    } catch (err: any) {
      setMessages((current) => current.map((item) => (item.id === optimisticMessage.id ? { ...item, status: 'failed' } : item)));
      setSendError(
        err?.response?.data?.message ??
          'Nao foi possivel enviar a mensagem para o WhatsApp.',
      );
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function handleInteractiveSend(input: {
    interactiveType: string;
    content: string;
    interactivePayload: Record<string, any>;
  }) {
    if (sending) return;

    setSending(true);
    setSendError(null);

    const optimisticMessage: Message = {
      id: `temp-interactive-${Date.now()}`,
      conversationId: id,
      senderType: 'user',
      senderId: null,
      type: 'interactive',
      content: input.content,
      mediaUrl: null,
      mimeType: null,
      fileName: null,
      fileSize: null,
      interactiveType: input.interactiveType,
      interactivePayload: input.interactivePayload,
      status: 'sent',
      externalId: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);

    try {
      const payload: SendMessageInput = {
        conversationId: id,
        type: 'interactive',
        content: input.content,
        interactiveType: input.interactiveType,
        interactivePayload: input.interactivePayload,
      };
      const persisted = (await sendMessage(payload)) as Message;
      setMessages((current) =>
        current.map((item) =>
          item.id === optimisticMessage.id ? persisted : item,
        ),
      );
      void mutate();
    } catch (err: any) {
      setMessages((current) =>
        current.map((item) =>
          item.id === optimisticMessage.id
            ? { ...item, status: 'failed' }
            : item,
        ),
      );
      setSendError(
        err?.response?.data?.message ??
          'Nao foi possivel enviar a mensagem interativa.',
      );
      throw err;
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

  const windowOpen = conversation.lastContactMessageAt
    ? Date.now() - new Date(conversation.lastContactMessageAt).getTime() < 24 * 60 * 60 * 1000
    : false;
  const composerStatus = isClosed
    ? 'Conversa fechada'
    : sending
      ? mode === 'note'
        ? 'Salvando nota interna'
        : 'Enviando mensagem'
      : mode === 'note'
        ? 'Modo nota interna'
        : windowOpen
          ? 'Janela de 24h ativa'
          : 'Envio livre bloqueado';

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
            <AssignmentDialog
              conversationId={conversation.id}
              assignedUserId={conversation.assignedUser?.id ?? null}
              assignedUserName={conversation.assignedUser?.name ?? null}
              teamId={conversation.team?.id ?? null}
              teamName={conversation.team?.name ?? null}
              onAssigned={async () => {
                await mutate();
              }}
            />
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

                  {mode === 'message' && !windowOpen && (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] text-orange-700">
                      Janela de 24h expirada. O cliente não enviou mensagem recentemente. Use um template aprovado para retomar o contato.
                    </div>
                  )}

                  <div className="relative">
                    <Textarea
                      ref={textareaRef}
                      value={text}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey && quickReplySearch === null) {
                          event.preventDefault();
                          void handleSend();
                        }
                        if (event.key === 'Escape') { setMentionQuery(null); setQuickReplySearch(null); }
                      }}
                      placeholder={
                        mode === 'note'
                          ? 'Adicione uma nota interna... Use @nome para mencionar operadores.'
                          : 'Digite uma mensagem. / para respostas rápidas. Enter envia.'
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

                    {/* Quick reply dropdown */}
                    {quickReplySearch !== null && filteredQR.length > 0 && (
                      <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-border bg-background shadow-lg z-20">
                        {filteredQR.map((qr) => (
                          <button
                            key={qr.id}
                            onMouseDown={(e) => { e.preventDefault(); applyQuickReply(qr); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <code className="text-xs bg-muted px-1 rounded text-primary">/{qr.shortcut}</code>
                            <span className="text-muted-foreground">{qr.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {mode === 'message' && (
                        <>
                          <InteractiveMessageComposer
                            disabled={sending}
                            onSubmit={handleInteractiveSend}
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf,audio/ogg,audio/mpeg,video/mp4"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileUpload(f); e.target.value = ''; }}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sending}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Enviar arquivo"
                          >
                            <Paperclip className="size-4" />
                          </button>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {mode === 'note' ? 'Nota visível só para a equipe.' : 'Enter envia · / para respostas rápidas'}
                      </p>
                    </div>
                    <Badge
                      variant={sending ? 'secondary' : mode === 'note' || windowOpen ? 'outline' : 'warning'}
                      className={sendError ? 'border-destructive/20 bg-destructive/5 text-destructive' : undefined}
                    >
                      {composerStatus}
                    </Badge>
                  </div>
                  {sendError ? (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      {sendError}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-end gap-3">
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
