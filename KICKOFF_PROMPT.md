You are starting a new project: PETSEARCH, a mobile-first web portal for lost and found animals in Indaiatuba (SP, Brazil), built for a university extension project (IFSP Campus Salto, ADS, 5th semester, 2nd semester 2026, coordinator Prof. Leonel Cardoso Leal). Target audience: pet owners (tutores), residents (moradores), independent animal protectors and volunteers; reference entity: UPAR (Uniao Protetora dos Animais de Rua) - no contact or partnership confirmed yet.

THIS SESSION IS PLANNING ONLY. Do not scaffold the app, install packages, or write application code. The only files you may create are the planning documents listed below. Implementation starts in a later session, after I approve the plan.

## 0. Setup

1. Work in the existing repo `/Users/erick/Projects/petesearch/` (already has git, `main` and `origin/main`). Create and work on a branch `docs/planning` (never commit to `main`). Keep the existing `README.md` and `KICKOFF_PROMPT.md`.
2. Copy (do not move) the source files into `docs/sources/`:
   - `/Users/erick/Downloads/IFCIÊNCIA 2026.pptx.pdf` -> `docs/sources/ifciencia-2026-slides.pdf`
   - `/Users/erick/Downloads/Relatorio_Pos-IFCIENCIA_assinado_%281%29_assinado_assinado_assinado_assinado_assinado.pdf` -> `docs/sources/relatorio-pos-ifciencia.pdf`
   (the second filename contains a literal `%281%29`; if `cp` is blocked by macOS permissions on Downloads, use the Read tool on the original path and tell me to copy the files manually.)
3. Save the assignment brief below (Entrega 4), verbatim in Portuguese, to `docs/sources/entrega-4-brief.md`.
4. Read BOTH PDFs completely, page by page, including images, tables and footnotes. Do not skim.

## 1. Source facts you must account for (non-exhaustive; the PDFs are the authority)

From the slides:
- Problem: separate microchip registries (Meu Pet program, Indaiatuba 2024) make it hard to identify the owner of a found animal. Need: return found animals to owners.
- Objective: organize lost and found animal notices in Indaiatuba.
- Proposed features: photos and characteristics; filters by neighborhood (bairro) and date; sightings (avistamentos) and case updates.
- Core flow: 1) owner publishes notice -> 2) resident searches by neighborhood and characteristics -> 3) resident submits a sighting -> 4) owner reviews and updates the case.
- Privacy and safety: protected contact, approximate neighborhood only (no exact address), authorized data and images, access control, moderation.
- Candidate architecture: React + TypeScript frontend, Node.js API, MongoDB.
- UX: mobile navigation, accessibility (slides mention Figma prototypes; none were provided).
- Validation tasks planned: publish the fictional "Luna" notice (medium-size dog, caramel coat, status lost, contact protected); search a notice by neighborhood; register a sighting and update the case. Observe completion, time, form doubts, ease of comparing data, clarity of actions, navigation difficulties.
- Maintenance: moderation of notices, case updates, hosting and data protection. Future evolution (only after the basic flow is validated, with costs and owners defined): notifications and maps.
- Timeline: by 31/10 feedback and requirements; by 15/11 prototype, tests and adjustments (this is Entrega 4); by 30/11 final solution and report. Today is 2026-11-05.
- Open research questions: which data helps the search, where the public struggles, what existing services already cover.

From the post-IFCIENCIA report:
- Feedback from Prof. Diego: add a section for responsible adoption (animals available for adoption). Classify it explicitly as in-scope or planned; do not silently drop it or silently add it.
- Group: 9 members, leader Pedro Eduardo Malfatti Valim, with roles listed in the report.
- Learned: presentation time was tight; next time show a visual or functional prototype.

Known inconsistencies to flag, not resolve on your own:
- Member names differ between slides and report (e.g. "Mario Henrique Martins Alves Pedrao" vs "Mario Henrique Alves Martins Pedrao"; "Erick Henrique Toaliari Fortunato" vs "Erick Henrique Fortunato").
- Report says 48 registered and 73 present at the seminar.
- Slides mention Figma; no UI design file exists. Visual identity must come from the slide deck (IFSP green, navy headings) and must be confirmed by me.

## 2. Entrega 4 rubric (every item is a mandatory requirement)

The deliverable for 15/11 must contain:
1. Identification: project name; full names of all members; course semester; target entity/community/audience.
2. Proposal recap: problem or opportunity; objective of the solution; main planned features.
3. New prototype version: presentation of the updated version; implemented or improved features; screenshots, diagrams, demos.
4. Tests performed (if any): what was tested; procedures and results; failures, difficulties, limitations.
5. Adjustments: changes made after tests or evaluations; justification of key decisions; previous vs current version comparison.
6. Development evidence: screenshots; test records; updated diagrams, flows, documents; other proof of progress.
7. Next steps: remaining activities; pending features; plan to finish and prepare the final delivery.
Rules: group work; clear and objective; real evidence only; clearly separate implemented vs planned features; if incomplete, state current stage, available features and limitations; NEVER present tests, adjustments or evaluations that did not happen; verify all members are identified and evidence matches the current state before upload to Moodle.

## 3. Planning deliverables (create these files, nothing else)

`AGENTS.md` (root) - the single source of rules for any AI agent or human working in this repo. Include:
- Project summary and links to every file in `docs/`.
- Mandatory reading order before any change: `AGENTS.md` -> `docs/requirements.md` -> `docs/plan.md` -> relevant ADRs.
- Guardrails (see section 4), written as MUST / MUST NOT rules.
- Conventions: code, identifiers and commit messages in English; all UI text in pt-BR; Entrega 4 report content in pt-BR.
- Git rules: feature branches, small commits, one-line messages up to 72 chars, no emoji, no AI attribution or Co-Authored-By lines.
- Definition of Done per task (see section 4).
- Also create `CLAUDE.md` containing only `@AGENTS.md` so Claude Code loads it.

`docs/requirements.md` - traceability matrix. One row per atomic requirement with columns:
`ID | Requirement | Source (file + page/section) | Type (functional, non-functional, privacy, deliverable, process) | Priority (MoSCoW) | Status (planned, in-progress, implemented, verified, deferred, out-of-scope) | Verification method | Evidence link`.
ID prefixes: `FR-` features, `NFR-` quality, `PRV-` privacy/security, `DLV-` Entrega 4 rubric items (one row per bullet in section 2), `PRC-` process rules.
Every fact in section 1 and every bullet in section 2 must map to at least one row or be listed under "Explicitly excluded" with a reason.

`docs/plan.md` - implementation plan for the next session:
- MVP scope for 15/11 vs scope for 30/11 vs future. Be realistic about a 10-day window.
- Recommended stack with short justification, honoring the slides (React + TypeScript, Node.js, MongoDB) unless you give a concrete reason to deviate. Cover: build tool, styling, routing, forms and validation, API framework, schema validation shared between client and server, image upload/storage, auth for owners and moderators, local dev with Docker for MongoDB, hosting options with zero or low cost, PWA support.
- Screens and routes (mobile-first, 360px baseline), each mapped to FR IDs.
- Data model (Notice, Sighting, Animal characteristics, User, Moderation, AdoptionListing if in scope) with fields, indexes and which fields are public vs protected.
- How "protected contact" works concretely (e.g. relay form or masked contact, no phone/email exposed publicly) and how "approximate neighborhood" is enforced.
- LGPD considerations: consent for photos and data, data retention, deletion request path.
- Testing strategy: unit, API integration, E2E on mobile viewport, accessibility checks (WCAG 2.2 AA), plus a usability test script based on the three Luna tasks with a results template.
- Ordered task list, each task referencing requirement IDs and with acceptance criteria.

`docs/adr/0001-stack.md` (and more ADRs only if a decision needs one) - context, decision, alternatives, consequences.

`docs/entrega-4/outline.md` - skeleton of the Moodle deliverable in pt-BR with sections 1 to 7, each section listing the DLV IDs it satisfies and the evidence it will need (to be filled during implementation). Include an "Implemented vs planned" table and a pre-submission checklist mirroring the rubric rules.

`docs/evidence/README.md` - folder convention for screenshots, test logs and recordings: file naming `YYYY-MM-DD_<requirement-id>_<short-desc>.<ext>`, and the rule that evidence is only added from real runs.

`docs/open-questions.md` - every ambiguity, inconsistency (section 1) and decision that needs my or the group's input, each with your recommendation.

## 4. Guardrails (write into AGENTS.md and obey them now)

1. Planning gate: no application code, dependencies or scaffolding until I reply "approved" to the plan. Afterwards, implement only tasks listed in `docs/plan.md`.
2. Traceability: every commit, PR and task references at least one requirement ID. A requirement can only move to `verified` with an evidence link that exists in the repo.
3. Coverage check: at the end of each work session, re-read the sources and `docs/requirements.md` and report: requirements per status, any source item without an ID, any DLV item without planned evidence. Plan a script (`scripts/check-traceability`) for the implementation phase that fails if an ID is referenced but missing, or if a `verified` row has no existing evidence file.
4. Honesty: never fabricate test results, user feedback, metrics, partnerships, screenshots or evaluations. Fictional sample data (like "Luna") must be labeled as fictional in the UI and the report. Unknown means "not yet done", never invented.
5. Scope control: anything not in `docs/requirements.md` is out of scope until added there with a source or my approval. Notifications and maps stay "future" unless I decide otherwise.
6. Privacy by default: no exact address, phone or email shown publicly; no real personal data in seeds, fixtures, screenshots or commits; secrets only in `.env` (gitignored) with a `.env.example`.
7. Mobile-first quality bar for every screen: 360px baseline, touch targets at least 44x44px, no horizontal scroll, safe-area aware, visible focus, labels on all inputs, AA contrast, loading/empty/error states designed.
8. Quality gates before any commit (implementation phase): lint, typecheck, tests and build pass; report the numbers. If something fails, say so and do not mark tasks done.
9. Ask, do not guess: if sources conflict or do not cover a case, add it to `docs/open-questions.md` and ask.

## 5. Output of this session

When the files are written:
- Commit them on `docs/planning` with a single short commit message.
- Reply with: a summary table of requirement counts by type and priority; the MVP for 15/11 in up to 8 bullets; the top open questions that block implementation; any source item you could not map. Keep it concise. Then stop and wait for my approval.

## Assignment brief (save verbatim to docs/sources/entrega-4-brief.md)

Projeto de Extensão – Soluções Tecnológicas para a Comunidade

Atividade – Entrega 4: Nova Versão do Protótipo, Testes, Ajustes e Evidências

Nesta quarta etapa do Projeto de Extensão 2º Semestre 2026, os grupos deverão dar continuidade ao desenvolvimento da solução tecnológica proposta, apresentando sua evolução por meio de uma nova versão do protótipo ou da solução, dos testes realizados, dos ajustes implementados e das evidências que demonstrem o trabalho desenvolvido.

O objetivo é verificar como a proposta evoluiu desde as etapas anteriores, quais melhorias foram realizadas e de que maneira a solução está avançando para atender às necessidades do público-alvo.

Objetivo da atividade
Apresentar a versão atualizada do protótipo ou da solução tecnológica, documentar os testes realizados, registrar os ajustes efetuados e reunir evidências que demonstrem a evolução do projeto.

O que deverá ser entregue?
1. Identificação do projeto
- Nome do projeto;
- Nome completo dos integrantes do grupo;
- Semestre do curso;
- Entidade, comunidade ou público-alvo a que a solução se destina.
2. Retomada da proposta
- Breve descrição do problema ou da oportunidade identificada;
- Objetivo da solução tecnológica;
- Principais funcionalidades ou características previstas.
3. Nova versão do protótipo ou da solução
- Apresentação da versão atualizada;
- Descrição das funcionalidades implementadas ou aprimoradas;
- Capturas de tela, diagramas, demonstrações ou outros registros que permitam compreender a solução.
4. Testes realizados (caso ocorra)
- Descrição dos testes efetuados para verificar o funcionamento da solução;
- Apresentação dos procedimentos utilizados e dos resultados obtidos;
- Identificação de falhas, dificuldades ou limitações encontradas, quando houver.
5. Ajustes e melhorias
- Descrição das alterações realizadas após os testes ou avaliações;
- Justificativa para as principais decisões tomadas;
- Comparação entre a versão anterior e a versão atual, quando possível.
6. Evidências do desenvolvimento
- Capturas de tela do sistema ou protótipo;
- Registros de testes;
- Diagramas, fluxos ou documentos atualizados;
- Outros materiais que comprovem a evolução do trabalho.
7. Próximos passos
- Atividades que ainda precisam ser realizadas;
- Funcionalidades ou melhorias pendentes;
- Planejamento para a conclusão do projeto e preparação da entrega final.

Orientações importantes
- A atividade deverá ser desenvolvida em grupo, com a participação dos integrantes.
- Organizem suas pesquisas, de forma clara e objetiva, priorizando a demonstração da evolução da solução.
- Apresentem evidências reais do desenvolvimento, dos testes e dos ajustes realizados.
- Diferenciem as funcionalidades já implementadas daquelas que ainda estão planejadas.
- Caso a solução ainda não esteja totalmente implementada, apresentem o estágio atual, as funcionalidades disponíveis e as limitações encontradas.
- Não apresentem como realizados testes, ajustes ou avaliações que não tenham ocorrido.

Entrega da atividade
- Após concluir esta atividade, um integrante do grupo deverá enviar o(s) arquivo(s) exclusivamente por esta atividade no Moodle, dentro do prazo estabelecido.
- Antes do envio, verifiquem se o arquivo está completo, se todos os integrantes estão identificados e se as evidências apresentadas correspondem ao estágio atual da solução.

Atenção: nesta etapa, o foco está em demonstrar a evolução prática do projeto. Mais do que apresentar uma ideia, o grupo deverá mostrar o que foi desenvolvido, o que foi testado (caso tenha ocorrido), quais melhorias foram realizadas e quais pontos ainda precisam ser aprimorados.
