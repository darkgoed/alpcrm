'use client';

import { Check, CheckCheck, Download, ExternalLink, List, Lock, MousePointerSquareDashed, Paperclip } from 'lucide-react';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/dateUtils';

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaContent({ message }: { message: Message }) {
  const { type, mediaUrl, content, mimeType, fileName, fileSize } = message;

  if (!mediaUrl) {
    return (
      <span className="inline-flex items-center gap-2 text-sm italic opacity-80">
        <Paperclip className="size-4" />
        Mídia não disponível
      </span>
    );
  }

  if (type === 'image') {
    return (
      <div className="space-y-1">
        <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={fileName ?? 'imagem'}
            className="max-w-[220px] rounded-lg object-cover"
          />
        </a>
        {content && <p className="text-sm leading-5">{content}</p>}
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <audio controls className="max-w-[220px]">
        <source src={mediaUrl} type={mimeType ?? 'audio/ogg'} />
      </audio>
    );
  }

  if (type === 'video') {
    return (
      <div className="space-y-1">
        <video controls className="max-w-[220px] rounded-lg">
          <source src={mediaUrl} type={mimeType ?? 'video/mp4'} />
        </video>
        {content && <p className="text-sm leading-5">{content}</p>}
      </div>
    );
  }

  // document / fallback
  return (
    <a
      href={mediaUrl}
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

// ─── Highlight @mentions in note content ──────────────────────────────────────

function NoteContent({ content }: { content: string }) {
  const parts = content.split(/(@\S+)/g);
  return (
    <p className="whitespace-pre-wrap leading-5">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-semibold text-amber-700 bg-amber-100 rounded px-0.5">
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

export function ConversationMessageBubble({ message }: { message: Message }) {
  const isOutgoing = message.senderType === 'user';
  const isSystem = message.senderType === 'system';

  // Nota interna de operador: system com senderId preenchido
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

  // Evento de sistema (bot, auto-close, etc.)
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full border border-border/70 bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[82%] rounded-2xl px-3 py-2 text-[13px] sm:max-w-[68%]',
          isOutgoing
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border border-border/60 bg-white/95 text-foreground',
        )}
      >
        {message.type === 'text' || !message.mediaUrl ? (
          message.type === 'interactive' ? (
            <InteractiveContent message={message} />
          ) : message.content ? (
            <p className="whitespace-pre-wrap leading-5">{message.content}</p>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm italic opacity-80">
              <Paperclip className="size-4" />
              Mídia enviada
            </span>
          )
        ) : (
          <MediaContent message={message} />
        )}
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
