import { withRequestContext, newRequestId } from '../tracing.js';

export function requestIdMiddleware() {
  return function requestId(req, res, next) {
    const incoming = req.header('x-request-id');
    const id = incoming && /^[a-f0-9-]{8,}$/i.test(incoming) ? incoming : newRequestId();

    res.setHeader('X-Request-ID', id);
    withRequestContext({ requestId: id, userId: null }, () => next());
  };
}
