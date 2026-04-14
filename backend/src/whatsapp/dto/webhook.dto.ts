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
  type:
    | 'text'
    | 'image'
    | 'audio'
    | 'video'
    | 'document'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'interactive'
    | 'button';
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  video?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; filename: string; mime_type: string };
  sticker?: { id: string; mime_type: string; animated?: boolean };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    url?: string;
  };
  contacts?: Array<{
    name?: {
      formatted_name?: string;
      first_name?: string;
      last_name?: string;
    };
    org?: { company?: string };
    phones?: Array<{ phone?: string; wa_id?: string }>;
    emails?: Array<{ email?: string }>;
  }>;
  button?: { payload?: string; text: string };
  interactive?: {
    type: 'button_reply' | 'list_reply' | 'nfm_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface WhatsappStatus {
  id: string; // message external_id
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
