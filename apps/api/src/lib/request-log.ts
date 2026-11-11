// One JSON line per API request with a request id that also goes back in X-Request-Id, so an
// error report can be matched to the log. No IP, user, query string or body is logged (PRV-07).
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestLog: RequestHandler = (req, res, next) => {
  const id = randomUUID();
  const started = process.hrtime.bigint();
  res.locals.requestId = id;
  res.set('X-Request-Id', id);
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    console.log(
      JSON.stringify({
        at: new Date().toISOString(),
        id,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        ms: Math.round(ms),
      }),
    );
  });
  next();
};
