import sharp from 'sharp';
import request from 'supertest';
import type { NoticeInput, OwnerNotice } from '@petsearch/shared';
import { setRole } from '../src/admin/roles.ts';
import { createApp } from '../src/app.ts';

export function makeApp(rateLimits = { auth: 1000, sightings: 1000 }) {
  return createApp({
    sessionSecret: 'test-secret',
    cookieSecure: false,
    rateLimits,
  });
}

export type Agent = ReturnType<typeof request.agent>;

export async function signUp(agent: Agent, email = 'ana@exemplo.test') {
  const res = await agent
    .post('/api/auth/sign-up')
    .send({ displayName: 'Ana (fictícia)', email, password: 'senha-de-teste', consent: true });
  if (res.status !== 201)
    throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as { id: string; role: string };
}

/** Signs up and then grants the role the way an operator would (FR-17). */
export async function signUpModerator(agent: Agent, email = 'mod@exemplo.test') {
  const user = await signUp(agent, email);
  await setRole(email, 'moderator');
  return user;
}

/** A generated test image (no real photo). `exif` embeds metadata to prove it gets stripped. */
export async function testJpeg({ width = 2000, height = 1500, exif = false } = {}) {
  let image = sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 150, b: 90 } },
  }).jpeg();
  if (exif) {
    image = image.withExif({
      IFD0: { Copyright: 'Teste de metadados', Artist: 'Pessoa Ficticia' },
    });
  }
  return image.toBuffer();
}

export const luna: NoticeInput = {
  type: 'lost',
  animal: {
    name: 'Luna',
    species: 'dog',
    size: 'medium',
    coatColors: ['caramel'],
    sex: 'female',
    hasMicrochip: 'unknown',
  },
  neighborhood: 'centro',
  eventDate: '2026-11-01',
  description: 'Exemplo fictício. Cadela dócil com coleira vermelha.',
  consent: true,
};

export async function createNotice(
  agent: Agent,
  input: Omit<Partial<NoticeInput>, 'animal'> & { animal?: Partial<NoticeInput['animal']> } = {},
  photos?: Buffer[],
) {
  const body = { ...luna, ...input, animal: { ...luna.animal, ...input.animal } };
  let req = agent.post('/api/notices').field('data', JSON.stringify(body));
  for (const [index, photo] of (photos ?? [await testJpeg()]).entries()) {
    req = req.attach('photos', photo, { filename: `foto${index}.jpg`, contentType: 'image/jpeg' });
  }
  const res = await req;
  if (res.status !== 201)
    throw new Error(`create failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as OwnerNotice;
}

export function sendSighting(
  agent: Agent,
  noticeId: string,
  data: Record<string, unknown> = {},
  photo?: Buffer,
) {
  let req = agent.post(`/api/notices/${noticeId}/sightings`).field(
    'data',
    JSON.stringify({
      kind: 'sighting',
      seenAt: '2026-11-02',
      neighborhood: 'centro',
      description: 'Vi um cachorro caramelo perto da escola.',
      consent: true,
      ...data,
    }),
  );
  if (photo) req = req.attach('photo', photo, { filename: 'p.jpg', contentType: 'image/jpeg' });
  return req;
}
