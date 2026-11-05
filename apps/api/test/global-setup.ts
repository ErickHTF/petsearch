// Resets the test database schema and applies migrations once per run.
// Requires PostgreSQL from `docker compose up -d db` (or the CI service).
import pg from 'pg';
import { closeDb, connectDb, runMigrations } from '../src/db/client.ts';
import { TEST_DATABASE_URL } from './env.ts';

export default async function setup() {
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Cannot reach the test database at ${TEST_DATABASE_URL}. Start it with "docker compose up -d db".`,
      { cause: err },
    );
  }
  await client.query(
    'DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE;',
  );
  await client.query('CREATE SCHEMA public;');
  await client.end();

  connectDb(TEST_DATABASE_URL);
  await runMigrations();
  await closeDb();
}
