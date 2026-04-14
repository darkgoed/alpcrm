import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TEMPLATE_POLL_QUEUE } from '../queues/queues.constants';
import { TemplatesService } from './templates.service';

@Processor(TEMPLATE_POLL_QUEUE)
export class TemplatePollProcessor extends WorkerHost {
  private readonly logger = new Logger(TemplatePollProcessor.name);

  constructor(private templatesService: TemplatesService) {
    super();
  }

  async process(job: Job) {
    this.logger.log(
      `[TemplatePoll] Iniciando polling de templates PENDING (job=${job.id ?? 'unknown'})`,
    );
    await this.templatesService.pollAllPending();
  }
}
