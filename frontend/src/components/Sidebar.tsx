'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/contexts/AuthContext';
import { ConversationItem } from './ConversationItem';
import { Conversation } from '@/types';
import { MessageCircle, Search, LogOut, RefreshCw, Zap, ChevronLeft } from 'lucide-react';

const NAV = [
  { href: '/conversations', label: 'Inbox', icon: MessageCircle },
  { href: '/automation', label: 'Automação', icon: Zap },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const { conversations, mutate } = useConversations(filter);
  const [localConvs, setLocalConvs] = useState<Conversation[]>([]);

  const isInbox = pathname.startsWith('/conversations');

  useEffect(() => {
    setLocalConvs(conversations);
  }, [conversations]);

  useSocket({
    onNewMessage: ({ conversationId, message }) => {
      setLocalConvs((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) { mutate(); return prev; }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], messages: [message], lastMessageAt: message.createdAt };
        const [conv] = updated.splice(idx, 1);
        return [conv, ...updated];
      });
    },
  });

  const activeId = pathname.startsWith('/conversations/') ? pathname.split('/')[2] : null;

  const filtered = localConvs.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.contact.name?.toLowerCase().includes(q) || c.contact.phone.includes(q);
  });

  return (
    <aside className="w-80 flex flex-col border-r border-gray-100 bg-white flex-shrink-0">
      {/* Top nav */}
      <div className="px-3 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
              <MessageCircle size={14} className="text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-sm">CRM WhatsApp</span>
          </div>
          <button onClick={logout} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg" title="Sair">
            <LogOut size={14} />
          </button>
        </div>
        <nav className="flex gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Inbox panel */}
      {isInbox && (
        <>
          <div className="px-4 pt-3 pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Conversas</span>
              <button onClick={() => mutate()} className="p-1 text-gray-400 hover:text-gray-600 rounded" title="Atualizar">
                <RefreshCw size={13} />
              </button>
            </div>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contato..."
                className="w-full pl-7 pr-3 py-1.5 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-1.5">
              {(['open', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filter === s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s === 'open' ? 'Abertas' : 'Fechadas'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                <MessageCircle size={24} className="mb-2 opacity-40" />
                <p>Nenhuma conversa</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeId}
                  onClick={() => router.push(`/conversations/${conv.id}`)}
                />
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filtered.length} conversa{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </>
      )}
    </aside>
  );
}
