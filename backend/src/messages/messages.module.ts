import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [WhatsappModule, GatewayModule],
  providers: [MessagesService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
