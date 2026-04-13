import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { WebhookSignatureGuard } from '../common/guards/webhook-signature.guard';
import { TeamsModule } from '../teams/teams.module';
import { AutomationModule } from '../automation/automation.module';
import { FollowUpProcessor } from '../queues/follow-up.processor';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [
    GatewayModule,
    forwardRef(() => TeamsModule),
    AutomationModule,
    QueuesModule,
  ],
  providers: [WhatsappService, WebhookSignatureGuard, FollowUpProcessor],
  controllers: [WhatsappController],
  exports: [WhatsappService],
})
export class WhatsappModule {}
