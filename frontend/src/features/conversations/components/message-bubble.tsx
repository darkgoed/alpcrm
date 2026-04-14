'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  List,
  Lock,
  MapPin,
  MousePointerSquareDashed,
  Paperclip,
  Reply,
  Smile,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { Message, MessageReference } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/dateUtils';

const ACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewableDocument(mimeType: string | null) {
  return mimeType === 'application/pdf' || mimeType?.startsWith('text/') === true;
}

function resolveMediaUrl(mediaUrl: string | null) {
  if (!mediaUrl) return null;

  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  const browserOrigin =
    typeof window !== 'undefined' ? window.location.origin.replace(/\/+$/, '') : null;
  const browserUsesPublicHost =
    !!browserOrigin &&
    !browserOrigin.includes('://localhost') &&
    !browserOrigin.includes('://127.0.0.1') &&
    !browserOrigin.includes('://0.0.0.0');
  const preferredBase =
    browserUsesPublicHost ? browserOrigin : configuredApiUrl;

  if (mediaUrl.startsWith('/')) {
    if (preferredBase) {
      return new URL(mediaUrl, `${preferredBase}/`).toString();
    }
    return mediaUrl;
  }

  try {
    const parsed = new URL(mediaUrl);
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0';

    if (isLocalhost && preferredBase) {
      return new URL(parsed.pathname + parsed.search + parsed.hash, `${preferredBase}/`).toString();
    }
  } catch {
    return mediaUrl;
  }

  return mediaUrl;
}

function getReferenceLabel(message: MessageReference | null) {
  if (!message) return 'Mensagem original';
  if (message.deletedAt) return 'Mensagem excluida';
  if (message.type === 'image') return message.content ?? 'Imagem';
  if (message.type === 'sticker') return 'Sticker';
  if (message.type === 'video') return message.content ?? 'Video';
  if (message.type === 'audio') return 'Audio';
  if (message.type === 'document') return message.fileName ?? 'Documento';
  if (message.type === 'location') return message.metadata?.location?.name ?? message.metadata?.location?.address ?? 'Localizacao';
  if (message.type === 'contacts') return message.content ?? 'Contato compartilhado';
  return message.content ?? 'Mensagem';
}

function buildMapLink(message: Message) {
  const location = message.metadata?.location;
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
}

function MessageReplyPreview({ message }: { message: MessageReference }) {
  return (
    <div className="mb-2 rounded-xl border border-current/15 bg-black/5 px-2.5 py-2 text-xs">
      <div className="mb-1 inline-flex items-center gap-1.5 font-medium opacity-75">
        <Reply className="size-3.5" />
        Respondendo
      </div>
      <p className="line-clamp-2 leading-4">{getReferenceLabel(message)}</p>
    </div>
  );
}

function MessageActions({
  message,
  onReply,
  onDelete,
  onReact,
}: {
  message: Message;
  onReply?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  if (!onReply && !onDelete && !onReact) {
    return null;
  }

  return (
    <div ref={containerRef} className="absolute right-1.5 top-1.5 z-20">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="rounded-full bg-black/10 p-1 opacity-0 transition group-hover:opacity-100 hover:bg-black/20"
        aria-label="Acoes da mensagem"
      >
        <ChevronDown className="size-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 mt-1 w-52 rounded-xl border border-border/70 bg-background p-2 text-foreground shadow-xl">
          <div className="mb-2 flex flex-wrap gap-1">
            {ACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-lg border border-border/70 px-2 py-1 text-sm hover:bg-accent"
                onClick={() => {
                  onReact?.(message, emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent"
            onClick={() => {
              onReply?.(message);
              setOpen(false);
            }}
          >
            <Reply className="size-4" />
            Responder
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              onDelete?.(message);
              setOpen(false);
            }}
          >
            <Trash2 className="size-4" />
            Excluir
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ReactionRow({ message }: { message: Message }) {
  const grouped = useMemo(() => {
    const counts = new Map<string, number>();
    for (const reaction of message.reactions ?? []) {
      counts.set(reaction.emoji, (counts.get(reaction.emoji) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [message.reactions]);

  if (grouped.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {grouped.map(([emoji, count]) => (
        <span
          key={emoji}
          className="inline-flex items-center gap-1 rounded-full border border-current/15 bg-black/5 px-2 py-0.5 text-[11px]"
        >
          <span>{emoji}</span>
          <span>{count}</span>
        </span>
      ))}
    </div>
  );
}

function MediaPreviewDialog({
  open,
  onOpenChange,
  message,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  message: Message;
}) {
  const label = message.fileName ?? message.content ?? 'arquivo';
  const mediaUrl = resolveMediaUrl(message.mediaUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[75vh] overflow-hidden rounded-xl border border-border/70 bg-muted/20">
          {message.type === 'image' || message.type === 'sticker' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl ?? ''}
              alt={label}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : message.type === 'document' && isPreviewableDocument(message.mimeType) ? (
            <iframe
              src={mediaUrl ?? ''}
              title={label}
              className="h-[70vh] w-full"
            />
          ) : null}
        </div>
        <DialogFooter>
          <Button asChild variant="outline">
            <a href={mediaUrl ?? '#'} download={message.fileName ?? true}>
              <Download className="size-4" />
              Baixar
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaContent({ message }: { message: Message }) {
  const { type, mediaUrl, content, mimeType, fileName, fileSize } = message;
  const [previewOpen, setPreviewOpen] = useState(false);
  const resolvedMediaUrl = resolveMediaUrl(mediaUrl);

  if (!resolvedMediaUrl) {
    return (
      <span className="inline-flex items-center gap-2 text-sm italic opacity-80">
        <Paperclip className="size-4" />
        Midia nao disponivel
      </span>
    );
  }

  if (type === 'image' || type === 'sticker') {
    return (
      <>
        <button type="button" className="space-y-1 text-left" onClick={() => setPreviewOpen(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedMediaUrl}
            alt={fileName ?? (type === 'sticker' ? 'sticker' : 'imagem')}
            className={cn(
              'rounded-lg object-contain',
              type === 'sticker' ? 'max-h-[180px] max-w-[180px]' : 'max-w-[220px]',
            )}
          />
          {content ? <p className="text-sm leading-5">{content}</p> : null}
        </button>
        <MediaPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} message={message} />
      </>
    );
  }

  if (type === 'audio') {
    return (
      <audio controls className="max-w-[220px]">
        <source src={resolvedMediaUrl} type={mimeType ?? 'audio/ogg'} />
      </audio>
    );
  }

  if (type === 'video') {
    return (
      <div className="space-y-1">
        <video controls className="max-w-[220px] rounded-lg">
          <source src={resolvedMediaUrl} type={mimeType ?? 'video/mp4'} />
        </video>
        {content ? <p className="text-sm leading-5">{content}</p> : null}
      </div>
    );
  }

  if (type === 'document' && isPreviewableDocument(mimeType)) {
    return (
      <>
        <button type="button" className="w-full space-y-2 text-left" onClick={() => setPreviewOpen(true)}>
          <div className="overflow-hidden rounded-lg border border-current/15 bg-white">
            <iframe
              src={resolvedMediaUrl}
              title={fileName ?? 'documento'}
              className="h-56 w-full pointer-events-none"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{fileName ?? 'documento'}</span>
            {fileSize ? <span className="text-xs opacity-70">{formatBytes(fileSize)}</span> : null}
          </div>
          {content ? <p className="text-sm leading-5">{content}</p> : null}
        </button>
        <MediaPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} message={message} />
      </>
    );
  }

  return (
    <a
      href={resolvedMediaUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName ?? true}
      className="inline-flex items-center gap-2 rounded-md border border-current/20 bg-white/10 px-2.5 py-1.5 text-sm hover:bg-white/20"
    >
      <Paperclip className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{fileName ?? 'documento'}</span>
      {fileSize ? <span className="shrink-0 text-xs opacity-70">{formatBytes(fileSize)}</span> : null}
      <Download className="size-3.5 shrink-0 opacity-70" />
    </a>
  );
}

function NoteContent({ content }: { content: string }) {
  const parts = content.split(/(@\S+)/g);
  return (
    <p className="whitespace-pre-wrap leading-5">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="rounded bg-amber-100 px-0.5 font-semibold text-amber-700">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function InteractiveContent({ message }: { message: Message }) {
  const payload = message.interactivePayload;
  const kind = message.interactiveType;

  if (!payload || !kind) {
    return <p className="whitespace-pre-wrap leading-5">{message.content}</p>;
  }

  if (kind === 'reply_buttons') {
    return (
      <div className="space-y-2">
        {payload.headerText ? <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{payload.headerText}</p> : null}
        {payload.body ? <p className="whitespace-pre-wrap leading-5">{payload.body}</p> : null}
        <div className="space-y-1.5">
          {payload.buttons?.map((button) => (
            <div key={button.id} className="flex items-center gap-2 rounded-lg border border-current/15 px-2.5 py-1.5">
              <MousePointerSquareDashed className="size-4 shrink-0 opacity-70" />
              <span>{button.title}</span>
            </div>
          ))}
        </div>
        {payload.footer ? <p className="text-xs opacity-70">{payload.footer}</p> : null}
      </div>
    );
  }

  if (kind === 'list') {
    return (
      <div className="space-y-2">
        {payload.headerText ? <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{payload.headerText}</p> : null}
        {payload.body ? <p className="whitespace-pre-wrap leading-5">{payload.body}</p> : null}
        <div className="rounded-lg border border-current/15 px-2.5 py-2">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold opacity-80">
            <List className="size-4" />
            {payload.buttonText ?? 'Abrir lista'}
          </div>
          <div className="space-y-1.5">
            {payload.sections?.map((section, sectionIndex) => (
              <div key={`${section.title}-${sectionIndex}`} className="space-y-1">
                <p className="text-xs font-medium opacity-70">{section.title}</p>
                {section.rows.map((row) => (
                  <div key={row.id} className="rounded-md border border-current/10 px-2 py-1.5">
                    <p>{row.title}</p>
                    {row.description ? <p className="text-xs opacity-70">{row.description}</p> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        {payload.footer ? <p className="text-xs opacity-70">{payload.footer}</p> : null}
      </div>
    );
  }

  if (kind === 'cta_url') {
    return (
      <div className="space-y-2">
        {payload.headerText ? <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{payload.headerText}</p> : null}
        {payload.body ? <p className="whitespace-pre-wrap leading-5">{payload.body}</p> : null}
        <a
          href={payload.url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-current/15 px-2.5 py-1.5"
        >
          <ExternalLink className="size-4" />
          {payload.buttonText ?? 'Abrir link'}
        </a>
        {payload.footer ? <p className="text-xs opacity-70">{payload.footer}</p> : null}
      </div>
    );
  }

  if (kind === 'button_reply' || kind === 'list_reply') {
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-current/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] opacity-80">
          {kind === 'button_reply' ? 'Reply button' : 'List reply'}
        </div>
        <p className="whitespace-pre-wrap leading-5">{payload.title ?? message.content}</p>
        {payload.description ? <p className="text-xs opacity-70">{payload.description}</p> : null}
      </div>
    );
  }

  return <p className="whitespace-pre-wrap leading-5">{message.content}</p>;
}

function StructuredContent({ message }: { message: Message }) {
  if (message.type === 'location') {
    const location = message.metadata?.location;
    const mapLink = buildMapLink(message);
    return (
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-current/15 px-2.5 py-2">
          <MapPin className="size-4" />
          <div className="min-w-0">
            <p className="font-medium">{location?.name ?? 'Localizacao compartilhada'}</p>
            {location?.address ? <p className="text-xs opacity-70">{location.address}</p> : null}
          </div>
        </div>
        {location ? (
          <p className="text-xs opacity-75">
            {location.latitude}, {location.longitude}
          </p>
        ) : null}
        {mapLink ? (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-current/15 px-2.5 py-1.5 text-sm"
          >
            <ExternalLink className="size-4" />
            Abrir no mapa
          </a>
        ) : null}
      </div>
    );
  }

  if (message.type === 'contacts') {
    const contacts = message.metadata?.contacts ?? [];
    return (
      <div className="space-y-2">
        {contacts.map((contact, index) => (
          <div key={`${contact.name}-${index}`} className="rounded-xl border border-current/15 px-3 py-2">
            <div className="mb-1 flex items-center gap-2">
              <UserRound className="size-4" />
              <span className="font-medium">{contact.formattedName ?? contact.name}</span>
            </div>
            {contact.organization ? <p className="text-xs opacity-75">{contact.organization}</p> : null}
            {contact.phones.map((phone) => (
              <p key={phone} className="text-sm">{phone}</p>
            ))}
            {contact.emails.map((email) => (
              <p key={email} className="text-xs opacity-75">{email}</p>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (message.type === 'interactive') {
    return <InteractiveContent message={message} />;
  }

  return message.content ? <p className="whitespace-pre-wrap leading-5">{message.content}</p> : null;
}

export function ConversationMessageBubble({
  message,
  onReply,
  onDelete,
  onReact,
}: {
  message: Message;
  onReply?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onReact?: (message: Message, emoji: string) => void;
}) {
  const isOutgoing = message.senderType === 'user';
  const isSystem = message.senderType === 'system';

  if (isSystem && message.senderId) {
    return (
      <div className="flex justify-center py-1">
        <div className="max-w-[80%] rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-amber-600">
            <Lock className="size-3" />
            Nota interna
          </div>
          <NoteContent content={message.content ?? ''} />
          <p className="mt-1.5 text-right text-[11px] text-amber-500">{formatTime(message.createdAt)}</p>
        </div>
      </div>
    );
  }

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full border border-border/70 bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  const showStructured = ['location', 'contacts', 'interactive'].includes(message.type);

  return (
    <div className={cn('flex w-full', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'group relative max-w-[82%] rounded-2xl px-3 py-2 text-[13px] sm:max-w-[68%]',
          isOutgoing
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border border-border/60 bg-white/95 text-foreground',
        )}
      >
        <MessageActions
          message={message}
          onReply={message.deletedAt ? undefined : onReply}
          onDelete={message.deletedAt ? undefined : onDelete}
          onReact={message.deletedAt ? undefined : onReact}
        />
        {message.replyToMessage ? <MessageReplyPreview message={message.replyToMessage} /> : null}
        {message.deletedAt ? (
          <p className="italic opacity-70">Mensagem excluida</p>
        ) : message.type === 'text' || (!message.mediaUrl && !showStructured) ? (
          message.content ? (
            <p className="whitespace-pre-wrap leading-5">{message.content}</p>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm italic opacity-80">
              <Paperclip className="size-4" />
              Midia enviada
            </span>
          )
        ) : showStructured ? (
          <StructuredContent message={message} />
        ) : (
          <MediaContent message={message} />
        )}
        <ReactionRow message={message} />
        <div className={cn('mt-1.5 flex items-center justify-end gap-1 text-[10px]', isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          <span>{formatTime(message.createdAt)}</span>
          {isOutgoing ? (
            message.status === 'read' ? (
              <CheckCheck className="size-3.5 text-cyan-200" />
            ) : message.status === 'delivered' ? (
              <CheckCheck className="size-3.5" />
            ) : message.status === 'failed' ? (
              <span className="font-semibold text-red-200">!</span>
            ) : (
              <Check className="size-3.5" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
