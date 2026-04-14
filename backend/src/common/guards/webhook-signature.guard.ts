import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

interface WebhookRequest extends Request {
  rawBody?: Buffer;
}

// In-memory replay cache: signature hash → expiry timestamp (ms)
const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const replayCache = new Map<string, number>();

function pruneReplayCache() {
  const now = Date.now();
  for (const [key, expiry] of replayCache) {
    if (now > expiry) replayCache.delete(key);
  }
}

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<WebhookRequest>();
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const rawBody: Buffer | undefined = req.rawBody;
    const ip = req.ip ?? 'unknown';
    const ua = req.headers['user-agent'] ?? 'unknown';

    if (!signature) {
      if (isProduction) {
        this.logger.error(
          `Webhook rejeitado: assinatura ausente (ip=${ip} ua=${ua})`,
        );
        throw new UnauthorizedException(
          'Assinatura do webhook é obrigatória em produção',
        );
      }

      this.logger.warn(
        `Webhook sem assinatura — aceitando (modo dev, ip=${ip})`,
      );
      return true;
    }

    if (!rawBody) {
      this.logger.error(`Webhook rejeitado: rawBody ausente (ip=${ip})`);
      throw new ServiceUnavailableException(
        'rawBody é obrigatório para validar a assinatura do webhook',
      );
    }

    // ── Validação de origem do payload ────────────────────────────────────────
    const parsedPayload = this.parsePayload(rawBody);
    if (parsedPayload && !this.isValidOrigin(parsedPayload)) {
      this.logger.error(
        `Webhook rejeitado: objeto inesperado "${String((parsedPayload as Record<string, unknown>)['object'])}" (ip=${ip})`,
      );
      throw new UnauthorizedException('Payload de webhook inválido');
    }

    // ── Resolução do App Secret ───────────────────────────────────────────────
    const appSecret = await this.resolveAppSecret(
      rawBody,
      parsedPayload as Record<string, unknown> | null,
    );

    if (!appSecret) {
      this.logger.error(`Webhook rejeitado: App Secret ausente (ip=${ip})`);
      throw new ServiceUnavailableException(
        'Validação do webhook indisponível por configuração ausente',
      );
    }

    // ── Verificação de assinatura ─────────────────────────────────────────────
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    if (signature.length !== expected.length) {
      this.logger.error(
        `Webhook rejeitado: assinatura inválida (comprimento diferente, ip=${ip} ua=${ua})`,
      );
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!valid) {
      this.logger.error(
        `Webhook rejeitado: assinatura inválida (ip=${ip} ua=${ua})`,
      );
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    // ── Proteção contra replay ────────────────────────────────────────────────
    pruneReplayCache();
    const sigHash = crypto.createHash('sha256').update(signature).digest('hex');

    if (replayCache.has(sigHash)) {
      this.logger.warn(
        `Webhook rejeitado: replay detectado (ip=${ip} ua=${ua})`,
      );
      throw new UnauthorizedException('Webhook duplicado rejeitado');
    }

    replayCache.set(sigHash, Date.now() + REPLAY_WINDOW_MS);

    return true;
  }

  private isValidOrigin(payload: unknown): boolean {
    if (!this.isRecord(payload)) return false;
    return payload['object'] === 'whatsapp_business_account';
  }

  private parsePayload(rawBody: Buffer): unknown {
    try {
      return JSON.parse(rawBody.toString('utf8')) as unknown;
    } catch {
      return null;
    }
  }

  private async resolveAppSecret(
    rawBody: Buffer,
    parsed: Record<string, unknown> | null,
  ): Promise<string | null> {
    const phoneNumberId = this.extractPhoneNumberId(parsed);

    if (phoneNumberId) {
      const account = await this.prisma.whatsappAccount.findFirst({
        where: { metaAccountId: phoneNumberId, isActive: true },
        select: { appSecret: true },
      });

      if (account?.appSecret?.trim()) {
        return account.appSecret;
      }
    }

    return this.config.get<string>('WHATSAPP_APP_SECRET')?.trim() || null;
  }

  private extractPhoneNumberId(
    parsed: Record<string, unknown> | null,
  ): string | null {
    try {
      if (!parsed || !Array.isArray(parsed['entry'])) return null;

      const [entry] = parsed['entry'] as unknown[];
      if (!this.isRecord(entry) || !Array.isArray(entry['changes']))
        return null;

      const [change] = entry['changes'] as unknown[];
      if (!this.isRecord(change) || !this.isRecord(change['value']))
        return null;

      const metadata = change['value']['metadata'];
      if (!this.isRecord(metadata)) return null;

      const phoneNumberId = metadata['phone_number_id'];
      return typeof phoneNumberId === 'string' && phoneNumberId.trim()
        ? phoneNumberId
        : null;
    } catch {
      return null;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
