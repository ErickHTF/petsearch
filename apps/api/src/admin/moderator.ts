// Usage: npm run moderator -- <email> [--revoke] (local) or
// `docker compose exec app node apps/api/dist/admin/moderator.js <email> [--revoke]`.
// The account must exist; confirm the person's identity before granting (FR-17, PRV-04).
import { config } from '../config.ts';
import { closeDb, connectDb } from '../db/client.ts';
import { setRole } from './roles.ts';

const args = process.argv.slice(2);
const revoke = args.includes('--revoke');
const email = args.find((arg) => !arg.startsWith('--'));
if (!email) throw new Error('Usage: moderator <email> [--revoke]');

connectDb(config.databaseUrl);
const found = await setRole(email, revoke ? 'owner' : 'moderator');
await closeDb();
if (!found) {
  console.error(`No account with email ${email}`);
  process.exitCode = 1;
} else {
  console.log(`${email} is now ${revoke ? 'owner' : 'moderator'}`);
}
