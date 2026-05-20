import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  sku: Joi.string().min(1).max(64).required(),
  description: Joi.string().max(2000).allow('').default(''),
  priceCents: Joi.number().integer().min(0).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
  stock: Joi.number().integer().min(0).default(0),
  active: Joi.boolean().default(true),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  description: Joi.string().max(2000).allow(''),
  priceCents: Joi.number().integer().min(0),
  currency: Joi.string().length(3).uppercase(),
  stock: Joi.number().integer().min(0),
  active: Joi.boolean(),
}).min(1);

export const reserveSchema = Joi.object({
  items: Joi.array()
    .items(Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required(),
    }))
    .min(1)
    .required(),
});

export const releaseSchema = reserveSchema;
