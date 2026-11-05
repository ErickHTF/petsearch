// Validation shared by web forms and API routes. Error messages are user-facing (pt-BR).
import { z } from 'zod';
import {
  COAT_COLORS,
  MICROCHIP_OPTIONS,
  MODERATION_ACTIONS,
  NOTICE_STATUSES,
  NOTICE_TYPES,
  SEXES,
  SIGHTING_KINDS,
  SIGHTING_OWNER_STATES,
  SIZES,
  SPECIES,
} from './enums.ts';
import { NEIGHBORHOOD_SLUGS } from './neighborhoods.ts';
import { findSensitiveText, sensitiveTextMessage } from './text-guard.ts';

export const LIMITS = {
  nameMax: 40,
  marksMax: 300,
  descriptionMax: 1000,
  noteMax: 300,
  sightingMax: 500,
  contactMax: 80,
  photosMax: 3,
  passwordMin: 8,
  passwordMax: 128,
  reasonMax: 200,
} as const;

/** Today as YYYY-MM-DD in Indaiatuba's time zone. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(now);
}

function safeText(max: number, { required = false } = {}) {
  let schema = z
    .string()
    .trim()
    .max(max, { error: `Use no máximo ${max} caracteres.` });
  if (required) schema = schema.min(1, { error: 'Preencha este campo.' });
  return schema.superRefine((value, ctx) => {
    const kinds = findSensitiveText(value);
    if (kinds.length) ctx.addIssue({ code: 'custom', message: sensitiveTextMessage(kinds) });
  });
}

const isoDate = z
  .string({ error: 'Informe a data.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'Informe a data.' })
  .refine((value) => !Number.isNaN(Date.parse(value)), { error: 'Data inválida.' })
  .refine((value) => value <= todayIso(), { error: 'A data não pode estar no futuro.' });

const neighborhood = z.enum(NEIGHBORHOOD_SLUGS, { error: 'Escolha o bairro.' });

const emailField = z
  .string({ error: 'Informe um e-mail válido.' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Informe um e-mail válido.' }));

const consent = z.literal(true, {
  error: 'É preciso autorizar o uso dos dados para continuar.',
});

export const animalSchema = z.object({
  name: safeText(LIMITS.nameMax).optional(),
  species: z.enum(SPECIES, { error: 'Escolha a espécie.' }),
  size: z.enum(SIZES, { error: 'Escolha o porte.' }),
  coatColors: z
    .array(z.enum(COAT_COLORS))
    .min(1, { error: 'Escolha pelo menos uma cor.' })
    .max(3, { error: 'Escolha no máximo 3 cores.' }),
  sex: z.enum(SEXES, { error: 'Escolha o sexo.' }),
  distinctiveMarks: safeText(LIMITS.marksMax).optional(),
  hasMicrochip: z.enum(MICROCHIP_OPTIONS, { error: 'Informe se tem microchip.' }),
});

export const noticeInputSchema = z.object({
  type: z.enum(NOTICE_TYPES, { error: 'Escolha o tipo de aviso.' }),
  animal: animalSchema,
  neighborhood,
  eventDate: isoDate,
  description: safeText(LIMITS.descriptionMax).optional(),
  photoAlts: z.array(safeText(120)).max(LIMITS.photosMax).optional(),
  consent,
});
export type NoticeInput = z.infer<typeof noticeInputSchema>;

/** Editing keeps consent and photos as they are. */
export const noticeUpdateSchema = noticeInputSchema.omit({ consent: true, photoAlts: true });
export type NoticeUpdate = z.infer<typeof noticeUpdateSchema>;

export const statusUpdateSchema = z.object({
  status: z.enum(NOTICE_STATUSES, { error: 'Escolha a situação.' }),
  note: safeText(LIMITS.noteMax).optional(),
});
export type StatusUpdate = z.infer<typeof statusUpdateSchema>;

export const sightingInputSchema = z
  .object({
    kind: z.enum(SIGHTING_KINDS, { error: 'Escolha o tipo.' }),
    seenAt: isoDate.optional(),
    neighborhood: neighborhood.optional(),
    description: z
      .string()
      .trim()
      .min(1, { error: 'Descreva o que você viu ou sua mensagem.' })
      .max(LIMITS.sightingMax, { error: `Use no máximo ${LIMITS.sightingMax} caracteres.` }),
    contactName: z.string().trim().max(LIMITS.nameMax).optional(),
    contactValue: z.string().trim().max(LIMITS.contactMax).optional(),
    contactConsent: z.boolean().optional(),
    consent,
  })
  .superRefine((value, ctx) => {
    if (value.kind === 'sighting') {
      if (!value.seenAt) {
        ctx.addIssue({ code: 'custom', path: ['seenAt'], message: 'Informe quando viu o animal.' });
      }
      if (!value.neighborhood) {
        ctx.addIssue({ code: 'custom', path: ['neighborhood'], message: 'Escolha o bairro.' });
      }
    }
    if (value.contactValue && !value.contactConsent) {
      ctx.addIssue({
        code: 'custom',
        path: ['contactConsent'],
        message: 'Autorize o envio do seu contato à tutora ou ao tutor.',
      });
    }
  });
export type SightingInput = z.infer<typeof sightingInputSchema>;

export const sightingStateSchema = z.object({ ownerState: z.enum(SIGHTING_OWNER_STATES) });

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Informe como quer ser chamado.' })
    .max(LIMITS.nameMax),
  email: emailField,
  password: z
    .string()
    .min(LIMITS.passwordMin, {
      error: `A senha precisa ter pelo menos ${LIMITS.passwordMin} caracteres.`,
    })
    .max(LIMITS.passwordMax),
  consent,
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: 'Informe a senha.' }).max(LIMITS.passwordMax),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const noticeFiltersSchema = z.object({
  type: z.enum(NOTICE_TYPES).optional(),
  neighborhood: neighborhood.optional(),
  species: z.enum(SPECIES).optional(),
  size: z.enum(SIZES).optional(),
  color: z.enum(COAT_COLORS).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
export type NoticeFilters = z.infer<typeof noticeFiltersSchema>;

export const moderationActionSchema = z.object({
  action: z.enum(MODERATION_ACTIONS),
  reason: z.string().trim().min(3, { error: 'Informe o motivo.' }).max(LIMITS.reasonMax),
});
export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
