# API contract

Base path `/api`, JSON unless noted, same origin as the web app. Types come from `@petsearch/shared` (`packages/shared/src/types.ts`, request schemas in `schemas.ts`). Session cookie `petsearch.sid` (httpOnly, SameSite=Lax); clients send `credentials: 'same-origin'`.

## Errors

Every non-2xx response has the body `ApiError`: `{ error: string, fields?: Record<string, string> }`. `error` is a pt-BR sentence that can be shown to the user. `fields` maps a dotted field path (e.g. `animal.coatColors`, `eventDate`, `photos`, `email`) to a pt-BR message.

| Status | Meaning |
|---|---|
| 400 | Validation error (see `fields`) or malformed request |
| 401 | Not signed in |
| 403 | Signed in without permission, or cross-origin write |
| 404 | Not found, hidden, or not owned by the caller |
| 409 | Conflict (email already registered; notice no longer open) |
| 429 | Rate limited |

## Auth and account (FR-16, PRV-07)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/auth/me` | - | `200 { user: SessionUser \| null }` |
| POST | `/auth/sign-up` | `SignUpInput` (`signUpSchema`) | `201 SessionUser`, sets cookie; `409` if email exists |
| POST | `/auth/sign-in` | `SignInInput` | `200 SessionUser`; `401` wrong credentials. Rate limit 20 per 15 min per IP (shared with sign-up) and 10 per 15 min per email |
| POST | `/auth/sign-out` | - | `204` |
| DELETE | `/account` | - | `204`; deletes the account, its notices, sightings and images |

## Public notices (FR-07 to FR-11)

| Method | Path | Notes |
|---|---|---|
| GET | `/notices?type&neighborhood&species&size&color&from&to&page` | Query matches `noticeFiltersSchema`. Only open, visible notices, newest `eventDate` first. Response `Page<PublicNotice>`, `pageSize` 12 |
| GET | `/notices/:id` | `PublicNotice` for any visible notice (any status). `404` if hidden, inactive (open with no activity for 90 days) or unknown |
| GET | `/images/:id` | `image/webp`. Public photos of visible notices for everyone; sighting photos only for the notice owner or a moderator |

## Owner actions (FR-01 to FR-06, FR-13 to FR-15)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/notices` | `multipart/form-data`: field `data` = JSON string of `NoticeInput`; files `photos` (1 to 3, JPEG/PNG/WebP, max 8 MB each) | `201 OwnerNotice`. Missing photos -> `400` with `fields.photos`. Rate limit 10 per hour per account |
| PATCH | `/notices/:id` | `NoticeUpdate` | `200 OwnerNotice` |
| POST | `/notices/:id/status` | `StatusUpdate` (`{ status, note? }`) | `200 OwnerNotice`; adds a timeline entry |
| DELETE | `/notices/:id` | - | `204` |
| GET | `/me/notices` | - | `200 OwnerNotice[]` (includes hidden ones, with `newSightings` count and `inactive`: open with no activity for 90 days, out of public view until the owner posts an update or edits it) |
| GET | `/me/notices/:id` | - | `200 OwnerNotice` |
| GET | `/me/notices/:id/sightings` | - | `200 OwnerSighting[]`, newest first, excluding moderator-hidden ones |
| PATCH | `/me/sightings/:id` | `{ ownerState: 'new' \| 'useful' \| 'dismissed' }` | `200 OwnerSighting` |

## Sightings and messages (FR-12, PRV-01, PRV-09, PRV-12)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/notices/:id/sightings` | `multipart/form-data`: field `data` = JSON string of `SightingInput` plus optional honeypot `website` (must be empty); optional file `photo` | `201 { ok: true }`. `409` if the notice is not open. Rate limit 5 per hour per IP per notice. No account needed |

## Moderation (FR-17)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/moderation/items?targetType=notice\|sighting` | - | `200 ModerationItem[]` (latest 50, including hidden) |
| POST | `/moderation/:targetType/:id` | `ModerationActionInput` (`{ action: 'hide' \| 'restore' \| 'delete', reason }`) | `204` |

Sign-up always creates an `owner`. An operator grants or revokes the moderator role on an existing account with `npm run moderator -- <email> [--revoke]` (in the container: `node apps/api/dist/admin/moderator.js`); the change applies to open sessions on their next request.

## Health

`GET /health` -> `200 { status: 'ok' }`.
