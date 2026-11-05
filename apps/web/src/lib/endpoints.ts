import type {
  ModerationActionInput,
  ModerationItem,
  NoticeFilters,
  NoticeInput,
  NoticeUpdate,
  OwnerNotice,
  OwnerSighting,
  Page,
  PublicNotice,
  SessionUser,
  SightingInput,
  SightingOwnerState,
  SignInInput,
  SignUpInput,
  StatusUpdate,
} from '@petsearch/shared';
import { request, toQueryString } from './api.ts';

export type ListFilters = Partial<NoticeFilters>;
export type ModerationTargetType = 'notice' | 'sighting';

export const queryKeys = {
  session: ['session'] as const,
  notices: (filters: ListFilters) => ['notices', filters] as const,
  notice: (id: string) => ['notice', id] as const,
  myNotices: ['my-notices'] as const,
  myNotice: (id: string) => ['my-notice', id] as const,
  mySightings: (id: string) => ['my-sightings', id] as const,
  moderation: (targetType: ModerationTargetType) => ['moderation', targetType] as const,
};

const enc = encodeURIComponent;

export const api = {
  session: () => request<{ user: SessionUser | null }>('/auth/me'),
  signIn: (input: SignInInput) => request<SessionUser>('/auth/sign-in', { json: input }),
  signUp: (input: SignUpInput) => request<SessionUser>('/auth/sign-up', { json: input }),
  signOut: () => request<void>('/auth/sign-out', { method: 'POST' }),
  deleteAccount: () => request<void>('/account', { method: 'DELETE' }),

  listNotices: (filters: ListFilters) =>
    request<Page<PublicNotice>>(`/notices${toQueryString({ ...filters })}`),
  getNotice: (id: string) => request<PublicNotice>(`/notices/${enc(id)}`),

  createNotice: (input: NoticeInput, photos: File[]) => {
    const form = new FormData();
    form.append('data', JSON.stringify(input));
    for (const photo of photos) form.append('photos', photo);
    return request<OwnerNotice>('/notices', { formData: form });
  },
  updateNotice: (id: string, input: NoticeUpdate) =>
    request<OwnerNotice>(`/notices/${enc(id)}`, { method: 'PATCH', json: input }),
  updateStatus: (id: string, input: StatusUpdate) =>
    request<OwnerNotice>(`/notices/${enc(id)}/status`, { json: input }),
  deleteNotice: (id: string) => request<void>(`/notices/${enc(id)}`, { method: 'DELETE' }),

  myNotices: () => request<OwnerNotice[]>('/me/notices'),
  myNotice: (id: string) => request<OwnerNotice>(`/me/notices/${enc(id)}`),
  mySightings: (id: string) => request<OwnerSighting[]>(`/me/notices/${enc(id)}/sightings`),
  setSightingState: (id: string, ownerState: SightingOwnerState) =>
    request<OwnerSighting>(`/me/sightings/${enc(id)}`, { method: 'PATCH', json: { ownerState } }),

  sendSighting: (noticeId: string, input: SightingInput, website: string, photo?: File) => {
    const form = new FormData();
    form.append('data', JSON.stringify({ ...input, website }));
    if (photo) form.append('photo', photo);
    return request<{ ok: true }>(`/notices/${enc(noticeId)}/sightings`, { formData: form });
  },

  moderationItems: (targetType: ModerationTargetType) =>
    request<ModerationItem[]>(`/moderation/items${toQueryString({ targetType })}`),
  moderate: (targetType: ModerationTargetType, id: string, input: ModerationActionInput) =>
    request<void>(`/moderation/${targetType}/${enc(id)}`, { json: input }),
};
