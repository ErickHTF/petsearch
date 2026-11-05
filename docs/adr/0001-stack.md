# ADR 0001: Application stack

- Status: accepted (plan approved 2026-11-05; database changed to PostgreSQL by the project owner on 2026-11-05)
- Requirements: NFR-07, NFR-08, NFR-09, PRV-05, PRV-08, PRC-09

## Context

The IFCIENCIA slides propose React + TypeScript for the interface, Node.js for the API and MongoDB for storage (S p8); the post-seminar report repeats this (R p5). The prototype must be functional by 15/11, mobile-first, accessible, hosted at zero or low cost, and maintainable by a 9-person student group. Privacy rules require server-side control over what is public (PRV-01) and metadata removal from photos (PRV-08).

After the plan was approved, the project owner decided to replace MongoDB with **PostgreSQL** and to **run the app in containers** (OQ-25). This deviates from the slides, and the Entrega 4 report must say so and give the reason (DLV-15).

## Decision

- **Monorepo** with npm workspaces: `apps/web`, `apps/api`, `packages/shared`.
- **Web:** Vite 7 + React 19 + TypeScript (strict), React Router 7, TanStack Query 5, React Hook Form, Tailwind CSS v4 with CSS-variable tokens, `vite-plugin-pwa`.
- **Shared:** Zod 4 schemas, enums and the neighborhood list, imported by both web and API.
- **API:** Node.js 22 LTS + Express 5, `helmet`, `express-rate-limit`, `express-session` with `connect-pg-simple`, argon2id password hashing, `multer` + `sharp` for images.
- **Database:** PostgreSQL 17 via Drizzle ORM + `pg` (node-postgres). Schema and SQL migrations are versioned in `apps/api/drizzle/`; the API applies pending migrations on start. Foreign keys cascade deletes (account -> notices -> sightings and images), which backs LGPD deletion (PRV-07).
- **Images:** re-encoded WebP stored in an `images` table (`bytea`), served through `/api/images/:id` with access control. No external storage account.
- **Containers:** a multi-stage `Dockerfile` builds web + API into one image; `docker-compose.yml` runs `db` (PostgreSQL) and `app`. Local development can run only `db` and use `npm run dev:*` for hot reload. Tests run against a separate `petsearch_test` database in the same container.
- **Hosting:** the Docker image on a Render free web service (same origin for SPA and `/api`), plus a free managed PostgreSQL (Neon free tier recommended, because Render's free PostgreSQL has had an expiry period; confirm current terms in OQ-12).
- **Quality:** ESLint + Prettier, `tsc --noEmit`, Vitest, Supertest against the test database, Playwright + axe-core, GitHub Actions with a PostgreSQL service container.

Package majors are pinned to versions the team can rely on (Vite 7, TypeScript 5.9, React Router 7, Vitest 3, ESLint 9, Drizzle 0.45) rather than the newest majors, to avoid unfamiliar breaking changes inside the 10-day window.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| MongoDB (slide stack) | Replaced by owner decision (OQ-25). PostgreSQL gives foreign keys with cascades, SQL date filters and a single store for sessions and images |
| Prisma | Ships a query engine binary and heavier migrations; Drizzle is plain TypeScript and SQL |
| Raw `pg` without ORM | More boilerplate and no typed schema; Drizzle stays close to SQL |
| Next.js (full-stack React) | Merges API and UI and adds SSR concepts the group has not planned for; the slides describe a separate Node API |
| Java / Spring Boot API | Considered on 2026-11-05; owner chose to keep Node |
| Object storage (S3, Cloudinary) for images | Another account and key; `bytea` fits the prototype volume and keeps access control in one place |
| JWT in localStorage | Exposed to XSS; same-origin cookie sessions are simpler and safer here |
| Separate static host + API host | Cross-origin cookies and CORS add complexity; one container serves both |

## Consequences

- Positive: one language end to end; validation written once; referential integrity and cascades in the database; the same container runs locally and in production; $0 hosting.
- Negative: deviation from the slides must be justified in the report. Local tests need Docker running. Images in the database grow the DB size (about 150 KB each; free-tier storage must be watched in the maintenance plan, PRC-19). The Render free tier sleeps after inactivity (cold start of about 50 s); warm it up before demos and usability sessions.
- If storage grows, images can move to object storage behind the same `/api/images/:id` route without changing clients.
