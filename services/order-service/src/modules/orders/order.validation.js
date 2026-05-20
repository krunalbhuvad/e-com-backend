import Joi from 'joi';

export const createOrderSchema = Joi.object({
  items: Joi.array().items(Joi.object({
    productId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    unitPriceCents: Joi.number().integer().min(0).required(),
  })).min(1).required(),
  currency: Joi.string().length(3).uppercase().default('USD'),
});

export const changeStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED').required(),
});
