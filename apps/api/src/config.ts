function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

export const config = {
  isProduction,
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: required(
    'MONGODB_URI',
    isProduction ? undefined : 'mongodb://localhost:27017/petsearch',
  ),
  sessionSecret: required('SESSION_SECRET', isProduction ? undefined : 'dev-only-secret'),
  moderatorEmails: (process.env.MODERATOR_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  webDistDir: process.env.WEB_DIST_DIR,
};
