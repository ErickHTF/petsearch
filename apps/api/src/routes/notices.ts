// Notices: public list and detail, owner create/edit/status/delete (FR-01 to FR-11, FR-14, FR-15).
import { and, arrayContains, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { Router, type RequestHandler } from 'express';
import {
  LIMITS,
  NOTICE_STATUS_LABELS,
  PRIVACY_POLICY_VERSION,
  SPECIES_LABELS,
  noticeFiltersSchema,
  noticeInputSchema,
  noticeUpdateSchema,
  statusUpdateSchema,
  type Page,
  type PublicNotice,
} from '@petsearch/shared';
import { db } from '../db/client.ts';
import { images, noticeEvents, notices } from '../db/schema.ts';
import { HttpError, notFound, parse } from '../lib/errors.ts';
import { uuidParam } from '../lib/ids.ts';
import { requireUser } from '../lib/auth.ts';
import { imageRows, imageUpload, processAll } from '../lib/images.ts';
import { publiclyVisible } from '../lib/retention.ts';
import { loadOwnedNotice, ownerView, publicViews } from '../repo/notices.ts';

export const PAGE_SIZE = 12;

export function parseJsonField(value: unknown): unknown {
  if (typeof value !== 'string') throw new HttpError(400, 'Requisição inválida.');
  try {
    return JSON.parse(value);
  } catch {
    throw new HttpError(400, 'Requisição inválida.');
  }
}

export function noticesRouter(options: { limiter: RequestHandler }) {
  const router = Router();
  const upload = imageUpload(LIMITS.photosMax);

  router.get('/notices', async (req, res) => {
    const filters = parse(noticeFiltersSchema, req.query);
    const conditions: SQL[] = [publiclyVisible(), eq(notices.status, 'open')];
    if (filters.type) conditions.push(eq(notices.type, filters.type));
    if (filters.neighborhood) conditions.push(eq(notices.neighborhood, filters.neighborhood));
    if (filters.species) conditions.push(eq(notices.species, filters.species));
    if (filters.size) conditions.push(eq(notices.size, filters.size));
    if (filters.color) conditions.push(arrayContains(notices.coatColors, [filters.color]));
    if (filters.from) conditions.push(gte(notices.eventDate, filters.from));
    if (filters.to) conditions.push(lte(notices.eventDate, filters.to));
    const where = and(...conditions);

    const [rows, totals] = await Promise.all([
      db()
        .select()
        .from(notices)
        .where(where)
        .orderBy(desc(notices.eventDate), desc(notices.createdAt))
        .limit(PAGE_SIZE)
        .offset((filters.page - 1) * PAGE_SIZE),
      db().select({ total: count() }).from(notices).where(where),
    ]);
    const page: Page<PublicNotice> = {
      items: await publicViews(rows),
      page: filters.page,
      pageSize: PAGE_SIZE,
      total: totals[0]?.total ?? 0,
    };
    res.json(page);
  });

  router.get('/notices/:id', async (req, res) => {
    const [notice] = await db()
      .select()
      .from(notices)
      .where(and(eq(notices.id, uuidParam(req.params.id)), publiclyVisible()));
    if (!notice) throw notFound();
    const [view] = await publicViews([notice]);
    res.json(view);
  });

  router.post(
    '/notices',
    requireUser,
    options.limiter,
    upload.array('photos', LIMITS.photosMax),
    async (req, res) => {
      const input = parse(noticeInputSchema, parseJsonField(req.body.data));
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (files.length === 0) {
        throw new HttpError(400, 'Adicione pelo menos uma foto.', {
          photos: 'Adicione pelo menos uma foto.',
        });
      }
      const label = input.animal.name || SPECIES_LABELS[input.animal.species];
      const processed = await processAll(
        files.map((file, index) => ({
          buffer: file.buffer,
          position: index,
          alt: input.photoAlts?.[index] || `Foto ${index + 1} de ${label}`,
        })),
      );

      const notice = await db().transaction(async (tx) => {
        const now = new Date();
        const [created] = await tx
          .insert(notices)
          .values({
            type: input.type,
            name: input.animal.name || null,
            species: input.animal.species,
            size: input.animal.size,
            coatColors: input.animal.coatColors,
            sex: input.animal.sex,
            distinctiveMarks: input.animal.distinctiveMarks || null,
            hasMicrochip: input.animal.hasMicrochip,
            neighborhood: input.neighborhood,
            eventDate: input.eventDate,
            description: input.description || null,
            ownerId: req.session.userId!,
            consentAcceptedAt: now,
            consentPolicyVersion: PRIVACY_POLICY_VERSION,
          })
          .returning();
        await tx.insert(images).values(imageRows(created!.id, 'public', processed));
        await tx
          .insert(noticeEvents)
          .values({ noticeId: created!.id, at: now, status: 'open', note: 'Aviso publicado.' });
        return created!;
      });
      res.status(201).json(await ownerView(notice));
    },
  );

  router.patch('/notices/:id', requireUser, async (req, res) => {
    const current = await loadOwnedNotice(uuidParam(req.params.id), req.session.userId);
    const input = parse(noticeUpdateSchema, req.body);
    const [updated] = await db()
      .update(notices)
      .set({
        type: input.type,
        name: input.animal.name || null,
        species: input.animal.species,
        size: input.animal.size,
        coatColors: input.animal.coatColors,
        sex: input.animal.sex,
        distinctiveMarks: input.animal.distinctiveMarks || null,
        hasMicrochip: input.animal.hasMicrochip,
        neighborhood: input.neighborhood,
        eventDate: input.eventDate,
        description: input.description || null,
        lastActivityAt: new Date(),
      })
      .where(eq(notices.id, current.id))
      .returning();
    res.json(await ownerView(updated!));
  });

  router.post('/notices/:id/status', requireUser, async (req, res) => {
    const current = await loadOwnedNotice(uuidParam(req.params.id), req.session.userId);
    const input = parse(statusUpdateSchema, req.body);
    const changed = input.status !== current.status;
    if (!changed && !input.note) {
      throw new HttpError(400, 'Mude a situação ou escreva uma atualização.', {
        note: 'Mude a situação ou escreva uma atualização.',
      });
    }
    const now = new Date();
    const updated = await db().transaction(async (tx) => {
      await tx.insert(noticeEvents).values({
        noticeId: current.id,
        at: now,
        status: changed ? input.status : null,
        note: input.note || (changed ? `Situação: ${NOTICE_STATUS_LABELS[input.status]}.` : null),
      });
      const [row] = await tx
        .update(notices)
        .set({
          status: input.status,
          // Moving between closed and reunited keeps the original date, so retention still counts
          // from the first close (PRV-07).
          closedAt: input.status === 'open' ? null : (current.closedAt ?? now),
          lastActivityAt: now,
        })
        .where(eq(notices.id, current.id))
        .returning();
      return row!;
    });
    res.json(await ownerView(updated));
  });

  router.delete('/notices/:id', requireUser, async (req, res) => {
    const notice = await loadOwnedNotice(uuidParam(req.params.id), req.session.userId);
    // Cascades to events, sightings and images.
    await db().delete(notices).where(eq(notices.id, notice.id));
    res.status(204).end();
  });

  return router;
}
