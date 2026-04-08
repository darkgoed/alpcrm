import {
  Controller, Get, Post, Query, Body,
  Res, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import type { WhatsappWebhookPayload } from './dto/webhook.dto';
import { EventsGateway } from '../gateway/events.gateway';
import { WebhookSignatureGuard } from '../common/guards/webhook-signature.guard';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  // Verificação do webhook pela Meta (GET) — sem assinatura
  @Get('webhook')
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    res.status(200).send(result);
  }

  // Recebimento de mensagens/status (POST) — valida assinatura da Meta
  @Post('webhook')
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async receive(@Body() payload: WhatsappWebhookPayload) {
    await this.whatsappService.processWebhook(payload, (data) => {
      this.eventsGateway.emitToWorkspace(data.workspaceId, data.event, data);
    });
    return 'ok';
  }
}
