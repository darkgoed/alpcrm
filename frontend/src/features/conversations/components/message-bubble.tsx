'use client';

import { Check, CheckCheck, Lock, Paperclip } from 'lucide-react';
import type { Message } from '@/types';
import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/dateUtils';

// ─── Highlight @mentions in note content ──────────────────────────────────────

function NoteContent({ content }: { content: string }) {
  const parts = content.split(/(@\S+)/g);
  return (
    <p className="whitespace-pre-wrap leading-6">
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

export function ConversationMessageBubble({ message }: { message: Message }) {
  const isOutgoing = message.senderType === 'user';
  const isSystem = message.senderType === 'system';

  // Nota interna de operador: system com senderId preenchido
  if (isSystem && message.senderId) {
    return (
      <div className="flex justify-center py-1">
        <div className="max-w-[80%] rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm shadow-sm">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
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
          'max-w-[85%] rounded-[24px] px-4 py-3 text-sm shadow-sm sm:max-w-[70%]',
          isOutgoing
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border border-border/70 bg-white text-foreground',
        )}
      >
        {message.content ? (
          <p className="whitespace-pre-wrap leading-6">{message.content}</p>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm italic opacity-80">
            <Paperclip className="size-4" />
            Mídia enviada
          </span>
        )}
        <div className={cn('mt-2 flex items-center justify-end gap-1 text-[11px]', isOutgoing ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
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
