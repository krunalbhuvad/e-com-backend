import { createHttpClient } from 'shared/http-client';
import { wrap, getBreakerMetrics } from 'shared/circuit-breaker';
import { env } from '../config/env.js';

const targets = {
  auth: env.AUTH_SERVICE_URL,
  products: env.PRODUCT_SERVICE_URL,
  orders: env.ORDER_SERVICE_URL,
  notifications: env.NOTIFICATION_SERVICE_URL,
};

const clients = Object.fromEntries(
  Object.entries(targets).map(([k, baseURL]) => [k, createHttpClient({ baseURL, timeout: env.UPSTREAM_TIMEOUT_MS, label: k })]),
);

async function callUpstream({ target, method, path, headers, body }) {
  const client = clients[target];
  return client.request({
    method,
    url: path,
    headers,
    data: body,
    validateStatus: () => true,
  });
}

const breakers = Object.fromEntries(
  Object.keys(targets).map((k) => [k, wrap(`upstream:${k}`, callUpstream)]),
);

export function forward(target, req) {
  if (!breakers[target]) throw new Error(`Unknown breaker target: ${target}`);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers['content-length'];
  delete headers.connection;

  return breakers[target].fire({
    target,
    method: req.method,
    path: req.originalUrl.replace(/^\/api/, ''),
    headers,
    body: req.body,
  });
}

export { getBreakerMetrics };
