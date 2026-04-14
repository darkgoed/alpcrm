import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { FlowsService } from './flows.service';
import { FlowExecutorService } from './flow-executor.service';
import { FlowNodeRunnerService } from './flow-node-runner.service';
import { FlowDelayProcessor } from '../queues/flow-delay.processor';
import { FlowReplyTimeoutProcessor } from '../queues/flow-reply-timeout.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [AutomationController],
  providers: [
    FlowsService,
    FlowExecutorService,
    FlowNodeRunnerService,
    FlowDelayProcessor,
    FlowReplyTimeoutProcessor,
  ],
  exports: [FlowExecutorService],
})
export class AutomationModule {}
