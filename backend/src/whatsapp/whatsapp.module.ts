import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappMetaClient } from './whatsapp-meta-client.service';
import { WhatsappController } from './whatsapp.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { WebhookSignatureGuard } from '../common/guards/webhook-signature.guard';
import { TeamsModule } from '../teams/teams.module';
import { AutomationModule } from '../automation/automation.module';
import { FollowUpProcessor } from '../queues/follow-up.processor';
import { OutboundMessageProcessor } from '../queues/outbound-message.processor';
import { QueuesModule } from '../queues/queues.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    GatewayModule,
    forwardRef(() => TeamsModule),
    AutomationModule,
    QueuesModule,
    MetricsModule,
  ],
  providers: [WhatsappService, WhatsappMetaClient, WebhookSignatureGuard, FollowUpProcessor, OutboundMessageProcessor],
  controllers: [WhatsappController],
  exports: [WhatsappService, WhatsappMetaClient],
})
export class WhatsappModule {}
