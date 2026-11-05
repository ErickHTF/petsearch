import request from 'supertest';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { createNotice, luna, makeApp, signUp, testJpeg } from './helpers.ts';

const PUBLIC_KEYS = [
  'animal',
  'createdAt',
  'description',
  'eventDate',
  'id',
  'isFictional',
  'neighborhood',
  'photos',
  'status',
  'timeline',
  'type',
  'updatedAt',
];

describe('publishing notices (FR-01 to FR-06, PRV-03, PRV-08)', () => {
  it('requires a session', async () => {
    const res = await request(makeApp()).post('/api/notices').field('data', JSON.stringify(luna));
    expect(res.status).toBe(401);
  });

  it('requires at least one photo', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const res = await agent.post('/api/notices').field('data', JSON.stringify(luna));
    expect(res.status).toBe(400);
    expect(res.body.fields.photos).toBeTruthy();
  });

  it('rejects more than 3 photos', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const photo = await testJpeg({ width: 50, height: 50 });
    let req = agent.post('/api/notices').field('data', JSON.stringify(luna));
    for (let i = 0; i < 4; i++) req = req.attach('photos', photo, `f${i}.jpg`);
    expect((await req).status).toBe(400);
  });

  it('rejects non-image files', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const res = await agent
      .post('/api/notices')
      .field('data', JSON.stringify(luna))
      .attach('photos', Buffer.from('not an image'), {
        filename: 'x.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
  });

  it('rejects contact data in free text', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const res = await agent
      .post('/api/notices')
      .field('data', JSON.stringify({ ...luna, description: 'Ligue (19) 99876-5432' }))
      .attach('photos', await testJpeg(), 'f.jpg');
    expect(res.status).toBe(400);
    expect(res.body.fields.description).toMatch(/telefone/);
  });

  it('creates a notice with resized photos and stripped metadata', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const original = await testJpeg({ exif: true });
    expect((await sharp(original).metadata()).exif).toBeDefined();

    const notice = await createNotice(agent, {}, [original]);
    expect(notice.status).toBe('open');
    expect(notice.timeline).toHaveLength(1);
    expect(notice.photos).toHaveLength(1);
    expect(notice.photos[0]).toMatchObject({ width: 1280, height: 960, alt: 'Foto 1 de Luna' });

    const image = await request(makeApp()).get(`/api/images/${notice.photos[0]!.id}`);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toBe('image/webp');
    const meta = await sharp(image.body as Buffer).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.exif).toBeUndefined();
  });
});

describe('public list and detail (FR-07 to FR-11, PRV-01)', () => {
  it('exposes only allowlisted fields and never the owner', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await signUp(agent);
    const created = await createNotice(agent);

    const detail = await request(app).get(`/api/notices/${created.id}`);
    expect(detail.status).toBe(200);
    expect(Object.keys(detail.body).sort()).toEqual(PUBLIC_KEYS);
    expect(Object.keys(detail.body.animal).sort()).toEqual([
      'coatColors',
      'hasMicrochip',
      'name',
      'sex',
      'size',
      'species',
    ]);
    const text = JSON.stringify(detail.body);
    expect(text).not.toContain('ana@exemplo.test');
    expect(text).not.toMatch(/owner|consent|hidden/i);

    const list = await request(app).get('/api/notices');
    expect(list.body.total).toBe(1);
    expect(Object.keys(list.body.items[0]).sort()).toEqual(PUBLIC_KEYS);
  });

  it('filters by neighborhood, date, type and characteristics', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await signUp(agent);
    await createNotice(agent); // Luna: centro, 2026-11-01, dog, medium, caramel, lost
    await createNotice(agent, {
      type: 'found',
      neighborhood: 'vila-furlan',
      eventDate: '2026-10-20',
      animal: { name: 'Tom', species: 'cat', size: 'small', coatColors: ['black', 'white'] },
    });

    const names = async (query: string) =>
      (await request(app).get(`/api/notices?${query}`)).body.items.map(
        (n: { animal: { name: string } }) => n.animal.name,
      );

    expect(await names('')).toEqual(['Luna', 'Tom']);
    expect(await names('neighborhood=vila-furlan')).toEqual(['Tom']);
    expect(await names('species=dog')).toEqual(['Luna']);
    expect(await names('size=small')).toEqual(['Tom']);
    expect(await names('color=white')).toEqual(['Tom']);
    expect(await names('type=found')).toEqual(['Tom']);
    expect(await names('from=2026-10-25')).toEqual(['Luna']);
    expect(await names('to=2026-10-25')).toEqual(['Tom']);
    expect(await names('neighborhood=centro&species=cat')).toEqual([]);
    expect((await request(app).get('/api/notices?species=dragon')).status).toBe(400);
  });

  it('returns 404 for unknown or malformed ids', async () => {
    const app = makeApp();
    expect((await request(app).get('/api/notices/not-a-uuid')).status).toBe(404);
    expect(
      (await request(app).get('/api/notices/00000000-0000-4000-8000-000000000000')).status,
    ).toBe(404);
  });
});

describe('owner updates (FR-13, FR-14, PRV-04)', () => {
  it('updates status with a timeline entry and leaves the public list', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await signUp(agent);
    const notice = await createNotice(agent);

    const res = await agent
      .post(`/api/notices/${notice.id}/status`)
      .send({ status: 'reunited', note: 'Luna voltou para casa (exemplo fictício).' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reunited');
    expect(res.body.timeline.at(-1)).toMatchObject({ status: 'reunited' });

    expect((await request(app).get('/api/notices')).body.total).toBe(0);
    expect((await request(app).get(`/api/notices/${notice.id}`)).body.status).toBe('reunited');
  });

  it('accepts a note without a status change but not an empty update', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const notice = await createNotice(agent);
    expect(
      (await agent.post(`/api/notices/${notice.id}/status`).send({ status: 'open' })).status,
    ).toBe(400);
    const res = await agent
      .post(`/api/notices/${notice.id}/status`)
      .send({ status: 'open', note: 'Ainda procurando.' });
    expect(res.body.timeline.at(-1)).toMatchObject({ note: 'Ainda procurando.' });
  });

  it('lets only the owner edit, change status, delete and see own notices', async () => {
    const app = makeApp();
    const owner = request.agent(app);
    await signUp(owner);
    const notice = await createNotice(owner);
    const other = request.agent(app);
    await signUp(other, 'bia@exemplo.test');

    const update = { ...luna, consent: undefined, description: 'Editado.' };
    expect((await other.patch(`/api/notices/${notice.id}`).send(update)).status).toBe(404);
    expect(
      (await other.post(`/api/notices/${notice.id}/status`).send({ status: 'closed' })).status,
    ).toBe(404);
    expect((await other.delete(`/api/notices/${notice.id}`)).status).toBe(404);
    expect((await other.get(`/api/me/notices/${notice.id}`)).status).toBe(404);
    expect((await other.get('/api/me/notices')).body).toEqual([]);

    const edited = await owner.patch(`/api/notices/${notice.id}`).send(update);
    expect(edited.status).toBe(200);
    expect(edited.body.description).toBe('Editado.');
    expect((await owner.get('/api/me/notices')).body).toHaveLength(1);
    expect((await owner.delete(`/api/notices/${notice.id}`)).status).toBe(204);
    expect((await request(app).get(`/api/notices/${notice.id}`)).status).toBe(404);
  });
});
