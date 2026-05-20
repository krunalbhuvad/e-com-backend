import amqplib from 'amqplib';
import { logger } from './logger.js';
import { withRequestContext, getRequestId } from './tracing.js';

const state = {
  connection: null,
  channel: null,
  url: null,
  reconnecting: false,
  consumers: [],
};

async function backoff(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function connectBroker(url) {
  state.url = url ?? process.env.RABBITMQ_URL;
  if (!state.url) throw new Error('RABBITMQ_URL is not set');

  const conn = await amqplib.connect(state.url);
  conn.on('error', (err) => logger.error('rabbitmq error', { err: err.message }));
  conn.on('close', () => {
    logger.warn('rabbitmq connection closed');
    state.connection = null;
    state.channel = null;
    scheduleReconnect();
  });
  const ch = await conn.createConfirmChannel();
  await ch.prefetch(20);

  state.connection = conn;
  state.channel = ch;
  logger.info('rabbitmq connected');

  for (const c of state.consumers) {
    await registerConsumerInternal(c);
  }
}

function scheduleReconnect() {
  if (state.reconnecting) return;
  state.reconnecting = true;
  (async () => {
    let delay = 1000;
    while (!state.connection) {
      try {
        await connectBroker(state.url);
        break;
      } catch (err) {
        logger.warn('rabbitmq reconnect failed', { err: err.message, nextDelayMs: delay });
        await backoff(delay);
        delay = Math.min(delay * 2, 30_000);
      }
    }
    state.reconnecting = false;
  })();
}

export async function assertTopology({ exchange, queue, routingKey, dlx }) {
  const ch = state.channel;
  if (!ch) throw new Error('broker not connected');

  await ch.assertExchange(exchange, 'topic', { durable: true });
  if (dlx) {
    await ch.assertExchange(dlx, 'topic', { durable: true });
  }
  if (queue) {
    await ch.assertQueue(queue, {
      durable: true,
      arguments: dlx ? { 'x-dead-letter-exchange': dlx } : undefined,
    });
    if (routingKey) await ch.bindQueue(queue, exchange, routingKey);
  }
}

export async function publish(exchange, routingKey, payload, { headers = {} } = {}) {
  const ch = state.channel;
  if (!ch) throw new Error('broker not connected');

  const finalHeaders = { 'x-request-id': getRequestId() ?? null, ...headers };
  const body = Buffer.from(JSON.stringify(payload));

  return new Promise((resolve, reject) => {
    const ok = ch.publish(
      exchange,
      routingKey,
      body,
      {
        contentType: 'application/json',
        persistent: true,
        headers: finalHeaders,
        messageId: finalHeaders['x-request-id'] ?? undefined,
      },
      (err) => (err ? reject(err) : resolve(true)),
    );
    if (!ok) {
      logger.warn('broker channel write buffer full', { exchange, routingKey });
    }
  });
}

async function registerConsumerInternal(c) {
  const ch = state.channel;
  await assertTopology({ exchange: c.exchange, queue: c.queue, routingKey: c.routingKey, dlx: c.dlx });
  await ch.consume(c.queue, async (msg) => {
    if (!msg) return;
    let payload;
    try {
      payload = JSON.parse(msg.content.toString('utf8'));
    } catch (err) {
      logger.error('broker: cannot parse message; sending to DLQ', { queue: c.queue });
      ch.nack(msg, false, false);
      return;
    }
    const requestId = msg.properties.headers?.['x-request-id'] ?? null;
    await withRequestContext({ requestId }, async () => {
      try {
        await c.handler(payload, { headers: msg.properties.headers, requestId });
        ch.ack(msg);
      } catch (err) {
        logger.error('consumer handler failed; sending to DLQ', {
          queue: c.queue,
          err: err.message,
        });
        ch.nack(msg, false, false);
      }
    });
  });
}

export async function registerConsumer({ exchange, queue, routingKey, dlx, handler }) {
  const c = { exchange, queue, routingKey, dlx, handler };
  state.consumers.push(c);
  if (state.channel) await registerConsumerInternal(c);
}

export async function isBrokerHealthy() {
  return Boolean(state.connection && state.channel);
}

export async function closeBroker() {
  try {
    await state.channel?.close();
    await state.connection?.close();
  } catch (err) {
    // ignore on shutdown
  } finally {
    state.channel = null;
    state.connection = null;
  }
}
