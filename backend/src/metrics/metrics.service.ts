import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
  register,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry;

  readonly httpRequestsTotal: Counter;
  readonly httpRequestDuration: Histogram;
  readonly messagesSentTotal: Counter;
  readonly messagesReceivedTotal: Counter;
  readonly messagesFailedTotal: Counter;
  readonly queueDepth: Gauge;
  readonly activeConversations: Gauge;

  constructor() {
    this.registry = register;

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.messagesSentTotal = new Counter({
      name: 'messages_sent_total',
      help: 'Total messages sent to WhatsApp',
      labelNames: ['workspace_id', 'status'],
      registers: [this.registry],
    });

    this.messagesReceivedTotal = new Counter({
      name: 'messages_received_total',
      help: 'Total messages received from WhatsApp',
      labelNames: ['workspace_id', 'type'],
      registers: [this.registry],
    });

    this.messagesFailedTotal = new Counter({
      name: 'messages_failed_total',
      help: 'Total messages that failed to send',
      labelNames: ['workspace_id', 'error_category'],
      registers: [this.registry],
    });

    this.queueDepth = new Gauge({
      name: 'bullmq_queue_depth',
      help: 'Current depth of BullMQ queues',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });

    this.activeConversations = new Gauge({
      name: 'active_conversations_total',
      help: 'Number of active (open) conversations',
      labelNames: ['workspace_id'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
