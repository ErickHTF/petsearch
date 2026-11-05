# ADR 0001: Application stack

- Status: proposed (awaiting owner approval, PRC-01)
- Date: 2026-11-05
- Requirements: NFR-07, NFR-08, NFR-09, PRV-05, PRV-08, PRC-09

## Context

The IFCIENCIA slides propose React + TypeScript for the interface, Node.js for the API and MongoDB for storage (S p8); the post-seminar report repeats this (R p5). The prototype must be functional by 15/11 (10 days from now), mobile-first, accessible, hosted at zero or low cost, and maintainable by a 9-person student group. Privacy rules require server-side control over what is public (PRV-01) and metadata removal from photos (PRV-08).

## Decision

- **Monorepo** with npm workspaces: `apps/web`, `apps/api`, `packages/shared`.
- **Web:** Vite + React 19 + TypeScript (strict), React Router, TanStack Query, React Hook Form, Tailwind CSS v4 with CSS-variable tokens, `vite-plugin-pwa`.
- **Shared:** Zod schemas, enums and the neighborhood list, imported by both web and API.
- **API:** Node.js 22 LTS + Express 5, Mongoose 8, `helmet`, `express-rate-limit`, `express-session` + `connect-mongo`, argon2id password hashing, `multer` + `sharp` for images, GridFS for image storage.
- **Database:** MongoDB 7 (Docker Compose locally, MongoDB Atlas M0 in production).
- **Hosting:** one Render free web service where Express serves the built SPA and `/api` from the same origin; Atlas M0.
- **Quality:** ESLint + Prettier, `tsc --noEmit`, Vitest, Supertest + mongodb-memory-server, Playwright + axe-core, GitHub Actions.

## Alternatives considered

| Option | Why not chosen |
|---|---|
| Next.js (full-stack React) | Merges API and UI and adds SSR concepts the group has not planned for; the slides describe a separate Node API |
| Fastify instead of Express | Faster and has schema-first validation, but less familiar to the group; Zod covers validation anyway |
| NestJS | Heavy structure for a 10-day MVP |
| PostgreSQL / Supabase | Deviates from the slide stack without a concrete need |
| Cloudinary or S3 for images | Another account and API key to manage; GridFS fits the volume (about 3,000 images at about 150 KB in 512 MB) and keeps EXIF stripping server-side |
| JWT in localStorage | Exposed to XSS; same-origin cookie sessions are simpler and safer here |
| Separate static host (Vercel/Netlify) + API host | Cross-origin cookies and CORS add complexity; a single origin avoids them. Can be revisited if the cold start hurts |
| Plain CSS modules | Viable, but slower to build consistent mobile-first layouts in 10 days |

## Consequences

- Positive: one language end to end; validation written once; $0 hosting; HTTPS by default; few moving parts.
- Negative: the Render free tier sleeps after inactivity, giving a cold start of about 50 s. Mitigation: open the app a few minutes before demos and usability sessions, and say so in the report as a limitation. Atlas M0 has 512 MB storage and shared resources, which is enough for the prototype and should be reviewed in the maintenance plan (PRC-19).
- GridFS couples images to the database; if storage grows, move images to object storage behind the same `/api/images/:id` route.
- The free-tier accounts must belong to the group, not an individual, for continuity (OQ-12).
