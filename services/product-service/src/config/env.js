import 'dotenv/config';
import Joi from 'joi';
import { loadEnv, baseEnv, mongoEnv, redisEnv, brokerEnv, jwtEnv } from 'shared/env';

const schema = Joi.object({
  ...baseEnv,
  ...mongoEnv,
  ...redisEnv,
  ...brokerEnv,
  JWT_ACCESS_SECRET: jwtEnv.JWT_ACCESS_SECRET,
  PRODUCT_CACHE_TTL_SECONDS: Joi.number().integer().min(1).default(300),
  CORS_ALLOWLIST: Joi.string().default(''),
});

export const env = loadEnv(schema);
export const corsAllowlist = env.CORS_ALLOWLIST.split(',').map((s) => s.trim()).filter(Boolean);
