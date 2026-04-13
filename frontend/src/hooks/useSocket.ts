'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { Message } from '@/types';

interface SocketHandlers {
  onNewMessage?: (data: {
    conversationId: string;
    message: Message;
    unreadCount?: number;
  }) => void;
  onMessageStatus?: (data: { messageId: string; status: string; conversationId: string }) => void;
  onConversationUpdated?: (data: {
    conversationId: string;
    conversation: any;
  }) => void;
}

export function useSocket(handlers: SocketHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getSocket();

    if (!socket.connected) socket.connect();

    const onNewMessage = (data: any) => handlersRef.current.onNewMessage?.(data);
    const onMessageStatus = (data: any) => handlersRef.current.onMessageStatus?.(data);
    const onConversationUpdated = (data: any) => handlersRef.current.onConversationUpdated?.(data);

    socket.on('new_message', onNewMessage);
    socket.on('message_status', onMessageStatus);
    socket.on('conversation_updated', onConversationUpdated);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('message_status', onMessageStatus);
      socket.off('conversation_updated', onConversationUpdated);
    };
  }, []);
}

export function joinConversation(conversationId: string) {
  getSocket().emit('join_conversation', { conversationId });
}

export function leaveConversation(conversationId: string) {
  getSocket().emit('leave_conversation', { conversationId });
}
