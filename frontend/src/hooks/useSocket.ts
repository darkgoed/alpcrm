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
  onMessageUpdated?: (data: {
    conversationId: string;
    message: Message;
  }) => void;
  onConversationUpdated?: (data: {
    conversationId: string;
    conversation: any;
  }) => void;
  onConversationDeleted?: (data: {
    conversationId: string;
  }) => void;
  onConversationPresence?: (data: {
    conversationId: string;
    operators: Array<{ userId: string; connections: number }>;
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
    const onMessageUpdated = (data: any) => handlersRef.current.onMessageUpdated?.(data);
    const onConversationUpdated = (data: any) => handlersRef.current.onConversationUpdated?.(data);
    const onConversationDeleted = (data: any) => handlersRef.current.onConversationDeleted?.(data);
    const onConversationPresence = (data: any) => handlersRef.current.onConversationPresence?.(data);

    socket.on('new_message', onNewMessage);
    socket.on('message_status', onMessageStatus);
    socket.on('message_updated', onMessageUpdated);
    socket.on('conversation_updated', onConversationUpdated);
    socket.on('conversation_deleted', onConversationDeleted);
    socket.on('conversation_presence', onConversationPresence);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('message_status', onMessageStatus);
      socket.off('message_updated', onMessageUpdated);
      socket.off('conversation_updated', onConversationUpdated);
      socket.off('conversation_deleted', onConversationDeleted);
      socket.off('conversation_presence', onConversationPresence);
    };
  }, []);
}

export function joinConversation(conversationId: string) {
  getSocket().emit('join_conversation', { conversationId });
}

export function leaveConversation(conversationId: string) {
  getSocket().emit('leave_conversation', { conversationId });
}
