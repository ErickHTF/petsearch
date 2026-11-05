import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from './schema.ts';

export type Database = NodePgDatabase<typeof schema>;

let pool: pg.Pool | undefined;
let database: Database | undefined;

export function connectDb(url: string): Database {
  pool = new pg.Pool({ connectionString: url, max: 10 });
  database = drizzle(pool, { schema });
  return database;
}

export function db(): Database {
  if (!database) throw new Error('Database not connected');
  return database;
}

export function dbPool(): pg.Pool {
  if (!pool) throw new Error('Database not connected');
  return pool;
}

export async function closeDb() {
  await pool?.end();
  pool = undefined;
  database = undefined;
}

/** Works from both src/db (tsx, tests) and dist (bundled server). */
function migrationsFolder(): string {
  const candidates = ['../drizzle', '../../drizzle'].map((path) =>
    fileURLToPath(new URL(path, import.meta.url)),
  );
  const found = process.env.MIGRATIONS_DIR ?? candidates.find((path) => existsSync(path));
  if (!found) throw new Error('Migrations folder not found');
  return found;
}

export async function runMigrations() {
  await migrate(db(), { migrationsFolder: migrationsFolder() });
}
