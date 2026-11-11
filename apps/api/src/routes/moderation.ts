// Moderation queue and actions with an audit log (FR-17).
import { desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import { MODERATION_TARGETS, moderationActionSchema } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { images, moderationActions, notices, sightings } from '../db/schema.ts';
import { notFound, parse } from '../lib/errors.ts';
import { uuidParam } from '../lib/ids.ts';
import { requireModerator } from '../lib/auth.ts';
import { toModerationNotice, toModerationSighting } from '../lib/serializers.ts';

const targetSchema = z.enum(MODERATION_TARGETS);
const queueSchema = z.object({
  targetType: targetSchema.default('notice'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const QUEUE_PAGE_SIZE = 50;

export function moderationRouter() {
  const router = Router();
  router.use('/moderation', requireModerator);

  router.get('/moderation/items', async (req, res) => {
    const { targetType, page } = parse(queueSchema, req.query);
    const offset = (page - 1) * QUEUE_PAGE_SIZE;
    if (targetType === 'notice') {
      const rows = await db()
        .select()
        .from(notices)
        .orderBy(desc(notices.createdAt), desc(notices.id))
        .limit(QUEUE_PAGE_SIZE)
        .offset(offset);
      res.json(rows.map(toModerationNotice));
    } else {
      const rows = await db()
        .select()
        .from(sightings)
        .orderBy(desc(sightings.createdAt), desc(sightings.id))
        .limit(QUEUE_PAGE_SIZE)
        .offset(offset);
      res.json(rows.map(toModerationSighting));
    }
  });

  router.post('/moderation/:targetType/:id', async (req, res) => {
    const targetType = parse(targetSchema, req.params.targetType);
    const id = uuidParam(req.params.id);
    const input = parse(moderationActionSchema, req.body);
    const table = targetType === 'notice' ? notices : sightings;

    await db().transaction(async (tx) => {
      const [target] = await tx.select({ id: table.id }).from(table).where(eq(table.id, id));
      if (!target) throw notFound();
      if (input.action === 'delete') {
        if (targetType === 'sighting') {
          const [row] = await tx
            .delete(sightings)
            .where(eq(sightings.id, id))
            .returning({ photoId: sightings.photoId });
          if (row?.photoId) await tx.delete(images).where(eq(images.id, row.photoId));
        } else {
          await tx.delete(notices).where(eq(notices.id, id));
        }
      } else {
        const hidden = input.action === 'hide';
        await tx
          .update(table)
          .set({
            hidden,
            hiddenReason: hidden ? input.reason : null,
            hiddenAt: hidden ? new Date() : null,
          })
          .where(eq(table.id, id));
      }
      await tx.insert(moderationActions).values({
        targetType,
        targetId: id,
        action: input.action,
        reason: input.reason,
        moderatorId: req.session.userId!,
      });
    });
    res.status(204).end();
  });

  return router;
}
