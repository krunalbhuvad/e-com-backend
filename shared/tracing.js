import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const store = new AsyncLocalStorage();

export function withRequestContext(ctx, fn) {
  return store.run(ctx, fn);
}

export function getRequestContext() {
  return store.getStore() ?? null;
}

export function getRequestId() {
  return store.getStore()?.requestId ?? null;
}

export function newRequestId() {
  return randomUUID();
}
