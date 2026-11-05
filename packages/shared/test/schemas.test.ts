import { describe, expect, it } from 'vitest';
import {
  noticeFiltersSchema,
  noticeInputSchema,
  sightingInputSchema,
  signUpSchema,
  statusUpdateSchema,
  todayIso,
} from '../src/schemas.ts';

const validNotice = {
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
  description: 'Exemplo fictício.',
  consent: true,
};

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('noticeInputSchema (FR-01 to FR-06, PRV-02, PRV-03)', () => {
  it('accepts a valid notice', () => {
    expect(noticeInputSchema.safeParse(validNotice).success).toBe(true);
  });

  it('requires consent', () => {
    const result = noticeInputSchema.safeParse({ ...validNotice, consent: false });
    expect(issuePaths(result)).toContain('consent');
  });

  it('rejects a neighborhood outside the list (FR-04)', () => {
    const result = noticeInputSchema.safeParse({ ...validNotice, neighborhood: 'rua-x-123' });
    expect(issuePaths(result)).toContain('neighborhood');
  });

  it('rejects future dates (FR-05)', () => {
    const result = noticeInputSchema.safeParse({ ...validNotice, eventDate: '2999-01-01' });
    expect(issuePaths(result)).toContain('eventDate');
  });

  it('accepts today', () => {
    expect(noticeInputSchema.safeParse({ ...validNotice, eventDate: todayIso() }).success).toBe(
      true,
    );
  });

  it('requires 1 to 3 coat colors (FR-03)', () => {
    const none = { ...validNotice, animal: { ...validNotice.animal, coatColors: [] } };
    const four = {
      ...validNotice,
      animal: { ...validNotice.animal, coatColors: ['black', 'white', 'brown', 'gray'] },
    };
    expect(issuePaths(noticeInputSchema.safeParse(none))).toContain('animal.coatColors');
    expect(issuePaths(noticeInputSchema.safeParse(four))).toContain('animal.coatColors');
  });

  it('rejects phone numbers in the description (PRV-01)', () => {
    const result = noticeInputSchema.safeParse({
      ...validNotice,
      description: 'Ligue 19 99876-5432',
    });
    expect(issuePaths(result)).toContain('description');
  });

  it('rejects unknown types (FR-15)', () => {
    expect(noticeInputSchema.safeParse({ ...validNotice, type: 'adoption' }).success).toBe(false);
  });
});

describe('statusUpdateSchema (FR-06, FR-14)', () => {
  it('accepts known statuses only', () => {
    expect(statusUpdateSchema.safeParse({ status: 'reunited' }).success).toBe(true);
    expect(statusUpdateSchema.safeParse({ status: 'deleted' }).success).toBe(false);
  });
});

describe('sightingInputSchema (FR-12, PRV-03)', () => {
  const sighting = {
    kind: 'sighting',
    seenAt: '2026-11-02',
    neighborhood: 'centro',
    description: 'Vi um cachorro caramelo perto da escola.',
    consent: true,
  };

  it('accepts a sighting', () => {
    expect(sightingInputSchema.safeParse(sighting).success).toBe(true);
  });

  it('requires date and neighborhood for sightings but not for messages', () => {
    const bare = { kind: 'sighting', description: 'Vi', consent: true };
    expect(issuePaths(sightingInputSchema.safeParse(bare))).toEqual(['seenAt', 'neighborhood']);
    expect(sightingInputSchema.safeParse({ ...bare, kind: 'message' }).success).toBe(true);
  });

  it('requires consent to share a contact', () => {
    const result = sightingInputSchema.safeParse({ ...sighting, contactValue: '19 99999-0000' });
    expect(issuePaths(result)).toContain('contactConsent');
  });
});

describe('signUpSchema (FR-16)', () => {
  it('normalizes email and enforces password length', () => {
    const ok = signUpSchema.parse({
      displayName: 'Ana',
      email: ' Ana@Exemplo.com ',
      password: '12345678',
      consent: true,
    });
    expect(ok.email).toBe('ana@exemplo.com');
    const short = signUpSchema.safeParse({ ...ok, password: '123' });
    expect(issuePaths(short)).toContain('password');
  });
});

describe('noticeFiltersSchema (FR-08 to FR-10)', () => {
  it('coerces page and defaults to 1', () => {
    expect(noticeFiltersSchema.parse({}).page).toBe(1);
    expect(noticeFiltersSchema.parse({ page: '3' }).page).toBe(3);
  });

  it('rejects unknown filter values', () => {
    expect(noticeFiltersSchema.safeParse({ species: 'dragon' }).success).toBe(false);
  });
});
