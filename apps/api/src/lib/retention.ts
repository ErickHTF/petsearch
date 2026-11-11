// Retention (PRV-07, plan.md section 6): closed or reunited notices are deleted 90 days after
// closing; their events, sightings and images go with them through foreign-key cascades. Open
// notices with no activity for 90 days leave public view until the owner posts an update.
import { and, eq, gte, isNotNull, lt, ne, or, type SQL } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { notices, type Notice } from '../db/schema.ts';

export const CLOSED_RETENTION_DAYS = 90;
export const INACTIVE_DAYS = 90;

function inactiveCutoff(now: Date) {
  return new Date(now.getTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);
}

/** An open notice nobody touched for INACTIVE_DAYS; its owner renews it by posting an update. */
export function isInactive(
  notice: Pick<Notice, 'status' | 'lastActivityAt'>,
  now: Date = new Date(),
): boolean {
  return notice.status === 'open' && notice.lastActivityAt < inactiveCutoff(now);
}

/** SQL twin of "not hidden by moderation and not inactive", for public queries. */
export function publiclyVisible(now: Date = new Date()): SQL {
  return and(
    eq(notices.hidden, false),
    or(ne(notices.status, 'open'), gte(notices.lastActivityAt, inactiveCutoff(now))),
  )!;
}

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
