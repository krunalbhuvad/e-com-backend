import { StatusCodes } from 'http-status-codes';
import { productService } from './product.service.js';
import { createProductSchema, updateProductSchema, reserveSchema, releaseSchema } from './product.validation.js';
import { ValidationError } from 'shared/errors';

function validate(schema, body) {
  const { value, error } = schema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) throw new ValidationError('Invalid request body', error.details.map((d) => d.message));
  return value;
}

export const productController = {
  async list(_req, res, next) {
    try { res.json({ items: await productService.list() }); } catch (err) { next(err); }
  },

  async get(req, res, next) {
    try { res.json(await productService.get(req.params.id)); } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const input = validate(createProductSchema, req.body);
      const created = await productService.create(input);
      res.status(StatusCodes.CREATED).json(created);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const patch = validate(updateProductSchema, req.body);
      res.json(await productService.update(req.params.id, patch));
    } catch (err) { next(err); }
  },

  async reserve(req, res, next) {
    try {
      const { items } = validate(reserveSchema, req.body);
      res.status(StatusCodes.CREATED).json(await productService.reserve(items));
    } catch (err) { next(err); }
  },

  async release(req, res, next) {
    try {
      const { items } = validate(releaseSchema, req.body);
      res.json(await productService.release(items));
    } catch (err) { next(err); }
  },
};
