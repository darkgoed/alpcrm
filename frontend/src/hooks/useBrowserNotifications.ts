'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';

function requestPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function showNotification(title: string, body: string, conversationId: string) {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(title, { body, icon: '/favicon.ico' });
  n.onclick = () => {
    window.focus();
    window.location.pathname = `/conversations/${conversationId}`;
  };
  // Auto-close after 5s
  setTimeout(() => n.close(), 5000);
}

export function useBrowserNotifications(activeConversationId?: string) {
  const activeRef = useRef(activeConversationId);
  activeRef.current = activeConversationId;

  useEffect(() => {
    requestPermission();
  }, []);

  useSocket({
    onNewMessage: ({ conversationId, message }) => {
      // Não notifica se a conversa já está aberta
      if (activeRef.current === conversationId) return;
      // Não notifica mensagens enviadas pelo operador
      if (message.senderType === 'user') return;

      const contactName = (message as any).contact?.name ?? 'Contato';
      const preview = message.content
        ? message.content.slice(0, 60)
        : '[mídia]';
      showNotification(`Nova mensagem — ${contactName}`, preview, conversationId);
    },
  });
}
