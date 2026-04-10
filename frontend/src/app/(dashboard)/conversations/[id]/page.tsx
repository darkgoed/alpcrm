import { ConversationThread } from '@/features/conversations/components/conversation-thread';

export default function ConversationPage(props: { params: Promise<{ id: string }> }) {
  return <ConversationThread {...props} />;
}
