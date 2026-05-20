import 'dotenv/config';
import Joi from 'joi';
import { loadEnv, baseEnv, mongoEnv, brokerEnv, jwtEnv } from 'shared/env';

const schema = Joi.object({
  ...baseEnv,
  ...mongoEnv,
  ...brokerEnv,
  JWT_ACCESS_SECRET: jwtEnv.JWT_ACCESS_SECRET,
  CORS_ALLOWLIST: Joi.string().default(''),
});

export const env = loadEnv(schema);
export const corsAllowlist = env.CORS_ALLOWLIST.split(',').map((s) => s.trim()).filter(Boolean);
