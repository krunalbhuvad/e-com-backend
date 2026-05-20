import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors.js';
import { getRequestContext } from '../tracing.js';

export function verifyJWT({ secret = process.env.JWT_ACCESS_SECRET } = {}) {
  if (!secret) throw new Error('verifyJWT: secret is missing');

  return function (req, res, next) {
    const header = req.header('authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or malformed Authorization header'));
    }
    const token = header.slice('Bearer '.length).trim();
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
      req.user = { id: decoded.sub, role: decoded.role, email: decoded.email };
      const ctx = getRequestContext();
      if (ctx) ctx.userId = decoded.sub;
      next();
    } catch (err) {
      return next(new UnauthorizedError('Invalid or expired token'));
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) return next(new ForbiddenError(`Requires role ${roles.join(' or ')}`));
    next();
  };
}
