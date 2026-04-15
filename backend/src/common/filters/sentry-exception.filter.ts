import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: { workspaceId?: string; sub?: string } }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Only capture non-HTTP exceptions (or 5xx) in Sentry
    if (!(exception instanceof HttpException) || status >= 500) {
      Sentry.withScope((scope) => {
        if (request.user?.workspaceId) {
          scope.setTag('workspaceId', request.user.workspaceId);
        }
        if (request.user?.sub) {
          scope.setUser({ id: request.user.sub });
        }
        scope.setTag('path', request.path);
        scope.setTag('method', request.method);
        Sentry.captureException(exception);
      });
    }

    if (response.headersSent) return;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
