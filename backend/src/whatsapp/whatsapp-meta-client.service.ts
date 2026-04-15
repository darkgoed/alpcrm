import { Injectable, Logger } from '@nestjs/common';
import { logMsg } from '../common/logger/app-logger.service';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

export interface MetaSendResponse {
  messages?: Array<{ id?: string }>;
}

export interface MetaMediaInfo {
  url: string;
  mime_type?: string;
  file_size?: number;
}

@Injectable()
export class WhatsappMetaClient {
  private readonly logger = new Logger(WhatsappMetaClient.name);

  // ─── Envio genérico de mensagem ─────────────────────────────────────────────

  async sendMessage(
    token: string,
    phoneNumberId: string,
    body: Record<string, unknown>,
  ): Promise<string> {
    const url = `${GRAPH_API}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    });

    if (!response.ok) {
      await this.throwApiError(response, `POST ${phoneNumberId}/messages`);
    }

    return this.extractMessageId(response);
  }

  // ─── Buscar metadados de mídia ───────────────────────────────────────────────

  async getMediaInfo(token: string, mediaId: string): Promise<MetaMediaInfo | null> {
    const response = await fetch(`${GRAPH_API}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      this.logger.warn(
        logMsg('Falha ao obter metadados de mídia', { mediaId, status: response.status }),
      );
      return null;
    }
    return response.json() as Promise<MetaMediaInfo>;
  }

  // ─── Download de conteúdo de mídia ───────────────────────────────────────────

  async downloadMedia(token: string, url: string): Promise<Buffer | null> {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      this.logger.warn(
        logMsg('Falha ao baixar mídia', { status: response.status }),
      );
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async extractMessageId(response: Response): Promise<string> {
    const data = (await response.json()) as MetaSendResponse;
    return data.messages?.[0]?.id ?? '';
  }

  private async throwApiError(response: Response, context: string): Promise<never> {
    const body = await response.text().catch(() => '');
    this.logger.error(
      logMsg('Erro na Meta API', { context, status: response.status, body }),
    );
    throw new Error(`WhatsApp API error status: ${response.status} body: ${body}`);
  }
}
