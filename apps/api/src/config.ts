function required(name: string, devFallback: string): string {
  const value = process.env[name] || (isProduction ? undefined : devFallback);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL', 'postgres://petsearch:petsearch@localhost:5432/petsearch'),
  sessionSecret: required('SESSION_SECRET', 'dev-only-secret'),
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction,
  moderatorEmails: (process.env.MODERATOR_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  webDistDir: process.env.WEB_DIST_DIR,
};
