# Implementation plan

Status: **draft, awaiting owner approval** (PRC-01). Nothing here is implemented yet.

Requirement IDs refer to `docs/requirements.md`. Open decisions are in `docs/open-questions.md`; where a task depends on one, the recommended answer is assumed and marked `(OQ-nn)`.

## 1. Scope by milestone

Today is 2026-11-05. Entrega 4 is due 15/11 (10 days). The window covers building the core flow, deploying it, running real usability sessions, making real adjustments and writing the report, so the MVP is limited to the four-step flow from S p7.

### MVP for 15/11 (Entrega 4)

- Publish a lost (and found, OQ-06) notice with photos, characteristics, neighborhood and date: FR-01 to FR-06, FR-15
- Public list with filters by neighborhood, date, species, size and color, plus a detail page: FR-07 to FR-11
- Sighting/message form through the protected-contact relay: FR-12, PRV-01, PRV-12
- Owner dashboard: see sightings, update status, case timeline: FR-13, FR-14
- Accounts for owners and moderators; minimal moderation (hide/restore with reason): FR-16, FR-17, PRV-04
- Privacy baseline: consent, approximate neighborhood, EXIF stripping, privacy page, account deletion: PRV-01 to PRV-08, PRV-10, PRV-11
- Fictional seed data (Luna) labeled in the UI; About page: FR-21, FR-22, PRC-07
- Mobile quality bar and automated checks: NFR-01 to NFR-07, NFR-11, PRC-09
- Deployed at zero cost: NFR-08
- Real usability sessions with the 3 Luna tasks, then adjustments: PRC-13 to PRC-15, PRC-17
- Entrega 4 report: DLV-01 to DLV-32

### For 30/11 (final delivery)

- Adoption section, if the group approves it (FR-20, OQ-01)
- Flag content for moderation (FR-18), rate limiting hardening (PRV-09)
- PWA install and app-shell cache (NFR-09), performance budget (NFR-12)
- Second usability round with residents and invited protectors (PRC-16, PRC-21)
- Research answers and comparison of existing services (PRC-20)
- Maintenance plan (PRC-19); protector role, if defined (FR-19, OQ-23)
- Final report and presentation with the functional prototype (DLV-33, PRC-22)

### Future (not before the basic flow is validated, with costs and owners defined, S p10)

- Notifications (FR-23), maps (FR-24), any registry integration (excluded)

## 2. Stack

Full rationale in `docs/adr/0001-stack.md`. Summary. Honors S p8 (React + TypeScript, Node.js) except the database: PostgreSQL replaces MongoDB by owner decision (OQ-25).

| Concern | Choice | Why (short) |
|---|---|---|
| Repo layout | npm workspaces monorepo: `apps/web`, `apps/api`, `packages/shared` | Ships with Node, so no extra tool; schemas are shared between client and server |
| Language | TypeScript (strict) everywhere | Slide stack; types shared with the API |
| Runtime | Node.js 22 LTS | Active LTS through the project's lifetime |
| Build tool (web) | Vite | Fast dev server, simple config, first-class React+TS |
| UI | React 19 | Slide stack |
| Styling | Tailwind CSS v4 with design tokens in CSS variables | Mobile-first utilities by default; tokens keep colors in one place for the AA contrast check (NFR-03, NFR-10) |
| Routing | React Router (data router) | Standard, small |
| Server state | TanStack Query | Handles caching and loading/error states (NFR-05) |
| Forms and validation | React Hook Form + Zod resolver | Accessible native inputs; the same Zod schemas as the API |
| Shared validation | Zod schemas in `packages/shared` | One definition for client checks, API validation and TS types |
| API framework | Express 5 | Most familiar to the group, so 9 members can maintain it; Express 5 handles async errors natively |
| Database | PostgreSQL 17 with Drizzle ORM + `pg`; SQL migrations in `apps/api/drizzle/` | Owner decision (OQ-25); foreign keys with cascades back LGPD deletion |
| Images | `multer` (memory) -> `sharp` (resize to 1280px WebP, strip metadata) -> `images` table (`bytea`) | No extra storage account; EXIF/GPS removed (PRV-08); about 150 KB per image |
| Auth | Email + password (argon2id), server sessions in PostgreSQL (`express-session` + `connect-pg-simple`), httpOnly SameSite=Lax secure cookie; roles `owner`, `moderator` | No email provider needed; same-origin deploy means no CORS or token storage in JS (OQ-10) |
| Security middleware | `helmet`, `express-rate-limit`, honeypot field | PRV-05, PRV-09 |
| Containers and local dev | Multi-stage `Dockerfile` (web + API in one image); `docker compose up` runs `db` + `app`; for hot reload run only `db` and `npm run dev:api` / `dev:web` | Owner decision (OQ-25); same image locally and in production |
| Hosting | The Docker image on a Render free web service (API also serves the built SPA) + Neon free PostgreSQL | $0, one origin, HTTPS included. Trade-off: cold start of about 50 s after idle, so warm it up before demos (OQ-12) |
| PWA | `vite-plugin-pwa` (manifest now, app-shell cache for 30/11) | NFR-09 |
| Tests | Vitest (unit, components with Testing Library), Supertest against a `petsearch_test` PostgreSQL database (API), Playwright at 360x800 (E2E), `@axe-core/playwright` (a11y) | Covers the full testing strategy with mainstream tools |
| Lint and format | ESLint (typescript-eslint, react, jsx-a11y) + Prettier; `tsc --noEmit` | Quality gates (PRC-09) |
| CI | GitHub Actions: lint, typecheck, test, build, check-traceability | PRC-05, PRC-09 |

## 3. Screens and routes

Routes are user-visible, so they are in pt-BR; components and code stay in English (PRC-12). Baseline 360px, single column, bottom navigation with Início / Avisos / Publicar / Minha conta.

| Route | Screen | Access | Requirements |
|---|---|---|---|
| `/` | Home: two primary actions ("Perdi meu animal", "Encontrei/Vi um animal"), latest notices | public | FR-07, FR-01, FR-15 |
| `/avisos` | List with a filter sheet (neighborhood, date range, species, size, color, type); card shows photo, name or "Sem nome", neighborhood, date, status, "Exemplo fictício" badge | public | FR-07 to FR-10, FR-21, NFR-05 |
| `/avisos/:id` | Detail: photo carousel, characteristics in a fixed order for comparison, neighborhood, date, status, public timeline, "Enviar avistamento ou mensagem" | public | FR-11, FR-14, PRV-01 |
| `/avisos/:id/avistamento` | Sighting/message form: kind, date, neighborhood, description, optional photo, optional contact plus consent | public (rate limited) | FR-12, PRV-01, PRV-03, PRV-09, PRV-12 |
| `/avisos/novo` | Three-step publish form: 1) animal, 2) where/when, 3) photos + consent + review | owner | FR-01 to FR-06, FR-15, PRV-02, PRV-03, PRV-08 |
| `/entrar`, `/cadastrar` | Sign in, sign up (with privacy consent) | public | FR-16, PRV-03 |
| `/minha-conta` | My notices, account data, "Excluir minha conta" | owner | FR-13, PRV-07 |
| `/minha-conta/avisos/:id` | Manage a notice: sightings inbox, change status with a note, edit, delete | owner of the notice | FR-13, FR-14, PRV-04 |
| `/moderacao` | Queue of recent and flagged items; hide/restore/delete with reason | moderator | FR-17, FR-18 |
| `/privacidade` | Privacy policy (LGPD) | public | PRV-07 |
| `/sobre` | About, fictional data notice, no UPAR partnership | public | FR-22, PRV-10 |
| `/adocao` | Adoption list (only if OQ-01 = yes, 30/11) | public | FR-20 |

## 4. Data model

All tables have `id` (uuid), `created_at` and `updated_at`; names below are the TypeScript field names (columns are snake_case). Arrays such as `coatColors` are `text[]`; `animal.*` fields are flat columns. **Public** = can appear in unauthenticated API responses. Public responses are built by an explicit allowlist serializer per entity, never by returning documents (PRV-01).

### Neighborhood (static, `packages/shared/neighborhoods.ts`)
- `slug`, `name`. Source list to be provided or confirmed (OQ-11). Includes "Outro / não sei".

### User (`users`)
| Field | Type | Public |
|---|---|---|
| `email` | string, unique, lowercased | no |
| `passwordHash` | argon2id | no |
| `displayName` | string, max 40 | no (never shown on notices) |
| `role` | `owner` \| `moderator` | no |
| `consent` | `{ acceptedAt, policyVersion }` | no |
| `deletedAt` | date \| null | no |

Indexes: `email` unique. Deleting a user cascades to their notices.

### Notice (`notices`)
| Field | Type | Public |
|---|---|---|
| `type` | `lost` \| `found` (\| `adoption` if FR-20) | yes |
| `status` | `open` \| `reunited` \| `closed` | yes |
| `animal.name` | string, optional, max 40 | yes |
| `animal.species` | `dog` \| `cat` \| `other` | yes |
| `animal.size` | `small` \| `medium` \| `large` | yes |
| `animal.coatColors` | enum[] (1 to 3) | yes |
| `animal.sex` | `male` \| `female` \| `unknown` | yes |
| `animal.distinctiveMarks` | string, max 300, pattern-checked (PRV-02) | yes |
| `animal.hasMicrochip` | `yes` \| `no` \| `unknown` (never the chip number) | yes |
| `neighborhood` | slug from the list | yes |
| `eventDate` | date, not in the future | yes |
| `description` | string, max 1000, pattern-checked | yes |
| `photos` | rows in `images` (`notice_id`, `position`, `alt`, `width`, `height`, `visibility`, `content bytea`), 1 to 3 | yes (served via `/api/images/:id`) |
| `timeline` | rows in `notice_events` (`at`, `status?`, `note`; note max 300, pattern-checked) | yes |
| `isFictional` | boolean | yes (drives the "Exemplo fictício" badge) |
| `ownerId` | uuid FK -> users, on delete cascade | no |
| `consent` | `{ acceptedAt, policyVersion }` | no |
| `hidden`, `hiddenReason`, `hiddenAt` | moderation state | no (hidden items are filtered out) |
| `lastActivityAt` | date | no |

Indexes: `(hidden, status, neighborhood, event_date)`, `(species, size)`, `(owner_id)`.

### Sighting (`sightings`): sightings and messages to the owner
| Field | Type | Visible to |
|---|---|---|
| `noticeId` | uuid FK -> notices, on delete cascade | owner, moderator |
| `kind` | `sighting` \| `message` | owner, moderator |
| `seenAt` | date (sighting only) | owner, moderator |
| `neighborhood` | slug (sighting only) | owner, moderator |
| `description` | string, max 500 | owner, moderator |
| `photoId` | uuid FK -> images (private) optional, EXIF stripped | owner, moderator |
| `contactName`, `contactValue` | optional, only with consent | owner only |
| `reporterConsent` | `{ acceptedAt, policyVersion }` | none (audit) |
| `ownerState` | `new` \| `useful` \| `dismissed` | owner |
| `hidden`, `hiddenReason`, `hiddenAt` | as in Notice | moderator |

Indexes: `(notice_id, created_at)`. Sightings are never public (PRV-12, OQ-08).

### ModerationAction (`moderation_actions`)
- `targetType` (`notice` \| `sighting`), `targetId`, `action` (`hide` \| `restore` \| `delete`), `reason`, `moderatorId`, `at`. Index `(target_type, target_id)`. No FK on `targetId`, so the log survives deletions.

### Flag (`flags`, 30/11)
- `targetType`, `targetId`, `reason` enum, `createdAt`. No reporter identity stored.

### AdoptionListing
- Only if OQ-01 = yes. Recommendation: reuse `Notice` with `type: adoption`, plus `adoption.{ vaccinated, neutered, ageRange }`; only moderators or protectors publish.

## 5. Protected contact and approximate location

**Protected contact (PRV-01, PRV-12)**
1. No notice has a phone, email or owner-name field. The owner's account email is never serialized publicly.
2. A visitor uses "Enviar avistamento ou mensagem". The submission is stored as a `Sighting` and shown only in the owner's inbox (`/minha-conta/avisos/:id`).
3. The reporter may optionally leave a way to be contacted (name and phone or email) after ticking a consent box. That value is visible only to the owner of that notice, and moderators see it only as "contato informado".
4. The owner decides whether to reach out. The platform never exposes the owner's contact.
5. Without notifications (future, FR-23), the owner sees a badge with the count of new items on sign-in. The home screen tells owners to check their inbox.
6. Abuse controls: rate limit of 5 submissions per hour per IP per notice, honeypot field, moderator hide (PRV-09, FR-17).
7. Test: an API test snapshots the exact key set of every public response and fails if any new key appears.

**Approximate location (PRV-02, PRV-08)**
1. Location is only a neighborhood `select` from the fixed list. There are no address, street, number, CEP or coordinates fields.
2. Free-text fields (description, marks, notes, sighting description) pass a shared checker that blocks CEP (`\d{5}-?\d{3}`), phone numbers, emails and street patterns ("rua", "av.", "avenida", "travessa", "nº" followed by a number). The UI explains why ("Não informe endereço ou telefone; use a mensagem protegida").
3. All images are re-encoded by `sharp`, which drops EXIF/GPS. A test checks this with a geotagged fixture image the group creates itself (no real location).
4. The publish form warns against photos showing house numbers, license plates or people. Moderators can hide such photos.

## 6. LGPD

- **Legal basis:** consent (LGPD art. 7, I) for notice data and images; legitimate interest for minimal security logs. The consent checkbox is not pre-ticked and links to `/privacidade`. Its timestamp and policy version are stored (PRV-03).
- **Minimization:** no CPF, address, phone or email on notices. Account email is used only for sign-in.
- **Controller and contact:** the student group under IFSP Campus Salto supervision. A group contact email for privacy requests is needed (OQ-20).
- **Retention (recommended, OQ-20):** notices with status `reunited` or `closed` leave the public list immediately and are deleted 90 days later. Open notices with no activity for 90 days are hidden and the owner is asked to renew. Sightings are deleted with their notice. Deleted accounts are erased with their notices, sightings and images within 24 h (a scheduled cleanup job). Session records expire after 14 days.
- **Rights (art. 18):** "Excluir minha conta" (self-service, PRV-07), edit or delete any notice at any time, and the contact email for other requests, answered within 15 days.
- **Demo and test data:** only fictional data (PRV-06, FR-21). Usability sessions record no participant names, only "P1", "P2" and so on.

## 7. Testing strategy

| Level | Tool | Scope | Gate |
|---|---|---|---|
| Unit | Vitest | Shared schemas, pattern checker, status transitions, serializers | Required in CI |
| Component | Vitest + Testing Library | Forms (labels, errors), loading/empty/error states (NFR-05) | Required in CI |
| API integration | Supertest against the `petsearch_test` PostgreSQL database | Each route: happy path, validation, 401/403, public key allowlist, EXIF strip, rate limit | Required in CI |
| E2E | Playwright, viewport 360x800 (plus 412x915) | The 4-step flow as owner and visitor, moderation, account deletion; asserts no horizontal scroll and 44px targets (NFR-01, NFR-02) | Required before merge to main |
| Accessibility | `@axe-core/playwright` on every route, plus a manual keyboard and screen-reader pass (VoiceOver/TalkBack) | WCAG 2.2 AA, 0 serious or critical violations (NFR-03) | Required before merge to main |
| Usability | Moderated sessions with the script below | PRC-13 to PRC-17 | Real sessions only (PRC-06) |

### Usability test script (pt-BR, run on the participant's phone or a 360px device)

Before starting: explain that this is a test of the prototype, not of the person; the data is fictional; no names or images of participants are recorded; get verbal consent and note "consentimento verbal: sim". Moderator reads each task aloud and measures time from the end of the reading to completion or abandonment (limit 5 min).

| Task | Instruction read to the participant | Observe (S p9) |
|---|---|---|
| T1 (PRC-13) | "Você perdeu a Luna, uma cadela de porte médio, pelagem caramelo. Publique um aviso." (Photo provided by the moderator, licensed, OQ-16) | Completed? Time. Doubts in the form (which field, what was said) |
| T2 (PRC-14) | "Você viu um cachorro caramelo no bairro X. Procure se há algum aviso desse animal." | Completed? Time. Ease of finding and comparing the data (1 to 5 rating plus comment) |
| T3 (PRC-15) | Part A, as a resident: "Avise a tutora que você viu o animal." Part B, as the owner (moderator switches account): "Confira o avistamento e atualize o caso." | Completed? Time. Clarity of the actions, navigation difficulties |

Closing questions: "O que foi mais difícil?", "Que informação faltou para reconhecer o animal?" (PRC-20), "Você usaria isso? Por quê?" (PRC-21).

### Results template (one file per session: `docs/evidence/usability/YYYY-MM-DD_PRC-13_usability-P1.md`)

```
Sessão: P1 | Data: | Moderador: | Dispositivo/navegador: | Versão (commit):
Perfil (sem dados pessoais): colega / morador / protetor
Consentimento verbal: sim/não

| Tarefa | Concluiu (sim/parcial/não) | Tempo (s) | Erros/desvios | Dúvidas e falas (literal) | Nota 1-5 |
| T1 | | | | | |
| T2 | | | | | |
| T3A | | | | | |
| T3B | | | | | |

Problemas observados (cada um vira F-nn em findings):
Respostas finais:
```

Aggregated findings go to `docs/evidence/findings.md` (F-01 and so on: severity, sessions where it appeared, requirement ID). Adjustments go to `docs/evidence/adjustments.md` (finding, change, commit, before/after screenshot, re-test result), following PRC-17.

## 8. Ordered task list

Owner column to be filled by the group (OQ-14, PRC-18, DLV-24). Dates are targets. Each task ends with the Definition of Done in `AGENTS.md`.

| # | Task | IDs | Acceptance criteria | Target | Owner |
|---|---|---|---|---|---|
| T01 | Scaffold the monorepo (web, api, shared), TS strict, ESLint, Prettier, Vitest, `.env.example`, `.gitignore` | NFR-07, PRV-05, PRC-09 | `npm run lint`, `typecheck`, `test` and `build` pass on an empty app | 06/11 | |
| T01b | PostgreSQL + Drizzle migrations, `Dockerfile`, `docker-compose.yml` (db + app), CI PostgreSQL service | NFR-07, NFR-08 | `docker compose up` serves the app on :3000 with migrations applied | 06/11 | |
| T02 | GitHub Actions CI and `scripts/check-traceability` | PRC-02, PRC-03, PRC-05, PRC-09 | CI is green; the script fails on a fake unknown ID and on a `verified` row with a missing file (both shown in a test) | 06/11 | |
| T03 | Shared Zod schemas, enums, neighborhood list, text pattern checker | FR-03 to FR-06, PRV-02 | Unit tests cover valid and invalid cases for each field and pattern | 07/11 | |
| T04 | API: auth (sign up, sign in, sign out, me), sessions, roles, account deletion | FR-16, PRV-03, PRV-04, PRV-07, PRV-09 | Integration tests: consent required, wrong password, 401/403, deletion cascades | 07/11 | |
| T05 | API: notices CRUD, image upload pipeline (sharp, `images` table), status and timeline, public serializer | FR-01 to FR-06, FR-14, FR-15, PRV-01, PRV-08, NFR-11 | Tests: EXIF stripped, 1 to 3 photos, public key allowlist, only the owner edits | 08/11 | |
| T06 | API: list with filters and pagination, indexes | FR-07 to FR-10 | Tests for each filter and combinations; hidden notices excluded | 08/11 | |
| T07 | API: sightings and messages, owner inbox, rate limit; moderation hide/restore/delete with log | FR-12, FR-13, FR-17, PRV-09, PRV-12 | Tests: never public, owner-only contact, moderator-only routes | 09/11 | |
| T08 | Web: app shell, tokens, bottom navigation, layout primitives, loading/empty/error components | NFR-01 to NFR-06, NFR-10 | axe has 0 serious issues on the shell; 360px with no horizontal scroll | 08/11 | |
| T09 | Web: list, filters, detail page | FR-07 to FR-11, FR-21 | E2E: filter by neighborhood finds Luna; fictional badge visible | 09/11 | |
| T10 | Web: auth screens, publish form (3 steps), owner area, status update | FR-01 to FR-06, FR-13 to FR-16, PRV-03 | E2E: full owner flow at 360px | 10/11 | |
| T11 | Web: sighting form, moderation screen, privacy page, about page, account deletion | FR-12, FR-17, FR-22, PRV-07, PRV-10 | E2E: visitor sighting reaches the owner inbox; deletion works | 10/11 | |
| T12 | Fictional seed script (Luna plus about 8 others, licensed images) | FR-21, PRV-06, PRV-11, PRC-07 | All seeded notices have `isFictional: true`; asset sources listed | 10/11 | |
| T13 | Deploy (Docker image on Render + Neon PostgreSQL), HTTPS, environment config, smoke test | NFR-08, PRV-05 | Public URL works on a phone; smoke E2E passes against it | 11/11 | |
| T14 | Full E2E + a11y + manual keyboard/screen-reader pass; fix issues | NFR-01 to NFR-05 | Reports saved in `docs/evidence/` | 11/11 | |
| T15 | Usability sessions (at least 3 participants, OQ-13) | PRC-13 to PRC-16 | One filled results file per real session; findings.md | 12-13/11 | |
| T16 | Adjustments from findings, then quick re-test | PRC-17, DLV-14, DLV-16 | adjustments.md links findings, commits, before/after screenshots | 13-14/11 | |
| T17 | Entrega 4 report in pt-BR from `docs/entrega-4/outline.md`; pre-submission checklist | DLV-01 to DLV-32 | Every claim links to evidence; checklist complete; one member uploads to Moodle | 14-15/11 | |

Buffer: if T01 to T13 slip past 11/11, drop FR-15 and the moderation UI (keep the API) before cutting usability sessions, because the report depends on real tests (DLV-11 to DLV-16).

## 9. scripts/check-traceability (spec for T02)

Node script (`scripts/check-traceability.mjs`, no dependencies), run in CI and before each session report:
1. Parse every table row in `docs/requirements.md` whose first cell matches `^(FR|NFR|PRV|DLV|PRC)-\d{2}$`. Fail on duplicate IDs.
2. Scan `docs/**/*.md`, `AGENTS.md`, source files and the messages of commits on the current branch (`git log main..HEAD`) for that pattern. Fail if any referenced ID is not in the matrix.
3. Fail if a commit on the branch references no ID (PRC-02). Merge commits are exempt.
4. For each `verified` row, every path in the Evidence column must exist. Fail otherwise.
5. Warn if a DLV row has an empty Evidence column.
6. Print the counts per type and status (used for the end-of-session report, PRC-04).
