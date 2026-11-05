// Explicit allowlists: rows are never returned as-is (PRV-01).
import type {
  ModerationItem,
  OwnerNotice,
  OwnerSighting,
  PublicNotice,
  SessionUser,
} from '@petsearch/shared';
import type { Notice, NoticeEvent, Sighting, User } from '../db/schema.ts';

export interface PhotoMeta {
  id: string;
  noticeId: string;
  alt: string;
  width: number;
  height: number;
  position: number;
}

function optional<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined || value === '' ? undefined : value;
}

export function toPublicNotice(
  notice: Notice,
  photos: PhotoMeta[],
  events: NoticeEvent[],
): PublicNotice {
  return {
    id: notice.id,
    type: notice.type,
    status: notice.status,
    animal: {
      name: optional(notice.name),
      species: notice.species,
      size: notice.size,
      coatColors: [...notice.coatColors],
      sex: notice.sex,
      distinctiveMarks: optional(notice.distinctiveMarks),
      hasMicrochip: notice.hasMicrochip,
    },
    neighborhood: notice.neighborhood,
    eventDate: notice.eventDate,
    description: optional(notice.description),
    photos: photos.map((photo) => ({
      id: photo.id,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
    })),
    timeline: events.map((event) => ({
      at: event.at.toISOString(),
      status: optional(event.status),
      note: optional(event.note),
    })),
    isFictional: notice.isFictional,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
  };
}

export function toOwnerNotice(
  notice: Notice,
  photos: PhotoMeta[],
  events: NoticeEvent[],
  newSightings: number,
): OwnerNotice {
  return { ...toPublicNotice(notice, photos, events), hidden: notice.hidden, newSightings };
}

export function toOwnerSighting(sighting: Sighting): OwnerSighting {
  const contactValue = optional(sighting.contactValue);
  return {
    id: sighting.id,
    noticeId: sighting.noticeId,
    kind: sighting.kind,
    seenAt: optional(sighting.seenAt),
    neighborhood: optional(sighting.neighborhood),
    description: sighting.description,
    photoId: optional(sighting.photoId),
    contact: contactValue
      ? { name: optional(sighting.contactName), value: contactValue }
      : undefined,
    ownerState: sighting.ownerState,
    createdAt: sighting.createdAt.toISOString(),
  };
}

export function toSessionUser(user: User): SessionUser {
  return { id: user.id, displayName: user.displayName, email: user.email, role: user.role };
}

export function toModerationNotice(notice: Notice): ModerationItem {
  const summary = [notice.name, notice.description].filter(Boolean).join(' – ').slice(0, 160);
  return {
    targetType: 'notice',
    id: notice.id,
    noticeId: notice.id,
    summary: summary || '(sem descrição)',
    hidden: notice.hidden,
    isFictional: notice.isFictional,
    createdAt: notice.createdAt.toISOString(),
  };
}

export function toModerationSighting(sighting: Sighting): ModerationItem {
  return {
    targetType: 'sighting',
    id: sighting.id,
    noticeId: sighting.noticeId,
    // Moderators see that a contact was given, never the contact itself (plan.md section 5).
    summary:
      sighting.description.slice(0, 160) + (sighting.contactValue ? ' [contato informado]' : ''),
    hidden: sighting.hidden,
    isFictional: false,
    createdAt: sighting.createdAt.toISOString(),
  };
}
