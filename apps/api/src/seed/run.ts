// Usage: npm run seed (local) or `docker compose exec app node apps/api/dist/seed/run.js`.
import { config } from '../config.ts';
import { closeDb, connectDb, runMigrations } from '../db/client.ts';
import { seed } from './seed.ts';

const password = process.env.SEED_PASSWORD || (config.isProduction ? '' : 'senha-demo-123');
if (!password) throw new Error('Set SEED_PASSWORD to seed a production database');

connectDb(config.databaseUrl);
await runMigrations();
const result = await seed(password);
await closeDb();
console.log(
  `Seeded ${result.notices} fictional notices. Demo accounts: ${result.accounts.join(', ')}`,
);
