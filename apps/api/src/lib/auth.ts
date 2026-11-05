import type { RequestHandler } from 'express';
import type { Role } from '@petsearch/shared';
import { HttpError } from './errors.ts';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: Role;
  }
}

export const requireUser: RequestHandler = (req, _res, next) => {
  if (!req.session.userId) throw new HttpError(401, 'Entre na sua conta para continuar.');
  next();
};

export const requireModerator: RequestHandler = (req, _res, next) => {
  if (!req.session.userId) throw new HttpError(401, 'Entre na sua conta para continuar.');
  if (req.session.role !== 'moderator') throw new HttpError(403, 'Acesso restrito à moderação.');
  next();
};

/** Rejects cross-site writes as a second layer on top of SameSite=Lax cookies. */
export const sameOriginWrites: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  if (origin && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    let host: string | undefined;
    try {
      host = new URL(origin).host;
    } catch {
      host = undefined;
    }
    if (host !== req.headers.host) throw new HttpError(403, 'Origem não permitida.');
  }
  next();
};
