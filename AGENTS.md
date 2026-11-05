# AGENTS.md

Rules for any AI agent or person working in this repository. When this file conflicts with anything else in the repo, this file wins; when it does not cover a case, ask (rule G9).

## Project

PETSEARCH is a mobile-first web portal for lost and found animals in Indaiatuba (SP, Brazil). It is a university extension project: IFSP Campus Salto, ADS, 5th semester, 2nd semester 2026, coordinator Prof. Leonel Cardoso Leal. Audience: pet owners (tutores), residents (moradores), independent protectors and volunteers. Reference entity: UPAR (União Protetora dos Animais de Rua). **No contact or partnership with UPAR is confirmed.**

Core flow (S p7): owner publishes a notice -> resident searches by neighborhood and characteristics -> resident sends a sighting -> owner reviews it and updates the case.

Deadlines: Entrega 4 (prototype, tests, adjustments) by **15/11/2026**; final solution and report by **30/11/2026**.

## Documents

| File | Purpose |
|---|---|
| `docs/requirements.md` | Traceability matrix; the only definition of scope |
| `docs/plan.md` | Milestones, stack summary, routes, data model, privacy design, tests, ordered tasks |
| `docs/adr/0001-stack.md` | Stack decision |
| `docs/api.md` | HTTP API contract between web and API |
| `docs/open-questions.md` | Pending decisions with recommendations |
| `docs/entrega-4/outline.md` | Skeleton of the Entrega 4 report (pt-BR) |
| `docs/evidence/README.md` | Evidence conventions |
| `docs/sources/` | Original sources: slides, post-IFCIENCIA report, Entrega 4 brief |
| `KICKOFF_PROMPT.md` | Original instructions from the project owner |

## Mandatory reading order before any change

1. `AGENTS.md`
2. `docs/requirements.md`
3. `docs/plan.md`
4. The ADRs relevant to the change (`docs/adr/`)
5. `docs/open-questions.md` entries for the IDs you touch

## Guardrails

- **G1 Planning gate (PRC-01).** You MUST NOT write application code, add dependencies or scaffold anything until the project owner has replied "approved" to the plan. After approval, you MUST implement only tasks listed in `docs/plan.md`.
- **G2 Traceability (PRC-02, PRC-03).** Every commit, PR and task MUST reference at least one requirement ID. A requirement MUST NOT move to `verified` without an Evidence link to a file that exists in the repo.
- **G3 Coverage check (PRC-04, PRC-05).** At the end of every work session you MUST re-read the sources and `docs/requirements.md` and report: rows per status, any source item without an ID, any DLV row without planned evidence. Once it exists, `scripts/check-traceability` MUST pass.
- **G4 Honesty (PRC-06, PRC-07, DLV-29).** You MUST NOT fabricate test results, user feedback, metrics, partnerships, screenshots or evaluations. Fictional sample data (such as "Luna") MUST be labeled as fictional in the UI and in the report. Unknown means "not yet done".
- **G5 Scope control (PRC-08).** Anything not in `docs/requirements.md` is out of scope until added with a source or the owner's approval. Notifications and maps stay `deferred`.
- **G6 Privacy by default (PRV-01 to PRV-12).** You MUST NOT show an exact address, phone or email publicly. You MUST NOT put real personal data in seeds, fixtures, screenshots or commits. Secrets MUST live only in `.env` (gitignored), with a `.env.example` committed.
- **G7 Mobile-first quality bar (NFR-01 to NFR-05).** Every screen MUST have: 360px baseline, touch targets of at least 44x44px, no horizontal scroll, safe-area awareness, visible focus, labels on all inputs, AA contrast, and designed loading, empty and error states.
- **G8 Quality gates (PRC-09).** Before any commit in the implementation phase, lint, typecheck, tests and build MUST pass, and you MUST report the numbers. If something fails, say so and do not mark the task done.
- **G9 Ask, do not guess (PRC-10).** If the sources conflict or do not cover a case, add it to `docs/open-questions.md` and ask. MUST NOT invent a default for a decision listed there as pending.

## Conventions

- Code, identifiers, comments and commit messages in **English**.
- All UI text in **pt-BR**, including user-visible routes (`/avisos`, `/minha-conta`).
- Entrega 4 report content in **pt-BR**.
- Follow the stack in `docs/adr/0001-stack.md`. New dependencies need a reason in the PR description.
- Use the project scripts (`npm run lint`, `typecheck`, `test`, `build`, `e2e`) once they exist; do not use other tools.

## Git

- Never commit to `main`. Use feature branches (`feat/...`, `fix/...`, `docs/...`, `test/...`) and merge through PRs.
- Small, focused commits.
- Commit message: one line, at most 72 characters, imperative, in English, with at least one requirement ID, e.g. `Add neighborhood filter to notice list (FR-08)`. Add a body (2-3 lines) only when the reason is not obvious from the diff.
- No emoji. No AI attribution: no `Co-Authored-By` lines and no "Generated with" footers, in commits or PRs.
- PR description: 1 line of context, short bullets, validation numbers, requirement IDs, `Closes #N` when applicable.

## Definition of Done (per task)

A task is done only when all of these hold:

1. The acceptance criteria in `docs/plan.md` are met.
2. Commits and the PR reference the task's requirement IDs.
3. Tests were added or updated for the behavior; lint, typecheck, tests and build pass, and the numbers are reported.
4. UI tasks: the G7 checklist was checked at 360px, and axe reports 0 serious or critical violations on the touched routes.
5. Privacy tasks: public API responses were checked against the allowlist, and no real personal data was added.
6. `docs/requirements.md` statuses are updated (`implemented`; `verified` only with an existing evidence file).
7. Evidence produced by real runs is saved under `docs/evidence/` following its README.
8. New ambiguities are logged in `docs/open-questions.md`.
