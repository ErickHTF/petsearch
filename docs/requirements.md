# Requirements and traceability matrix

Single source of truth for scope. Anything not listed here is out of scope until added with a source or explicit approval (PRC-08).

## Source keys

| Key | File | Notes |
|---|---|---|
| S | `docs/sources/ifciencia-2026-slides.pdf` | IFCIENCIA 2026 slides, 12 pages; `S p5` = page 5 |
| R | `docs/sources/relatorio-pos-ifciencia.pdf` | Post-IFCIENCIA report, 7 pages (p7 blank) |
| B | `docs/sources/entrega-4-brief.md` | Entrega 4 assignment brief; `B 3` = section 3 of "O que deverá ser entregue?" |
| K | `KICKOFF_PROMPT.md` | Project owner's kickoff instructions; `K 4.7` = section 4, rule 7 |
| OQ | `docs/open-questions.md` | Decision pending; row wording may change after the answer |

## Status and verification rules

- Status values: `planned`, `in-progress`, `implemented`, `verified`, `deferred`, `out-of-scope`.
- `verified` requires an Evidence link that points to an existing file in the repo (PRC-03). `planned: ...` text in the Evidence column is a plan, not evidence.
- Priority is MoSCoW for the 30/11 final delivery. The 15/11 MVP subset is defined in `docs/plan.md`.

## Functional (FR)

| ID | Requirement | Source | Type | Priority | Status | Verification method | Evidence link |
|---|---|---|---|---|---|---|---|
| FR-01 | An owner (tutor/tutora) can publish a lost-animal notice | S p7 (step 1); S p4 (tutores); R p3 | functional | Must | implemented | E2E publish flow on 360px viewport; usability task 1 | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-02 | A notice holds 1 to 3 photos of the animal | S p5 ("Fotos e características"); R p3 | functional | Must | implemented | API integration test (upload, resize); E2E | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-03 | A notice holds structured characteristics: name (optional), species, size, coat colors, sex, distinctive marks, microchip yes/no/unknown | S p5 (Luna: porte médio, pelagem caramelo); S p3 (microchip context) | functional | Must | implemented | Unit test of shared schema; E2E | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-04 | A notice holds the neighborhood (bairro) chosen from a fixed list of Indaiatuba neighborhoods | S p3 ("por bairro"); S p5; S p7 | functional | Must | implemented | Unit test: schema rejects values outside the list | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-05 | A notice holds the date the animal was lost or found | S p3 ("data"); S p5 ("Filtros por bairro e data") | functional | Must | implemented | Unit test: no future dates | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-06 | A notice has a visible status: lost, found or reunited/closed | S p5 ("Situação: perdido"); S p7 (step 4) | functional | Must | implemented | API test of status transitions | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-07 | Anyone can browse the public list of open notices without an account | S p8 ("Publicar e buscar"); S p12 ("consulta de avisos") | functional | Must | implemented | E2E as anonymous visitor | docs/evidence/screenshots/2026-11-05_FR-07_home-360px.png |
| FR-08 | The list can be filtered by neighborhood | S p5; S p7 (step 2); R p3 ("filtros por localização") | functional | Must | implemented | API test of the filter; usability task 2 | docs/evidence/screenshots/2026-11-05_FR-08_avisos-360px.png |
| FR-09 | The list can be filtered by date range | S p5 ("Filtros por bairro e data"); S p3 | functional | Must | implemented | API test of the filter | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-10 | The list can be filtered by species, size and coat color | S p7 (step 2: "Busca por bairro e características"); R p3 | functional | Must | implemented | API test of combined filters | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-11 | The notice detail page shows the photos, characteristics, neighborhood, date, status and case history, laid out so that a found animal can be compared with the data | S p9 ("Facilidade de encontrar e comparar os dados"); S p4 (moradores: "Relacionar o animal encontrado a um anúncio") | functional | Must | implemented | E2E; usability task 2 | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-12 | Anyone can submit a sighting (avistamento) on a notice: date, neighborhood, description, optional photo, optional contact | S p7 (step 3); S p5; R p3 | functional | Must | implemented | E2E; usability task 3 | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-13 | The owner sees the sightings and messages received on their own notices | S p7 (step 4: "Confere"); S p4 (tutores: "acompanhar relatos") | functional | Must | implemented | E2E as owner | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-14 | The owner updates their case: changes the status and adds a note; changes appear in a public timeline | S p7 (step 4: "atualiza o caso"); S p5; S p10 ("Atualização dos casos") | functional | Must | implemented | API test; E2E; usability task 3 | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-15 | A resident who found an animal can publish a "found animal" notice | S p5 (objective: "perdidos e encontrados"); R p3 ("animais perdidos e encontrados"); OQ-06 | functional | Should | planned | E2E | planned: E2E log |
| FR-16 | Owners and moderators sign up and sign in with an account to manage their notices | S p8 ("controle de acesso") | functional | Must | implemented | API auth tests | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-17 | Moderators can review notices and sightings and hide, restore or delete them, with a recorded reason | S p8 ("moderação"); S p10 ("Moderação dos avisos") | functional | Must | implemented | API test (role guard); E2E as moderator | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-18 | Visitors can flag a notice or sighting as inappropriate for moderation | S p10 ("Moderação dos avisos"), derived | functional | Should | planned | API test | planned: test log |
| FR-19 | Protectors and volunteers can check the information and forward cases | S p4 ("Protetores e voluntários: Conferir informações e encaminhar os casos"); OQ-23 | functional | Could | planned | To be defined after OQ-23 | planned |
| FR-20 | Responsible adoption section listing animals available for adoption (Prof. Diego's suggestion). **Classification: planned, candidate for 30/11, not in the 15/11 MVP. Final call by the group (OQ-01).** | R p4; R p5; S p2 ("Adoção responsável" as a UPAR activity) | functional | Could | planned | E2E if built | planned |
| FR-21 | The demo environment contains fictional sample notices, including "Luna" (medium dog, caramel coat, status lost, contact protected), each labeled "Exemplo fictício" in the UI | S p5; S p9 | functional | Must | implemented | E2E asserts the label on seeded notices | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| FR-22 | About page: project purpose, academic context, fictional data notice, and a statement that there is no confirmed partnership with UPAR | S p2 ("Sem contato ou parceria confirmados"); S p5 | functional | Should | implemented | E2E / screenshot | docs/evidence/screenshots/2026-11-05_FR-22_sobre-360px.png |
| FR-23 | Notifications (e.g. new sighting alerts) | S p10 ("Evolução possível: Notificações") | functional | Won't (now) | deferred | n/a. Future only after the basic flow is validated, with costs and owners defined (S p10) | - |
| FR-24 | Maps | S p10 ("Evolução possível: mapas") | functional | Won't (now) | deferred | n/a. Same condition as FR-23 | - |

## Non-functional (NFR)

| ID | Requirement | Source | Type | Priority | Status | Verification method | Evidence link |
|---|---|---|---|---|---|---|---|
| NFR-01 | Mobile-first layout with a 360px baseline and no horizontal scroll on any screen | S p8 ("navegação por celular"); K 4.7 | non-functional | Must | verified | Playwright at 360x800 asserts scrollWidth <= clientWidth | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| NFR-02 | Touch targets at least 44x44 CSS px | K 4.7 | non-functional | Must | verified | Playwright check of interactive element bounding boxes | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| NFR-03 | WCAG 2.2 AA: text contrast AA, visible focus, labels on every input, keyboard reachable | S p8 ("acessibilidade"); K 4.7; R p5 | non-functional | Must | implemented | axe-core in Playwright (0 serious/critical) plus a manual keyboard pass | docs/evidence/test-logs/2026-11-05_NFR-03_axe-report.json |
| NFR-04 | Layout respects safe areas (notch, home indicator) | K 4.7 | non-functional | Should | planned | CSS `env(safe-area-inset-*)` review; device screenshot | planned: screenshot |
| NFR-05 | Every data screen has designed loading, empty and error states | K 4.7 | non-functional | Must | planned | Component tests for each state | planned: test log |
| NFR-06 | All UI text in pt-BR | K 3 | non-functional | Must | planned | Review of the UI string catalog | planned: screenshot |
| NFR-07 | Stack: React + TypeScript frontend, Node.js API, PostgreSQL database (slides proposed MongoDB; changed by owner decision, OQ-25), app runs in containers | S p8 ("Arquitetura candidata"); R p5; OQ-25 | non-functional | Must | in-progress | ADR 0001; repo structure; `docker compose up` | planned: docs/adr/0001-stack.md |
| NFR-08 | Hosted at zero or low cost; hosting responsibility documented | S p10 ("Hospedagem"); K 3 | non-functional | Must | planned | Public URL reachable; plan.md hosting section | planned: screenshot of deployed app |
| NFR-09 | Installable PWA (manifest, icons, app-shell caching) | K 3 | non-functional | Should | planned | Lighthouse PWA installability check | planned: Lighthouse report |
| NFR-10 | Visual identity derived from the slide deck (green and navy) and confirmed by the project owner | K 1; S p1-p12 (palette); OQ-05 | non-functional | Should | planned | Owner approval recorded in OQ-05 | planned |
| NFR-11 | Uploaded images are resized and compressed (max 1280px, WebP) to keep pages light on mobile data | S p8 (mobile), derived | non-functional | Should | planned | API test checks output dimensions | planned: test log |
| NFR-12 | Public list loads in under 3 s on a "Fast 4G" profile in the deployed environment | S p8 (mobile), derived | non-functional | Could | planned | Lighthouse mobile run | planned: Lighthouse report |

## Privacy and security (PRV)

| ID | Requirement | Source | Type | Priority | Status | Verification method | Evidence link |
|---|---|---|---|---|---|---|---|
| PRV-01 | Protected contact: no phone, email or name of the owner is ever shown publicly or sent in public API responses; contact goes through the in-app relay (sighting/message form) | S p2; S p5 ("Contato: protegido"); S p8; K 4.6 | privacy | Must | implemented | API test asserts the public serializer allowlist; E2E | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| PRV-02 | Approximate location only: neighborhood from a list, no exact address field; free text is checked for address, CEP and phone patterns | S p2 ("bairro aproximado"); K 4.6 | privacy | Must | implemented | Unit tests for the pattern checker; schema test | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| PRV-03 | Explicit consent (unticked checkbox) for publishing data and images, stored with a timestamp and policy version | S p2 ("Dados e imagens autorizados") | privacy | Must | implemented | API test rejects submissions without consent | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| PRV-04 | Access control: only the owner edits their notices and reads their sightings; only moderators reach moderation | S p8 ("controle de acesso") | security | Must | planned | API tests for 401/403 per route | planned: test log |
| PRV-05 | Secrets only in `.env` (gitignored) with a committed `.env.example`; HTTPS in production; secure cookies | S p10 ("proteção dos dados"); K 4.6 | security | Must | planned | Secret scan in CI; config review | planned: CI log |
| PRV-06 | No real personal data in seeds, fixtures, screenshots or commits | K 4.6 | privacy | Must | planned | Seed review; evidence checklist | planned: docs/evidence/README.md |
| PRV-07 | LGPD: privacy page in pt-BR, retention rules, and a deletion path (self-service account deletion plus a contact channel) | S p10 ("proteção dos dados"); K 3 | privacy | Must | implemented | E2E deletion flow; privacy page screenshot | docs/evidence/test-logs/2026-11-05_NFR-01_playwright-mobile.txt |
| PRV-08 | EXIF and GPS metadata stripped from every uploaded photo | S p2 ("bairro aproximado"), derived | privacy | Must | planned | API test uploads a geotagged JPEG and asserts no EXIF in output | planned: test log |
| PRV-09 | Rate limiting and a honeypot on the sighting, message and sign-up endpoints | S p8 ("moderação", "contatos protegidos"), derived | security | Should | planned | API test hits the limit | planned: test log |
| PRV-10 | No UPAR logo or wording that implies a partnership | S p2 ("Sem contato ou parceria confirmados"); K 1 | privacy | Must | planned | UI review checklist | planned: screenshot |
| PRV-11 | Every image used in the app and the report is the group's own, licensed or credited; the Luna photo from S p5 has no credited source and is not reused (OQ-16) | S p5; S p11 (credits cover only the UPAR image) | privacy | Must | planned | Asset inventory in `docs/evidence/README.md` | planned |
| PRV-12 | Sightings and messages are visible only to the notice owner and moderators, never publicly (OQ-08) | S p2 ("Contato protegido"), derived | privacy | Must | planned | API test | planned: test log |

## Deliverable: Entrega 4 (DLV)

One row per bullet of the brief. "B n" = section n of the brief.

| ID | Requirement | Source | Type | Priority | Status | Verification method | Evidence link |
|---|---|---|---|---|---|---|---|
| DLV-01 | Project name | B 1; S p1; R p1 | deliverable | Must | planned | Pre-submission checklist | planned: outline §1 |
| DLV-02 | Full names of all group members | B 1; S p1; R p1; OQ-02 | deliverable | Must | planned | Checklist: 9 names, confirmed spelling | planned: outline §1 |
| DLV-03 | Course semester | B 1; S p1 (5º semestre, ADS 2026/2) | deliverable | Must | planned | Checklist | planned: outline §1 |
| DLV-04 | Entity, community or target audience | B 1; S p2; S p4 | deliverable | Must | planned | Checklist | planned: outline §1 |
| DLV-05 | Short description of the problem or opportunity | B 2; S p3; S p4 | deliverable | Must | planned | Checklist | planned: outline §2 |
| DLV-06 | Objective of the solution | B 2; S p5 | deliverable | Must | planned | Checklist | planned: outline §2 |
| DLV-07 | Main planned features | B 2; S p5; S p7; R p3 | deliverable | Must | planned | Checklist | planned: outline §2 |
| DLV-08 | Presentation of the updated version | B 3 | deliverable | Must | planned | Deployed URL plus screenshots of the current build | planned: deployed URL, screenshots |
| DLV-09 | Description of implemented or improved features | B 3 | deliverable | Must | planned | Must match FR rows with status implemented/verified | planned: outline §3 table |
| DLV-10 | Screenshots, diagrams, demos or other records | B 3 | deliverable | Must | planned | Files exist under `docs/evidence/` | planned: docs/evidence/ |
| DLV-11 | Description of the tests performed (only if they happened) | B 4 | deliverable | Must | planned | Matches real logs only | planned: test logs, usability records |
| DLV-12 | Procedures used and results obtained | B 4 | deliverable | Must | planned | Usability script plus results template filled from real sessions | planned: usability records |
| DLV-13 | Failures, difficulties or limitations found | B 4 | deliverable | Must | planned | Findings list traceable to sessions or test logs | planned: findings file |
| DLV-14 | Changes made after tests or evaluations | B 5 | deliverable | Must | planned | Each change links to a finding and a commit | planned: adjustments log |
| DLV-15 | Justification of the main decisions | B 5 | deliverable | Must | planned | ADRs and open-question answers | planned: docs/adr/ |
| DLV-16 | Previous vs current version comparison, when possible | B 5 | deliverable | Should | planned | Slides concept (S p5, S p7) vs current screenshots, plus before/after screenshots of adjustments | planned: before/after screenshots |
| DLV-17 | Screenshots of the system or prototype | B 6 | deliverable | Must | planned | Files exist | planned: docs/evidence/ |
| DLV-18 | Test records | B 6 | deliverable | Must | planned | Files exist | planned: docs/evidence/ |
| DLV-19 | Updated diagrams, flows or documents | B 6 | deliverable | Must | planned | Flow diagram and data model in the repo | planned: docs/evidence/ diagrams |
| DLV-20 | Other materials proving progress (e.g. commit history, CI runs) | B 6 | deliverable | Should | planned | Link to repo, CI badge or log | planned: CI log |
| DLV-21 | Activities still to be done | B 7 | deliverable | Must | planned | Generated from matrix rows not yet verified | planned: outline §7 |
| DLV-22 | Pending features or improvements | B 7 | deliverable | Must | planned | Same as above | planned: outline §7 |
| DLV-23 | Plan to finish the project and prepare the final delivery (30/11) | B 7; S p6 | deliverable | Must | planned | Dated plan in the outline | planned: outline §7 |
| DLV-24 | Developed as group work with member participation | B "Orientações" | deliverable | Must | planned | Task owners recorded in plan.md (OQ-14) | planned: plan.md task owners |
| DLV-25 | Clear and objective organization that prioritizes showing the solution's evolution | B "Orientações" | deliverable | Must | planned | Review against the outline before upload | planned: checklist |
| DLV-26 | Only real evidence of development, tests and adjustments | B "Orientações"; K 4.4 | deliverable | Must | planned | Every claim links to an evidence file | planned: checklist |
| DLV-27 | Implemented vs planned features clearly separated | B "Orientações" | deliverable | Must | planned | "Implementado vs planejado" table generated from the matrix | planned: outline table |
| DLV-28 | If incomplete: current stage, available features and limitations | B "Orientações" | deliverable | Must | planned | Outline §3 and §7 | planned: outline §3 |
| DLV-29 | Never present tests, adjustments or evaluations that did not happen | B "Orientações"; S p9 ("Testes e feedback formal: ainda não realizados") | deliverable | Must | planned | Checklist cross-checks §4 and §5 against docs/evidence/ | planned: checklist |
| DLV-30 | One member uploads the file(s) only through the Moodle activity, before the deadline | B "Entrega da atividade" | deliverable | Must | planned | Upload confirmation screenshot | planned: screenshot |
| DLV-31 | Before upload: file complete, all members identified, evidence matches the current stage | B "Entrega da atividade" | deliverable | Must | planned | Pre-submission checklist signed off | planned: checklist |
| DLV-32 | Entrega 4 (prototype, tests and adjustments) delivered by 15/11/2026 | S p6 ("Até 15/11"); K 1 | deliverable | Must | planned | Upload date | planned: screenshot |
| DLV-33 | Final solution and final report by 30/11/2026 | S p6 ("Até 30/11") | deliverable | Must | planned | Out of Entrega 4; tracked for the next stage | planned |

## Process (PRC)

| ID | Requirement | Source | Type | Priority | Status | Verification method | Evidence link |
|---|---|---|---|---|---|---|---|
| PRC-01 | Planning gate: no app code, dependencies or scaffolding until the owner replies "approved"; afterwards only tasks in plan.md | K 4.1 | process | Must | in-progress | Git history: first code commit comes after approval | - |
| PRC-02 | Every commit, PR and task references at least one requirement ID | K 4.2 | process | Must | in-progress | `scripts/check-traceability` checks commit messages | - |
| PRC-03 | A row moves to `verified` only with an evidence link to an existing file | K 4.2 | process | Must | planned | `scripts/check-traceability` | - |
| PRC-04 | End-of-session coverage report: rows per status, source items without an ID, DLV rows without planned evidence | K 4.3 | process | Must | in-progress | Session report in chat | - |
| PRC-05 | `scripts/check-traceability` fails on unknown IDs and on `verified` rows without an existing evidence file | K 4.3 | process | Must | planned | CI step | planned: CI log |
| PRC-06 | Honesty: no fabricated tests, feedback, metrics, partnerships, screenshots or evaluations; impact and reunions are not claimed | K 4.4; S p12 ("Impacto e reencontros ainda não medidos"); S p4 ("sem medida de animais perdidos") | process | Must | in-progress | Review of the report and evidence | - |
| PRC-07 | Fictional sample data labeled fictional in the UI and in the report | K 4.4; S p5 ("Exemplo fictício") | process | Must | planned | See FR-21; report review | - |
| PRC-08 | Scope control: only what is in this matrix is built | K 4.5 | process | Must | in-progress | PR review | - |
| PRC-09 | Quality gates before every commit in the implementation phase: lint, typecheck, tests and build pass, with the numbers reported | K 4.8 | process | Must | planned | CI plus a local run | planned: CI log |
| PRC-10 | Ask, don't guess: conflicts and gaps go to `docs/open-questions.md` | K 4.9 | process | Must | in-progress | open-questions.md | - |
| PRC-11 | Git: feature branches, never commit to main, small commits, one-line messages up to 72 chars, no emoji, no AI attribution | K 3 | process | Must | in-progress | `git log` review | - |
| PRC-12 | Code, identifiers and commit messages in English; UI and Entrega 4 report in pt-BR | K 3 | process | Must | in-progress | Review | - |
| PRC-13 | Usability task 1: publish the fictional Luna notice; observe completion, time and doubts in the form | S p9 | process | Must | planned | Usability session record | planned: usability record |
| PRC-14 | Usability task 2: find a notice by neighborhood; observe how easy it is to find and compare data | S p9 | process | Must | planned | Usability session record | planned: usability record |
| PRC-15 | Usability task 3: register a sighting and update the case; observe clarity of actions and navigation difficulties | S p9 | process | Must | planned | Usability session record | planned: usability record |
| PRC-16 | Evaluate with colleagues, residents and invited protectors | S p9 ("Depois: avaliar com colegas, moradores e protetores convidados"); S p6 | process | Should | planned | Participant log (no personal data) | planned: usability record |
| PRC-17 | Cycle: evaluate (record difficulties), adjust (prioritize fixes), re-evaluate (check the improvement) | S p10 | process | Must | planned | Findings, then adjustments log, then re-test record | planned: adjustments log |
| PRC-18 | Responsibilities split among the 9 members and recorded | S p6 ("Divisão de responsabilidades: pendente"); S p12; R p1; R p3 | process | Must | planned | Owner column in the plan.md task list (OQ-14) | - |
| PRC-19 | Maintenance plan: who moderates, who updates cases, hosting and data protection owners | S p10 ("Manutenção a planejar") | process | Should | planned | Section in the final report (30/11) | planned |
| PRC-20 | Research questions answered with evidence: which data helps the search, where the public struggles, what existing services already cover | S p6 ("O que investigar") | process | Should | planned | Usability findings plus a short comparison of existing services | planned: docs/research/ |
| PRC-21 | Validate demand ("Validação da demanda") | S p12 ("O que falta") | process | Should | planned | Usability sessions plus questions to protectors (PRC-16) | planned: usability record |
| PRC-22 | Next presentations: a visual or functional prototype and tighter time management | R p4 | process | Could | planned | Demo script for the final presentation | planned |

## Explicitly excluded or context-only source items

| Source item | Source | Decision | Reason |
|---|---|---|---|
| Integration with the Meu Pet microchip registry | S p3; S p7 | out-of-scope | No API or partnership; the portal complements it. FR-03 keeps a microchip yes/no/unknown field and never stores the chip number |
| UPAR activities: rescue and rehabilitation | S p2 | out-of-scope | UPAR's work, not a portal feature. Adoption is handled by FR-20 |
| UPAR 2023 numbers (160 dogs, 23 cats, 17 in foster homes) | S p4 | context-only | Used in the report recap (DLV-05), always with the slide's caveat that there is no measure of lost animals |
| Figma prototypes | S p8 | out-of-scope | No Figma file exists; the 15/11 prototype is functional code. The report must not claim Figma work (OQ-04) |
| Seminar logistics (22/10/2026, room D112, 21h20 to 21h35, SUAP link, 48 registered, 73 present) | R p2 | context-only | Historical record of Entrega 3; 48 vs 73 flagged in OQ-03 |
| Thematic area "Programação" | R p2 | context-only | Classification only |
| Theme origin (idea from Pedro, NGO focus) | R p3 | context-only | Background for the recap |
| Course milestones 21/10 and 22/10 | S p6 | context-only | Already past |
| Bibliographic references (Prefeitura de Indaiatuba, Jornal Mais Expressão) | S p11 | context-only | Reused as references in the report recap (DLV-05) |
| Report annex links (Apresentação, Versão de Estudo, Fotos Extras) | R p6 | context-only | Link targets cannot be read from the PDF (OQ-15) |
| Signatures (gov.br, 23 to 24/10/2026) | R p5; R p6 | context-only | Historical; also the strongest source for official name spelling (OQ-02) |
| ADS knowledge applied (software engineering, UX/UI, architecture, web, databases) | S p8; R p5 | context-only | Covered by NFR-03, NFR-07 and the plan |
| IFCIENCIA was the first feedback round with faculty and community | S p9; R p4 | context-only | Only feedback on record is Prof. Diego's (FR-20); nothing else may be reported as feedback (PRC-06) |
| Expected contribution: make it easier to publish and look up lost-animal notices | S p12 | context-only | Restates the objective (DLV-06) |
