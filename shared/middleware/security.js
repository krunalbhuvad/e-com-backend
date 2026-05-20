import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import { logger } from '../logger.js';
import { getRequestId } from '../tracing.js';

export function applySecurity(app, { corsAllowlist = [] } = {}) {
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || corsAllowlist.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not in allowlist`));
      },
      credentials: true,
    }),
  );

  app.use(mongoSanitize());
  app.use(hpp());
  app.use(compression());

  morgan.token('reqid', () => getRequestId() ?? '-');
  app.use(
    morgan(':method :url :status :res[content-length] :response-time ms reqid=:reqid', {
      stream: { write: (line) => logger.http(line.trim()) },
    }),
  );
}
