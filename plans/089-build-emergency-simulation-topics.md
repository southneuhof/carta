# Plan 089: Implement emergency simulation topics

Status: DONE

Verified: 2026-08-19 by focused checks, idempotent seed, authenticated Codex
browser journey, and independent read-only module verification (`PASS`).

Design: `docs/superpowers/specs/2026-08-19-emergency-simulation-topics-design.md`

Manifest: `plans/089-build-emergency-simulation-topics.module.json`

The user approved exact legacy parity by requesting this module be made
identical. Execute this plan in the current dirty worktree. Preserve unrelated
changes. Do not change framework packages or add compatibility routes.

## Ownership and acceptance matrix

- API owner: `apps/api/src/routes/emergency-simulation-topics/`
- Web owner: `apps/web/src/routes/(authenticated)/master-data/emergency-simulation-topics/`
- Navigation: `master-data`, `Emergency Simulation`, after
  `master-data-number-configs`
- Relation owner: none
- Permissions: six `system` permissions derived from the module slug
- Seed: five legacy names, owned by the module seed file and called by
  `apps/api/scripts/seed.ts`

| Field | Legacy label | API create | API update | List/detail | Renderer | Source | Server supplied |
|---|---|---:|---:|---:|---|---|---|
| `name` | `Nama` | required | yes | yes | text | no | no |
| `code` | `Kode` | nullable unique | yes | no | none | no | no |
| `description` | `Deskripsi` | nullable | yes | no | none | no | no |
| `active` | `Status` | default true | yes | no | none | no | yes |
| audit fields | — | no | no | no | none | no | yes |

| Surface | Legacy evidence | New route/action | Status |
|---|---|---|---|
| List entry | legacy menu and config | `/master-data/emergency-simulation-topics`, `resource.list()` | PASS |
| List row | shared `BaseCRUD` | standard detail, edit, delete row actions | PASS |
| Detail | shared `CRUDDetail` | `/:emergencySimulationTopicId/detail`, `resource.detail()` | PASS |
| Create | shared `CRUDCreate` | `/create`, `FormView` | PASS |
| Edit | shared `CRUDUpdate` | `/:emergencySimulationTopicId/edit`, `FormView` | PASS |
| Child row | no legacy child | none | NOT NEEDED |
| Workflow action | no legacy workflow | none | NOT NEEDED |

| Label | Legacy | New | Status |
|---|---|---|---|
| Page/list heading | `Topik Simulasi Tanggap Darurat` | same | PASS |
| Field | `Nama` | same | PASS |
| Create heading | `Tambah Topik Simulasi Tanggap Darurat` | same | PASS |
| Detail heading | `Detail Topik Simulasi Tanggap Darurat` | same | PASS |
| Edit heading | `Ubah Topik Simulasi Tanggap Darurat` | same | PASS |
| Submit | `Submit` | same | PASS |
| Create/update success | `Berhasil menambahkan data!` / `Berhasil mengubah data!` | same | PASS |
| Validation | `Harus diisi!` | API/resource validation | APPROVED DIFFERENCE |
| Delete chrome | `Data berhasil dihapus!` | standard framework delete chrome | APPROVED DIFFERENCE |

## Implementation

1. Run the scaffold command with this manifest and review all generated paths.
2. Run guarded integration with `--check`, then `--apply`.
3. Add the legacy audit columns, validation, code normalization, and API
   authorization behavior. Keep the resource projection to `name` only.
4. Generate and apply the Drizzle migration. Add central route and manifest
   assertions for the four URLs and the navigation separator.
5. Run the focused API and web checks, type checks, lint, seed twice, and
   `git diff --check`.
6. Verify list, create, detail, edit, delete, reload, and exact labels in the
   authenticated Codex browser. Then run the independent verifier.

## Commands

```sh
pnpm scaffold:master-data --config /Users/gamer/Documents/projects/ads-hk/plans/089-build-emergency-simulation-topics.module.json --json
pnpm integrate:master-data --manifest /Users/gamer/Documents/projects/ads-hk/plans/089-build-emergency-simulation-topics.module.json --check
pnpm integrate:master-data --manifest /Users/gamer/Documents/projects/ads-hk/plans/089-build-emergency-simulation-topics.module.json --apply
pnpm verify:module --manifest /Users/gamer/Documents/projects/ads-hk/plans/089-build-emergency-simulation-topics.module.json --check-only
pnpm verify:module --manifest /Users/gamer/Documents/projects/ads-hk/plans/089-build-emergency-simulation-topics.module.json --run --with-seed
```

## Copied module acceptance checklist

- [x] Module owner, relation owner, legacy reference, sibling pattern, and
  design path are recorded above.
- [x] Field inventory and route/action matrix are complete.
- [x] Legacy labels are copied exactly. Differences are recorded as approved.
- [x] Database, API schema, operation, resource, and route field names match.
- [x] API authentication and allowed/denied permission checks pass.
- [x] Seed runs twice and produces the five expected records.
- [x] Standard `ListView`, `DetailView`, and `FormView` surfaces work.
- [x] First load and reload after create, update, and delete work.
- [x] Focused API tests pass.
- [x] Focused web tests pass.
- [x] API/web type checks and lint pass.
- [x] `git diff --check` passes.
- [x] Authenticated Codex browser journey is recorded.
- [x] `$verify-ads-hk-module` returns `PASS`.
- [x] No framework package changed.

## Independent verifier report

VERDICT: PASS  
MODULE: `emergency-simulation-topics`  
PLAN: `plans/089-build-emergency-simulation-topics.md`  
DESIGN: `docs/superpowers/specs/2026-08-19-emergency-simulation-topics-design.md`  
LEGACY: `/Users/gamer/Documents/projects/ads-hk-legacy`; model, migration,
seed, config, menu, list surface, shared CRUD labels  
PARITY: PASS; exact visible field, title, route group, five seed names, and
standard CRUD actions match  
CONTRACT: PASS; migration, authenticated API, normalized resource, and four
standard routes align  
LABELS: PASS; validation and delete chrome are the approved repository
framework differences  
CHECKS: manifest static PASS; API 2/2, web 11/11, focused lint, API/web type
checks, two seed runs, migration, and `git diff --check` PASS  
BROWSER: `http://localhost:5173/master-data/emergency-simulation-topics`;
authenticated list, create, detail, edit, reload, approved test-row delete,
post-delete reload, exact labels, success messages, and five seed rows PASS;
test row `e722a7ba-e9d3-4a3a-8b78-c50478fbe2c6`  
REWORK: None  
BLOCKER: None

## Reuse record

- Reused: manifest scaffold, guarded integration, `permit-danger-source` API
  and resource CRUD shape, standard View shells, route map generation.
- Searched: legacy model/config/seed/menu/shared CRUD, current API/web siblings,
  route and navigation tests, framework architecture.
- Gap: scaffold does not add audit-aware validation or code normalization, so
  those small module-local pieces are added to the generated API files.
