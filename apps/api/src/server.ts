import { fileURLToPath } from 'node:url';
import { createApp } from './app.ts';
import { config } from './config.ts';
import { closeDb, connectDb, runMigrations } from './db/client.ts';
import { scheduleRetention } from './lib/retention.ts';

connectDb(config.databaseUrl, config.databasePoolMax);
await runMigrations();
const retention = scheduleRetention();

const app = createApp({
  sessionSecret: config.sessionSecret,
  cookieSecure: config.cookieSecure,
  trustProxy: config.trustProxy,
  requestLog: true,
  webDistDir: config.webDistDir ?? fileURLToPath(new URL('../../web/dist', import.meta.url)),
});

const server = app.listen(config.port, () => {
  console.log(`PETSEARCH listening on http://localhost:${config.port}`);
});

// Containers stop with SIGTERM: finish in-flight requests, then release the database pool.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  clearInterval(retention);
  setTimeout(() => process.exit(1), 10_000).unref();
  server.close(() => {
    closeDb().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
