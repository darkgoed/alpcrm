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
  source: 'manual' | 'import_csv' | 'whatsapp_inbound';
  optInStatus: 'unknown' | 'opted_in' | 'opted_out';
  optInAt: string | null;
  optInSource: string | null;
  optInEvidence: string | null;
}

export interface InteractiveButtonOption {
  id: string;
  title: string;
}

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string | null;
}

export interface InteractiveListSection {
  title: string;
  rows: InteractiveListRow[];
}

export interface InteractivePayload {
  body?: string | null;
  footer?: string | null;
  buttonText?: string | null;
  headerText?: string | null;
  buttons?: InteractiveButtonOption[];
  sections?: InteractiveListSection[];
  replyId?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'contact' | 'system';
  senderId: string | null;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'link' | 'interactive';
  content: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  interactiveType: string | null;
  interactivePayload: InteractivePayload | null;
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
  unreadCount: number;
  lastMessageAt: string | null;
  lastContactMessageAt: string | null;
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
