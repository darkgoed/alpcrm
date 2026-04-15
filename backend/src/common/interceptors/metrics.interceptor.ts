import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { MetricsService } from '../../metrics/metrics.service';

interface ExpressRequestWithRoute extends Request {
  route?: { path?: string };
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<ExpressRequestWithRoute>();
    const response = ctx.getResponse<Response>();

    const start = Date.now();
    const method = request.method;
    const route = request.route?.path ?? request.path ?? 'unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = (Date.now() - start) / 1000;
          const status = String(response.statusCode);
          this.metricsService.httpRequestsTotal.inc({ method, route, status_code: status });
          this.metricsService.httpRequestDuration.observe({ method, route, status_code: status }, duration);
        },
        error: () => {
          const duration = (Date.now() - start) / 1000;
          const status = '500';
          this.metricsService.httpRequestsTotal.inc({ method, route, status_code: status });
          this.metricsService.httpRequestDuration.observe({ method, route, status_code: status }, duration);
        },
      }),
    );
  }
}
