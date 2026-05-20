import 'dotenv/config';
import Joi from 'joi';
import { loadEnv, baseEnv, mongoEnv, jwtEnv } from 'shared/env';

const schema = Joi.object({
  ...baseEnv,
  ...mongoEnv,
  ...jwtEnv,
  BCRYPT_COST: Joi.number().integer().min(10).max(14).default(12),
  CORS_ALLOWLIST: Joi.string().default(''),
});

export const env = loadEnv(schema);
export const corsAllowlist = env.CORS_ALLOWLIST.split(',').map((s) => s.trim()).filter(Boolean);
