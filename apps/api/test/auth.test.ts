import request from 'supertest';
import { count, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { setRole } from '../src/admin/roles.ts';
import { db } from '../src/db/client.ts';
import { images, notices, sessions, users } from '../src/db/schema.ts';
import { createNotice, makeApp, signUp } from './helpers.ts';

describe('auth and account (FR-16, PRV-03, PRV-04, PRV-07)', () => {
  it('requires consent to sign up', async () => {
    const res = await request(makeApp()).post('/api/auth/sign-up').send({
      displayName: 'Ana',
      email: 'ana@exemplo.test',
      password: 'senha-de-teste',
      consent: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.fields.consent).toBeTruthy();
  });

  it('signs up, keeps the session and signs out', async () => {
    const agent = request.agent(makeApp());
    const user = await signUp(agent);
    expect(user.role).toBe('owner');
    const me = await agent.get('/api/auth/me');
    expect(me.body.user).toMatchObject({ id: user.id, email: 'ana@exemplo.test' });
    expect(Object.keys(me.body.user).sort()).toEqual(['displayName', 'email', 'id', 'role']);
    expect((await agent.post('/api/auth/sign-out')).status).toBe(204);
    expect((await agent.get('/api/auth/me')).body.user).toBeNull();
  });

  it('sets an httpOnly SameSite=Lax session cookie', async () => {
    const res = await request(makeApp()).post('/api/auth/sign-up').send({
      displayName: 'Ana',
      email: 'ana@exemplo.test',
      password: 'senha-de-teste',
      consent: true,
    });
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/petsearch\.sid=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('rejects duplicate emails', async () => {
    const app = makeApp();
    await signUp(request.agent(app));
    const res = await request(app).post('/api/auth/sign-up').send({
      displayName: 'Ana',
      email: 'ANA@exemplo.test',
      password: 'senha-de-teste',
      consent: true,
    });
    expect(res.status).toBe(409);
  });

  it('answers 409, not 500, to simultaneous sign-ups with the same email (FR-16)', async () => {
    const app = makeApp();
    const body = {
      displayName: 'Ana',
      email: 'ana@exemplo.test',
      password: 'senha-de-teste',
      consent: true,
    };
    const results = await Promise.all(
      [1, 2, 3].map(() => request(app).post('/api/auth/sign-up').send(body)),
    );
    expect(results.map((res) => res.status).sort()).toEqual([201, 409, 409]);
  });

  it('signs in with the right password only', async () => {
    const app = makeApp();
    await signUp(request.agent(app));
    const wrong = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'ana@exemplo.test', password: 'errada-123' });
    expect(wrong.status).toBe(401);
    const unknown = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'ninguem@exemplo.test', password: 'errada-123' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error).toBe(wrong.body.error);
    const ok = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'ana@exemplo.test', password: 'senha-de-teste' });
    expect(ok.status).toBe(200);
  });

  it('never grants the moderator role at sign-up (FR-17)', async () => {
    const agent = request.agent(makeApp());
    const user = await signUp(agent, 'mod@exemplo.test');
    expect(user.role).toBe('owner');
    expect((await agent.get('/api/moderation/items')).status).toBe(403);
  });

  it('lets an operator grant and revoke the moderator role (FR-17)', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent, 'mod@exemplo.test');
    expect(await setRole(' MOD@exemplo.test ', 'moderator')).toBe(true);
    expect((await agent.get('/api/auth/me')).body.user.role).toBe('moderator');
    expect(await setRole('mod@exemplo.test', 'owner')).toBe(true);
    expect((await agent.get('/api/moderation/items')).status).toBe(403);
    expect(await setRole('ninguem@exemplo.test', 'moderator')).toBe(false);
  });

  it('rate limits sign-in attempts', async () => {
    const app = makeApp({ auth: 2, sightings: 5 });
    const attempt = () =>
      request(app).post('/api/auth/sign-in').send({ email: 'x@exemplo.test', password: 'x' });
    await attempt();
    await attempt();
    expect((await attempt()).status).toBe(429);
  });

  it('blocks cross-origin writes', async () => {
    const res = await request(makeApp())
      .post('/api/auth/sign-in')
      .set('Origin', 'https://evil.example')
      .send({ email: 'ana@exemplo.test', password: 'senha-de-teste' });
    expect(res.status).toBe(403);
  });

  it('deletes the account with its notices and images (PRV-07)', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    await createNotice(agent);
    expect((await agent.delete('/api/account')).status).toBe(204);
    const [n] = await db().select({ n: count() }).from(notices);
    const [i] = await db().select({ n: count() }).from(images);
    expect(n!.n).toBe(0);
    expect(i!.n).toBe(0);
    expect((await agent.get('/api/auth/me')).body.user).toBeNull();
  });

  it('ends the account sessions on other devices when it is deleted (PRV-07)', async () => {
    const app = makeApp();
    const phone = request.agent(app);
    const laptop = request.agent(app);
    await signUp(phone);
    await laptop
      .post('/api/auth/sign-in')
      .send({ email: 'ana@exemplo.test', password: 'senha-de-teste' });
    await signUp(request.agent(app), 'bia@exemplo.test');
    expect((await phone.delete('/api/account')).status).toBe(204);
    const [s] = await db().select({ n: count() }).from(sessions);
    expect(s!.n).toBe(1);
    expect((await laptop.get('/api/auth/me')).body.user).toBeNull();
  });

  it('treats a session whose user no longer exists as signed out (PRV-04)', async () => {
    const agent = request.agent(makeApp());
    const user = await signUp(agent);
    await db().delete(users).where(eq(users.id, user.id));
    expect((await agent.get('/api/me/notices')).status).toBe(401);
    expect((await agent.get('/api/auth/me')).body.user).toBeNull();
  });

  it('requires a session to delete an account', async () => {
    expect((await request(makeApp()).delete('/api/account')).status).toBe(401);
  });
});
