import { afterAll, beforeAll, beforeEach } from 'vitest';
import { closeDb, connectDb, db } from '../src/db/client.ts';
import { sql } from 'drizzle-orm';
import { TABLE_NAMES } from '../src/db/schema.ts';
import { TEST_DATABASE_URL } from './env.ts';

beforeAll(() => {
  connectDb(TEST_DATABASE_URL);
});

beforeEach(async () => {
  await db().execute(sql.raw(`TRUNCATE ${TABLE_NAMES.join(', ')} CASCADE`));
});

afterAll(async () => {
  await closeDb();
});
