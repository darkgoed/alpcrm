import { Module, forwardRef } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [GatewayModule, forwardRef(() => WhatsappModule)],
  providers: [ConversationsService],
  controllers: [ConversationsController],
  exports: [ConversationsService],
})
export class ConversationsModule {}
