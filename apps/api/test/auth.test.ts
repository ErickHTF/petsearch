import request from 'supertest';
import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '../src/db/client.ts';
import { images, notices } from '../src/db/schema.ts';
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

  it('grants the moderator role to configured emails', async () => {
    const user = await signUp(request.agent(makeApp()), 'mod@exemplo.test');
    expect(user.role).toBe('moderator');
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

  it('requires a session to delete an account', async () => {
    expect((await request(makeApp()).delete('/api/account')).status).toBe(401);
  });
});
