import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FLOW_DELAY_QUEUE } from './queues.constants';
import { FlowExecutorService } from '../automation/flow-executor.service';

export interface FlowDelayJobData {
  nextNodeId: string;
  conversationId: string;
  contactId: string;
  flowId: string;
}

@Processor(FLOW_DELAY_QUEUE)
export class FlowDelayProcessor extends WorkerHost {
  private readonly logger = new Logger(FlowDelayProcessor.name);

  constructor(private flowExecutor: FlowExecutorService) {
    super();
  }

  async process(job: Job<FlowDelayJobData>) {
    const { nextNodeId, conversationId, contactId, flowId } = job.data;
    this.logger.log(`[FlowDelay] Executando nó ${nextNodeId} após delay`);
    await this.flowExecutor.executeNodeById(nextNodeId, conversationId, contactId, flowId);
  }
}
