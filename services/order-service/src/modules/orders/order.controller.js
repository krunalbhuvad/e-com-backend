import { StatusCodes } from 'http-status-codes';
import { orderService } from './order.service.js';
import { createOrderSchema, changeStatusSchema } from './order.validation.js';
import { ValidationError } from 'shared/errors';

function validate(schema, body) {
  const { value, error } = schema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) throw new ValidationError('Invalid request body', error.details.map((d) => d.message));
  return value;
}

export const orderController = {
  async create(req, res, next) {
    try {
      const payload = validate(createOrderSchema, req.body);
      const idempotencyKey = req.header('idempotency-key');
      const bearerToken = req.header('authorization')?.replace(/^Bearer\s+/i, '');
      const { isReplay, body } = await orderService.createOrder({
        user: req.user, idempotencyKey, bearerToken, payload,
      });
      const status = isReplay ? StatusCodes.OK : StatusCodes.CREATED;
      res.setHeader('Idempotency-Replayed', isReplay ? 'true' : 'false');
      res.status(status).json(isReplay ? body : body);
    } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try { res.json(await orderService.getOrder(req.user, req.params.id)); } catch (err) { next(err); }
  },

  async list(req, res, next) {
    try { res.json({ items: await orderService.listMine(req.user) }); } catch (err) { next(err); }
  },

  async changeStatus(req, res, next) {
    try {
      const { status } = validate(changeStatusSchema, req.body);
      res.json(await orderService.changeStatus(req.user, req.params.id, status));
    } catch (err) { next(err); }
  },
};
