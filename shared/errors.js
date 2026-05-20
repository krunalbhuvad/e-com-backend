import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  constructor(message, { code = 'INTERNAL_ERROR', statusCode = StatusCodes.INTERNAL_SERVER_ERROR, cause } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    if (cause) this.cause = cause;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, { code: 'VALIDATION_ERROR', statusCode: StatusCodes.BAD_REQUEST });
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { code: 'UNAUTHORIZED', statusCode: StatusCodes.UNAUTHORIZED });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, { code: 'FORBIDDEN', statusCode: StatusCodes.FORBIDDEN });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, { code: 'NOT_FOUND', statusCode: StatusCodes.NOT_FOUND });
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, { code: 'CONFLICT', statusCode: StatusCodes.CONFLICT });
  }
}

export class UpstreamError extends AppError {
  constructor(message, { upstream } = {}) {
    super(message, { code: 'UPSTREAM_UNAVAILABLE', statusCode: StatusCodes.BAD_GATEWAY });
    this.upstream = upstream;
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', retryAfterSeconds) {
    super(message, { code: 'RATE_LIMITED', statusCode: StatusCodes.TOO_MANY_REQUESTS });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
