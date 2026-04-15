import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_HEADER = 'x-request-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existing = req.headers[CORRELATION_HEADER] as string | undefined;
    const requestId = existing ?? randomUUID();
    req.headers[CORRELATION_HEADER] = requestId;
    res.setHeader(CORRELATION_HEADER, requestId);
    next();
  }
}
