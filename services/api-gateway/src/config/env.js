import 'dotenv/config';
import Joi from 'joi';
import { loadEnv, baseEnv, redisEnv, jwtEnv } from 'shared/env';

const schema = Joi.object({
  ...baseEnv,
  ...redisEnv,
  ...jwtEnv,
  AUTH_SERVICE_URL: Joi.string().uri().required(),
  PRODUCT_SERVICE_URL: Joi.string().uri().required(),
  ORDER_SERVICE_URL: Joi.string().uri().required(),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().required(),
  CORS_ALLOWLIST: Joi.string().default(''),
  RATE_LIMIT_IP_PER_MIN: Joi.number().integer().min(1).default(100),
  RATE_LIMIT_USER_PER_MIN: Joi.number().integer().min(1).default(1000),
  UPSTREAM_TIMEOUT_MS: Joi.number().integer().min(100).default(3000),
});

export const env = loadEnv(schema);
export const corsAllowlist = env.CORS_ALLOWLIST.split(',').map((s) => s.trim()).filter(Boolean);
