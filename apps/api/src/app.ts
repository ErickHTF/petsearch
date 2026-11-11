import { existsSync } from 'node:fs';
import { join } from 'node:path';
import connectPgSimple from 'connect-pg-simple';
import express, { Router } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { dbPool } from './db/client.ts';
import { notFoundHandler, errorHandler } from './lib/errors.ts';
import { loadUser, sameOriginWrites } from './lib/auth.ts';
import { createLimiters, DEFAULT_RATE_LIMITS, type RateLimits } from './lib/rate-limit.ts';
import { authRouter, SESSION_COOKIE } from './routes/auth.ts';
import { noticesRouter } from './routes/notices.ts';
import { meRouter } from './routes/me.ts';
import { sightingsRouter } from './routes/sightings.ts';
import { moderationRouter } from './routes/moderation.ts';
import { imagesRouter } from './routes/images.ts';

export interface AppOptions {
  sessionSecret: string;
  cookieSecure: boolean;
  trustProxy?: boolean;
  rateLimits?: RateLimits;
  webDistDir?: string;
}

const PgStore = connectPgSimple(session);

export function createApp(options: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  if (options.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { 'img-src': ["'self'", 'data:', 'blob:'] },
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(
    session({
      name: SESSION_COOKIE,
      secret: options.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: new PgStore({ pool: dbPool(), tableName: 'session', createTableIfMissing: false }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: options.cookieSecure,
        maxAge: 14 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  const limiters = createLimiters(options.rateLimits ?? DEFAULT_RATE_LIMITS);
  const api = Router();
  api.use(sameOriginWrites);
  api.use(loadUser);
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  api.use(authRouter({ limiter: limiters.auth, signInLimiter: limiters.signInAccount }));
  api.use(noticesRouter({ limiter: limiters.notices }));
  api.use(sightingsRouter({ limiter: limiters.sightings }));
  api.use(meRouter());
  api.use(moderationRouter());
  api.use(imagesRouter());
  api.use(notFoundHandler);

  app.use('/api', api);

  // Production: the same origin serves the built SPA (ADR 0001).
  if (options.webDistDir && existsSync(options.webDistDir)) {
    const indexHtml = join(options.webDistDir, 'index.html');
    app.use(
      express.static(options.webDistDir, {
        index: false,
        setHeaders: (res, path) => {
          if (path.includes(`${join(options.webDistDir!, 'assets')}`)) {
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      }),
    );
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}
