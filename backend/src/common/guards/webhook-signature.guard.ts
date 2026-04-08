import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const signature = req.headers['x-hub-signature-256'] as string;

    // Em ambiente de dev sem assinatura configurada, passa direto
    if (!signature) {
      this.logger.warn('Webhook recebido sem assinatura — aceitando (modo dev)');
      return true;
    }

    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (!appSecret) return true;

    // O body precisa ser raw para o HMAC funcionar
    const rawBody: Buffer = req.rawBody;
    if (!rawBody) return true;

    const expected = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );

    if (!valid) {
      this.logger.error('Assinatura inválida no webhook — possível requisição falsa');
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }

    return true;
  }
}
