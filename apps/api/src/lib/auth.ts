import { eq } from 'drizzle-orm';
import type { RequestHandler } from 'express';
import type { Role } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import { HttpError } from './errors.ts';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: Role };
  }
}

/**
 * Resolves the signed-in user from the database on every request, so a revoked role or a
 * deleted account takes effect at once instead of when the session expires (PRV-04).
 */
export const loadUser: RequestHandler = async (req, _res, next) => {
  const userId = req.session.userId;
  if (userId) {
    const [user] = await db()
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId));
    if (user) req.user = user;
    else delete req.session.userId;
  }
  next();
};

export const requireUser: RequestHandler = (req, _res, next) => {
  if (!req.user) throw new HttpError(401, 'Entre na sua conta para continuar.');
  next();
};

export const requireModerator: RequestHandler = (req, _res, next) => {
  if (!req.user) throw new HttpError(401, 'Entre na sua conta para continuar.');
  if (req.user.role !== 'moderator') throw new HttpError(403, 'Acesso restrito à moderação.');
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
