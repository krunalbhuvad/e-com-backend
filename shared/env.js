import Joi from 'joi';

export function loadEnv(schema, source = process.env) {
  const { value, error } = schema.prefs({ abortEarly: false, convert: true }).validate(source, {
    allowUnknown: true,
    stripUnknown: false,
  });
  if (error) {
    const details = error.details.map((d) => d.message).join('; ');
    throw new Error(`[env] invalid environment: ${details}`);
  }
  return value;
}

export const baseEnv = {
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),
  PORT: Joi.number().port().required(),
  SERVICE_NAME: Joi.string().required(),
};

export const mongoEnv = {
  MONGO_URI: Joi.string().uri({ scheme: ['mongodb'] }).required(),
};

export const redisEnv = {
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
};

export const brokerEnv = {
  RABBITMQ_URL: Joi.string().uri({ scheme: ['amqp', 'amqps'] }).required(),
};

export const jwtEnv = {
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),
};
