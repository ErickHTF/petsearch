# Open questions

Each entry: the question, why it matters, a recommendation, and who decides. "Blocks" lists the tasks in `docs/plan.md` that cannot finish without an answer. Record the answer and date under each item when decided.

## Blocking implementation

### OQ-01 Adoption section: in scope for the MVP, planned for 30/11, or future?
- Source: Prof. Diego's suggestion (R p4, R p5); "Adoção responsável" also appears as a UPAR activity (S p2).
- Recommendation: **planned for 30/11, not in the 15/11 MVP.** The 10-day window is needed for the core lost/found flow and real tests. If built, reuse the Notice model (`type: adoption`), published only by moderators or protectors. The report should cite the suggestion as feedback received and list it under "Próximos passos".
- Decides: group. Blocks: none for 15/11; FR-20 for 30/11.
- Answer:

### OQ-06 "Found animal" notices in the MVP?
- Source: the objective says "perdidos e encontrados" (S p5, R p3), but the 4-step flow only describes the owner's lost notice (S p7).
- Recommendation: **yes**, as a `type` field on the same Notice (small cost, same screens). A resident holding a found animal is a common case.
- Decides: owner. Blocks: T05, T10.
- Answer:

### OQ-08 Sighting visibility and moderation timing
- Should sightings be public under the notice or visible only to the owner? Should notices be reviewed before or after publishing?
- Recommendation: **sightings visible only to the owner and moderators** (they may contain precise hints and the reporter's contact), with the owner able to turn a useful one into a public timeline note. **Post-moderation**: notices go live immediately and moderators can hide them, because pre-moderation needs someone on call, which nobody is for a prototype.
- Decides: owner. Blocks: T07, T11.
- Answer:

### OQ-09 Protected contact mechanism
- Recommendation: **in-app relay** (section 5 of plan.md): the visitor sends a sighting or message and the owner reads it in their inbox; no email is sent because notifications are future (FR-23). Alternative: email relay via a transactional provider (needs an account, a domain and costs, and is effectively a notification).
- Decides: owner. Blocks: T07.
- Answer:

### OQ-11 Official list of Indaiatuba neighborhoods
- Filters depend on a fixed list. It must not be invented.
- Recommendation: the group provides the list from a public source (Prefeitura de Indaiatuba, CEP/IBGE data) and records the source. Until then, the seed uses a few clearly named neighborhoods plus "Outro / não sei". Note that the slide's Luna uses "Bairro: Exemplo".
- Decides: group. Blocks: T03 (list content), not structure.
- Answer:

### OQ-12 Hosting accounts and ownership
- Recommendation: the app's Docker image on Render (free web service) + Neon (free PostgreSQL), created with a **group** email so access does not depend on one person; credentials shared through a password manager, never in the repo. Check the current free-tier terms before creating accounts (Render's free PostgreSQL has had an expiry period).
- Decides: group. Blocks: T13.
- Answer:

### OQ-14 Who does what (9 members)
- Slides: "Divisão de responsabilidades: pendente" (S p6); report lists roles (R p1, R p3) but not development tasks. The brief requires group participation (DLV-24).
- Recommendation: assign an owner per task T01 to T17 in plan.md, for example 2 people on API, 2 on web, 1 on tests/a11y, 2 running usability sessions, 2 on the report and evidence, and record it before T01 starts.
- Decides: group (leader Pedro). Blocks: DLV-24, PRC-18.
- Answer:

### OQ-13 Usability test participants and dates
- Recommendation: at least 3 participants on 12-13/11 (colleagues, and residents if possible), with verbal consent, no personal data recorded. Invited protectors in the 30/11 round (PRC-16).
- Decides: group. Blocks: T15.
- Answer:

## Decided

### OQ-25 Database and runtime
- The slides propose MongoDB (S p8). Asked on 2026-11-05 whether to change the stack.
- Answer (project owner, 2026-11-05): keep Node.js and React; **use PostgreSQL instead of MongoDB; run the app in containers**. Recorded in ADR 0001. The Entrega 4 report must mention the change and its reason (DLV-15).

## Inconsistencies in the sources

### OQ-02 Member name spelling
- Slides p1 and the report's signature table (R p5, R p6, matching the gov.br signatures) use "ERICK HENRIQUE TOALIARI FORTUNATO" and "MARIO HENRIQUE MARTINS ALVES PEDRAO". The report's participants table (R p1) uses "Erick Henrique Fortunato" and "Mário Henrique Alves Martins Pedrão". Accents also differ elsewhere (Júnior/JUNIOR, André/ANDRE).
- Recommendation: use the **gov.br signature form** (it reflects official records), with accents confirmed by each member, and the same form in every deliverable.
- Decides: each member. Blocks: DLV-02.
- Answer:

### OQ-03 48 registered vs 73 present
- R p2 reports more attendees than registrations. Possible (walk-ins), but unexplained.
- Recommendation: do not repeat these numbers in Entrega 4 unless someone confirms them against SUAP.
- Decides: group.
- Answer:

### OQ-04 Figma prototypes
- S p8 mentions "protótipos no Figma"; no Figma file exists.
- Recommendation: the report states that the group went straight to a functional prototype; never claim Figma work.
- Decides: owner.
- Answer:

### OQ-05 Visual identity
- No design file. The deck uses IFSP green (about #00A651 to #00B050) for accents and the bottom bar, and navy (about #1F3864) for headings.
- Recommendation: own identity for PETSEARCH using a green/navy palette tuned for AA contrast (green on white fails AA for normal text, so use navy for text and green only for large elements or with dark text), **without the IFSP or UPAR logos inside the app**; IFSP branding stays in the report.
- Decides: owner. Blocks: T08 (tokens), not structure.
- Answer:

### OQ-16 The Luna photo on slide 5
- The photo has no source in the credits (S p11 credits only the UPAR image).
- Recommendation: do not reuse it. Use a CC0/licensed image (or the group's own pet photo with consent) for Luna, labeled fictional, and list it in `docs/evidence/assets.md`.
- Decides: owner.
- Answer:

### OQ-22 Responsibility split: slides vs report
- S p6 and S p12 say it is pending; R p1 and R p3 list roles. Recommendation: treat the report (later) as current, and extend it with development tasks (OQ-14).
- Answer:

## Other decisions

### OQ-07 Can sightings be sent without an account?
- Recommendation: **yes**. Requiring sign-up would lose most residents at the moment they see the animal. Protection comes from rate limiting, a honeypot, owner-only visibility and moderator hide (PRV-09, PRV-12, FR-17).
- Decides: owner. Blocks: T07.
- Answer:

### OQ-10 Authentication method
- Recommendation: email + password with server sessions (ADR 0001). No email verification in the MVP (no email provider), which is a known limitation for the report. Magic link or Google sign-in only if the group accepts an extra provider.
- Answer:

### OQ-15 Report annex links
- R p6 links "Apresentação", "Versão de Estudo" and "Fotos Extras"; the targets cannot be read from the PDF. Are they needed for Entrega 4 (e.g. as evidence of the previous version)?
- Answer:

### OQ-17 Mentioning UPAR in the app
- Recommendation: text only on the About page ("entidade de referência pesquisada, sem parceria ou contato confirmados"); no logo (PRV-10).
- Answer:

### OQ-18 Entrega 4 file format
- The brief says "arquivo(s)" without a format. Recommendation: a single PDF in pt-BR, generated from `docs/entrega-4/outline.md` once filled, with the deployed URL and repo link.
- Answer:

### OQ-19 Repo and folder name
- Local folder is `petesearch`, the remote is `ErickHTF/petsearch`. Recommendation: rename the local folder to `petsearch` when convenient; no code impact.
- Answer:

### OQ-20 Retention periods and privacy contact
- Recommendation in plan.md section 6 (closed notices deleted after 90 days, inactive notices hidden after 90 days, account deletion within 24 h, requests answered within 15 days). Needs a group email address for privacy requests.
- Answer:

### OQ-21 Prof. Diego's full name
- Needed to credit the feedback correctly in the report.
- Answer:

### OQ-23 Role of protectors and volunteers
- S p4: "Conferir informações e encaminhar os casos". Recommendation: for 15/11 the moderator role covers it; for 30/11 decide whether protectors get their own role (e.g. publish adoption listings, mark a notice as "verificado").
- Answer:

### OQ-24 Microchip field
- Recommendation: a "possui microchip: sim/não/não sei" field only; never store or show the chip number (out of scope: registry integration).
- Answer:
