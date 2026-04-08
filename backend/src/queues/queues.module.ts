import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FlowDelayProcessor } from './flow-delay.processor';
import { FollowUpProcessor } from './follow-up.processor';
import { AutoCloseProcessor } from './auto-close.processor';
import { SchedulerService } from './scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewayModule } from '../gateway/gateway.module';

export const FLOW_DELAY_QUEUE = 'flow-delay';
export const FOLLOW_UP_QUEUE = 'follow-up';
export const AUTO_CLOSE_QUEUE = 'auto-close';

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
    FlowDelayProcessor,
    FollowUpProcessor,
    AutoCloseProcessor,
  ],
  exports: [SchedulerService, BullModule],
})
export class QueuesModule {}
