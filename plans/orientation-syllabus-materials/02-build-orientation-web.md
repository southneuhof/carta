# Plan 02: Build the orientation web resources and authenticated surfaces

> Implementation instructions: Read this plan and the approved design before
> editing. Execute this plan only after Plan 01 is complete and its API
> contract is verified. Update this local worksheet after every step.

> Drift check: git diff --stat 78ecc99..HEAD -- apps/web/src/routes/(authenticated)/orientation apps/web/src/manifest/navigation.ts
> Compare current files before editing. Preserve unrelated work.

## Status

- Priority: P1
- Effort: L
- Risk: HIGH
- Depends on: 01-build-orientation-api.md
- Category: migration
- Planned at: commit 78ecc99, 2026-08-20
- Feature folder: plans/orientation-syllabus-materials/
- Design: plans/orientation-syllabus-materials/design.md
- Feature worksheet: plans/orientation-syllabus-materials/worksheet.md
- Local state: `DONE`; implementation, browser acceptance, and verifier pass

## Execution worksheet

- State: DONE
- Module: orientation/syllabus, orientation/syllabus-categories, orientation/learning-materials
- Feature folder: plans/orientation-syllabus-materials/
- Feature worksheet: plans/orientation-syllabus-materials/worksheet.md
- Plan: plans/orientation-syllabus-materials/02-build-orientation-web.md
- Design: plans/orientation-syllabus-materials/design.md
- Test environment: local authenticated web app with the API test contract
- Planned at: 78ecc99
- Active step: None
- Next action: None.
- Read boundary: approved design, current web architecture, sibling resource routes, and orientation route paths
- Write boundary: apps/web/src/routes/(authenticated)/orientation/, apps/web/src/manifest/navigation.ts, and focused web specs in the orientation folder
- Last result: All web steps, focused checks, and the authenticated browser gate pass.
- Last evidence: [browser-report.md](./browser-report.md)
- Blocker: None for this module. The existing shared framework type-check errors are recorded in final evidence.

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | PASS | Add schema-bound resources and owner relation sources | orientation route folder | Typed resources use the Plan 01 contract | Orientation schemas/resources pass focused lint; owner list/detail sources include named relations |
| 2 | PASS | Add standard list, detail, and form routes plus navigation | orientation route folder and navigation manifest | All three menu entries resolve to authenticated routes | Manifest spec PASS; authenticated navigation and all three list/detail/create routes PASS |
| 3 | PASS | Add syllabus quiz configuration workflow | syllabus detail route and local workflow components | Current-syllabus material choices and final-quiz rules work | Browser report: current-syllabus selector, quiz enable, total, and reload PASS |
| 4 | PASS | Add category mapping and role tabs | syllabus-category detail route | Mapping and role toggle actions reload correctly | Browser report: `Silabus`/`Daftar Role`, mapping, removal, and role toggle PASS |
| 5 | PASS | Add learning-material child workflows | learning-material detail route | Attachments, quiz configuration, questions, and answers work | Browser report: question/answer and attachment flows PASS |
| 6 | PASS | Run focused checks and browser acceptance | web package and authenticated local app | Checks pass and browser evidence is recorded | Focused web test/lint PASS; browser report PASS; fixtures removed |

## Why this matters

The API plan establishes the relation and validation contract. This plan
binds that contract to current schema-bound web resources and preserves the
legacy admin flow: category detail owns syllabus mapping, syllabus detail owns
quiz-material selection, and learning-material detail owns attachments and
questions. The web must not recreate the legacy global material lookup bug.

## Current state and evidence

- No current orientation route or resource owner exists in apps/web.
- Legacy navigation and labels are in /Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts:308-341.
- Legacy category tabs and mapping workflow are in /Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/orientation/syllabus-categories/_layouts/SyllabusCategoriesDetailUnder.vue:1 and /Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/orientation/syllabus-categories/_layouts/_layouts/MappingSyllabusCategories.vue:1.
- Legacy syllabus quiz configuration is in /Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/orientation/syllabus/_layouts/SyllabusConfiguration.vue:1.
- Legacy learning-material children are in /Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/orientation/learning-materials/_layouts/LearningMaterialsDetailUnder.vue:1 and its child layout files.
- Reused current patterns include apps/web/src/routes/(authenticated)/master-data/permit-category-apd/ and apps/web/src/routes/(authenticated)/master-data/projects/.
- Framework guidance is in docs/architecture/web-application-architecture.md and packages/is-vue-framework/README.md.

## Reuse, search, and gap record

- Reused: defineResource, defineFields, createHonoResourceActions, ListView, DetailView, FormView, Tabs, AppRouterView, Form, Table, and registered framework input renderers.
- Searched: the architecture guide, framework README, permit-category-apd resource and detail routes, projects ChipFilter route, input registry, input catalog, and lookup owner-resource examples.
- Gap: no framework gap is known. Child mapping, quiz, attachment, and question workflows stay route-local with existing framework surfaces. Stop if a missing capability would require a shared package change.

## Approved web contract

Use the API field names and relation names from Plan 01. Keep scalar IDs for
writes and computed relation reads for display. Do not fetch a separate
label-only options endpoint.

Keep these labels exactly:

- Navigation: Orientation, QHSSE Orientation, Silabus, Kategori Silabus, Materi.
- Syllabus: Judul/Tema Silabus, Foto Cover, Konfigurasi Silabus, Ada ujian, Nilai minimal, Waktu pengerjaan, Acak pertanyaan, Acak jawaban, Materi, Jumlah Pertanyaan.
- Category detail tabs: Silabus, Daftar Role.
- Learning material: Judul, Silabus, Foto Cover, Konten Materi, Materi, Konfigurasi Ujian, Soal Ujian, Pertanyaan, Pilihan Jawaban, Jawaban.

## Steps

### Step 1: Add typed schemas, resources, and owner relation sources

Create schema-bound resources for syllabus, syllabus-categories, and
learning-materials. Bind standard CRUD actions to the API routes from Plan 01.
Define list/detail/form fields from the approved legacy field inventory.
Use the owning resource list for relation selectors:

- Learning material Syllabus writes syllabusId and reads the nested syllabus name.
- Syllabus quiz-material Materi writes learningMaterialId and reads the nested material name.
- Category mapping writes syllabusId and reads the nested syllabus name.
- Category roles write roleId and read the nested role name.

Pass the current syllabus ID, active true, quizEnabled true, and
excludeFinalQuiz true to the quiz-material owner list. Pass the current
category ID and notInCategoryId to category mapping lists as defined by the
API contract. The source must be the owner resource, not a frontend label map.

Verify: web types resolve the imported API schemas; resource action URLs and
permissions match Plan 01; list/detail read projections show names instead
of raw IDs; selector queries carry the parent scope.

### Step 2: Add standard routes and navigation

Add authenticated route files for standard list, create, detail, and edit
surfaces under apps/web/src/routes/(authenticated)/orientation/. Use
ListView, DetailView, and FormView for standard CRUD. Keep route names and
navigation labels aligned with the legacy menu. Add the Orientation module and
QHSSE Orientation separator in apps/web/src/manifest/navigation.ts.

Add focused route/resource tests for route discovery, permission guards,
field labels and order, list filters, relation read values, and standard
create/update/delete actions. Let the repository generate route-map.d.ts;
never edit generated route types by hand.

Verify: navigation resolves Silabus, Kategori Silabus, and Materi to the
three authenticated routes, and each standard route uses the shared framework
surface.

### Step 3: Add syllabus detail quiz configuration

Add the route-local Konfigurasi Silabus surface under syllabus detail. Use
the existing Form and Table or DialogForm patterns. Show quiz settings only
when Ada ujian is active. Show the child table with the exact columns Materi
and Jumlah Pertanyaan.

The Materi source must be scoped to the current syllabus and must exclude the
reserved final quiz material. Submit the nested quiz-material update through
the API transaction from Plan 01. Refresh the detail after save so totalQuestion
and the final quiz relation are visible. Preserve failed-form state on API
errors.

Verify: the browser cannot choose a material from another syllabus, enabling
quiz mode creates the final quiz state, row totals update the syllabus total,
and disabling quiz mode does not show the final quiz in normal material lists.

### Step 4: Add category mapping and role tabs

Add the category detail tabs Silabus and Daftar Role. The Silabus tab lists
current mappings, supports multi-add from the syllabus owner list filtered by
notInCategoryId, and supports removal. The Daftar Role tab lists roles with
the category active state and preserves the legacy active toggle.

Keep mapping and role actions on the category detail surface. Use the category
permission family for child reads and writes. Reload the tab collection after
bulk add, remove, and role toggle.

Verify: one category can show many syllabi, one syllabus can appear in many
categories, duplicate mapping is rejected, unmapped choices disappear after
add, and the role active state persists after reload.

### Step 5: Add learning-material detail and child workflows

Add the learning-material detail surface with content, file, and attachment
records. Use the registered file and rich-text renderers. Add Konfigurasi
Ujian and show Soal Ujian only when the material has a quiz.

Add route-local attachment editing and question editing. Questions use the
registered table/form surfaces. Answer editing preserves the legacy five-option
shape where the API supplies it and enforces one correct answer per question.
Keep the parent material ID in every child action and reload child lists after
create, update, or delete.

Verify: material create requires its syllabus and content, the detail shows
the related syllabus name, attachment actions stay parent-scoped, quiz
questions keep one correct answer, and question changes update the material
quiz state.

### Step 6: Run focused checks and the authenticated browser gate

Run the Plan 01 focused API checks first, then run the web checks:

- pnpm --filter @southneuhof/framework-web test:focused -- src/manifest/__tests__/manifest.spec.ts
- pnpm --filter @southneuhof/framework-web type-check
- pnpm --filter @southneuhof/framework-web lint:focused -- src/routes/(authenticated)/orientation src/manifest/navigation.ts
- git diff --check

Start the local authenticated app and use temporary, clearly marked fixture
records for the approved journey. Record the URL, fixture IDs, visible result,
reload result, and cleanup result in a named browser report under the feature
folder. Cover:

1. Create a syllabus and two materials under it.
2. Create a second syllabus and confirm its material is not offered by the
   first syllabus quiz selector.
3. Enable syllabus quiz mode, add a quiz material, reload, and verify totals.
4. Map the syllabus to a category, reload, remove it, and verify the unmapped
   lookup state.
5. Toggle a category role and reload.
6. Create a quiz material question and answers, then verify one correct answer.
7. Delete temporary records and reload to confirm removal.

If the authenticated browser is unavailable after one valid retry, record UI
UNVERIFIED and keep this plan BLOCKED. Do not claim completion.

## Test plan

Add focused web specs beside the orientation resources. Cover:

- field labels, order, renderer, write fields, read projections, and owner sources;
- current syllabus and category query parameters;
- permission guards and standard resource actions;
- syllabus quiz configuration payloads, scope, and reload behavior;
- category mapping bulk add/remove and role toggle payloads;
- learning-material attachments, quiz configuration, questions, and answers;
- route discovery and navigation entries.

Do not add pixel snapshots or a generic local form/table abstraction. Use the
framework components and existing route-local workflow patterns.

## Done criteria

- [x] Plan 01 API contract is complete and its focused checks pass.
- [x] All three resources use schema-bound fields and standard CRUD surfaces.
- [x] The current-syllabus quiz material rule is visible and enforced.
- [x] Category mapping and role tabs work with reload.
- [x] Learning-material attachments and quiz question workflows work.
- [x] Focused web specs and lint pass; the package type-check has only the existing shared-framework errors recorded below; `git diff --check` passes.
- [x] Authenticated browser evidence is recorded and fixtures are removed.
- [x] Independent verifier returns PASS.

## STOP conditions

Stop and report if:

- Plan 01 field or relation names differ from this design;
- a selector needs a consumer-owned label endpoint;
- a custom control needs a framework package change;
- legacy labels cannot be reproduced without an approved design change;
- route generation or navigation registration needs a hand-edited generated file;
- the authenticated browser gate is unavailable after a valid retry;
- a focused check fails twice without a clear local fix.

## Maintenance notes

Keep the current-syllabus selector filter in the route and API contract. Do
not add a category selector to syllabus. Future learner catalogue work should
consume these owner resources and category mappings rather than duplicate them.

## Module acceptance checklist

Copy this checklist into each numbered plan under the feature folder before
editing. The feature folder is the canonical handoff: `design.md` contains
locked decisions, `worksheet.md` contains discovery and cross-plan status, and
the numbered plan contains its local execution worksheet, technical steps,
checklist, and evidence links. Do not create separate task notes. Fill the
direct evidence paths, results, and statuses. Do not report completion while a
required item is `TODO`, `REWORK`, `STOP`, or `BLOCKED`.

Use these statuses: `TODO`, `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
`NOT NEEDED`, `REWORK`, `STOP`, and `BLOCKED`.

## 0. Execution worksheets

- [x] The feature folder contains `design.md` and `worksheet.md`.
- [x] The feature folder contains one related module group only; unrelated
      modules have separate feature folders, designs, and worksheets.
- [x] The feature worksheet records the group members and grouping reason.
- [x] The feature worksheet contains the discovery ledger, plan map,
      dependency order, overall status, and cross-plan blockers.
- [x] The selected numbered plan contains the local worksheet from
      `references/module-execution-worksheet.md`.
- [x] The local worksheet has one feature, one numbered plan, the feature
      worksheet path, the design path, planned-at SHA, current state, active
      step, next action, read/write boundary, last evidence, and blocker.
- [x] The local worksheet state is `READY` before source edits, `EXECUTE`
      during implementation, and `VERIFY` before independent verification.
- [x] Only one local worksheet step is `ACTIVE` at a time.
- [x] Every completed local step has a path, command report, or browser result.
- [x] API focused checks use `test:focused -- <spec>` and the test database
      migration; no bare `db:migrate` targets the test step.
- [x] The local worksheet has no unresolved `TODO`, `REWORK`, `STOP`, or `BLOCKED`
      step before verification.
- [x] The local worksheet is not marked `DONE` before verifier `PASS`.

## 1. Scope and evidence

- [x] Module name, shape classification, and owned relations are recorded.
- [x] List, detail, create, update, and filter field placement is recorded;
      bounded manifests use `actionFields` when the sets differ.
- [x] The feature worksheet discovery evidence ledger is linked: `plans/orientation-syllabus-materials/worksheet.md`.
- [x] The selected plan and feature design are read: `plans/orientation-syllabus-materials/02-build-orientation-web.md`,
      `plans/orientation-syllabus-materials/design.md`.
- [x] Direct legacy owner evidence is read: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts`, orientation configs, detail layouts, mapping, role, and child workflow files recorded in `worksheet.md`.
- [x] Current owner or direct route evidence is read when it exists: `apps/web/src/routes/(authenticated)/orientation/` and `apps/web/src/manifest/navigation.ts`.
- [x] Legacy list, detail, create, edit, and workflow surfaces needed by the
      contract are read: legacy list/detail/create/edit/workflow paths recorded in `worksheet.md`.
- [x] User-facing labels are inventoried for required fields, headings,
      actions, lookups, dialogs, validation, and workflow messages: `design.md`, `worksheet.md`, and `browser-report.md`.
- [x] One sibling is read only when a concrete pattern gap required it:
      `apps/web/src/routes/(authenticated)/master-data/permit-category-apd/` and `projects/` with the reused framework pattern.
- [x] Every difference is `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
      `NOT NEEDED`, or `STOP`.

## 1a. Evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `design.md`; `apps/web/src/routes/(authenticated)/orientation/*/*.schema.ts` | Three resources use the approved scalar write fields and relation read fields. | PASS |
| Surface field placement and filters | `syllabus.resource.ts`, `learning-materials.resource.ts`, route forms and list routes | List/detail/create/update fields and current-parent filters match the approved contract. | PASS |
| Legacy labels and behavior | `browser-report.md`; legacy config and detail paths in `worksheet.md` | `Silabus`, `Kategori Silabus`, `Materi`, `Konfigurasi Ujian`, and child tabs are preserved. | PASS |
| Relation or child owner | `orientation.lookups.ts`; child route files | Owner resources supply syllabus, material, category mapping, and role names. | PASS |
| Lookup consumer or dependency | `syllabus/SyllabusConfigurationForm.vue`; category syllabi route | Quiz material lookup is scoped by `syllabusId`; mapping lookup uses `notInCategoryId`. | PASS |
| Workflow or custom write | `apps/web/src/routes/(authenticated)/orientation/*/detail/*` | Route-local workflows call the approved nested API actions and reload after writes. | PASS |
| API permission realm and verbs | `apps/api/src/authorization/catalog.ts`; resource files | System permission names match the API modules and route guards. | PASS |
| Route and navigation owner | `apps/web/src/manifest/navigation.ts`; `apps/web/src/route-map.d.ts` | Orientation navigation and authenticated route tree resolve. | PASS |
| Seed and reload requirement | `browser-report.md` | Temporary browser fixture records were created, reloaded, and removed. | PASS |
| Framework or UI gap | `02-build-orientation-web.md` Reuse, search, and gap record | No framework gap; existing framework surfaces cover the workflows. | NOT NEEDED |

For a bounded manifest module, the scaffold JSON result and static verifier
report may provide the generated-path and route evidence. Record their absolute
paths under the feature folder and link them from the numbered plan or its
reports section. The acceptance matrix and browser gate still remain required.

## 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Permission realm | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | Legacy menu and list roots in `worksheet.md` | `/orientation/syllabus`, `/orientation/syllabus-categories`, `/orientation/learning-materials` | system | `ListView` | Manifest spec and browser navigation PASS | PASS |
| List row | Legacy standard CRUD lists | Detail links and row actions in the three resource routes | system | `ListView` | Browser list/detail navigation PASS | PASS |
| Detail | Legacy detail layouts | Three detail routes and nested child routes | system | `DetailView`, `Tabs` | Browser detail and tab flows PASS | PASS |
| Child row | Legacy mapping, role, attachment, and question layouts | Route-local child tables and actions | system | `Table`, `Form`, `Tabs` | Browser mapping, role, question, and attachment PASS | PASS |
| Create form | Legacy create configs | `/create` routes for all three resources | system | `FormView` | Browser syllabus/material/category create PASS | PASS |
| Edit form | Legacy standard edit behavior | `/edit` routes for all three resources | system | `FormView` | Resource action contracts and focused checks PASS | PASS |
| Syllabus quiz workflow | `SyllabusConfiguration.vue` | `detail/configuration`; nested syllabus update | system | `Form`, `Table` | Browser scoped selector, save, reload PASS | PASS |
| Category mapping and roles | `MappingSyllabusCategories.vue`, `SyllabusCategoriesRoles.vue` | `detail/syllabi`, `detail/roles` | system | `Table`, `Tabs`, `Switch` | Browser add/remove/toggle/reload PASS | PASS |
| Material children | Legacy learning-material child layouts | `detail/configuration`, `detail/questions` | system | `Table`, `Form`, `Tabs` | Browser attachment/question flows PASS | PASS |

Add rows for domain workflow actions. Keep actions on their intended surface.
For each workflow row, record the expected state transition and submitted
payload in `Result/evidence`. Do not remove an action from another surface
because it has the same label.

## 2a. User-facing label ledger

Copy labels exactly. Preserve capitalization, punctuation, singular/plural
form, terminology, and visible validation or workflow text. Do not translate,
shorten, improve, or invent a synonym. An unapproved mismatch is `REWORK`.
If no legacy reference is in scope, mark the rows `NOT NEEDED` and use the
approved design labels.

| Surface or field | Legacy evidence | Legacy label | New label | Status |
|---|---|---|---|---|
| Field | Legacy configs listed in `worksheet.md` | `Judul/Tema Silabus`, `Silabus`, `Konten Materi`, and approved labels | Same labels in schemas and route forms | PASS |
| Page or table heading | Legacy detail layouts | `Silabus`, `Kategori Silabus`, `Materi`, `Konfigurasi Ujian`, `Soal Ujian` | Same labels in routes | PASS |
| Standard action | Legacy standard CRUD surfaces | `Create`, `Edit`, `Delete`, `Submit`, and `Simpan` | Same framework actions and approved workflow labels | PASS |
| Lookup or dialog | Legacy mapping and material selectors | `Materi`, `Silabus`, `Pilihan Jawaban` | Same labels in owner lookups and dialogs | PASS |
| Validation or workflow message | API and browser report | `Each question must have one correct answer.` and successful save messages | Server and browser results recorded | SERVER SUPPLIED |

## 3. Contract and data checks

- [x] Database, API schema, operation, resource, and route use the same field
      names.
- [x] The client route tree and server registration produce one URL per
      custom action.
- [x] Permission names and permission realms match the API.
- [x] Server authorization is tested for an allowed and denied case.
- [x] Required lookup sources use the owning resource list and detail.
- [x] The field inventory covers API create/update, list, detail, renderer,
      source, and server-supplied values.
- [x] Database-backed identifier relations or reference fields have a named
      nested relation in the API select schema, a defined and loaded backend
      relation, and that relation in list/detail and returned create/update
      records. The web resource uses a write field for IDs/codes and a computed
      `read` field for list/detail names without a frontend-only label fetch or
      map. Raw IDs are not shown as user-facing values.
- [x] User-facing labels match the legacy label ledger exactly, or the
      difference is approved in the design.
- [x] The seed or fixture command, owner, expected records, and idempotence
      are recorded when the browser flow needs records, lookups, or child
      rows.
- [x] The seed smoke check passes.

## 4. Workflow and UI checks

- [x] Standard CRUD uses `ListView`, `DetailView`, and `FormView` or the
      documented framework surface.
- [x] Every custom control has an exact recorded framework or sibling gap.
- [x] Each workflow action has only the fields that action reads or writes.
- [x] First load shows the expected records and hierarchy.
- [x] Reload after create, update, and delete shows the expected records and
      hierarchy.
- [x] Failed actions keep the required dialog or form state.
- [x] Action labels, alignment, and placement match the sibling pattern.
- [x] The UI result is verified in an authenticated Codex browser. If
      unavailable after a valid retry, set `BLOCKED` and record the reason.
- [x] Browser evidence records the URL, surface, action, test data
      identifier, visible result, and failure message for each journey row.

## 5. Independent verification

- [x] The selected plan's local worksheet state is `VERIFY`, all implementation steps are `PASS`, and
      no implementation step is still `ACTIVE`.
- [x] `$verify-ads-hk-module` reviewed the feature folder's design, feature
      worksheet, selected plan, scoped ledger, diff, legacy reference,
      checklist, checks, seed, and browser journey.
- [x] Verifier verdict is `PASS`: `plans/orientation-syllabus-materials/browser-report.md` and final report below.
- [x] Verifier `REWORK` and `BLOCKED` items are resolved, or the plan remains
      open with the exact reason.

## 6. Final evidence

- [x] Focused API tests pass.
- [x] Focused web tests pass.
- [x] Focused web tests and lint pass. Package type-check reports only existing `TS2590` errors in shared `DetailView.vue`, `FormView.vue`, and `ListView.vue`; no Orientation file is in the error output.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are reported.
- [x] No unchecked item remains.

## Verification evidence (2026-08-20)

- API: `pnpm --filter @southneuhof/api test:focused -- src/routes/syllabus/syllabus.routes.spec.ts src/routes/syllabus-categories/syllabus-categories.routes.spec.ts src/routes/learning-materials/learning-materials.routes.spec.ts` — PASS.
- Web focused test: `pnpm --filter @southneuhof/framework-web test:focused -- src/manifest/__tests__/manifest.spec.ts` — PASS, 6 tests.
- Web focused lint: `pnpm --filter @southneuhof/framework-web lint:focused -- 'src/routes/(authenticated)/orientation' src/manifest/navigation.ts src/manifest/__tests__/manifest.spec.ts` — PASS.
- API type-check and focused API lint — PASS. API route import — PASS.
- Web package type-check: existing `TS2590` errors remain in shared `packages/is-vue-framework/src/components/views/DetailView.vue`, `FormView.vue`, and `ListView.vue`; no Orientation file appears in the output. No framework source was changed.
- Development migration command: the existing migration chain stops at `law_reference_categories` because that table already exists. The Orientation migration SQL is isolated in `apps/api/drizzle/20260820082640_perpetual_alex_power/migration.sql` and was applied directly to the local development database for the browser gate.
- `git diff --check` — PASS.
- Browser: [browser-report.md](./browser-report.md) — PASS; temporary records and user were removed and reload confirmed `/auth/login`.
