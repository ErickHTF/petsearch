import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

function limiter(
  limit: number,
  windowMs: number,
  keySuffix?: (params: Record<string, string>) => string,
) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) =>
      `${ipKeyGenerator(req.ip ?? '')}:${keySuffix ? keySuffix(req.params as Record<string, string>) : ''}`,
    handler: (_req, res) => {
      res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' });
    },
  });
}

export interface RateLimits {
  auth: number;
  sightings: number;
}

export const DEFAULT_RATE_LIMITS: RateLimits = { auth: 20, sightings: 5 };

export function createLimiters(limits: RateLimits) {
  return {
    // 20 sign-in/sign-up attempts per 15 minutes per IP.
    auth: limiter(limits.auth, 15 * 60 * 1000),
    // 5 sightings or messages per hour per IP per notice (PRV-09).
    sightings: limiter(limits.sightings, 60 * 60 * 1000, (params) => params.id ?? ''),
  };
}
