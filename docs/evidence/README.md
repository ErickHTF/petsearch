# Evidence

Proof of real work, used by `docs/requirements.md` (Evidence link column) and the Entrega 4 report.

## Core rule

Evidence is added **only from real runs**: real test executions, real screenshots of the current build, real usability sessions. Never edit, stage or simulate an evidence file (PRC-06, DLV-26, DLV-29). If something did not happen, there is no file for it.

## File naming

```
YYYY-MM-DD_<requirement-id>_<short-desc>.<ext>
```

- Date = the day the run happened (not the day the file was committed).
- One primary requirement ID; mention others inside the file.
- `short-desc` in lowercase kebab-case English.
- Examples: `2026-11-11_FR-08_filter-by-neighborhood-360px.png`, `2026-11-11_NFR-03_axe-report.json`, `2026-11-12_PRC-13_usability-P1.md`.

## Layout

```
docs/evidence/
  README.md
  findings.md          usability and test findings (F-01, F-02, ...)
  adjustments.md       changes made from findings (PRC-17, DLV-14)
  assets.md            image inventory: file, source, license (PRV-11)
  screenshots/         .png, mobile 360px unless the name says otherwise
  test-logs/           CI or local output of unit, API, E2E, axe, Lighthouse
  usability/           one .md per session from the plan.md template
  recordings/          short screen recordings (.mp4/.webm, keep under 20 MB)
  diagrams/            flow and data model (.svg/.png plus source)
```

## Requirements for each kind

- **Screenshots:** taken from the build of the commit recorded in the file or commit message; fictional data only; the "Exemplo fictício" badge must be visible on seeded notices; no real names, emails or phones (PRV-06).
- **Test logs:** raw tool output with the commit hash and date at the top; do not trim failures.
- **Usability records:** participants identified only as P1, P2, ...; record verbal consent; literal quotes, no paraphrase that changes meaning.
- **Recordings:** no faces or voices of participants without written consent.

## Linking from the matrix

A requirement becomes `verified` only when its Evidence column lists a path such as `docs/evidence/test-logs/2026-11-11_FR-08_api-filters.txt` and that file exists. `scripts/check-traceability` enforces this (PRC-03, PRC-05).
