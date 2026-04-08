'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useConversation, sendMessage, closeConversation, reopenConversation } from '@/hooks/useConversations';
import { useSocket, joinConversation, leaveConversation } from '@/hooks/useSocket';
import { MessageBubble } from '@/components/MessageBubble';
import { Message } from '@/types';
import {
  Phone, UserCheck, X, RotateCcw, Send, ChevronDown,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ConversationPage({ params }: Props) {
  const { id } = use(params);
  const { conversation, mutate } = useConversation(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Inicializa mensagens quando conversa carrega
  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
    }
  }, [conversation?.id]);

  // Scroll ao fundo quando novas mensagens chegam
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Entrar/sair da room da conversa
  useEffect(() => {
    joinConversation(id);
    return () => leaveConversation(id);
  }, [id]);

  // Escuta novas mensagens em tempo real
  useSocket({
    onNewMessage: ({ conversationId, message }) => {
      if (conversationId !== id) return;
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    onMessageStatus: ({ messageId, status, conversationId }) => {
      if (conversationId !== id) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: status as any } : m)),
      );
    },
  });

  async function handleSend() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    // Otimistic UI — adiciona mensagem localmente antes da resposta
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: id,
      senderType: 'user',
      senderId: null,
      type: 'text',
      content,
      mediaUrl: null,
      status: 'sent',
      externalId: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const real = await sendMessage(id, content);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? real : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMsg.id ? { ...m, status: 'failed' } : m,
        ),
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleClose() {
    await closeConversation(id);
    mutate();
  }

  async function handleReopen() {
    await reopenConversation(id);
    mutate();
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const contactName = conversation.contact.name ?? conversation.contact.phone;
  const isClosed = conversation.status === 'closed';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-semibold">
            {contactName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{contactName}</p>
            <p className="text-xs text-gray-400">
              {conversation.contact.phone}
              {conversation.assignedUser && ` • ${conversation.assignedUser.name}`}
              {conversation.team && ` • ${conversation.team.name}`}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Telefone">
            <Phone size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Atribuir">
            <UserCheck size={16} />
          </button>
          {isClosed ? (
            <button
              onClick={handleReopen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <RotateCcw size={13} /> Reabrir
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
            >
              <X size={13} /> Fechar
            </button>
          )}
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="bg-white border-t border-gray-100 px-4 py-3 text-center">
          <p className="text-sm text-gray-400">
            Conversa fechada.{' '}
            <button onClick={handleReopen} className="text-green-500 hover:underline">
              Reabrir
            </button>
          </p>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-3 py-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem... (Enter para enviar)"
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-32 py-1"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-8 h-8 flex items-center justify-center bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white rounded-xl transition-colors flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
            Shift+Enter para nova linha
          </p>
        </div>
      )}
    </div>
  );
}
