// Drops and recreates the E2E database schema; the server applies migrations on start.
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url || !url.includes('petsearch_e2e')) throw new Error('Refusing to reset a non-E2E database');
const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE;');
await client.query('CREATE SCHEMA public;');
await client.end();
