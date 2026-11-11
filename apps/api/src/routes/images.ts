// Serves stored images with access control: sighting photos are owner/moderator only (PRV-12).
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { db } from '../db/client.ts';
import { images, notices } from '../db/schema.ts';
import { notFound } from '../lib/errors.ts';
import { uuidParam } from '../lib/ids.ts';
import { isInactive } from '../lib/retention.ts';

export function imagesRouter() {
  const router = Router();

  router.get('/images/:id', async (req, res) => {
    const [row] = await db()
      .select({
        content: images.content,
        visibility: images.visibility,
        ownerId: notices.ownerId,
        noticeHidden: notices.hidden,
        status: notices.status,
        lastActivityAt: notices.lastActivityAt,
      })
      .from(images)
      .innerJoin(notices, eq(notices.id, images.noticeId))
      .where(eq(images.id, uuidParam(req.params.id)));
    if (!row) throw notFound();

    const isOwner = row.ownerId === req.user?.id;
    const isModerator = req.user?.role === 'moderator';
    const isPublic = row.visibility === 'public' && !row.noticeHidden && !isInactive(row);
    if (!isPublic && !isOwner && !isModerator) throw notFound();

    res.set('Content-Type', 'image/webp');
    res.set('Cache-Control', isPublic ? 'public, max-age=86400' : 'private, no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    res.send(row.content);
  });

  return router;
}
