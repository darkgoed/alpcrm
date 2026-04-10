import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TemplatePollProcessor } from './templates-poll.processor';
import { TEMPLATE_POLL_QUEUE } from '../queues/queues.constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: TEMPLATE_POLL_QUEUE }),
  ],
  providers: [TemplatesService, TemplatePollProcessor],
  controllers: [TemplatesController],
  exports: [TemplatesService],
})
export class TemplatesModule {}
