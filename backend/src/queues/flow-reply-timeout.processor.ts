import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FLOW_REPLY_TIMEOUT_QUEUE } from './queues.constants';
import { FlowExecutorService } from '../automation/flow-executor.service';

export interface FlowReplyTimeoutJobData {
  contactId: string;
  flowId: string;
  conversationId: string;
  nodeId: string;
}

@Processor(FLOW_REPLY_TIMEOUT_QUEUE)
export class FlowReplyTimeoutProcessor extends WorkerHost {
  private readonly logger = new Logger(FlowReplyTimeoutProcessor.name);

  constructor(private flowExecutor: FlowExecutorService) {
    super();
  }

  async process(job: Job<FlowReplyTimeoutJobData>) {
    const { contactId, flowId, conversationId, nodeId } = job.data;
    this.logger.log(`[FlowReplyTimeout] Timeout disparado — contact=${contactId} flow=${flowId}`);
    await this.flowExecutor.handleReplyTimeout(contactId, flowId, conversationId, nodeId);
  }
}
