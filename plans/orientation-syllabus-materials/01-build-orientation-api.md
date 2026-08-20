# Plan 01: Build the orientation syllabus API and data contract

> **Implementation instructions**: Read this plan and the approved design before
> editing. Execute the steps in order. Update the local execution worksheet
> after every step. If a STOP condition occurs, stop and report it.
>
> **Drift check**: `git diff --stat 78ecc99..HEAD -- apps/api/src/routes apps/api/src/authorization/catalog.ts apps/api/src/routes/index.ts apps/api/drizzle`
> Compare current files before editing. Do not overwrite unrelated work.

## Status

- State: `DONE`
- Result: `PASS`

## Execution worksheet

- State: DONE
- Module: orientation/syllabus, orientation/syllabus-categories, orientation/learning-materials
- Feature folder: plans/orientation-syllabus-materials/
- Feature worksheet: plans/orientation-syllabus-materials/worksheet.md
- Plan: plans/orientation-syllabus-materials/01-build-orientation-api.md
- Design: plans/orientation-syllabus-materials/design.md
- Test environment: .env.test / repository test database
- Planned at: 78ecc99
- Active step: None
- Next action: None.
- Read boundary: approved design, current API architecture, legacy owner files, and cited sibling API routes
- Write boundary: apps/api/src/routes/syllabus/, apps/api/src/routes/syllabus-categories/, apps/api/src/routes/learning-materials/, apps/api/src/routes/index.ts, apps/api/src/authorization/catalog.ts, and the feature migration
- Last result: Migration, focused route specs, type check, focused lint, route import, and diff check pass.
- Last evidence: apps/api/drizzle/20260820082640_perpetual_alex_power/migration.sql and plans/orientation-syllabus-materials/browser-report.md
- Blocker: None

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | PASS | Add database entities and migration | API route folders and apps/api/drizzle | Feature tables, relations, constraints, and indexes exist | `apps/api/drizzle/20260820082640_perpetual_alex_power/migration.sql`; API type-check PASS |
| 2 | PASS | Define schemas, filters, and relation responses | API route folders | API contract validates parent scope and returns named relations | Three focused route specs PASS; named syllabus/material/role relations are returned |
| 3 | PASS | Add standard authenticated CRUD routes | API route folders | Three main resources have permission-gated CRUD | Focused route specs cover auth, CRUD, validation, and relation display |
| 4 | PASS | Add category mapping and role workflows | syllabus-categories route folder | Mapping and role actions are parent-scoped and idempotent | Category focused spec PASS; browser mapping and role reload PASS |
| 5 | PASS | Add transactional syllabus quiz configuration | syllabus route folder and relations | Quiz rows, totals, and final quiz sync are atomic | Syllabus focused spec PASS; browser current-syllabus selector and reload PASS |
| 6 | PASS | Add learning-material child workflows | learning-materials route folder | Attachments, questions, and answers are parent-scoped | Learning-material focused spec PASS; browser question and attachment flows PASS |
| 7 | PASS | Register routes, permissions, and focused specs | API route index and authorization catalog | API checks, type-check, lint, and diff check pass | Focused API test, lint, type-check, route import, and `git diff --check` PASS |

- Priority: P1
- Effort: L
- Risk: HIGH
- Depends on: none
- Category: migration
- Planned at: commit `78ecc99`, 2026-08-20
- Feature folder: `plans/orientation-syllabus-materials/`
- Design: `plans/orientation-syllabus-materials/design.md`
- Feature worksheet: `plans/orientation-syllabus-materials/worksheet.md`
- Local state: `READY after plan approval`

## Why this matters

The current repository has no orientation API owner. The approved design needs a
database-backed contract for three related admin modules: syllabus, syllabus
categories, and learning materials. The API must enforce the relation rules,
especially the approved rule that quiz materials must belong to the current
syllabus. This plan makes the web work safe by exposing typed owner lists,
named relations, authenticated writes, and transaction boundaries first.

## Current state and evidence

- The legacy syllabus model stores quiz configuration and returns quiz material
  rows in [legacy Syllabus.php](/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/Syllabus.php:177).
- Legacy material rows reference one syllabus and assign display order per
  syllabus in [legacy LearningMaterials.php](/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LearningMaterials.php:141).
- The legacy category relation is many-to-many through
  [create_mapping_syllabus_categories.php](/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_11_20_130452_create_mapping_syllabus_categories.php:14).
- Current API entities use Drizzle tables, Zod schemas, audit fields, and
  createEntity; use [business-categories.entity.ts](/Users/gamer/Documents/projects/ads-hk/apps/api/src/routes/business-categories/business-categories.entity.ts:1).
- Current API standard models use authenticated list/detail/create/update/delete
  routes and defineDomainPart; use
  [business-categories.ts](/Users/gamer/Documents/projects/ads-hk/apps/api/src/routes/business-categories/business-categories.ts:1).
- Current API routes are installed through
  [apps/api/src/routes/index.ts](/Users/gamer/Documents/projects/ads-hk/apps/api/src/routes/index.ts:1).
- Current permission definitions use the system realm and six standard verbs in
  [catalog.ts](/Users/gamer/Documents/projects/ads-hk/apps/api/src/authorization/catalog.ts:1).

## Contract to implement

Use these API resource names and field names:

- syllabus: id, name, imgThumbnail, description, active, isHaveQuiz,
  minScore, timeLimit, totalQuestion, isShuffleQuestion,
  isShuffleOption, questionType.
- syllabus-categories: id, name, imgThumbnail, description, active.
- learning-materials: id, syllabusId, name, type, imgThumbnail, file,
  displayOrder, description, content, isHaveQuiz, minScore, timeLimit,
  totalQuestion, isShuffleQuestion, isShuffleOption, active.
- category-syllabus mapping: id, syllabusCategoryId, syllabusId, description,
  active.
- category-role mapping: id, syllabusCategoryId, roleId, description, active.
- syllabus quiz material: id, syllabusId, learningMaterialId, totalQuestion,
  active.
- learning-material attachment: id, learningMaterialId, name,
  fileAttachment, description, active.
- learning-material question: id, learningMaterialId, name, active.
- question answer: id, learningMaterialQuestionId, code, name, isAnswer, active.

The API must return relation names for database-backed IDs in list/detail and
returned create/update records. The web will use the scalar ID for writes and
the relation object for display.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| API type check | `pnpm --filter @southneuhof/api type-check` | Exit 0 |
| API focused tests | `pnpm --filter @southneuhof/api test:focused -- src/routes/syllabus/syllabus.routes.spec.ts src/routes/syllabus-categories/syllabus-categories.routes.spec.ts src/routes/learning-materials/learning-materials.routes.spec.ts` | All named specs pass after test files exist |
| API focused lint | `pnpm --filter @southneuhof/api lint:focused -- src/routes/syllabus src/routes/syllabus-categories src/routes/learning-materials src/routes/index.ts src/authorization/catalog.ts` | Exit 0 |
| Migration generation | `pnpm --filter @southneuhof/api db:generate` | One migration contains only this feature's tables and constraints |
| Diff check | `git diff --check` | No whitespace errors |

## Scope

In scope:

- `apps/api/src/routes/syllabus/`
- `apps/api/src/routes/syllabus-categories/`
- `apps/api/src/routes/learning-materials/`
- `apps/api/src/routes/index.ts`
- `apps/api/src/authorization/catalog.ts`
- The generated feature migration under `apps/api/drizzle/`
- Focused route specs in the three route folders

Out of scope:

- `apps/web/`; Plan 02 owns it.
- `packages/is-vue-framework/`; no framework change is approved.
- Learner catalogue, learning progress, exam session, and certificate routes.
- Legacy Laravel source.
- Permanent seed records. Browser fixtures are temporary and module-scoped.

## Steps

### Step 1: Add the database entities and migration

Create the three main tables and their owned child/mapping tables in the three
API route folders. Use text UUID identifiers, audit fields, Drizzle relations,
foreign keys, and indexes that support parent list filters. Add unique
constraints for category-syllabus pairs, category-role pairs, and
syllabus-quiz-material pairs. Keep final quiz materials identifiable by
displayOrder zero and type final-quiz.

Use the current users and roles entities as relation owners. Do not reuse the
legacy integer IDs or legacy table names when that conflicts with current
repository conventions.

Run the migration generator. Inspect the generated SQL before applying it. If
the generated SQL contains unrelated tables or changes from the dirty
worktree, stop and report.

Verify: migration SQL contains every approved table, foreign key, unique pair,
and index; API type-check exits 0.

### Step 2: Define record, query, create, and update schemas

Use createEntity schemas as the API write contract. Add typed query filters for:

- active and search on normal list fields;
- syllabusId on learning-material lists;
- active and quiz-enabled filters for material lookup;
- excludeFinalQuiz for material lookup;
- category ID for mapped and unmapped syllabus lists;
- parent IDs for mapping, role, attachment, and question lists.

Reject a quiz-material write when the material does not belong to the same
syllabus, is inactive, is final-quiz, or is not quiz-enabled. Reject duplicate
quiz rows. Reject missing parent records and invalid child IDs.

Return relation metadata with user-facing names. Never force the browser to
fetch an ID only to show a label.

Verify: focused schema and route tests return 400 for invalid relation scope,
duplicate mappings, inactive lookup records, and invalid numeric quiz counts.

### Step 3: Add authenticated standard API routes

Implement standard list, detail, create, update, and delete routes for:

- syllabus;
- syllabus-categories;
- learning-materials.

Use list-* and detail-* permission checks for API reads and create/update/delete
permissions for writes. Use view-* only for the web resource route guard.

Keep the legacy field semantics:

- material create assigns the next display order for that syllabus;
- normal material lists exclude displayOrder zero;
- syllabus totalQuestion is derived from quiz material rows;
- material and category active flags default to true;
- uploaded file fields use the existing file contract.

Return the full required record and named relations after create and update.

Verify: each route spec covers authentication, missing permission, list, detail,
create, update, delete, validation, and relation display.

### Step 4: Add category mapping and role workflows

Add parent-scoped routes owned by syllabus-categories:

- list mapped syllabi for a category;
- bulk add syllabi not already mapped to the category;
- remove one syllabus mapping;
- list all roles with the current category active state;
- toggle one category-role mapping.

Use the category permission for these child reads and writes. Recheck the
category ID, syllabus ID, and role ID on the server. Make bulk add idempotent
by rejecting or ignoring existing pairs according to the approved API error
style; do not create duplicate rows.

Verify: route specs prove that a category can map many syllabi, one syllabus
can map many categories, duplicate pairs are blocked, and role toggles reload
with the expected active state.

### Step 5: Add transactional syllabus quiz configuration

Extend syllabus detail and update so one update can write:

- quiz settings;
- the selected quiz material rows;
- totalQuestion derived from the row totals;
- the reserved final quiz material.

Use one database transaction. On quiz enable, create or update the final quiz
material. On quiz disable, keep the stored material records but exclude the
final quiz from normal material and quiz-material choices, matching the design.
Never allow a quiz row from another syllabus.

Use explicit schemas for the nested update payload. Do not add a generic
workflow engine.

Verify: route specs cover enable, update, disable, nested row replacement,
total calculation, final quiz creation/update, rollback on invalid child data,
and cross-syllabus rejection.

### Step 6: Add learning-material child workflows

Add authenticated child routes for attachments and quiz questions/answers.
Use parent-scoped reads and writes. Keep question count and isHaveQuiz aligned
after question create and delete. Enforce one correct answer per question.

Use the existing file upload and file object contract. Do not store raw upload
metadata without the current API file validation.

Verify: focused tests cover parent scoping, attachment create/update/delete,
question and answer persistence, one-answer validation, and material quiz
state recalculation.

### Step 7: Register routes, domains, permissions, and focused specs

Register every domain part and installed model in
[apps/api/src/routes/index.ts](/Users/gamer/Documents/projects/ads-hk/apps/api/src/routes/index.ts).
Add the three system modules and six standard permissions to
[apps/api/src/authorization/catalog.ts](/Users/gamer/Documents/projects/ads-hk/apps/api/src/authorization/catalog.ts).

Keep all route modules colocated. Do not edit generated web route types in this
plan.

Verify: focused API tests, API type-check, focused lint, migration check, and
git diff --check all pass.

## Test plan

Add route specs beside each API route. Use the existing authenticated fixture
pattern in
[permit-category-apd.routes.spec.ts](/Users/gamer/Documents/projects/ads-hk/apps/api/src/routes/permit-category-apd/permit-category-apd.routes.spec.ts:1).
Cover:

- authentication and each operation permission;
- standard CRUD and returned relation names;
- parent and child foreign-key validation;
- category many-to-many mapping and role toggles;
- current-syllabus quiz material restriction;
- final quiz creation and exclusion;
- transactional rollback;
- attachment and question ownership;
- one correct answer and material quiz count.

Use temporary IDs with a test prefix and remove all rows created by each fixture.

## Done criteria

- [x] All approved tables, relations, indexes, and constraints exist.
- [x] All API routes are authenticated and permission-gated.
- [x] The current-syllabus quiz material rule is enforced by the API.
- [x] Focused API specs pass with the exact command above.
- [x] API type-check and focused lint pass.
- [x] The generated migration contains no unrelated work.
- [x] No source file outside the Scope section is modified.
- [x] The feature worksheet and plan status are updated.

## STOP conditions

Stop and report if:

- the current API entity or route pattern differs from the cited examples;
- the migration generator includes unrelated dirty-worktree changes;
- the file upload contract cannot validate the approved fields;
- a child write needs a new permission family or route shape not approved in
  the design;
- the current database cannot support the required transaction;
- the approved labels or field names require a change to the design;
- any focused check fails twice without a clear local fix.

## Maintenance notes

Reviewers must check the cross-syllabus rule on every write path, not only the
lookup list. Future learner catalogue work must use the material and category
owner lists instead of adding consumer-owned options endpoints. If the final
quiz behavior changes, update the syllabus transaction and material list
filter together.

## Module acceptance checklist

# Module acceptance checklist

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
- [x] The selected plan and feature design are read: `plans/orientation-syllabus-materials/01-build-orientation-api.md`,
      `plans/orientation-syllabus-materials/design.md`.
- [x] Direct legacy owner evidence is read: `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/Syllabus.php`, `SyllabusCategories.php`, and `LearningMaterials.php`.
- [x] Current owner or direct route evidence is read when it exists: current API route and entity files under `apps/api/src/routes/orientation/`, `syllabus/`, `syllabus-categories/`, and `learning-materials/`.
- [x] Legacy list, detail, create, edit, and workflow surfaces needed by the
      contract are read: legacy list/detail/create/edit/workflow paths recorded in `worksheet.md`.
- [x] User-facing labels are inventoried for required fields, headings,
      actions, lookups, dialogs, validation, and workflow messages: `design.md`, `worksheet.md`, and the legacy config/detail paths.
- [x] One sibling is read only when a concrete pattern gap required it:
      `apps/api/src/routes/business-categories/` and `apps/api/src/routes/roles/` with the reused authenticated model pattern.
- [x] Every difference is `PASS`, `APPROVED DIFFERENCE`, `SERVER SUPPLIED`,
      `NOT NEEDED`, or `STOP`.

## 1a. Evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `orientation.entity.ts`; `syllabus.ts`; `syllabus-categories.ts`; `learning-materials.ts` | Three main entities and all approved child entities use the design field names. | PASS |
| Surface field placement and filters | The three route files and their focused specs | Standard CRUD fields, parent filters, quiz filters, and child parent IDs are validated. | PASS |
| Legacy labels and behavior | `design.md` and legacy paths in `worksheet.md` | API preserves the approved semantics: category mapping owns the many-to-many relation; material belongs to one syllabus; final quiz uses display order zero. | PASS |
| Relation or child owner | `orientation.entity.ts` relations and response schemas | Syllabus, category, role, and material nested relations are defined and loaded. | PASS |
| Lookup consumer or dependency | `syllabus.ts` quiz validation and `learning-materials.ts` syllabus validation | Quiz material writes require the same syllabus and valid active non-final material. | PASS |
| Workflow or custom write | `syllabus.ts`, `syllabus-categories.ts`, `learning-materials.ts` | Quiz sync, category mapping/role actions, attachments, and questions are parent-scoped. | PASS |
| API permission realm and verbs | `apps/api/src/authorization/catalog.ts` and route guards | All three modules use the system realm and six standard permissions. | PASS |
| Route and navigation owner | `apps/api/src/routes/index.ts` | The three models and Orientation domain are registered. | PASS |
| Seed and reload requirement | `plans/orientation-syllabus-materials/browser-report.md` | Temporary fixture records support browser lookup and reload checks; no permanent seed is needed. | NOT NEEDED |
| Framework or UI gap | `02-build-orientation-web.md` Reuse, search, and gap record | No API framework change is required. | NOT NEEDED |

For a bounded manifest module, the scaffold JSON result and static verifier
report may provide the generated-path and route evidence. Record their absolute
paths under the feature folder and link them from the numbered plan or its
reports section. The acceptance matrix and browser gate still remain required.

## 2. Route and action matrix

| Surface | Legacy evidence | New route/action | Permission realm | Reused pattern | Result/evidence | Status |
|---|---|---|---|---|---|---|
| List entry | Legacy menu in `worksheet.md` | `/syllabus`, `/syllabus-categories`, `/learning-materials` list actions | system | model registration | Focused specs PASS | PASS |
| List row | Legacy standard CRUD lists | List response with named relations | system | standard model route | Focused specs and browser lists PASS | PASS |
| Detail | Legacy detail layouts | `/detail/:id` and nested relation reads | system | standard model route | Focused specs and browser details PASS | PASS |
| Child row | Legacy mapping, role, attachment, and question layouts | Parent-scoped list/create/update/delete actions | system | route-local API actions | Focused specs and browser child flows PASS | PASS |
| Create form | Legacy create configs | `/create` actions for three resources and child records | system | standard model route | Focused specs PASS | PASS |
| Edit form | Legacy edit behavior | `/update` actions with relation and parent validation | system | standard model route | Focused specs PASS | PASS |
| Syllabus quiz sync | `Syllabus.php` and quiz config | Nested syllabus update transaction | system | explicit workflow | Syllabus spec and browser reload PASS | PASS |
| Category mapping and role toggle | Legacy mapping and role services | Category child actions | system | explicit workflow | Category spec and browser reload PASS | PASS |
| Material question and attachment writes | Legacy learning-material child models | Parent-scoped child actions | system | explicit workflow | Material spec and browser PASS | PASS |

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
| Field | Legacy configs in `worksheet.md` | API field names from `01-build-orientation-api.md` contract | Exact approved API names | PASS |
| Page or table heading | Legacy detail/layout files | API route payloads have no invented UI headings | Approved design labels are web-owned | NOT NEEDED |
| Standard action | Legacy service files | `list`, `detail`, `create`, `update`, `delete` | Permission action names match catalog | PASS |
| Lookup or dialog | Legacy lookup consumers | Parent IDs and named nested relations | Scalar IDs for writes; nested names for reads | SERVER SUPPLIED |
| Validation or workflow message | Focused route specs | Invalid scope, duplicate, inactive, and answer-count writes return errors | Server validation is the source of truth | SERVER SUPPLIED |

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
- [x] API type-check and focused lint pass; the web package type-check note is recorded in Plan 02.
- [x] `git diff --check` passes.
- [x] `Reused`, `Searched`, and `Gap` are reported.
- [x] No unchecked item remains.

## Verification evidence (2026-08-20)

- API focused tests: `pnpm --filter @southneuhof/api test:focused -- src/routes/syllabus/syllabus.routes.spec.ts src/routes/syllabus-categories/syllabus-categories.routes.spec.ts src/routes/learning-materials/learning-materials.routes.spec.ts` — PASS, 3 files and 3 tests; test migration ran through `db:migrate:test`.
- API type-check: `pnpm --filter @southneuhof/api type-check` — PASS.
- API focused lint: `pnpm --filter @southneuhof/api lint:focused -- src/routes/orientation src/routes/syllabus src/routes/syllabus-categories src/routes/learning-materials src/routes/index.ts src/authorization/catalog.ts` — PASS.
- Route import: `pnpm --filter @southneuhof/api exec tsx -e "import('./src/routes/index.ts').then(() => console.log('route import ok'))"` — PASS.
- Migration: `apps/api/drizzle/20260820082640_perpetual_alex_power/migration.sql` contains only Orientation tables, indexes, and foreign keys. The full development migration chain has the unrelated existing `law_reference_categories` conflict recorded in Plan 02.
- Browser relation and workflow evidence: [browser-report.md](./browser-report.md) — PASS.
- `git diff --check` — PASS.
