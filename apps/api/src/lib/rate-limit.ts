import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

function limiter(limit: number, windowMs: number, key: (req: Request) => string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: key,
    handler: (_req, res) => {
      res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' });
    },
  });
}

const byIp = (req: Request) => ipKeyGenerator(req.ip ?? '');

export interface RateLimits {
  auth: number;
  signInAccount: number;
  notices: number;
  sightings: number;
}

export const DEFAULT_RATE_LIMITS: RateLimits = {
  auth: 20,
  signInAccount: 10,
  notices: 10,
  sightings: 5,
};

export function createLimiters(limits: RateLimits) {
  return {
    // 20 sign-in/sign-up attempts per 15 minutes per IP.
    auth: limiter(limits.auth, 15 * 60 * 1000, byIp),
    // 10 sign-in attempts per 15 minutes per account, whatever the IP, against distributed guessing.
    signInAccount: limiter(limits.signInAccount, 15 * 60 * 1000, (req) => {
      const email: unknown = req.body?.email;
      return `email:${typeof email === 'string' ? email.trim().toLowerCase() : ''}`;
    }),
    // 10 new notices per hour per account; each one can carry 3 photos of 8 MB to re-encode.
    notices: limiter(limits.notices, 60 * 60 * 1000, (req) => `user:${req.user?.id ?? ''}`),
    // 5 sightings or messages per hour per IP per notice (PRV-09).
    sightings: limiter(limits.sightings, 60 * 60 * 1000, (req) => {
      const params = req.params as Record<string, string>;
      return `${byIp(req)}:${params.id ?? ''}`;
    }),
  };
}
