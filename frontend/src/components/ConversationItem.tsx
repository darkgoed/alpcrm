'use client';

import { Conversation } from '@/types';
import { formatDistanceToNow } from '@/lib/dateUtils';

interface Props {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: Props) {
  const lastMsg = conversation.messages?.[0];
  const name = conversation.contact.name ?? conversation.contact.phone;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
        isActive ? 'bg-green-50 border-r-2 border-green-500' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {initials}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
          {conversation.lastMessageAt && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatDistanceToNow(conversation.lastMessageAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-500 truncate">
            {lastMsg?.content ?? 'Mídia'}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {conversation.status === 'open' ? (
              <span className="w-2 h-2 bg-green-400 rounded-full" />
            ) : (
              <span className="w-2 h-2 bg-gray-300 rounded-full" />
            )}
          </div>
        </div>
        {conversation.assignedUser && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {conversation.assignedUser.name}
          </p>
        )}
      </div>
    </button>
  );
}
