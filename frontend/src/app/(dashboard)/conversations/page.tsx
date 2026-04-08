import { MessageCircle } from 'lucide-react';

export default function ConversationsIndex() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <MessageCircle size={48} className="mb-4 opacity-20" />
      <p className="text-lg font-medium">Selecione uma conversa</p>
      <p className="text-sm mt-1">Escolha uma conversa na lista ao lado para começar</p>
    </div>
  );
}
