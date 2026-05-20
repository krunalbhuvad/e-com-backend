import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function signAccessToken({ sub, role, email }) {
  return jwt.sign({ sub, role, email }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_TTL,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
}

export function newRefreshToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshExpiry() {
  const m = String(env.JWT_REFRESH_TTL).match(/^(\d+)(s|m|h|d)$/);
  if (!m) throw new Error(`Invalid JWT_REFRESH_TTL: ${env.JWT_REFRESH_TTL}`);
  const n = Number(m[1]);
  const factor = { s: 1, m: 60, h: 3600, d: 86400 }[m[2]];
  return new Date(Date.now() + n * factor * 1000);
}
