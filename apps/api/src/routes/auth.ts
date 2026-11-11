// Accounts and sessions (FR-16, PRV-03, PRV-04, PRV-07).
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { Router, type Request, type RequestHandler } from 'express';
import { PRIVACY_POLICY_VERSION, signInSchema, signUpSchema } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { users } from '../db/schema.ts';
import { HttpError, parse } from '../lib/errors.ts';
import { requireUser } from '../lib/auth.ts';
import { toSessionUser } from '../lib/serializers.ts';

export const SESSION_COOKIE = 'petsearch.sid';

// Hash of a throwaway password so sign-in takes similar time for unknown emails.
const dummyHash = argon2.hash('timing-equalizer-not-a-real-password');

function regenerate(req: Request) {
  return new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
}

function destroy(req: Request) {
  return new Promise<void>((resolve, reject) =>
    req.session.destroy((err) => (err ? reject(err) : resolve())),
  );
}

export function authRouter(options: { limiter: RequestHandler }) {
  const router = Router();

  router.post('/auth/sign-up', options.limiter, async (req, res) => {
    const input = parse(signUpSchema, req.body);
    const [existing] = await db()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email));
    if (existing) {
      throw new HttpError(409, 'Este e-mail já está cadastrado.', {
        email: 'Este e-mail já está cadastrado.',
      });
    }
    const [user] = await db()
      .insert(users)
      .values({
        email: input.email,
        passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
        displayName: input.displayName,
        consentAcceptedAt: new Date(),
        consentPolicyVersion: PRIVACY_POLICY_VERSION,
      })
      .returning();
    await regenerate(req);
    req.session.userId = user!.id;
    res.status(201).json(toSessionUser(user!));
  });

  router.post('/auth/sign-in', options.limiter, async (req, res) => {
    const input = parse(signInSchema, req.body);
    const [user] = await db().select().from(users).where(eq(users.email, input.email));
    const valid = user
      ? await argon2.verify(user.passwordHash, input.password)
      : await argon2.verify(await dummyHash, input.password).then(() => false);
    if (!user || !valid) throw new HttpError(401, 'E-mail ou senha incorretos.');
    await regenerate(req);
    req.session.userId = user.id;
    res.json(toSessionUser(user));
  });

  router.post('/auth/sign-out', async (req, res) => {
    await destroy(req);
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
  });

  router.get('/auth/me', async (req, res) => {
    const userId = req.session.userId;
    const [user] = userId ? await db().select().from(users).where(eq(users.id, userId)) : [];
    res.json({ user: user ? toSessionUser(user) : null });
  });

  // Self-service deletion; foreign keys cascade to notices, events, sightings and images (PRV-07).
  router.delete('/account', requireUser, async (req, res) => {
    await db().delete(users).where(eq(users.id, req.session.userId!));
    await destroy(req);
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
  });

  return router;
}
