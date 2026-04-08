// Tipagem do payload que a API do WhatsApp Cloud envia via webhook
// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples

export interface WhatsappWebhookPayload {
  object: string;
  entry: WhatsappEntry[];
}

export interface WhatsappEntry {
  id: string;
  changes: WhatsappChange[];
}

export interface WhatsappChange {
  value: WhatsappChangeValue;
  field: string;
}

export interface WhatsappChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsappContact[];
  messages?: WhatsappMessage[];
  statuses?: WhatsappStatus[];
}

export interface WhatsappContact {
  profile: { name: string };
  wa_id: string;
}

export interface WhatsappMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker';
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; filename: string; mime_type: string };
}

export interface WhatsappStatus {
  id: string;           // message external_id
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
