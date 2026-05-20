import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(10).max(128).required(),
  name: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('customer', 'admin').default('customer'),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutSchema = refreshSchema;
