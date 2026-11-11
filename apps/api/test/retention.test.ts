import request from 'supertest';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { db } from '../src/db/client.ts';
import { notices } from '../src/db/schema.ts';
import { purgeExpired } from '../src/lib/retention.ts';
import { createNotice, makeApp, signUp } from './helpers.ts';

describe('retention (PRV-07)', () => {
  it('deletes notices closed more than 90 days ago and keeps the rest', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const old = await createNotice(agent);
    const recent = await createNotice(agent);
    const open = await createNotice(agent);
    await agent.post(`/api/notices/${old.id}/status`).send({ status: 'reunited' });
    await agent.post(`/api/notices/${recent.id}/status`).send({ status: 'closed' });
    await db()
      .update(notices)
      .set({ closedAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000) })
      .where(eq(notices.id, old.id));

    expect(await purgeExpired()).toBe(1);
    const remaining = (await db().select({ id: notices.id }).from(notices)).map((n) => n.id);
    expect(remaining.sort()).toEqual([recent.id, open.id].sort());
  });

  it('counts from the first close when a notice moves from closed to reunited', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const notice = await createNotice(agent);
    await agent.post(`/api/notices/${notice.id}/status`).send({ status: 'closed' });
    const firstClose = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
    await db().update(notices).set({ closedAt: firstClose }).where(eq(notices.id, notice.id));
    await agent.post(`/api/notices/${notice.id}/status`).send({ status: 'reunited' });

    expect(await purgeExpired()).toBe(1);
  });

  it('clears the close date when a notice is reopened', async () => {
    const agent = request.agent(makeApp());
    await signUp(agent);
    const notice = await createNotice(agent);
    await agent.post(`/api/notices/${notice.id}/status`).send({ status: 'closed' });
    await agent.post(`/api/notices/${notice.id}/status`).send({ status: 'open' });
    const [row] = await db().select().from(notices).where(eq(notices.id, notice.id));
    expect(row!.closedAt).toBeNull();
  });
});
