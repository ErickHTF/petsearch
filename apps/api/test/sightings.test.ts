import request from 'supertest';
import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '../src/db/client.ts';
import { sightings } from '../src/db/schema.ts';
import { createNotice, makeApp, sendSighting, signUp, testJpeg } from './helpers.ts';

async function setup() {
  const app = makeApp();
  const owner = request.agent(app);
  await signUp(owner);
  const notice = await createNotice(owner);
  return { app, owner, notice };
}

describe('sightings and messages (FR-12, FR-13, PRV-01, PRV-09, PRV-12)', () => {
  it('accepts an anonymous sighting and shows it only in the owner inbox', async () => {
    const { app, owner, notice } = await setup();
    const res = await sendSighting(request(app), notice.id);
    expect(res.status).toBe(201);

    const detail = await request(app).get(`/api/notices/${notice.id}`);
    expect(JSON.stringify(detail.body)).not.toContain('escola');

    const mine = await owner.get('/api/me/notices');
    expect(mine.body[0].newSightings).toBe(1);
    const inbox = await owner.get(`/api/me/notices/${notice.id}/sightings`);
    expect(inbox.body).toHaveLength(1);
    expect(inbox.body[0]).toMatchObject({
      kind: 'sighting',
      neighborhood: 'centro',
      ownerState: 'new',
    });
    expect(inbox.body[0].contact).toBeUndefined();
  });

  it('keeps the reporter contact only with consent', async () => {
    const { app, owner, notice } = await setup();
    expect(
      (await sendSighting(request(app), notice.id, { contactValue: '19 99999-0000' })).status,
    ).toBe(400);
    await sendSighting(request(app), notice.id, {
      contactName: 'Pessoa fictícia',
      contactValue: '19 99999-0000',
      contactConsent: true,
    });
    const inbox = await owner.get(`/api/me/notices/${notice.id}/sightings`);
    expect(inbox.body[0].contact).toEqual({ name: 'Pessoa fictícia', value: '19 99999-0000' });
  });

  it('accepts messages without date or neighborhood', async () => {
    const { app, notice } = await setup();
    const res = await sendSighting(request(app), notice.id, {
      kind: 'message',
      seenAt: undefined,
      neighborhood: undefined,
      description: 'Acho que vi um anúncio parecido em outro bairro.',
    });
    expect(res.status).toBe(201);
  });

  it('silently drops honeypot submissions', async () => {
    const { app, notice } = await setup();
    const res = await sendSighting(request(app), notice.id, { website: 'http://spam.example' });
    expect(res.status).toBe(201);
    const [row] = await db().select({ n: count() }).from(sightings);
    expect(row!.n).toBe(0);
  });

  it('refuses sightings on notices that are not open', async () => {
    const { app, owner, notice } = await setup();
    await owner.post(`/api/notices/${notice.id}/status`).send({ status: 'closed' });
    expect((await sendSighting(request(app), notice.id)).status).toBe(409);
  });

  it('rate limits sightings per notice', async () => {
    const app = makeApp({ sightings: 2 });
    const owner = request.agent(app);
    await signUp(owner);
    const notice = await createNotice(owner);
    await sendSighting(request(app), notice.id);
    await sendSighting(request(app), notice.id);
    expect((await sendSighting(request(app), notice.id)).status).toBe(429);
  });

  it('keeps sighting photos private to the owner', async () => {
    const { app, owner, notice } = await setup();
    await sendSighting(request(app), notice.id, {}, await testJpeg({ width: 300, height: 200 }));
    const [sighting] = (await owner.get(`/api/me/notices/${notice.id}/sightings`)).body;
    expect(sighting.photoId).toBeTruthy();

    expect((await request(app).get(`/api/images/${sighting.photoId}`)).status).toBe(404);
    const stranger = request.agent(app);
    await signUp(stranger, 'bia@exemplo.test');
    expect((await stranger.get(`/api/images/${sighting.photoId}`)).status).toBe(404);
    const own = await owner.get(`/api/images/${sighting.photoId}`);
    expect(own.status).toBe(200);
    expect(own.headers['cache-control']).toBe('private, no-store');

    const detail = await request(app).get(`/api/notices/${notice.id}`);
    expect(detail.body.photos.map((p: { id: string }) => p.id)).not.toContain(sighting.photoId);
  });

  it('lets only the owner mark sightings', async () => {
    const { app, owner, notice } = await setup();
    await sendSighting(request(app), notice.id);
    const [sighting] = (await owner.get(`/api/me/notices/${notice.id}/sightings`)).body;
    const stranger = request.agent(app);
    await signUp(stranger, 'bia@exemplo.test');
    expect(
      (await stranger.patch(`/api/me/sightings/${sighting.id}`).send({ ownerState: 'useful' }))
        .status,
    ).toBe(404);
    const res = await owner
      .patch(`/api/me/sightings/${sighting.id}`)
      .send({ ownerState: 'useful' });
    expect(res.body.ownerState).toBe('useful');
    expect((await owner.get('/api/me/notices')).body[0].newSightings).toBe(0);
  });
});
