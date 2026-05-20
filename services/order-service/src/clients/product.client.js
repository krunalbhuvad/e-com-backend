import { createHttpClient } from 'shared/http-client';
import { wrap } from 'shared/circuit-breaker';
import { env } from '../config/env.js';

const http = createHttpClient({
  baseURL: env.PRODUCT_SERVICE_URL,
  timeout: env.PRODUCT_SERVICE_TIMEOUT_MS,
  label: 'product',
});

async function reserveCall({ items, bearerToken }) {
  const res = await http.post(
    '/products/reserve',
    { items },
    { headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {} },
  );
  if (res.status >= 400) {
    const err = new Error(`product /reserve returned ${res.status}`);
    err.upstreamStatus = res.status;
    err.upstreamBody = res.data;
    throw err;
  }
  return res.data;
}

const reserveBreaker = wrap('upstream:product:reserve', reserveCall);

export const productClient = {
  reserve(items, bearerToken) {
    return reserveBreaker.fire({ items, bearerToken });
  },
};
