import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ContactImportService } from './contact-import.service';
import { CONTACT_IMPORT_QUEUE } from '../queues/queues.constants';

@Processor(CONTACT_IMPORT_QUEUE)
export class ContactImportProcessor extends WorkerHost {
  constructor(private contactImportService: ContactImportService) {
    super();
  }

  async process(job: Job) {
    const { workspaceId, rows } = job.data as {
      workspaceId: string;
      rows: Array<{ phone: string; name?: string; email?: string }>;
    };
    await this.contactImportService.bulkCreate(workspaceId, rows);
  }
}
