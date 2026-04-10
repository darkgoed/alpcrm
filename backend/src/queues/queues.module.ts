import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AutoCloseProcessor } from './auto-close.processor';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';
import { FLOW_DELAY_QUEUE, FOLLOW_UP_QUEUE, AUTO_CLOSE_QUEUE } from './queues.constants';

export { FLOW_DELAY_QUEUE, FOLLOW_UP_QUEUE, AUTO_CLOSE_QUEUE } from './queues.constants';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    GatewayModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: FLOW_DELAY_QUEUE },
      { name: FOLLOW_UP_QUEUE },
      { name: AUTO_CLOSE_QUEUE },
    ),
  ],
  providers: [
    SchedulerService,
    AutoCloseProcessor,
  ],
  exports: [SchedulerService, BullModule],
})
export class QueuesModule {}
