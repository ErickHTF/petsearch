// Owner area: own notices and their sightings inbox (FR-13, PRV-04, PRV-12).
import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { sightingStateSchema } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { notices, sightings } from '../db/schema.ts';
import { notFound, parse } from '../lib/errors.ts';
import { uuidParam } from '../lib/ids.ts';
import { requireUser } from '../lib/auth.ts';
import { toOwnerSighting } from '../lib/serializers.ts';
import { loadOwnedNotice, ownerView, ownerViews } from '../repo/notices.ts';

export function meRouter() {
  const router = Router();
  router.use('/me', requireUser);

  router.get('/me/notices', async (req, res) => {
    const rows = await db()
      .select()
      .from(notices)
      .where(eq(notices.ownerId, req.session.userId!))
      .orderBy(desc(notices.createdAt));
    res.json(await ownerViews(rows));
  });

  router.get('/me/notices/:id', async (req, res) => {
    const notice = await loadOwnedNotice(uuidParam(req.params.id), req.session.userId);
    res.json(await ownerView(notice));
  });

  router.get('/me/notices/:id/sightings', async (req, res) => {
    const notice = await loadOwnedNotice(uuidParam(req.params.id), req.session.userId);
    const rows = await db()
      .select()
      .from(sightings)
      .where(and(eq(sightings.noticeId, notice.id), eq(sightings.hidden, false)))
      .orderBy(desc(sightings.createdAt));
    res.json(rows.map(toOwnerSighting));
  });

  router.patch('/me/sightings/:id', async (req, res) => {
    const input = parse(sightingStateSchema, req.body);
    const [row] = await db()
      .select({ sighting: sightings, ownerId: notices.ownerId })
      .from(sightings)
      .innerJoin(notices, eq(notices.id, sightings.noticeId))
      .where(eq(sightings.id, uuidParam(req.params.id)));
    if (!row || row.ownerId !== req.session.userId || row.sighting.hidden) throw notFound();
    const [updated] = await db()
      .update(sightings)
      .set({ ownerState: input.ownerState })
      .where(eq(sightings.id, row.sighting.id))
      .returning();
    res.json(toOwnerSighting(updated!));
  });

  return router;
}
