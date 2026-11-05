// Resets and inserts the fictional demo data. Real accounts are never touched: only users on the
// reserved demo domain are deleted (their notices cascade).
import argon2 from 'argon2';
import sharp from 'sharp';
import { like } from 'drizzle-orm';
import { PRIVACY_POLICY_VERSION, type CoatColor } from '@petsearch/shared';
import { db } from '../db/client.ts';
import { images, noticeEvents, notices, users } from '../db/schema.ts';
import { processImage } from '../lib/images.ts';
import {
  DEMO_DOMAIN,
  DEMO_MODERATOR_EMAIL,
  DEMO_OWNER_EMAIL,
  SEED_NOTICES,
  type SeedNotice,
} from './data.ts';

const COLOR_HEX: Record<CoatColor, string> = {
  black: '#2b2b2b',
  white: '#f1f1f1',
  brown: '#7b4b2a',
  caramel: '#c8965a',
  golden: '#d9a441',
  gray: '#8d8d8d',
  brindle: '#6b5136',
  spotted: '#d8d2c8',
  orange: '#e07b2e',
  tricolor: '#c98b4b',
};

/** Generated illustration (no photo, no license needed): a paw print over the coat color. */
export async function illustration(colors: CoatColor[]): Promise<Buffer> {
  const [first = 'gray', second] = colors;
  const background = COLOR_HEX[first];
  const accent = second ? COLOR_HEX[second] : undefined;
  const dark = ['black', 'brown', 'brindle', 'gray'].includes(first);
  const paw = dark ? '#ffffff' : '#1f3864';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="${background}"/>
    ${accent ? `<rect x="560" width="240" height="600" fill="${accent}"/>` : ''}
    <g fill="${paw}" opacity="0.85">
      <ellipse cx="400" cy="360" rx="95" ry="80"/>
      <ellipse cx="290" cy="250" rx="38" ry="50"/>
      <ellipse cx="360" cy="200" rx="38" ry="52"/>
      <ellipse cx="440" cy="200" rx="38" ry="52"/>
      <ellipse cx="510" cy="250" rx="38" ry="50"/>
    </g>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function insertNotice(ownerId: string, seed: SeedNotice) {
  const image = await processImage(await illustration(seed.animal.coatColors));
  const now = new Date();
  await db().transaction(async (tx) => {
    const [notice] = await tx
      .insert(notices)
      .values({
        type: seed.type,
        name: seed.animal.name ?? null,
        species: seed.animal.species,
        size: seed.animal.size,
        coatColors: seed.animal.coatColors,
        sex: seed.animal.sex,
        distinctiveMarks: seed.animal.distinctiveMarks ?? null,
        hasMicrochip: seed.animal.hasMicrochip,
        neighborhood: seed.neighborhood,
        eventDate: seed.eventDate,
        description: seed.description ?? null,
        isFictional: true,
        ownerId,
        consentAcceptedAt: now,
        consentPolicyVersion: PRIVACY_POLICY_VERSION,
      })
      .returning({ id: notices.id });
    await tx.insert(images).values({
      noticeId: notice!.id,
      visibility: 'public',
      position: 0,
      alt: seed.alt,
      width: image.width,
      height: image.height,
      content: image.data,
    });
    await tx.insert(noticeEvents).values({
      noticeId: notice!.id,
      at: now,
      status: 'open',
      note: 'Aviso publicado (exemplo fictício).',
    });
  });
}

export async function seed(password: string) {
  await db()
    .delete(users)
    .where(like(users.email, `%@${DEMO_DOMAIN}`));
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const consent = { consentAcceptedAt: new Date(), consentPolicyVersion: PRIVACY_POLICY_VERSION };
  const [owner] = await db()
    .insert(users)
    .values([
      { email: DEMO_OWNER_EMAIL, displayName: 'Tutora (exemplo)', passwordHash, ...consent },
      {
        email: DEMO_MODERATOR_EMAIL,
        displayName: 'Moderação (exemplo)',
        role: 'moderator' as const,
        passwordHash,
        ...consent,
      },
    ])
    .returning({ id: users.id });
  for (const notice of SEED_NOTICES) await insertNotice(owner!.id, notice);
  return { notices: SEED_NOTICES.length, accounts: [DEMO_OWNER_EMAIL, DEMO_MODERATOR_EMAIL] };
}
