// Environment validated once at startup, so a bad deploy fails fast with a clear message (PRV-05).
import { z } from 'zod';

const DEV_DATABASE_URL = 'postgres://petsearch:petsearch@localhost:5432/petsearch';
const DEV_SESSION_SECRET = 'dev-only-secret';

const flag = z.enum(['true', 'false']).transform((value) => value === 'true');

function schema(isProduction: boolean) {
  return z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: isProduction ? z.string() : z.string().default(DEV_DATABASE_URL),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    SESSION_SECRET: isProduction
      ? z.string().min(32, { error: 'must have at least 32 characters in production' })
      : z.string().default(DEV_SESSION_SECRET),
    COOKIE_SECURE: flag.default(isProduction),
    // Number of reverse proxies in front of the app. Set 0 when clients connect directly,
    // otherwise X-Forwarded-For can be forged to dodge the per-IP rate limits (PRV-09).
    TRUST_PROXY: z.coerce
      .number()
      .int()
      .min(0)
      .max(10)
      .default(isProduction ? 1 : 0),
    WEB_DIST_DIR: z.string().optional(),
  });
}

export function loadConfig(env: Record<string, string | undefined>) {
  const isProduction = env.NODE_ENV === 'production';
  const present = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ''));
  const result = schema(isProduction).safeParse(present);
  if (!result.success) {
    const problems = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment: ${problems.join('; ')}`);
  }
  const values = result.data;
  return {
    isProduction,
    port: values.PORT,
    databaseUrl: values.DATABASE_URL,
    databasePoolMax: values.DATABASE_POOL_MAX,
    sessionSecret: values.SESSION_SECRET,
    cookieSecure: values.COOKIE_SECURE,
    trustProxy: values.TRUST_PROXY,
    webDistDir: values.WEB_DIST_DIR,
  };
}

export const config = loadConfig(process.env);
