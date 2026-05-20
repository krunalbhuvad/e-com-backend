import winston from 'winston';
import { getRequestContext } from './tracing.js';

const SECRET_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._\-]+/g,
  /eyJ[A-Za-z0-9._\-]+/g,
  /"password"\s*:\s*"[^"]*"/g,
];

const redact = winston.format((info) => {
  for (const field of ['message', 'stack']) {
    if (typeof info[field] === 'string') {
      for (const pattern of SECRET_PATTERNS) {
        info[field] = info[field].replace(pattern, '[REDACTED]');
      }
    }
  }
  return info;
});

const injectContext = winston.format((info) => {
  const ctx = getRequestContext();
  if (ctx?.requestId) info.requestId = ctx.requestId;
  if (ctx?.userId) info.userId = ctx.userId;
  return info;
});

export function createLogger(serviceName) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      injectContext(),
      redact(),
      winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
    exitOnError: false,
  });
}

export const logger = createLogger(process.env.SERVICE_NAME || 'unknown');
