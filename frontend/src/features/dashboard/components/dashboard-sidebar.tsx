'use client';

import { useDeferredValue, useEffect, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bot,
  ChevronRight,
  Kanban,
  LayoutDashboard,
  LogOut,
  MessageSquareMore,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  assignConversation,
  closeConversation,
  deleteConversation,
  reopenConversation,
  useConversations,
  useMessageSearch,
} from '@/hooks/useConversations';
import {
  addTag,
  deleteContact,
  moveContact,
  removeContactFromPipeline,
  removeTag,
  updateContact,
  useContacts,
} from '@/hooks/useContacts';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import type { Conversation } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getMessagePreview(conversation: Conversation) {
  const lastMessage = conversation.messages[0];
  if (!lastMessage) return 'Sem mensagens';
  if (lastMessage.deletedAt) return 'Mensagem excluida';
  if (lastMessage.type === 'interactive') {
    const labelByType: Record<string, string> = {
      reply_buttons: 'Interativo: botões',
      list: 'Interativo: lista',
      cta_url: 'Interativo: link',
      button_reply: 'Resposta: botão',
      list_reply: 'Resposta: lista',
    };
    return (
      labelByType[lastMessage.interactiveType ?? ''] ??
      lastMessage.content ??
      'Mensagem interativa'
    );
  }
  if (lastMessage.type === 'image') return 'Imagem compartilhada';
  if (lastMessage.type === 'sticker') return 'Sticker compartilhado';
  if (lastMessage.type === 'video') return 'Video compartilhado';
  if (lastMessage.type === 'audio') return 'Audio compartilhado';
  if (lastMessage.type === 'document') return 'Documento compartilhado';
  if (lastMessage.type === 'location') return 'Localizacao compartilhada';
  if (lastMessage.type === 'contacts') return 'Contato compartilhado';
  return lastMessage.content ?? 'Mídia compartilhada';
}

interface WorkspaceUserOption {
  id: string;
  name: string;
}

interface WorkspaceTeamOption {
  id: string;
  name: string;
}

interface ContactDetail {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  company: string | null;
  contactTags: Array<{ tag: { id: string; name: string; color: string | null } }>;
  contactPipelines: Array<{
    pipeline: { id: string; name: string };
    stage: { id: string; name: string; color?: string | null };
  }>;
}

// ─── Global Search ────────────────────────────────────────────────────────────

export function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q);
  const { results, isLoading } = useMessageSearch(deferredQ);

  function close() {
    setOpen(false);
    setQ('');
  }

  function goToConversation(conversationId: string) {
    router.push(`/conversations/${conversationId}`);
    onNavigate?.();
    close();
  }

  // ⌘K keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Buscar mensagens...</span>
        <kbd className="text-[10px] rounded bg-border/60 px-1.5 py-0.5">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/70 bg-background shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar em mensagens e conversas..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button onClick={close} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {isLoading ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">Buscando...</p>
              ) : q.trim() && results.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhum resultado para &quot;{q}&quot;</p>
              ) : results.length > 0 ? (
                results.map((msg) => {
                  const contactName = msg.conversation.contact.name ?? msg.conversation.contact.phone;
                  return (
                    <button
                      key={msg.id}
                      onClick={() => goToConversation(msg.conversation.id)}
                      className="flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left hover:bg-accent transition-colors"
                    >
                      <span className="text-xs font-medium text-foreground">{contactName}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{msg.content}</span>
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Digite para buscar em mensagens de todas as conversas.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Nav Rail (64px) ──────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/conversations', label: 'Inbox', icon: MessageSquareMore },
  { href: '/contacts', label: 'Contatos', icon: Users },
  { href: '/crm', label: 'CRM Kanban', icon: Kanban },
  { href: '/automation', label: 'Automação', icon: Bot },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

function shouldForceSidebarReload(pathname: string, href: string) {
  const isFlowEditorRoute = /^\/automation\/[^/]+/.test(pathname);
  return isFlowEditorRoute && href !== '/automation';
}

function handleSidebarNavigation(
  event: ReactMouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string,
) {
  if (!shouldForceSidebarReload(pathname, href)) return;
  event.preventDefault();
  window.location.assign(href);
}

export function NavRail() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-16 shrink-0 flex-col items-center border-r border-border/70 bg-white/80 backdrop-blur py-4 gap-1">
      {/* Logo */}
      <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="size-5" />
      </div>

      <Separator className="mb-2 w-8" />

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  prefetch={false}
                  onClick={(event) => handleSidebarNavigation(event, pathname, href)}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  aria-label={label}
                >
                  <Icon className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <Separator className="mt-2 mb-2 w-8" />

      {/* Logout */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={logout}
            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Sair da operação"
          >
            <LogOut className="size-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Sair da operação</TooltipContent>
      </Tooltip>
    </aside>
  );
}

// ─── Conversation list item ────────────────────────────────────────────────────

function ConversationListItem({
  conversation,
  active,
  onOpen,
  onChanged,
  onRemoved,
}: {
  conversation: Conversation;
  active: boolean;
  onOpen: () => void;
  onChanged: () => Promise<void> | void;
  onRemoved: (conversationId: string) => void;
}) {
  const name = conversation.contact.name ?? conversation.contact.phone;
  const preview = getMessagePreview(conversation);

  return (
    <div
      className={cn(
        'flex w-full min-w-0 items-start gap-2 overflow-hidden rounded-xl border px-3 py-3 transition-colors hover:border-primary/30 hover:bg-accent/60',
        active ? 'border-primary/30 bg-primary/5' : 'border-transparent bg-background',
      )}
    >
      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <Avatar className="size-9 shrink-0 border border-border/70">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-1">
            <p className="min-w-0 flex-1 overflow-hidden text-sm font-medium text-foreground break-words [overflow-wrap:anywhere]">
              {name}
            </p>
            <div className="shrink-0 flex items-center gap-1.5">
              {conversation.unreadCount > 0 ? (
                <Badge variant="default" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </Badge>
              ) : null}
              {conversation.lastMessageAt ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNow(conversation.lastMessageAt)}</span>
              ) : null}
            </div>
          </div>
          <p className="max-w-full text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">
            {preview}
          </p>
          <div className="flex min-w-0 items-center gap-1.5 pt-0.5">
            <Badge variant={conversation.status === 'open' ? 'success' : 'muted'} className="text-[10px] px-1.5 py-0">
              {conversation.status === 'open' ? 'Aberta' : 'Fechada'}
            </Badge>
            {conversation.assignedUser ? (
              <span className="min-w-0 flex-1 text-[10px] text-muted-foreground break-words [overflow-wrap:anywhere]">
                {conversation.assignedUser.name}
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <ConversationActionsSheet
        conversation={conversation}
        onChanged={onChanged}
        onRemoved={onRemoved}
      />
    </div>
  );
}

function ConversationActionsSheet({
  conversation,
  onChanged,
  onRemoved,
}: {
  conversation: Conversation;
  onChanged: () => Promise<void> | void;
  onRemoved: (conversationId: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactDetail, setContactDetail] = useState<ContactDetail | null>(null);
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string; stages: Array<{ id: string; name: string }> }>>([]);
  const [users, setUsers] = useState<WorkspaceUserOption[]>([]);
  const [teams, setTeams] = useState<WorkspaceTeamOption[]>([]);
  const [contactForm, setContactForm] = useState({
    name: conversation.contact.name ?? '',
    email: conversation.contact.email ?? '',
    company: '',
  });
  const [selectedUserId, setSelectedUserId] = useState(conversation.assignedUser?.id ?? '');
  const [selectedTeamId, setSelectedTeamId] = useState(conversation.team?.id ?? '');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [deleteConversationOpen, setDeleteConversationOpen] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);

  const selectedPipeline = pipelines.find((pipeline) => pipeline.id === selectedPipelineId) ?? null;
  const appliedTagIds = new Set(contactDetail?.contactTags.map(({ tag }) => tag.id) ?? []);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const requests: Promise<any>[] = [
        api.get<ContactDetail>(`/contacts/${conversation.contact.id}?includeMessages=false`),
      ];

      if (hasPermission('manage_contacts')) {
        requests.push(api.get('/contacts/tags/list'));
      }
      if (hasPermission('manage_pipelines')) {
        requests.push(api.get('/pipelines'));
      }
      if (hasPermission('assign_conversation')) {
        requests.push(api.get<WorkspaceUserOption[]>('/users'));
        requests.push(api.get<WorkspaceTeamOption[]>('/teams'));
      }

      const responses = await Promise.all(requests);
      const [contactResponse, ...rest] = responses;
      setContactDetail(contactResponse.data);
      setContactForm({
        name: contactResponse.data.name ?? '',
        email: contactResponse.data.email ?? '',
        company: contactResponse.data.company ?? '',
      });

      let offset = 0;

      if (hasPermission('manage_contacts')) {
        setTags(rest[offset].data);
        offset += 1;
      } else {
        setTags([]);
      }

      if (hasPermission('manage_pipelines')) {
        setPipelines(rest[offset].data);
        offset += 1;
      } else {
        setPipelines([]);
      }

      if (hasPermission('assign_conversation')) {
        setUsers(rest[offset].data);
        setTeams(rest[offset + 1].data);
      } else {
        setUsers([]);
        setTeams([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel carregar as acoes da conversa.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void loadData();
  }, [open]);

  async function handleContactSave() {
    setSaving(true);
    setError(null);
    try {
      await updateContact(conversation.contact.id, {
        name: contactForm.name.trim() || undefined,
        email: contactForm.email.trim() || undefined,
        company: contactForm.company.trim() || null,
      });
      await loadData();
      await onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel salvar o contato.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignmentSave() {
    setSaving(true);
    setError(null);
    try {
      await assignConversation(
        conversation.id,
        selectedUserId || undefined,
        selectedTeamId || undefined,
      );
      await onChanged();
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel atualizar a atribuicao.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTag() {
    if (!selectedTagId) return;
    setSaving(true);
    setError(null);
    try {
      await addTag(conversation.contact.id, selectedTagId);
      setSelectedTagId('');
      await loadData();
      await onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel adicionar a tag.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveTag(tagId: string) {
    setSaving(true);
    setError(null);
    try {
      await removeTag(conversation.contact.id, tagId);
      await loadData();
      await onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel remover a tag.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveToPipeline() {
    if (!selectedPipelineId || !selectedStageId) return;
    setSaving(true);
    setError(null);
    try {
      await moveContact(selectedPipelineId, conversation.contact.id, selectedStageId);
      setSelectedStageId('');
      await loadData();
      await onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel mover o contato no pipeline.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveFromPipeline(pipelineId: string) {
    setSaving(true);
    setError(null);
    try {
      await removeContactFromPipeline(pipelineId, conversation.contact.id);
      await loadData();
      await onChanged();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel remover do pipeline.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    setSaving(true);
    setError(null);
    try {
      if (conversation.status === 'open') {
        await closeConversation(conversation.id);
      } else {
        await reopenConversation(conversation.id);
      }
      await onChanged();
      setOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel atualizar a conversa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConversation() {
    setSaving(true);
    setError(null);
    try {
      await deleteConversation(conversation.id);
      setDeleteConversationOpen(false);
      setOpen(false);
      if (pathname.startsWith(`/conversations/${conversation.id}`)) {
        router.push('/conversations');
      }
      onRemoved(conversation.id);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel excluir a conversa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContact() {
    setSaving(true);
    setError(null);
    try {
      await deleteContact(conversation.contact.id);
      setDeleteContactOpen(false);
      setOpen(false);
      if (pathname.startsWith(`/conversations/${conversation.id}`)) {
        router.push('/conversations');
      }
      onRemoved(conversation.id);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Nao foi possivel excluir o contato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-7 shrink-0 self-center rounded-full"
        onClick={() => setOpen(true)}
        title="Acoes da conversa"
      >
        <ChevronRight className="size-4" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Acoes do atendimento</SheetTitle>
            <SheetDescription>
              Edite o contato, ajuste atribuicao, tags e pipeline sem sair da fila.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <p className="text-sm font-semibold text-foreground">
                {conversation.contact.name ?? conversation.contact.phone}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{conversation.contact.phone}</p>
              {conversation.lastMessageAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Ultima mensagem {formatDistanceToNow(conversation.lastMessageAt)}
                </p>
              ) : null}
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            ) : null}

            {!loading && hasPermission('manage_contacts') ? (
              <section className="space-y-3 rounded-xl border border-border/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Editar contato</p>
                  <p className="text-xs text-muted-foreground">Atualize os dados basicos do contato.</p>
                </div>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm((current) => ({ ...current, name: e.target.value }))}
                  placeholder="Nome do contato"
                />
                <Input
                  value={contactForm.email}
                  onChange={(e) => setContactForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="Email"
                  type="email"
                />
                <Input
                  value={contactForm.company}
                  onChange={(e) => setContactForm((current) => ({ ...current, company: e.target.value }))}
                  placeholder="Empresa"
                />
                <Button size="sm" onClick={handleContactSave} disabled={saving}>
                  Salvar contato
                </Button>
              </section>
            ) : null}

            {!loading && hasPermission('assign_conversation') ? (
              <section className="space-y-3 rounded-xl border border-border/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Atribuicao</p>
                  <p className="text-xs text-muted-foreground">Defina operador e time responsaveis.</p>
                </div>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sem operador</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sem time</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleAssignmentSave} disabled={saving}>
                  Salvar atribuicao
                </Button>
              </section>
            ) : null}

            {!loading && hasPermission('manage_contacts') ? (
              <section className="space-y-3 rounded-xl border border-border/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Tags</p>
                  <p className="text-xs text-muted-foreground">Adicione ou remova tags do contato.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contactDetail?.contactTags.length ? (
                    contactDetail.contactTags.map(({ tag }) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ background: `${tag.color ?? '#64748b'}20`, color: tag.color ?? '#64748b' }}
                      >
                        {tag.name} x
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhuma tag aplicada.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTagId}
                    onChange={(e) => setSelectedTagId(e.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Selecionar tag</option>
                    {tags
                      .filter((tag) => !appliedTagIds.has(tag.id))
                      .map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                  </select>
                  <Button size="sm" onClick={handleAddTag} disabled={saving || !selectedTagId}>
                    Adicionar
                  </Button>
                </div>
              </section>
            ) : null}

            {!loading && hasPermission('manage_pipelines') ? (
              <section className="space-y-3 rounded-xl border border-border/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Pipeline</p>
                  <p className="text-xs text-muted-foreground">Coloque o contato em uma etapa ou remova de um pipeline.</p>
                </div>
                <div className="space-y-2">
                  {contactDetail?.contactPipelines.length ? (
                    contactDetail.contactPipelines.map(({ pipeline, stage }) => (
                      <div key={pipeline.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{pipeline.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{stage.name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFromPipeline(pipeline.id)}
                          disabled={saving}
                        >
                          Remover
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Contato fora de pipelines.</p>
                  )}
                </div>
                <select
                  value={selectedPipelineId}
                  onChange={(e) => {
                    setSelectedPipelineId(e.target.value);
                    setSelectedStageId('');
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Selecionar pipeline</option>
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  disabled={!selectedPipeline}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="">Selecionar etapa</option>
                  {selectedPipeline?.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleMoveToPipeline} disabled={saving || !selectedPipelineId || !selectedStageId}>
                  Salvar pipeline
                </Button>
              </section>
            ) : null}

            {!loading && hasPermission('close_conversation') ? (
              <section className="space-y-3 rounded-xl border border-border/70 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Conversa</p>
                  <p className="text-xs text-muted-foreground">Controle o status do atendimento e remocao.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleToggleStatus} disabled={saving}>
                    {conversation.status === 'open' ? 'Fechar conversa' : 'Reabrir conversa'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConversationOpen(true)}
                    disabled={saving}
                  >
                    <Trash2 className="size-4" />
                    Excluir conversa
                  </Button>
                </div>
              </section>
            ) : null}

            {!loading && hasPermission('manage_contacts') ? (
              <section className="space-y-3 rounded-xl border border-destructive/20 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Contato</p>
                  <p className="text-xs text-muted-foreground">Remova o contato quando ele nao deve mais existir no CRM.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteContactOpen(true)}
                  disabled={saving}
                >
                  <Trash2 className="size-4" />
                  Excluir contato
                </Button>
              </section>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteConversationOpen} onOpenChange={setDeleteConversationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conversa</DialogTitle>
            <DialogDescription>
              Esta acao remove a conversa e o historico dela. Nao ha desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConversationOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConversation} disabled={saving}>
              Excluir conversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir contato</DialogTitle>
            <DialogDescription>
              Esta acao remove o contato do CRM. Se ainda houver conversa vinculada, a exclusao pode ser bloqueada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteContactOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteContact} disabled={saving}>
              Excluir contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Nova Conversa Dialog ─────────────────────────────────────────────────────

function NovaConversaDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [accountId, setAccountId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [headerVariables, setHeaderVariables] = useState<string[]>([]);
  const [buttonVariables, setButtonVariables] = useState<string[]>([]);
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const { contacts } = useContacts();
  const filtered = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch),
  ).slice(0, 8);

  useEffect(() => {
    if (!open) return;
    api.get('/workspaces/whatsapp-accounts').then((r) => setAccounts(r.data));
    api.get('/templates').then((r) => setTemplates((r.data as any[]).filter((t) => t.status === 'APPROVED')));
  }, [open]);

  useEffect(() => {
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      const bodyCount = (tpl.body.match(/\{\{(\d+)\}\}/g) ?? []).length;
      const headerCount = tpl.headerText ? (tpl.headerText.match(/\{\{(\d+)\}\}/g) ?? []).length : 0;
      const urlButtons = Array.isArray(tpl.buttons)
        ? tpl.buttons.filter((button: { type?: string }) => button.type === 'URL')
        : [];
      setVariables(Array.from({ length: bodyCount }, () => ''));
      setHeaderVariables(Array.from({ length: headerCount }, () => ''));
      setButtonVariables(Array.from({ length: urlButtons.length }, () => ''));
      setHeaderMediaUrl('');
    } else {
      setVariables([]);
      setHeaderVariables([]);
      setButtonVariables([]);
      setHeaderMediaUrl('');
    }
  }, [templateId, templates]);

  async function handleSend() {
    if (!selectedContact || !accountId || !templateId) return;
    setSending(true);
    try {
      const res = await api.post('/conversations/initiate', {
        contactId: selectedContact.id,
        whatsappAccountId: accountId,
        templateId,
        variables: variables.length ? variables : undefined,
        headerVariables: headerVariables.length ? headerVariables : undefined,
        buttonVariables: buttonVariables.length ? buttonVariables : undefined,
        headerMediaUrl: headerMediaUrl || undefined,
      });
      setOpen(false);
      onCreated();
      router.push(`/conversations/${res.data.conversation.id}`);
    } finally { setSending(false); }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(true)} title="Nova conversa">
        <Plus className="size-3.5" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
      <div className="bg-background rounded-xl shadow-xl border border-border w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Nova Conversa Outbound</p>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>

        {/* Contato */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Contato</label>
          {selectedContact ? (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm">{selectedContact.name ?? selectedContact.phone}</span>
              <button onClick={() => setSelectedContact(null)} className="text-muted-foreground"><X className="size-3" /></button>
            </div>
          ) : (
            <>
              <Input placeholder="Buscar por nome ou telefone" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
              {contactSearch && (
                <div className="rounded-md border border-border divide-y divide-border max-h-40 overflow-y-auto">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedContact(c); setContactSearch(''); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      {c.name ?? c.phone} <span className="text-xs text-muted-foreground">{c.phone}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum contato encontrado.</p>}
                </div>
              )}
            </>
          )}
        </div>

        {/* Conta WhatsApp */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Conta WhatsApp</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">Selecionar conta</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name ?? a.displayPhoneNumber}</option>)}
          </select>
        </div>

        {/* Template */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Template HSM (aprovado)</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">Selecionar template</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.language})</option>)}
          </select>
        </div>

        {/* Variáveis do template */}
        {variables.map((v, i) => (
          <div key={i} className="space-y-1">
            <label className="text-xs text-muted-foreground">Variável {`{{${i + 1}}}`}</label>
            <Input
              value={v}
              onChange={(e) => setVariables((prev) => prev.map((val, idx) => idx === i ? e.target.value : val))}
              placeholder={`Valor para {{${i + 1}}}`}
            />
          </div>
        ))}

        {headerVariables.map((v, i) => (
          <div key={`header-${i}`} className="space-y-1">
            <label className="text-xs text-muted-foreground">Header {`{{${i + 1}}}`}</label>
            <Input
              value={v}
              onChange={(e) => setHeaderVariables((prev) => prev.map((val, idx) => idx === i ? e.target.value : val))}
              placeholder={`Valor para header {{${i + 1}}}`}
            />
          </div>
        ))}

        {templates.find((t) => t.id === templateId)?.headerFormat &&
        templates.find((t) => t.id === templateId)?.headerFormat !== 'TEXT' ? (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">URL da mídia do header</label>
            <Input
              value={headerMediaUrl}
              onChange={(e) => setHeaderMediaUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        ) : null}

        {buttonVariables.map((v, i) => (
          <div key={`button-${i}`} className="space-y-1">
            <label className="text-xs text-muted-foreground">Botão URL {i + 1}</label>
            <Input
              value={v}
              onChange={(e) => setButtonVariables((prev) => prev.map((val, idx) => idx === i ? e.target.value : val))}
              placeholder="Valor do sufixo da URL"
            />
          </div>
        ))}

        <Button
          className="w-full"
          disabled={!selectedContact || !accountId || !templateId || sending}
          onClick={handleSend}
        >
          {sending ? <span className="animate-spin mr-2">⟳</span> : null}
          Iniciar conversa
        </Button>
      </div>
    </div>
  );
}

// ─── Inbox Rail (inside ContextSidebar) ───────────────────────────────────────

function InboxRail() {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const { conversations, isLoading, mutate } = useConversations(status);
  const [liveConversations, setLiveConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setLiveConversations(conversations);
  }, [conversations]);

  useSocket({
    onNewMessage: ({ conversationId, message, unreadCount }) => {
      setLiveConversations((current) => {
        const targetIndex = current.findIndex((item) => item.id === conversationId);
        if (targetIndex === -1) {
          void mutate();
          return current;
        }
        const updated = [...current];
        const conv = updated[targetIndex];
        updated[targetIndex] = {
          ...conv,
          lastMessageAt: message.createdAt,
          unreadCount:
            typeof unreadCount === 'number'
              ? unreadCount
              : message.senderType === 'contact' && conversationId !== activeConversationId
                ? conv.unreadCount + 1
                : conv.unreadCount,
          messages: [message, ...conv.messages.filter((m) => m.id !== message.id)],
        };
        const [moved] = updated.splice(targetIndex, 1);
        return [moved, ...updated];
      });
    },
    onMessageUpdated: ({ conversationId, message }) => {
      setLiveConversations((current) =>
        current.map((item) =>
          item.id !== conversationId
            ? item
            : {
                ...item,
                messages: item.messages.map((entry) =>
                  entry.id === message.id ? { ...entry, ...message } : entry,
                ),
              },
        ),
      );
    },
    onConversationUpdated: ({ conversationId, conversation }) => {
      setLiveConversations((current) => {
        const matchesCurrentStatus = conversation.status === status;
        const targetIndex = current.findIndex((item) => item.id === conversationId);

        if (!matchesCurrentStatus) {
          return targetIndex === -1
            ? current
            : current.filter((item) => item.id !== conversationId);
        }

        if (targetIndex === -1) {
          void mutate();
          return current;
        }

        return current.map((item) =>
          item.id === conversationId ? { ...item, ...conversation } : item,
        );
      });
    },
    onConversationDeleted: ({ conversationId }) => {
      setLiveConversations((current) =>
        current.filter((item) => item.id !== conversationId),
      );
    },
  });

  const activeConversationId = pathname.startsWith('/conversations/') ? pathname.split('/')[2] : null;
  const query = deferredSearch.trim().toLowerCase();
  const filtered = liveConversations.filter((c) => {
    if (!query) return true;
    return c.contact.phone.includes(query) || c.contact.name?.toLowerCase().includes(query);
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="space-y-3 px-3 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Fila de atendimento</p>
          <div className="flex items-center gap-1">
            <NovaConversaDialog onCreated={() => void mutate()} />
            <Button variant="ghost" size="icon" className="size-7" onClick={() => void mutate()} aria-label="Atualizar">
              <RefreshCcw className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou telefone"
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            size="sm"
            variant={status === 'open' ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => setStatus('open')}
          >
            Abertas
          </Button>
          <Button
            size="sm"
            variant={status === 'closed' ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => setStatus('closed')}
          >
            Fechadas
          </Button>
        </div>
      </div>

      <Separator />

      <ScrollArea className="min-h-0 flex-1 px-2 py-2">
        <div className="space-y-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={`sk-${i}`} className="rounded-xl border border-border/70 p-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((c) => (
              <ConversationListItem
                key={c.id}
                conversation={c}
                active={c.id === activeConversationId}
                onOpen={() => router.push(`/conversations/${c.id}`)}
                onChanged={async () => {
                  await mutate();
                }}
                onRemoved={(conversationId) => {
                  setLiveConversations((current) =>
                    current.filter((item) => item.id !== conversationId),
                  );
                  void mutate();
                }}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center">
              <Users className="mx-auto mb-2 size-5 text-muted-foreground" />
              <p className="text-xs font-medium text-foreground">Nenhuma conversa</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Aguarde novas entradas.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Context Sidebar (300px) ───────────────────────────────────────────────────

export function ContextSidebar() {
  const pathname = usePathname();
  const isInbox = pathname.startsWith('/conversations');

  if (!isInbox) return null;

  return (
    <aside className="hidden h-screen min-h-0 w-[300px] shrink-0 flex-col overflow-hidden border-r border-border/70 bg-white/70 backdrop-blur xl:flex">
      {/* Header */}
      <div className="px-3 py-4 border-b border-border/70">
        <GlobalSearch />
      </div>
      <InboxRail />
    </aside>
  );
}

// ─── DashboardSidebar (mobile sheet trigger) ──────────────────────────────────
// On mobile, NavRail is hidden and a top bar with a sheet drawer takes over.
// The sheet contains both nav + inbox rail when in /conversations.

export function DashboardSidebar() {
  // NavRail and ContextSidebar are rendered directly in the layout.
  // This component exists only for backwards compatibility.
  return null;
}
