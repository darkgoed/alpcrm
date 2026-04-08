import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { FlowsService } from './flows.service';
import { FlowExecutorService } from './flow-executor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AutomationController],
  providers: [FlowsService, FlowExecutorService],
  exports: [FlowExecutorService],
})
export class AutomationModule {}
