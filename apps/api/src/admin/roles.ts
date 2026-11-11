// Moderator role changes are an operator action, never a sign-up side effect: without email
// verification (OQ-10) anyone could register an allowlisted address first (FR-17, PRV-04).
import { eq } from 'drizzle-orm';
import type { Role } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';

/** Sets the role of an existing account; returns false when no account has that email. */
export async function setRole(email: string, role: Role): Promise<boolean> {
  const updated = await db()
    .update(users)
    .set({ role })
    .where(eq(users.email, email.trim().toLowerCase()))
    .returning({ id: users.id });
  return updated.length > 0;
}
