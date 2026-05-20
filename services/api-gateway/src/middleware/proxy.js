import { forward } from '../utils/breaker-registry.js';

export function proxyTo(target) {
  return async function proxyHandler(req, res, next) {
    try {
      const upstream = await forward(target, req);
      res.status(upstream.status);
      for (const [k, v] of Object.entries(upstream.headers ?? {})) {
        if (['transfer-encoding', 'connection', 'content-length'].includes(k.toLowerCase())) continue;
        res.setHeader(k, v);
      }
      return res.send(upstream.data);
    } catch (err) {
      return next(err);
    }
  };
}
