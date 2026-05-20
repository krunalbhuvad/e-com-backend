import { AppError, ValidationError, TooManyRequestsError } from '../errors.js';
import { getRequestId } from '../tracing.js';
import { logger } from '../logger.js';

export function notFoundHandler() {
  return (req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `No route ${req.method} ${req.originalUrl}`,
        requestId: getRequestId(),
      },
    });
  };
}

export function errorHandler() {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    const requestId = getRequestId();

    if (err instanceof AppError) {
      if (err.statusCode >= 500) {
        logger.error('handled app error', { code: err.code, message: err.message, statusCode: err.statusCode });
      } else {
        logger.warn('handled app error', { code: err.code, message: err.message, statusCode: err.statusCode });
      }

      const body = {
        error: { code: err.code, message: err.message, requestId },
      };
      if (err instanceof ValidationError && err.details) body.error.details = err.details;
      if (err instanceof TooManyRequestsError && err.retryAfterSeconds) {
        res.setHeader('Retry-After', String(err.retryAfterSeconds));
      }
      return res.status(err.statusCode).json(body);
    }

    logger.error('unhandled error', { err: err.message, stack: err.stack });
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error', requestId },
    });
  };
}
