import { Module } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { PipelinesController } from './pipelines.controller';

@Module({
  providers: [PipelinesService],
  controllers: [PipelinesController]
})
export class PipelinesModule {}
