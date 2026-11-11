import request from 'supertest';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '../src/db/client.ts';
import { moderationActions, users } from '../src/db/schema.ts';
import { createNotice, makeApp, sendSighting, signUp, signUpModerator } from './helpers.ts';

async function setup() {
  const app = makeApp();
  const owner = request.agent(app);
  await signUp(owner);
  const notice = await createNotice(owner);
  const moderator = request.agent(app);
  await signUpModerator(moderator);
  return { app, owner, notice, moderator };
}

describe('moderation (FR-17)', () => {
  it('is restricted to moderators', async () => {
    const { app, owner } = await setup();
    expect((await request(app).get('/api/moderation/items')).status).toBe(401);
    expect((await owner.get('/api/moderation/items')).status).toBe(403);
  });

  it('drops moderation access as soon as the role is revoked (PRV-04)', async () => {
    const { moderator } = await setup();
    expect((await moderator.get('/api/moderation/items')).status).toBe(200);
    await db().update(users).set({ role: 'owner' }).where(eq(users.email, 'mod@exemplo.test'));
    expect((await moderator.get('/api/moderation/items')).status).toBe(403);
  });

  it('hides and restores a notice with an audit log', async () => {
    const { app, owner, notice, moderator } = await setup();
    const hide = await moderator
      .post(`/api/moderation/notice/${notice.id}`)
      .send({ action: 'hide', reason: 'Conteúdo de teste' });
    expect(hide.status).toBe(204);
    expect((await request(app).get(`/api/notices/${notice.id}`)).status).toBe(404);
    expect((await request(app).get('/api/notices')).body.total).toBe(0);
    expect((await request(app).get(`/api/images/${notice.photos[0]!.id}`)).status).toBe(404);
    expect((await owner.get(`/api/me/notices/${notice.id}`)).body.hidden).toBe(true);

    const items = await moderator.get('/api/moderation/items?targetType=notice');
    expect(items.body[0]).toMatchObject({ id: notice.id, hidden: true });

    await moderator
      .post(`/api/moderation/notice/${notice.id}`)
      .send({ action: 'restore', reason: 'Revisado' });
    expect((await request(app).get(`/api/notices/${notice.id}`)).status).toBe(200);

    const log = await db().select().from(moderationActions);
    expect(log.map((entry) => entry.action)).toEqual(['hide', 'restore']);
  });

  it('hides and deletes sightings without exposing the reporter contact', async () => {
    const { app, owner, notice, moderator } = await setup();
    await sendSighting(request(app), notice.id, {
      contactValue: '19 99999-0000',
      contactConsent: true,
    });
    const [item] = (await moderator.get('/api/moderation/items?targetType=sighting')).body;
    expect(item.summary).toContain('[contato informado]');
    expect(item.summary).not.toContain('99999');

    await moderator
      .post(`/api/moderation/sighting/${item.id}`)
      .send({ action: 'hide', reason: 'Spam' });
    expect((await owner.get(`/api/me/notices/${notice.id}/sightings`)).body).toEqual([]);

    const del = await moderator
      .post(`/api/moderation/sighting/${item.id}`)
      .send({ action: 'delete', reason: 'Spam' });
    expect(del.status).toBe(204);
    expect((await moderator.get('/api/moderation/items?targetType=sighting')).body).toEqual([]);
  });

  it('requires a reason and a known target', async () => {
    const { notice, moderator } = await setup();
    expect(
      (await moderator.post(`/api/moderation/notice/${notice.id}`).send({ action: 'hide' })).status,
    ).toBe(400);
    expect(
      (
        await moderator
          .post('/api/moderation/notice/00000000-0000-4000-8000-000000000000')
          .send({ action: 'hide', reason: 'Teste' })
      ).status,
    ).toBe(404);
  });
});
