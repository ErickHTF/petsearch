import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { config } from './config.ts';
import { connectDb, runMigrations } from './db/client.ts';
import { scheduleRetention } from './lib/retention.ts';

connectDb(config.databaseUrl);
await runMigrations();
scheduleRetention();

const app = createApp({
  sessionSecret: config.sessionSecret,
  cookieSecure: config.cookieSecure,
  trustProxy: config.isProduction,
  webDistDir: config.webDistDir ?? fileURLToPath(new URL('../../web/dist', import.meta.url)),
});

app.listen(config.port, () => {
  console.log(`PETSEARCH listening on http://localhost:${config.port}`);
});
