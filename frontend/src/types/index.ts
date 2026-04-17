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

export type MessageKind =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'
  | 'link'
  | 'interactive';

export interface MessageReaction {
  emoji: string;
  senderType: 'user' | 'contact' | 'system';
  senderId: string | null;
  createdAt: string;
}

export interface MessageLocationMetadata {
  latitude: number;
  longitude: number;
  name?: string | null;
  address?: string | null;
  url?: string | null;
}

export interface MessageSharedContact {
  name: string;
  formattedName?: string | null;
  phones: string[];
  emails: string[];
  organization?: string | null;
}

export interface MessageMetadata {
  location?: MessageLocationMetadata | null;
  contacts?: MessageSharedContact[] | null;
  sticker?: { animated?: boolean | null } | null;
}

export interface MessageReference {
  id: string;
  type: MessageKind;
  content: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  fileName: string | null;
  metadata: MessageMetadata | null;
  deletedAt: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'contact' | 'system';
  senderId: string | null;
  type: MessageKind;
  content: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  fileName: string | null;
  fileSize: number | null;
  metadata: MessageMetadata | null;
  reactions: MessageReaction[] | null;
  replyToMessageId: string | null;
  replyToMessage: MessageReference | null;
  interactiveType: string | null;
  interactivePayload: InteractivePayload | null;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  failureReason: string | null;
  externalId: string | null;
  deletedAt: string | null;
  deletedById: string | null;
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
  updatedAt: string;
  closedAt?: string | null;
  contact: Contact;
  assignedUser: Pick<User, 'id' | 'name'> | null;
  team: { id: string; name: string } | null;
  messages: Message[];
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  workspaceId: string;
  permissions: string[];
  mustChangePassword?: boolean;
}
