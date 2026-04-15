import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

type LogContext = Record<string, unknown>;

function buildEntry(
  level: string,
  message: unknown,
  context?: string,
  extra?: LogContext,
) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    ctx: context,
    msg: typeof message === 'string' ? message : JSON.stringify(message),
    ...extra,
  };

  // Strip undefined values
  for (const key of Object.keys(entry)) {
    if (entry[key] === undefined) delete entry[key];
  }

  return JSON.stringify(entry);
}

@Injectable()
export class AppLogger implements LoggerService {
  private readonly levels: Set<LogLevel> = new Set([
    'log',
    'error',
    'warn',
    'debug',
    'verbose',
  ]);

  log(message: unknown, context?: string) {
    process.stdout.write(buildEntry('info', message, context) + '\n');
  }

  error(message: unknown, trace?: string, context?: string) {
    process.stderr.write(
      buildEntry('error', message, context, trace ? { trace } : undefined) + '\n',
    );
  }

  warn(message: unknown, context?: string) {
    process.stdout.write(buildEntry('warn', message, context) + '\n');
  }

  debug(message: unknown, context?: string) {
    process.stdout.write(buildEntry('debug', message, context) + '\n');
  }

  verbose(message: unknown, context?: string) {
    process.stdout.write(buildEntry('verbose', message, context) + '\n');
  }

  fatal(message: unknown, context?: string) {
    process.stderr.write(buildEntry('fatal', message, context) + '\n');
  }

  setLogLevels(levels: LogLevel[]) {
    this.levels.clear();
    for (const l of levels) this.levels.add(l);
  }
}

/**
 * Build a structured log entry with domain context fields.
 * Use this in services when you need to include workspaceId, conversationId, etc.
 *
 * Example:
 *   this.logger.log(logMsg('Webhook processed', { workspaceId, messageId }));
 */
export function logMsg(message: string, ctx: LogContext): string {
  const fields = Object.entries(ctx)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join(' ');
  return fields ? `${message} | ${fields}` : message;
}
