import { Message } from '@/types';
import { formatTime } from '@/lib/dateUtils';
import { Check, CheckCheck } from 'lucide-react';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isOutgoing = message.senderType === 'user';
  const isSystem = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3 py-2 ${
          isOutgoing
            ? 'bg-green-500 text-white rounded-br-sm'
            : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
        }`}
      >
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
        {!message.content && message.mediaUrl && (
          <p className="text-sm italic opacity-70">📎 Mídia</p>
        )}
        <div className={`flex items-center justify-end gap-1 mt-1 ${isOutgoing ? 'text-green-100' : 'text-gray-400'}`}>
          <span className="text-[10px]">{formatTime(message.createdAt)}</span>
          {isOutgoing && (
            message.status === 'read' ? (
              <CheckCheck size={12} className="text-blue-200" />
            ) : message.status === 'delivered' ? (
              <CheckCheck size={12} />
            ) : message.status === 'failed' ? (
              <span className="text-[10px] text-red-200">!</span>
            ) : (
              <Check size={12} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
