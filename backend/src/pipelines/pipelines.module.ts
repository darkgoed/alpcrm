import { Module } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [PrismaModule, AutomationModule],
  providers: [PipelinesService],
  controllers: [PipelinesController],
})
export class PipelinesModule {}
