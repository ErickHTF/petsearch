// Retention (PRV-07, plan.md section 6): closed or reunited notices are deleted 90 days after
// closing; their events, sightings and images go with them through foreign-key cascades.
import { and, isNotNull, lt, ne } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { notices } from '../db/schema.ts';

export const CLOSED_RETENTION_DAYS = 90;

export async function purgeExpired(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - CLOSED_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await db()
    .delete(notices)
    .where(
      and(ne(notices.status, 'open'), isNotNull(notices.closedAt), lt(notices.closedAt, cutoff)),
    )
    .returning({ id: notices.id });
  return deleted.length;
}

export function scheduleRetention(intervalMs = 24 * 60 * 60 * 1000) {
  const run = () =>
    purgeExpired().catch((err) => {
      console.error('Retention job failed', err);
    });
  void run();
  return setInterval(run, intervalMs).unref();
}
