import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ContactsService } from './contacts.service';
import { ContactImportService } from './contact-import.service';
import { ContactBulkService } from './contact-bulk.service';
import { ContactNotesService } from './contact-notes.service';
import { ContactTagsService } from './contact-tags.service';
import { ContactSegmentsService } from './contact-segments.service';
import { ContactsController } from './contacts.controller';
import { ContactImportProcessor } from './contact-import.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { CONTACT_IMPORT_QUEUE } from '../queues/queues.constants';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [
    PrismaModule,
    AutomationModule,
    BullModule.registerQueue({ name: CONTACT_IMPORT_QUEUE }),
  ],
  providers: [
    ContactsService,
    ContactImportService,
    ContactBulkService,
    ContactNotesService,
    ContactTagsService,
    ContactSegmentsService,
    ContactImportProcessor,
  ],
  controllers: [ContactsController],
  exports: [ContactsService],
})
export class ContactsModule {}
