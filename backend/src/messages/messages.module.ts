import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { GatewayModule } from '../gateway/gateway.module';
import { AutomationModule } from '../automation/automation.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [WhatsappModule, GatewayModule, AutomationModule, QueuesModule],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
