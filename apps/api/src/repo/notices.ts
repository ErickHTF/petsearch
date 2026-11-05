// Loads notices with their photos, timeline and sighting counts for serialization.
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import type { OwnerNotice, PublicNotice } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { images, noticeEvents, notices, sightings, type Notice } from '../db/schema.ts';
import { notFound } from '../lib/errors.ts';
import { toOwnerNotice, toPublicNotice, type PhotoMeta } from '../lib/serializers.ts';

async function relations(ids: string[]) {
  if (ids.length === 0) return { photos: [], events: [] };
  const [photos, events] = await Promise.all([
    db()
      .select({
        id: images.id,
        noticeId: images.noticeId,
        alt: images.alt,
        width: images.width,
        height: images.height,
        position: images.position,
      })
      .from(images)
      .where(and(inArray(images.noticeId, ids), eq(images.visibility, 'public')))
      .orderBy(asc(images.position)),
    db()
      .select()
      .from(noticeEvents)
      .where(inArray(noticeEvents.noticeId, ids))
      .orderBy(asc(noticeEvents.at)),
  ]);
  return { photos: photos as PhotoMeta[], events };
}

export async function publicViews(rows: Notice[]): Promise<PublicNotice[]> {
  const { photos, events } = await relations(rows.map((row) => row.id));
  return rows.map((row) =>
    toPublicNotice(
      row,
      photos.filter((p) => p.noticeId === row.id),
      events.filter((e) => e.noticeId === row.id),
    ),
  );
}

export async function ownerViews(rows: Notice[]): Promise<OwnerNotice[]> {
  const ids = rows.map((row) => row.id);
  const { photos, events } = await relations(ids);
  const counts = ids.length
    ? await db()
        .select({ noticeId: sightings.noticeId, n: count() })
        .from(sightings)
        .where(
          and(
            inArray(sightings.noticeId, ids),
            eq(sightings.ownerState, 'new'),
            eq(sightings.hidden, false),
          ),
        )
        .groupBy(sightings.noticeId)
    : [];
  return rows.map((row) =>
    toOwnerNotice(
      row,
      photos.filter((p) => p.noticeId === row.id),
      events.filter((e) => e.noticeId === row.id),
      counts.find((c) => c.noticeId === row.id)?.n ?? 0,
    ),
  );
}

export async function ownerView(row: Notice): Promise<OwnerNotice> {
  const [view] = await ownerViews([row]);
  return view!;
}

/** Loads a notice owned by the given user; 404 otherwise so ownership is not revealed. */
export async function loadOwnedNotice(id: string, userId: string | undefined): Promise<Notice> {
  const [notice] = await db().select().from(notices).where(eq(notices.id, id));
  if (!notice || notice.ownerId !== userId) throw notFound();
  return notice;
}
