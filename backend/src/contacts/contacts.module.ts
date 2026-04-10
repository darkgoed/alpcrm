import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { ContactImportProcessor } from './contact-import.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { CONTACT_IMPORT_QUEUE } from '../queues/queues.constants';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: CONTACT_IMPORT_QUEUE })],
  providers: [ContactsService, ContactImportProcessor],
  controllers: [ContactsController],
  exports: [ContactsService],
})
export class ContactsModule {}
