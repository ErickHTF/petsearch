import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { seed } from '../src/seed/seed.ts';
import { SEED_NOTICES } from '../src/seed/data.ts';
import { makeApp, signUp } from './helpers.ts';

describe('fictional seed (FR-21, PRV-06)', () => {
  it('creates only fictional notices with images and can run twice', async () => {
    const app = makeApp();
    const real = request.agent(app);
    await signUp(real, 'real@exemplo.org');

    await seed('senha-de-teste');
    await seed('senha-de-teste');

    const list = await request(app).get('/api/notices');
    expect(list.body.total).toBe(SEED_NOTICES.length);
    for (const notice of list.body.items) {
      expect(notice.isFictional).toBe(true);
      expect(notice.photos).toHaveLength(1);
    }
    const luna = list.body.items.find(
      (n: { animal: { name?: string } }) => n.animal.name === 'Luna',
    );
    expect(luna).toMatchObject({
      neighborhood: 'centro',
      status: 'open',
      animal: { size: 'medium' },
    });
    expect((await real.get('/api/auth/me')).body.user.email).toBe('real@exemplo.org');

    const moderator = request.agent(app);
    const signIn = await moderator
      .post('/api/auth/sign-in')
      .send({ email: 'moderacao.demo@exemplo.test', password: 'senha-de-teste' });
    expect(signIn.body.role).toBe('moderator');
  });
});
