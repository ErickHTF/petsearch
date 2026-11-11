// API response shapes. Public types are the only data unauthenticated clients receive (PRV-01).
import type {
  CoatColor,
  MicrochipOption,
  NoticeStatus,
  NoticeType,
  Role,
  Sex,
  SightingKind,
  SightingOwnerState,
  Size,
  Species,
} from './enums.ts';

export interface PublicPhoto {
  id: string;
  alt: string;
  width: number;
  height: number;
}

export interface PublicTimelineEntry {
  at: string;
  status?: NoticeStatus;
  note?: string;
}

export interface PublicNotice {
  id: string;
  type: NoticeType;
  status: NoticeStatus;
  animal: {
    name?: string;
    species: Species;
    size: Size;
    coatColors: CoatColor[];
    sex: Sex;
    distinctiveMarks?: string;
    hasMicrochip: MicrochipOption;
  };
  neighborhood: string;
  eventDate: string;
  description?: string;
  photos: PublicPhoto[];
  timeline: PublicTimelineEntry[];
  isFictional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerNotice extends PublicNotice {
  hidden: boolean;
  /** Open with no activity for 90 days: out of public view until the owner posts an update. */
  inactive: boolean;
  newSightings: number;
}

export interface OwnerSighting {
  id: string;
  noticeId: string;
  kind: SightingKind;
  seenAt?: string;
  neighborhood?: string;
  description: string;
  photoId?: string;
  contact?: { name?: string; value: string };
  ownerState: SightingOwnerState;
  createdAt: string;
}

export interface ModerationItem {
  targetType: 'notice' | 'sighting';
  id: string;
  noticeId: string;
  summary: string;
  hidden: boolean;
  isFictional: boolean;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  displayName: string;
  email: string;
  role: Role;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
