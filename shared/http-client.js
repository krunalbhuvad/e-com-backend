import axios from 'axios';
import axiosRetry from 'axios-retry';
import { getRequestId } from './tracing.js';
import { logger } from './logger.js';

const DEFAULT_TIMEOUT_MS = 3000;
const MAX_RETRIES = 3;

export function createHttpClient({ baseURL, timeout = DEFAULT_TIMEOUT_MS, label = 'upstream' } = {}) {
  const instance = axios.create({ baseURL, timeout });

  axiosRetry(instance, {
    retries: MAX_RETRIES,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      const idempotentRetryable = axiosRetry.isNetworkOrIdempotentRequestError(error);
      const status5xx = error.response?.status >= 500;
      return idempotentRetryable || status5xx;
    },
    onRetry: (retryCount, err, config) => {
      logger.warn('http retry', {
        label,
        retryCount,
        method: config.method,
        url: config.url,
        err: err.message,
      });
    },
  });

  instance.interceptors.request.use((config) => {
    const requestId = getRequestId();
    if (requestId) {
      config.headers = { ...config.headers, 'X-Request-ID': requestId };
    }
    return config;
  });

  return instance;
}
