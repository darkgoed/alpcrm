export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface Contact {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'contact' | 'system';
  senderId: string | null;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'link';
  content: string | null;
  mediaUrl: string | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  externalId: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  whatsappAccountId: string;
  assignedUserId: string | null;
  teamId: string | null;
  status: 'open' | 'closed' | 'pending';
  isBotActive: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  contact: Contact;
  assignedUser: Pick<User, 'id' | 'name'> | null;
  team: { id: string; name: string } | null;
  messages: Message[];
}

export interface AuthResponse {
  access_token: string;
  workspaceId: string;
  permissions: string[];
}
