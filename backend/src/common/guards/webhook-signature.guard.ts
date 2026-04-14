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

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<WebhookRequest>();
    const signature = req.headers['x-hub-signature-256'] as string;
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const rawBody: Buffer | undefined = req.rawBody;

    if (!signature) {
      if (isProduction) {
        this.logger.error(
          `Webhook rejeitado sem assinatura em produção (ip=${req.ip ?? 'unknown'})`,
        );
        throw new UnauthorizedException(
          'Assinatura do webhook é obrigatória em produção',
        );
      }

      this.logger.warn(
        'Webhook recebido sem assinatura — aceitando (modo dev)',
      );
      return true;
    }

    if (!rawBody) {
      this.logger.error(
        'Webhook recebido sem rawBody; validação de assinatura não pode ser executada',
      );
      throw new ServiceUnavailableException(
        'rawBody é obrigatório para validar a assinatura do webhook',
      );
    }

    const appSecret = await this.resolveAppSecret(rawBody);

    if (!appSecret) {
      this.logger.error(
        'App Secret ausente; validação de assinatura não pode ser executada',
      );
      throw new ServiceUnavailableException(
        'Validação do webhook indisponível por configuração ausente',
      );
    }

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    if (signature.length !== expected.length) {
      this.logger.error(
        `Assinatura inválida no webhook (ip=${req.ip ?? 'unknown'})`,
      );
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!valid) {
      this.logger.error(
        `Assinatura inválida no webhook (ip=${req.ip ?? 'unknown'})`,
      );
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    return true;
  }

  private async resolveAppSecret(rawBody: Buffer): Promise<string | null> {
    const phoneNumberId = this.extractPhoneNumberId(rawBody);

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

  private extractPhoneNumberId(rawBody: Buffer): string | null {
    try {
      const payload = JSON.parse(rawBody.toString('utf8')) as unknown;
      if (!this.isRecord(payload) || !Array.isArray(payload.entry)) {
        return null;
      }

      const [entry] = payload.entry as unknown[];
      if (!this.isRecord(entry) || !Array.isArray(entry.changes)) {
        return null;
      }

      const [change] = entry.changes as unknown[];
      if (!this.isRecord(change) || !this.isRecord(change.value)) {
        return null;
      }

      const metadata = change.value.metadata;
      if (!this.isRecord(metadata)) {
        return null;
      }

      const phoneNumberId = metadata.phone_number_id;

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
