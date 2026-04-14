'use client';

import { useEffect, useEffectEvent, useRef, useState, use } from 'react';
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
  getConversationMessages,
  markConversationAsRead,
  reopenConversation,
  sendMessage,
  type SendMessageInput,
  sendNote,
  useConversation,
} from '@/hooks/useConversations';
import { useQuickReplies, type QuickReply } from '@/hooks/useQuickReplies';
import { joinConversation, leaveConversation, useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
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
import { setContactOptIn } from '@/hooks/useContacts';
import { formatDistanceToNow, formatTime } from '@/lib/dateUtils';
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
  totalMessageCount: number;
  responseMetrics: ResponseMetrics;
  conversations: Array<{
    id: string;
    status: 'open' | 'closed' | 'pending';
    createdAt: string;
    lastMessageAt: string | null;
    lastContactMessageAt: string | null;
    assignedUser: { id: string; name: string } | null;
    team: { id: string; name: string } | null;
    messageCount: number;
    responseMetrics: ResponseMetrics;
  }>;
}

interface ResponseMetrics {
  firstResponseMs: number | null;
  averageResponseMs: number | null;
  lastResponseMs: number | null;
  pendingResponseMs: number | null;
  responseCount: number;
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

function formatFullDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDuration(durationMs: number) {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));

  if (totalMinutes < 60) return `${totalMinutes}min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 24) return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}min`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours === 0 ? `${days}d` : `${days}d ${remainingHours}h`;
}

function formatContactSource(source: 'manual' | 'import_csv' | 'whatsapp_inbound') {
  switch (source) {
    case 'manual':
      return 'Cadastro manual';
    case 'import_csv':
      return 'Importacao CSV';
    case 'whatsapp_inbound':
      return 'WhatsApp inbound';
  }
}

function formatOptInStatus(status: 'unknown' | 'opted_in' | 'opted_out') {
  switch (status) {
    case 'opted_in':
      return 'Opt-in confirmado';
    case 'opted_out':
      return 'Opt-out registrado';
    case 'unknown':
      return 'Consentimento nao registrado';
  }
}

function calculateResponseMetrics(messages: Message[]): ResponseMetrics {
  let firstContactMessageAt: string | null = null;
  const responseTimes: number[] = [];

  for (const message of messages) {
    if (message.senderType === 'contact' && !firstContactMessageAt) {
      firstContactMessageAt = message.createdAt;
      continue;
    }

    if (message.senderType === 'user' && firstContactMessageAt) {
      responseTimes.push(
        new Date(message.createdAt).getTime() -
          new Date(firstContactMessageAt).getTime(),
      );
      firstContactMessageAt = null;
    }
  }

  return {
    firstResponseMs: responseTimes[0] ?? null,
    averageResponseMs: responseTimes.length
      ? responseTimes.reduce((sum, value) => sum + value, 0) /
        responseTimes.length
      : null,
    lastResponseMs: responseTimes.at(-1) ?? null,
    pendingResponseMs: firstContactMessageAt
      ? Date.now() - new Date(firstContactMessageAt).getTime()
      : null,
    responseCount: responseTimes.length,
  };
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
  const { token } = useAuth();
  const { conversation, isLoading, mutate } = useConversation(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeOperatorIds, setActiveOperatorIds] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'message' | 'note'>('message');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingScrollModeRef = useRef<'bottom' | 'preserve' | null>(null);
  const scrollSnapshotRef = useRef<{ height: number; top: number } | null>(null);

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
    api.get<ContactDetail>(`/contacts/${conversation.contact.id}?includeMessages=false`)
      .then((r) => setContactDetail(r.data))
      .catch(() => null);
  }, [conversation?.contact.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialMessages() {
      setMessages([]);
      setMessageCursor(null);
      setHasMoreMessages(false);
      setLoadingMessages(true);

      try {
        const page = await getConversationMessages(id);
        if (cancelled) return;
        pendingScrollModeRef.current = 'bottom';
        setMessages(page.items);
        setHasMoreMessages(page.hasMore);
        setMessageCursor(page.nextCursor);
      } catch {
        if (cancelled) return;
        setMessages([]);
        setHasMoreMessages(false);
        setMessageCursor(null);
      } finally {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      }
    }

    void loadInitialMessages();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function getMessagesViewport() {
    return scrollAreaRef.current?.querySelector(
      '[data-radix-scroll-area-viewport]',
    ) as HTMLDivElement | null;
  }

  useEffect(() => {
    const viewport = getMessagesViewport();
    if (!viewport) return;

    if (pendingScrollModeRef.current === 'preserve' && scrollSnapshotRef.current) {
      const delta = viewport.scrollHeight - scrollSnapshotRef.current.height;
      viewport.scrollTop = scrollSnapshotRef.current.top + delta;
    } else if (pendingScrollModeRef.current === 'bottom') {
      viewport.scrollTop = viewport.scrollHeight;
    }

    pendingScrollModeRef.current = null;
    scrollSnapshotRef.current = null;
  }, [messages]);

  const syncReadState = useEffectEvent(async () => {
    if (!conversation || conversation.unreadCount === 0) return;
    const updated = await markConversationAsRead(id);
    await mutate(updated, false);
  });

  useEffect(() => {
    void syncReadState();
  }, [conversation?.id, conversation?.unreadCount]);

  useSocket({
    onNewMessage: ({ conversationId, message }) => {
      if (conversationId !== id) return;
      pendingScrollModeRef.current = 'bottom';
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
      if (message.senderType === 'contact') {
        void syncReadState();
      }
    },
    onMessageStatus: ({ conversationId, messageId, status }) => {
      if (conversationId !== id) return;
      setMessages((current) =>
        current.map((item) => (item.id === messageId ? { ...item, status: status as Message['status'] } : item)),
      );
    },
    onConversationPresence: ({ conversationId, operators }) => {
      if (conversationId !== id) return;
      setActiveOperatorIds(operators.map((operator) => operator.userId));
    },
  });

  useEffect(() => {
    setActiveOperatorIds([]);
    joinConversation(id);
    return () => leaveConversation(id);
  }, [id]);

  async function handleLoadOlderMessages() {
    if (!messageCursor || loadingOlderMessages) return;

    const viewport = getMessagesViewport();
    if (viewport) {
      scrollSnapshotRef.current = {
        height: viewport.scrollHeight,
        top: viewport.scrollTop,
      };
    }

    setLoadingOlderMessages(true);

    try {
      const page = await getConversationMessages(id, messageCursor);
      pendingScrollModeRef.current = 'preserve';
      setMessages((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const olderItems = page.items.filter((item) => !existingIds.has(item.id));
        return [...olderItems, ...current];
      });
      setHasMoreMessages(page.hasMore);
      setMessageCursor(page.nextCursor);
    } finally {
      setLoadingOlderMessages(false);
    }
  }

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
      pendingScrollModeRef.current = 'bottom';
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
        pendingScrollModeRef.current = 'bottom';
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

    pendingScrollModeRef.current = 'bottom';
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

    pendingScrollModeRef.current = 'bottom';
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
  const historicalConversations = (contactDetail?.conversations ?? [])
    .filter((item) => item.id !== conversation.id)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  const lastCustomerInteraction =
    contactDetail?.conversations
      ?.map((item) => item.lastContactMessageAt)
      .filter((value): value is string => Boolean(value))
      .sort(
        (left, right) => new Date(right).getTime() - new Date(left).getTime(),
      )[0] ?? conversation.lastContactMessageAt;
  const currentConversationSummary = contactDetail?.conversations.find(
    (item) => item.id === conversation.id,
  );
  const liveConversationResponseMetrics = calculateResponseMetrics(messages);
  const currentConversationResponseMetrics = {
    firstResponseMs:
      currentConversationSummary?.responseMetrics.firstResponseMs ??
      liveConversationResponseMetrics.firstResponseMs,
    averageResponseMs:
      currentConversationSummary?.responseMetrics.averageResponseMs ??
      liveConversationResponseMetrics.averageResponseMs,
    lastResponseMs:
      liveConversationResponseMetrics.lastResponseMs ??
      currentConversationSummary?.responseMetrics.lastResponseMs ??
      null,
    pendingResponseMs: liveConversationResponseMetrics.pendingResponseMs,
    responseCount: Math.max(
      liveConversationResponseMetrics.responseCount,
      currentConversationSummary?.responseMetrics.responseCount ?? 0,
    ),
  };
  const contactResponseMetrics =
    contactDetail?.responseMetrics ?? calculateResponseMetrics(messages);
  const totalMessageCount = contactDetail?.totalMessageCount ?? messages.length;

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
  const activeOperators = activeOperatorIds
    .map((userId) => users.find((user) => user.id === userId))
    .filter((user): user is WorkspaceUser => Boolean(user));
  const activeOperatorCount = activeOperatorIds.length;
  const activeOperatorLabel = activeOperatorCount
    ? `${activeOperatorCount} operador${activeOperatorCount > 1 ? 'es' : ''} ativo${activeOperatorCount > 1 ? 's' : ''}`
    : 'Nenhum operador ativo';
  const currentUserId = token
    ? (() => {
        try {
          return JSON.parse(atob(token.split('.')[1] ?? '')).sub as
            | string
            | undefined;
        } catch {
          return undefined;
        }
      })()
    : undefined;
  const hasOtherActiveOperator = currentUserId
    ? activeOperatorIds.some((operatorId) => operatorId !== currentUserId)
    : activeOperatorIds.length > 1;
  const collisionPreventionActive =
    mode === 'message' &&
    !isClosed &&
    !conversation.assignedUser &&
    hasOtherActiveOperator;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-border/60 bg-background/95 px-3 py-3 backdrop-blur lg:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-10 border border-border/60">
              <AvatarFallback className="bg-primary/10 text-primary">{getInitials(contactName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="truncate text-base font-semibold text-foreground">{contactName}</h1>
                <Badge variant={isClosed ? 'muted' : 'success'}>{isClosed ? 'Fechada' : 'Em atendimento'}</Badge>
                {conversation.isBotActive ? <Badge variant="outline">Bot ativo</Badge> : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {conversation.contact.phone}
                {conversation.assignedUser ? ` • ${conversation.assignedUser.name}` : ''}
                {conversation.team ? ` • ${conversation.team.name}` : ''}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant={activeOperators.length > 0 ? 'secondary' : 'outline'}>
                  {activeOperatorLabel}
                </Badge>
                {activeOperators.slice(0, 3).map((user) => (
                  <Badge key={user.id} variant="outline">
                    {user.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
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
              <Button onClick={handleReopen} size="sm" className="h-8 px-2.5 text-xs">
                <RotateCcw className="size-4" />
                Reabrir conversa
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleClose} size="sm" className="h-8 px-2.5 text-xs">
                <X className="size-4" />
                Fechar conversa
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-3 py-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:overflow-hidden lg:px-5">
        <Card className="flex min-h-0 flex-col overflow-hidden border-border/60 bg-white/50 shadow-none">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Linha do tempo do contato</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
            <ScrollArea
              ref={scrollAreaRef}
              className="min-h-0 flex-1 rounded-xl border border-border/60 bg-[linear-gradient(180deg,#fbfcfd_0%,#f5f7fa_100%)] p-3"
            >
              <div className="space-y-2.5">
                {hasMoreMessages ? (
                  <div className="flex justify-center pb-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => void handleLoadOlderMessages()}
                      disabled={loadingOlderMessages}
                    >
                      {loadingOlderMessages ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                      Ver mais
                    </Button>
                  </div>
                ) : null}
                {loadingMessages ? (
                  <div className="flex min-h-40 items-center justify-center">
                    <LoaderCircle className="size-5 animate-spin text-primary" />
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => (
                    <ConversationMessageBubble key={message.id} message={message} />
                  ))
                ) : (
                  <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/70 px-4 text-sm text-muted-foreground">
                    Nenhuma mensagem carregada nesta conversa.
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="rounded-xl border border-border/60 bg-background/95 p-2.5">
              {isClosed ? (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <span>Conversa encerrada. Reabra para continuar respondendo.</span>
                  <Button onClick={handleReopen} size="sm" className="h-8 px-2.5 text-xs">Reabrir</Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Mode toggle */}
                  <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/20 p-1">
                    <button
                      type="button"
                      onClick={() => setMode('message')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
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
                        'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
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
                    <p className="rounded-md border border-amber-100 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-600">
                      Notas internas são visíveis apenas para operadores. Use @nome para mencionar um colega.
                    </p>
                  )}

                  {mode === 'message' && !windowOpen && (
                    <div className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[11px] text-orange-700">
                      Janela de 24h expirada. O cliente não enviou mensagem recentemente. Use um template aprovado para retomar o contato.
                    </div>
                  )}

                  {collisionPreventionActive && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-700">
                      Outro operador esta com esta conversa aberta agora. Atribua a conversa antes de responder para evitar colisao.
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
                        'min-h-20 resize-none border-0 bg-transparent px-0 py-1 text-sm shadow-none focus-visible:ring-0',
                        mode === 'note' && 'text-amber-900 placeholder:text-amber-400',
                      )}
                      disabled={sending || collisionPreventionActive}
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
                      <div className="absolute bottom-full left-0 z-20 mb-1 w-full rounded-md border border-border bg-background shadow-lg">
                        {filteredQR.map((qr) => (
                          <button
                            key={qr.id}
                            onMouseDown={(e) => { e.preventDefault(); applyQuickReply(qr); }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
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
                    <div className="flex items-center gap-1.5">
                      {mode === 'message' && (
                        <>
                          <InteractiveMessageComposer
                            disabled={sending || collisionPreventionActive}
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
                            disabled={sending || collisionPreventionActive}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                            title="Enviar arquivo"
                          >
                            <Paperclip className="size-4" />
                          </button>
                        </>
                      )}
                      <p className="text-[11px] text-muted-foreground">
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
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
                      {sendError}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => void handleSend()}
                      disabled={!text.trim() || sending || collisionPreventionActive}
                      variant={mode === 'note' ? 'outline' : 'default'}
                      size="sm"
                      className={cn('h-8 px-2.5 text-xs', mode === 'note' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : '')}
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

        <Card className="flex min-h-0 flex-col overflow-hidden border-border/60 bg-white/50 shadow-none">
          <CardHeader className="px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              Contexto do atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 space-y-3 overflow-y-auto px-4 pb-4">
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contato</p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{contactName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{conversation.contact.phone}</p>
              {conversation.contact.email ? <p className="mt-1 text-sm text-muted-foreground">{conversation.contact.email}</p> : null}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Badge variant="outline">{formatContactSource(conversation.contact.source)}</Badge>
                <Badge
                  variant={
                    conversation.contact.optInStatus === 'opted_in'
                      ? 'secondary'
                      : conversation.contact.optInStatus === 'opted_out'
                        ? 'warning'
                        : 'muted'
                  }
                >
                  {formatOptInStatus(conversation.contact.optInStatus)}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {conversation.contact.optInAt
                  ? `Consentimento registrado em ${formatFullDateTime(conversation.contact.optInAt)}`
                  : 'Sem data de consentimento registrada'}
              </p>
              {conversation.contact.optInSource && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Origem: {conversation.contact.optInSource}
                </p>
              )}
              {conversation.contact.optInEvidence && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Evidência: {conversation.contact.optInEvidence}
                </p>
              )}
              <div className="mt-2.5 flex gap-2">
                {conversation.contact.optInStatus !== 'opted_in' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={async () => {
                      await setContactOptIn(conversation.contact.id, { status: 'opted_in', source: 'manual' });
                      void mutate();
                    }}
                  >
                    Registrar opt-in
                  </Button>
                )}
                {conversation.contact.optInStatus !== 'opted_out' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      await setContactOptIn(conversation.contact.id, { status: 'opted_out', source: 'manual' });
                      void mutate();
                    }}
                  >
                    Registrar opt-out
                  </Button>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Responsável</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{conversation.assignedUser?.name ?? 'Sem responsável definido'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{conversation.team?.name ?? 'Sem time vinculado'}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Presenca</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{activeOperatorLabel}</p>
              {activeOperators.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {activeOperators.map((user) => (
                    <Badge key={user.id} variant="outline" className="text-xs">
                      {user.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Nenhum operador com a conversa aberta agora.</p>
              )}
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resumo</p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-muted-foreground">
                <li>{totalMessageCount} mensagens registradas no histórico do contato</li>
                <li>Status: {conversation.status}</li>
                <li>Bot: {conversation.isBotActive ? 'ativo' : 'inativo'}</li>
                <li>
                  Última interação do cliente:{' '}
                  {lastCustomerInteraction
                    ? `${formatDistanceToNow(lastCustomerInteraction)} (${formatTime(lastCustomerInteraction)})`
                    : 'sem registro'}
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SLA e resposta</p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  Primeira resposta da conversa:{' '}
                  {currentConversationResponseMetrics.firstResponseMs
                    ? formatDuration(
                        currentConversationResponseMetrics.firstResponseMs,
                      )
                    : 'sem resposta registrada'}
                </li>
                <li>
                  Media de resposta do contato:{' '}
                  {contactResponseMetrics.averageResponseMs
                    ? formatDuration(contactResponseMetrics.averageResponseMs)
                    : 'sem base suficiente'}
                </li>
                <li>
                  Ultima resposta registrada:{' '}
                  {contactResponseMetrics.lastResponseMs
                    ? formatDuration(contactResponseMetrics.lastResponseMs)
                    : 'sem resposta registrada'}
                </li>
                <li>
                  SLA atual:{' '}
                  {currentConversationResponseMetrics.pendingResponseMs
                    ? `cliente aguardando ha ${formatDuration(currentConversationResponseMetrics.pendingResponseMs)}`
                    : 'sem pendencia de resposta'}
                </li>
                <li>
                  Respostas analisadas: {contactResponseMetrics.responseCount}
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Histórico de conversas
              </p>
              {historicalConversations.length > 0 ? (
                <div className="mt-2.5 space-y-2">
                  {historicalConversations.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/60 bg-background/80 px-2.5 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={item.status === 'closed' ? 'muted' : 'outline'}>
                          {item.status === 'closed' ? 'Encerrada' : 'Aberta'}
                        </Badge>
                        <span
                          className="text-[11px] text-muted-foreground"
                          title={formatFullDateTime(item.createdAt)}
                        >
                          {formatDistanceToNow(item.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        <p>{item.messageCount} mensagens</p>
                        <p>
                          Última atividade:{' '}
                          {item.lastMessageAt
                            ? formatFullDateTime(item.lastMessageAt)
                            : 'sem atividade'}
                        </p>
                        <p>
                          Responsável:{' '}
                          {item.assignedUser?.name ?? 'sem responsável'} •{' '}
                          {item.team?.name ?? 'sem time'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Este contato ainda não tem conversas anteriores.
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
              <div className="mb-2.5 flex items-center gap-2">
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
              <div className="rounded-xl border border-border/60 bg-muted/25 p-3">
                <div className="mb-2.5 flex items-center gap-2">
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
