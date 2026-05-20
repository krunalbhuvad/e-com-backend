import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import jwt from 'jsonwebtoken';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { TooManyRequestsError } from 'shared/errors';

function makeStore(prefix) {
  const client = getRedis();
  return new RedisStore({
    sendCommand: (...args) => client.call(...args),
    prefix,
  });
}

function decodeSubject(req) {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  try {
    const decoded = jwt.decode(token);
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}

const handler = (req, res, next) => {
  next(new TooManyRequestsError('Rate limit exceeded', 60));
};

export const ipLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.RATE_LIMIT_IP_PER_MIN,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  store: makeStore('rl:ip:'),
  handler,
  skip: (req) => Boolean(decodeSubject(req)),
});

export const userLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.RATE_LIMIT_USER_PER_MIN,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => decodeSubject(req) ?? req.ip,
  store: makeStore('rl:usr:'),
  handler,
  skip: (req) => !decodeSubject(req),
});
