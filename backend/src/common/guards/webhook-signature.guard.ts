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

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(private config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const signature = req.headers['x-hub-signature-256'] as string;
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
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

    if (!appSecret) {
      this.logger.error(
        'WHATSAPP_APP_SECRET ausente; validação de assinatura não pode ser executada',
      );
      throw new ServiceUnavailableException(
        'Validação do webhook indisponível por configuração ausente',
      );
    }

    if (!rawBody) {
      this.logger.error(
        'Webhook recebido sem rawBody; validação de assinatura não pode ser executada',
      );
      throw new ServiceUnavailableException(
        'rawBody é obrigatório para validar a assinatura do webhook',
      );
    }

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

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
}
