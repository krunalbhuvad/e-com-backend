import { StatusCodes } from 'http-status-codes';
import { authService } from './auth.service.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from './auth.validation.js';
import { ValidationError } from 'shared/errors';

function validate(schema, body) {
  const { value, error } = schema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) throw new ValidationError('Invalid request body', error.details.map((d) => d.message));
  return value;
}

export const authController = {
  async register(req, res, next) {
    try {
      const payload = validate(registerSchema, req.body);
      const result = await authService.register(payload);
      res.status(StatusCodes.CREATED).json(result);
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const payload = validate(loginSchema, req.body);
      const result = await authService.login(payload);
      res.json(result);
    } catch (err) { next(err); }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = validate(refreshSchema, req.body);
      const tokens = await authService.refresh(refreshToken);
      res.json(tokens);
    } catch (err) { next(err); }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = validate(logoutSchema, req.body);
      await authService.logout(refreshToken);
      res.status(StatusCodes.NO_CONTENT).end();
    } catch (err) { next(err); }
  },

  async me(req, res, next) {
    try {
      const user = await authService.me(req.user.id);
      res.json(user);
    } catch (err) { next(err); }
  },
};
