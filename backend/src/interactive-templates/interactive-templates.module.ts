import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InteractiveTemplatesController } from './interactive-templates.controller';
import { InteractiveTemplatesService } from './interactive-templates.service';

@Module({
  imports: [PrismaModule],
  controllers: [InteractiveTemplatesController],
  providers: [InteractiveTemplatesService],
})
export class InteractiveTemplatesModule {}
