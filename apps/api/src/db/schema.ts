// PostgreSQL schema (ADR 0001). Deletes cascade from users to notices to events, sightings and
// images, which backs account and notice deletion (PRV-07).
import {
  boolean,
  customType,
  date,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  COAT_COLORS,
  MICROCHIP_OPTIONS,
  MODERATION_ACTIONS,
  MODERATION_TARGETS,
  NOTICE_STATUSES,
  NOTICE_TYPES,
  ROLES,
  SEXES,
  SIGHTING_KINDS,
  SIGHTING_OWNER_STATES,
  SIZES,
  SPECIES,
} from '@petsearch/shared';

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => 'bytea',
});

export const roleEnum = pgEnum('role', ROLES);
export const noticeTypeEnum = pgEnum('notice_type', NOTICE_TYPES);
export const noticeStatusEnum = pgEnum('notice_status', NOTICE_STATUSES);
export const speciesEnum = pgEnum('species', SPECIES);
export const sizeEnum = pgEnum('size', SIZES);
export const coatColorEnum = pgEnum('coat_color', COAT_COLORS);
export const sexEnum = pgEnum('sex', SEXES);
export const microchipEnum = pgEnum('microchip', MICROCHIP_OPTIONS);
export const sightingKindEnum = pgEnum('sighting_kind', SIGHTING_KINDS);
export const ownerStateEnum = pgEnum('sighting_owner_state', SIGHTING_OWNER_STATES);
export const imageVisibilityEnum = pgEnum('image_visibility', ['public', 'private']);
export const moderationTargetEnum = pgEnum('moderation_target', MODERATION_TARGETS);
export const moderationActionEnum = pgEnum('moderation_action', MODERATION_ACTIONS);

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

const consent = {
  consentAcceptedAt: timestamp('consent_accepted_at', { withTimezone: true }).notNull(),
  consentPolicyVersion: text('consent_policy_version').notNull(),
};

const moderation = {
  hidden: boolean('hidden').notNull().default(false),
  hiddenReason: text('hidden_reason'),
  hiddenAt: timestamp('hidden_at', { withTimezone: true }),
};

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: roleEnum('role').notNull().default('owner'),
  ...consent,
  ...timestamps,
});

export const notices = pgTable(
  'notices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: noticeTypeEnum('type').notNull(),
    status: noticeStatusEnum('status').notNull().default('open'),
    name: text('name'),
    species: speciesEnum('species').notNull(),
    size: sizeEnum('size').notNull(),
    coatColors: coatColorEnum('coat_colors').array().notNull(),
    sex: sexEnum('sex').notNull(),
    distinctiveMarks: text('distinctive_marks'),
    hasMicrochip: microchipEnum('has_microchip').notNull(),
    // Slug from the shared list; text (not enum) while the list is provisional (OQ-11).
    neighborhood: text('neighborhood').notNull(),
    eventDate: date('event_date', { mode: 'string' }).notNull(),
    description: text('description'),
    isFictional: boolean('is_fictional').notNull().default(false),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...consent,
    ...moderation,
    closedAt: timestamp('closed_at', { withTimezone: true }),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    index('notices_public_list_idx').on(t.hidden, t.status, t.neighborhood, t.eventDate),
    index('notices_species_size_idx').on(t.species, t.size),
    index('notices_owner_idx').on(t.ownerId),
  ],
);

export const noticeEvents = pgTable(
  'notice_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    noticeId: uuid('notice_id')
      .notNull()
      .references(() => notices.id, { onDelete: 'cascade' }),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    status: noticeStatusEnum('status'),
    note: text('note'),
  },
  (t) => [index('notice_events_notice_idx').on(t.noticeId, t.at)],
);

export const images = pgTable(
  'images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    noticeId: uuid('notice_id')
      .notNull()
      .references(() => notices.id, { onDelete: 'cascade' }),
    visibility: imageVisibilityEnum('visibility').notNull(),
    position: integer('position').notNull().default(0),
    alt: text('alt').notNull().default(''),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    content: bytea('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('images_notice_idx').on(t.noticeId, t.visibility, t.position)],
);

export const sightings = pgTable(
  'sightings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    noticeId: uuid('notice_id')
      .notNull()
      .references(() => notices.id, { onDelete: 'cascade' }),
    kind: sightingKindEnum('kind').notNull(),
    seenAt: date('seen_at', { mode: 'string' }),
    neighborhood: text('neighborhood'),
    description: text('description').notNull(),
    photoId: uuid('photo_id').references(() => images.id, { onDelete: 'set null' }),
    // Visible only to the notice owner (PRV-01, PRV-12).
    contactName: text('contact_name'),
    contactValue: text('contact_value'),
    ...consent,
    ownerState: ownerStateEnum('owner_state').notNull().default('new'),
    ...moderation,
    ...timestamps,
  },
  (t) => [index('sightings_notice_idx').on(t.noticeId, t.createdAt)],
);

export const moderationActions = pgTable(
  'moderation_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    targetType: moderationTargetEnum('target_type').notNull(),
    // No foreign key: the log survives deletions.
    targetId: uuid('target_id').notNull(),
    action: moderationActionEnum('action').notNull(),
    reason: text('reason').notNull(),
    moderatorId: uuid('moderator_id').references(() => users.id, { onDelete: 'set null' }),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('moderation_actions_target_idx').on(t.targetType, t.targetId)],
);

// Table layout required by connect-pg-simple.
export const sessions = pgTable(
  'session',
  {
    sid: varchar('sid').primaryKey(),
    sess: json('sess').notNull(),
    expire: timestamp('expire', { precision: 6 }).notNull(),
  },
  (t) => [index('IDX_session_expire').on(t.expire)],
);

/** Every table, used by tests to truncate between cases. */
export const TABLE_NAMES = [
  'users',
  'notices',
  'notice_events',
  'images',
  'sightings',
  'moderation_actions',
  'session',
] as const;

export type User = typeof users.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type NoticeEvent = typeof noticeEvents.$inferSelect;
export type Image = typeof images.$inferSelect;
export type Sighting = typeof sightings.$inferSelect;
