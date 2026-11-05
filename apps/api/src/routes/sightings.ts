// Sightings and messages to the owner through the protected relay (FR-12, PRV-01, PRV-09, PRV-12).
import { eq } from 'drizzle-orm';
import { Router, type RequestHandler } from 'express';
import { PRIVACY_POLICY_VERSION, sightingInputSchema } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { images, notices, sightings } from '../db/schema.ts';
import { HttpError, notFound, parse } from '../lib/errors.ts';
import { uuidParam } from '../lib/ids.ts';
import { imageRows, imageUpload, processAll } from '../lib/images.ts';
import { parseJsonField } from './notices.ts';

export function sightingsRouter(options: { limiter: RequestHandler }) {
  const router = Router();
  const upload = imageUpload(1);

  router.post(
    '/notices/:id/sightings',
    options.limiter,
    upload.single('photo'),
    async (req, res) => {
      const raw = parseJsonField(req.body.data) as Record<string, unknown> | null;
      // Honeypot: real users never see this field. Answer as if it worked, store nothing.
      if (raw && typeof raw === 'object' && raw.website) {
        res.status(201).json({ ok: true });
        return;
      }
      const input = parse(sightingInputSchema, raw);
      const [notice] = await db()
        .select({ id: notices.id, status: notices.status, hidden: notices.hidden })
        .from(notices)
        .where(eq(notices.id, uuidParam(req.params.id)));
      if (!notice || notice.hidden) throw notFound();
      if (notice.status !== 'open') throw new HttpError(409, 'Este aviso não está mais aberto.');

      const processed = req.file
        ? await processAll([{ buffer: req.file.buffer, position: 0, alt: 'Foto do avistamento' }])
        : [];
      const keepContact = Boolean(input.contactValue && input.contactConsent);

      await db().transaction(async (tx) => {
        const [photo] = processed.length
          ? await tx
              .insert(images)
              .values(imageRows(notice.id, 'private', processed))
              .returning({ id: images.id })
          : [];
        await tx.insert(sightings).values({
          noticeId: notice.id,
          kind: input.kind,
          seenAt: input.kind === 'sighting' ? input.seenAt : null,
          neighborhood: input.kind === 'sighting' ? input.neighborhood : null,
          description: input.description,
          photoId: photo?.id ?? null,
          contactName: keepContact ? input.contactName || null : null,
          contactValue: keepContact ? input.contactValue! : null,
          consentAcceptedAt: new Date(),
          consentPolicyVersion: PRIVACY_POLICY_VERSION,
        });
        await tx
          .update(notices)
          .set({ lastActivityAt: new Date() })
          .where(eq(notices.id, notice.id));
      });
      res.status(201).json({ ok: true });
    },
  );

  return router;
}
