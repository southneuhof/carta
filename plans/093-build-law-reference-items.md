# Law reference items

## Execution worksheet

- State: `PLAN`
- Module: `master/law-reference-items`
- Plan: `/Users/gamer/Documents/projects/ads-hk/plans/093-build-law-reference-items.md`
- Design: `<TBD during DISCOVERY; required before PLAN>`
- Planned at: `248d3fe`
- Active step: `9`
- Next action: `Request technical-plan approval before source edits`
- Read boundary: `Discovery findings and user decision only`
- Write boundary: `plans/093-build-law-reference-items.md`
- Last result: `Technical plan and acceptance checklist are complete. Plan scope, file ownership, commands, stop conditions, and done criteria are recorded.`
- Last evidence: `plans/093-build-law-reference-items.md; plans/README.md`
- Blocker: `None`

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | PASS | Search exact module identifiers in current and legacy repositories | Exact identifiers only | Direct owners and missing identifiers recorded | Legacy view, menu, model, and seeder search results |
| 2 | PASS | Read the direct legacy view, model, menu, seeder, and API owner evidence | Direct legacy module owners only | Fields, labels, relations, actions, permissions, and seed behavior recorded | Legacy view, model, migration, category seeder, sync seeder, menu, and IBPRP consumer paths |
| 3 | PASS | Review the current TreeTable route and framework surface used for the custom tree | Current tree route and framework TreeTable only | Current route and framework reuse decision recorded | `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue`; `packages/is-vue-framework/src/components/core/TreeTable.vue` |
| 4 | PASS | Resolve the category source and recursive delete contract before design | Discovery findings and user decision only | Recursive soft delete selected; category source included as a read-only owner | User decision: recursive soft delete |
| 5 | PASS | Present the full design for approval | Design proposal only | User approved the proposed architecture and delete policy | User response: `Sounds good` |
| 6 | PASS | Write and self-review the approved design document | `docs/superpowers/specs/2026-08-20-law-reference-items-design.md` | Complete, consistent design document with no placeholders | `docs/superpowers/specs/2026-08-20-law-reference-items-design.md` |
| 7 | PASS | Request written-spec review for the design document | Design document only | User confirmed the written design | User response: `Sounds good` |
| 8 | PASS | Complete the technical plan, acceptance checklist, and execution worksheet | `plans/093-build-law-reference-items.md` | Ready plan with exact file ownership and commands | `plans/093-build-law-reference-items.md` |
| 9 | ACTIVE | Request technical-plan approval before source edits | Plan only | User approves the technical plan | — |

## Discovery evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_182635_create_law_reference_items.php:14-25`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LawReferenceItems.php:28-31,89-100` | `id`, `law_reference_category_code`, `name`, `code`, `level`, `parent_id`, `type`, `active`, audit fields; `code` exists in the table but is not in the model field lists | FOUND |
| Legacy labels and behavior | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/law-reference-items/law-reference-items.vue:67-146` | Title `Master Regulasi & Perundangan HSSE`; help text; tabs; headings `Undang-Undang`, `Nama`, `Tipe`, `Status`; actions `Tambah`; status labels `Berlaku` and `Tidak Berlaku`; type values `Reference` and `Applicable`; tree depth is limited to level 3 | FOUND |
| Relation or child owner | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LawReferenceItems.php:113-129,168-173`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_182635_create_law_reference_items.php:16-21` | Category relation by code and recursive self-child relation by `parent_id`; category is owned by `law_reference_categories` | FOUND |
| Lookup consumer or dependency | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/ibprp/_layouts/_layouts/WorkItemIBPRPLeaf.vue:198-205`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/ibprp/_layouts/IBPRPDetailUnder.vue:166-174` | Lookup source for IBPRP; filtered by category, `type`, and `level`; owning resource must expose list data for consumers | FOUND |
| Workflow or custom write | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/law-reference-items/law-reference-items.vue:79-148` | No domain workflow; create, update, and delete are standard writes, but the tree and parent/level payload make the list surface custom | FOUND |
| API permission realm and verbs | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LawReferenceItems.php:21-25`; `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts:140-145` | Legacy model enables list/add/edit/delete/view; exact permission names are not present in the direct legacy owner and need current RBAC evidence | AMBIGUOUS |
| Route and navigation owner | `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/menu.ts:140-145` | Navigation group `Undang-Undang`; title `Regulasi & Perundangan HSSE`; icon `folder` | FOUND |
| Seed and reload requirement | `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S08LawReferenceCategoriesSeeder.php:19-34`; `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S66SyncLawReferenceItemsSeeder.php:16-50` | Categories are upserted as `environment`, `k3`, and `security`; sync seeder soft-deletes descendants and linked fulfillment records; after writes the tree reloads by category | FOUND |
| Framework or UI gap | `packages/is-vue-framework/src/index.ts:5`; `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue:143-175` | Framework `TreeTable` exists and is used by a route-local tree CRUD surface; no framework change is required by current evidence | FOUND |

## Unresolved questions

- None after the selected delete policy. The design will define the category source as read-only and the dependent fulfillment side effect only if a current table exists.

## Plan 093: Build law reference items

> Follow this plan in order. Keep one worksheet step active. Run each listed
> check before starting the next step. Stop on any stop condition.

### Status

- Priority: `P1`
- Effort: `L`
- Risk: `HIGH` — new recursive data writes and a user-facing tree workflow.
- Depends on: `none`
- Category: `migration`
- Planned at: `3e1674b`, `2026-08-20`
- Design: `docs/superpowers/specs/2026-08-20-law-reference-items-design.md`
- Drift check: `git diff --stat 3e1674b..HEAD -- apps/api/src/routes/law-reference-items apps/api/src/routes/index.ts apps/api/src/authorization/catalog.ts apps/api/scripts/seed.ts apps/web/src/routes/\(authenticated\)/master-data/law-reference-items apps/web/src/manifest apps/web/src/route-map.d.ts`

### Why this matters

The legacy module manages HSSE law references as a three-level tree filtered by
law category. The current application has no owner for this data, while IBPRP
lookup consumers still require filtered law items. This plan adds the smallest
current API, resource, route, permission, and seed slice that preserves the
legacy business contract.

### Current state and patterns

- Legacy page: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/master/law-reference-items/law-reference-items.vue:65-153` — exact labels, category tabs, level-3 tree, and row actions.
- Legacy model: `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/LawReferenceItems.php:15-173` — fields, validation, category relation, recursive children, and soft-delete flag.
- Legacy schema: `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_182635_create_law_reference_items.php:14-25` and `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/migrations/2024_07_31_182552_create_law_reference_categories.php:14-23`.
- Current API owner pattern: `apps/api/src/routes/emergency-simulation-topics/emergency-simulation-topics.ts:9-106` — `defineModel`, five standard routes, authenticated permission constants, and `defineDomainPart`.
- Current API relation pattern: `apps/api/src/routes/work-items/work-items.entity.ts:18-59` — self-referencing `parentId`, nested select relation metadata, and `defineRelationsPart`.
- Current custom tree pattern: `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue:1-189` and `apps/api/src/routes/work-items/work-items.ts:190-227` — route-local `TreeTable`, `DialogForm`, permission checks, custom tree endpoint, nested `children`, and reload after writes.
- Current web resource pattern: `apps/web/src/routes/(authenticated)/master-data/emergency-simulation-topics/emergency-simulation-topics.schema.ts:1-16` and `emergency-simulation-topics.resource.ts:1-44` — schema-only `fromZod`, `defineFields`, `defineResource`, and standard permission names.
- Current permission catalog: `apps/api/src/authorization/catalog.ts:400-410` — one system module with `view`, `list`, `detail`, `create`, `update`, and `delete` permissions.
- Current seed registration: `apps/api/scripts/seed.ts:39-44,349-355` — module seed function import and call.
- Current navigation: `apps/web/src/manifest/navigation.ts:30-55` — master-data route entries and separators.

### Commands

| Purpose | Command | Expected result |
|---|---|---|
| API focused test | `pnpm --filter @southneuhof/api test:focused src/routes/law-reference-items/law-reference-items.routes.spec.ts` | Focused API spec passes |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test:focused routes/(authenticated)/master-data/law-reference-items/law-reference-items.resource.spec.ts routes/(authenticated)/master-data/law-reference-items/law-reference-items.integration.spec.ts` | Focused resource and route specs pass |
| API type check | `pnpm --filter @southneuhof/api type-check` | Exit 0 with no TypeScript errors |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0 with no TypeScript errors |
| API focused lint | `pnpm --filter @southneuhof/api lint:focused src/routes/law-reference-items/law-reference-items.entity.ts src/routes/law-reference-items/law-reference-items.ts src/routes/law-reference-items/law-reference-items.routes.spec.ts src/routes/law-reference-items/law-reference-items.seed.ts` | Exit 0 |
| Web focused lint | `pnpm --filter @southneuhof/framework-web lint:focused routes/(authenticated)/master-data/law-reference-items` | Exit 0 |
| Local schema and seed | `pnpm --filter @southneuhof/api db:push && pnpm --filter @southneuhof/api db:seed` | Schema applies and seed completes |
| Diff check | `git diff --check` | No whitespace errors |

Do not run package-wide test or bare `vitest run` by default. Use a full suite
only if a focused failure proves a cross-module registration risk, and record
that reason in this worksheet.

### Scope

In scope:

- `apps/api/src/routes/law-reference-items/law-reference-items.entity.ts` — new category and item tables, entities, schemas, and relations.
- `apps/api/src/routes/law-reference-items/law-reference-items.ts` — standard item routes and custom tree route.
- `apps/api/src/routes/law-reference-items/law-reference-items.seed.ts` — idempotent category seed.
- `apps/api/src/routes/law-reference-items/law-reference-items.routes.spec.ts` — focused API acceptance tests.
- `apps/api/src/routes/index.ts` — domain and route registration.
- `apps/api/src/authorization/catalog.ts` — system permission module and six permissions.
- `apps/api/scripts/seed.ts` — seed registration.
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.schema.ts` — API-bound web schema.
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.actions.ts` — custom tree action and response types.
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.resource.ts` — field catalog and resource actions.
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/index.route.vue` — category filter, tree, dialogs, permissions, and reload workflow.
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.resource.spec.ts` — field and resource action checks.
- `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.integration.spec.ts` — route and navigation checks.
- `apps/web/src/manifest/navigation.ts` — master-data entry under `Undang-Undang`.
- `apps/web/src/manifest/__tests__/manifest.spec.ts` — navigation assertion.
- `apps/web/src/routes/(authenticated)/master-data/index.route.vue` — master-data hub entry.

Generated scope:

- `apps/web/src/route-map.d.ts` only if the normal route generator changes it.
  Do not edit this file by hand.

Out of scope:

- `packages/is-vue-framework` and all shared framework components.
- Legacy repository files.
- Law fulfillment tables or dependent fulfillment writes; no current table exists.
- IBPRP consumer route changes; they consume the owner list contract.
- Separate category CRUD screens; categories are fixed, seeded, and read-only.
- Separate create, detail, or edit pages; the approved legacy-parity surface is one tree page with dialogs.

### Steps

#### Step 1: Add the database entities and API schemas

Create the two tables in one entity file. Use text UUID IDs, audit fields,
indexes for category, parent, and deleted rows, a nullable self-reference for
`parentId`, and the legacy soft-delete fields (`deleted`, `deletedByUserId`,
`deletedAt`, `deletedReason`). Keep category `code` unique and item category
code as its foreign key. Create entity schemas with `fromZod`-compatible
select, create, and update shapes. Make category and parent relations named in
the select schema. Create a `defineRelationsPart` for category and parent.

Create validation shapes for the enum `reference | applicable`, active boolean,
category code, optional parent ID, and level integer. Server-owned fields must
not be accepted from create or update input.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

#### Step 2: Implement and register the authenticated API

In the route file, define `listAccess`, `detailAccess`, `createAccess`,
`updateAccess`, and `deleteAccess` with the six catalog permissions. Use the
current standard route model, so the public action paths are `/list`,
`/detail/:id`, `/create`, `/update/:id`, and `/delete/:id`.

Implement one custom `tree` GET route under the same model. It must return the
ordered categories and the selected category tree. Keep list responses flat for
lookup consumers. Accept and validate `lawReferenceCategoryCode`, `type`, and
`level` query filters. Exclude rows where `deleted` is true.

Implement server validation for same-category parents, exact parent level,
level-3 child rejection, root type rules, cycle rejection, and active category
checks. For delete, use one transaction: find all descendants with a recursive
query, then update the full ID set with the actor and timestamp. Return the
standard action response. Do not hard delete rows.

Register `domain`, `model`, and `tree` route in `apps/api/src/routes/index.ts`.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0; then run the
focused API spec after Step 4.

#### Step 3: Add authorization and category seed data

Add a `law-reference-items` system module to `apps/api/src/authorization/catalog.ts`
with these permissions: `view-law-reference-items`,
`list-law-reference-items`, `detail-law-reference-items`,
`create-law-reference-items`, `update-law-reference-items`, and
`delete-law-reference-items`.

Add the three category rows with stable IDs, exact names, and exact codes to
the module seed. Use `onConflictDoUpdate` or an equivalent idempotent upsert.
Register the seed in `apps/api/scripts/seed.ts`. Do not seed law item records.

**Verify**: `pnpm --filter @southneuhof/api db:push && pnpm --filter @southneuhof/api db:seed` → both commands exit 0 and the three categories exist.

#### Step 4: Add focused API tests

Model the fixture and cleanup on
`apps/api/src/routes/emergency-simulation-topics/emergency-simulation-topics.routes.spec.ts`.
Create a system session with the item permissions and three temporary item
rows. Cover:

- unauthenticated and limited sessions return 401/403 for list, tree, create,
  update, and delete;
- category seed or fixture is returned in the tree response in legacy order;
- root and child create returns nested category and parent metadata;
- wrong-category parent, wrong level, missing root type, child type, level-3
  child, and cycle inputs return 400;
- list filters by category, type, and level;
- detail excludes soft-deleted records;
- deleting a root marks the root and descendants deleted and removes them from
  list and tree reads.

Clean up item rows, sessions, roles, permissions, and fixture users in
`afterEach`. Close the database in `afterAll`.

**Verify**: `pnpm --filter @southneuhof/api test:focused src/routes/law-reference-items/law-reference-items.routes.spec.ts` → all focused API tests pass.

#### Step 5: Add the web schema, actions, and resource

Create the schema with `defineSchema` and `fromZod` only. Use the API entity
schemas as the source of types. Keep scalar `lawReferenceCategoryCode` and
`parentId` as write fields. Add computed read projections for category and
parent names; do not fetch or map labels in the route.

Create `loadTree(categoryCode)` in `law-reference-items.actions.ts` using the
typed RPC custom tree endpoint and `parseHonoResponse`. Return the API tree
type with `children`, category metadata, and allowed operations.

Create one `defineFields` catalog. Use exact legacy labels. Use a radio source
for `type` with `Reference` and `Applicable`, a radio source for `active` with
`Berlaku` and `Tidak Berlaku`, and route context behavior to hide `type` for
children. Pass root category, parent, and level through `initialData` and
`context`; do not let users edit server-owned hierarchy fields.

Define standard `list`, `detail`, `create`, `update`, and `delete` actions with
the normal `view/create/update/delete` web permissions. Add `loadTree` as a
custom resource action without inventing a generic workflow abstraction.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

#### Step 6: Build the authenticated tree route and navigation

In `index.route.vue`, follow the current work-items route. Load the category
metadata and selected tree, default to `environment`, and use `ChipFilter`
with the exact category names and order. Render `TreeTable` with `Nama`,
`Tipe`, `Status`, and route-local row actions. Indent through the framework
tree surface, not custom CSS tree markup.

Use `DialogForm` for root create, child create, and edit. Show add-child only
for levels 1 and 2. Keep edit available for all levels. Guard controls with
the permission store. Confirm delete, call the resource delete action, and
reload the selected tree. Keep the dialog open when a write fails and show the
API error.

Add the navigation entry under a new `Undang-Undang` separator with title
`Regulasi & Perundangan HSSE` and icon `folder`. Add the same label to the
master-data hub. Do not edit generated route declarations by hand.

**Verify**: `pnpm --filter @southneuhof/framework-web lint:focused routes/(authenticated)/master-data/law-reference-items` → exit 0; `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

#### Step 7: Add focused web tests and run the selected checks

Add resource tests for exact field order, labels, radio sources, child type
visibility, action permissions, and custom `loadTree`. Add integration tests
for the route name, default entry route, navigation separator, title, icon, and
permission. Do not add pixel snapshots or broad CRUD matrices.

Run the focused API and web tests, focused lint, both type checks, schema/seed
smoke, and `git diff --check`. If the web route generator updates
`apps/web/src/route-map.d.ts`, include only that generated diff.

**Verify**: the commands in the Commands table pass; `git diff --check` exits 0.

#### Step 8: Browser acceptance and independent verification

Start the local API and web application with the repository's normal dev
commands. Use one authenticated Codex browser session. Create only marked
temporary law item records. Record each temporary ID in the worksheet.

Verify the route, default `Lingkungan` category, category changes, root create,
child create, edit, reload, recursive delete, and lookup-filter behavior. Delete
temporary records and reload to confirm removal. Record URL, surface, action,
temporary IDs, and visible result.

Set the worksheet to `VERIFY` and invoke `$verify-ads-hk-module`. Only a
`PASS` verdict may move the worksheet and plan to `DONE`.

### Test plan

- API: `apps/api/src/routes/law-reference-items/law-reference-items.routes.spec.ts`,
  modeled on the emergency simulation topic route spec. Test auth, permissions,
  schema validation, relation metadata, filters, tree nesting, and recursive
  soft delete.
- Web resource: `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.resource.spec.ts`,
  modeled on the emergency simulation topic resource spec. Test field labels,
  field order, source options, context behavior, and permissions.
- Web integration: `apps/web/src/routes/(authenticated)/master-data/law-reference-items/law-reference-items.integration.spec.ts`,
  modeled on the emergency simulation topic integration spec. Test route and
  navigation registration.
- Browser: authenticated local journey only. No pixel snapshots.

### Done criteria

- [ ] The approved design remains linked and unchanged in the plan.
- [ ] Entity schemas, category relation, parent relation, and recursive child
      data compile and pass focused API tests.
- [ ] API permissions return 401/403 correctly and all item writes validate
      category, parent, level, type, and cycle rules.
- [ ] Recursive soft delete excludes descendants from list, detail, and tree.
- [ ] Seed creates the three exact category records idempotently.
- [ ] Web resource uses schema-bound fields and exact legacy labels.
- [ ] Tree route uses framework `TreeTable`, `DialogForm`, `Form`, and
      `ChipFilter` with no framework changes.
- [ ] Navigation and route integration tests pass.
- [ ] Focused API and web tests, type checks, focused lint, seed smoke, and
      `git diff --check` pass.
- [ ] Authenticated browser acceptance passes and temporary records are removed.
- [ ] `$verify-ads-hk-module` returns `PASS`.
- [ ] `plans/README.md` status row is updated only after verifier `PASS`.

### STOP conditions

Stop and report instead of improvising if:

- The current route model does not expose the standard `/list`, `/detail`,
  `/create`, `/update`, and `/delete` actions used in this plan.
- Drizzle cannot express the category or self-parent relation in the current
  domain registration without changing framework code.
- A current law fulfillment table or consumer write contract is discovered;
  do not add it in this slice.
- The API requires a new permission realm or a permission name that differs
  from the approved catalog without a new design decision.
- The framework lacks a required `TreeTable`, `DialogForm`, `ChipFilter`, or
  field behavior; do not edit the framework.
- A focused check fails twice after a reasonable fix attempt.
- The authenticated browser is unavailable after one valid retry. Mark
  `UI UNVERIFIED` or `BLOCKED`; do not claim completion.
- Any required label, route action, delete rule, or lookup contract differs
  from the approved design.

### Maintenance notes

- Any future law item consumer must use the flat owner list and its category,
  type, and level filters. Do not add consumer-owned lookup routes.
- If categories become user-managed, split category CRUD into its own approved
  module and replace the fixed seed contract.
- If law fulfillment tables return to the current schema, extend the delete
  transaction only through a new approved design; do not add hidden side effects.
- Review recursive delete and parent-cycle checks as one security boundary.

## Acceptance checklist

### Execution worksheet

- [ ] This plan contains the worksheet and one active step at a time.
- [ ] The worksheet records module, plan, design, planned SHA, state, active
      step, next action, read/write boundary, result, and evidence.
- [ ] State is `READY` before source edits, `EXECUTE` during edits, and
      `VERIFY` before independent verification.
- [ ] Every completed step has a path, command report, or browser result.
- [ ] No `TODO`, `REWORK`, `STOP`, or `BLOCKED` item remains before verification.

### Scope and evidence

- [ ] Module name, shape, owned relations, and lookup consumer are recorded.
- [ ] Discovery ledger is recorded above.
- [ ] Approved design is linked and read.
- [ ] Direct legacy owner and required list/detail/create/edit/workflow surfaces
      are recorded.
- [ ] Exact labels, headings, actions, validation, and status text are recorded.
- [ ] Reused, searched, and gap decisions are recorded.

### Evidence ledger

| Question | Evidence | Result | Status |
|---|---|---|---|
| Identity and fields | Legacy migration/model; current entity after Step 1 | Fields and types match approved design | TODO |
| Legacy labels and behavior | Legacy Vue view: lines 67-153 | Labels and level-3 tree preserved | TODO |
| Relation or child owner | Legacy model: lines 113-173; current entity | Category and recursive parent relations | TODO |
| Lookup consumer | Legacy IBPRP consumers: `WorkItemIBPRPLeaf.vue:198-205`, `IBPRPDetailUnder.vue:166-174` | Flat filtered list remains available | TODO |
| Workflow or custom write | Legacy view: lines 79-148 | Standard writes plus custom tree presentation | TODO |
| API permission realm and verbs | Current catalog and route permission constants | System realm; six item permissions | TODO |
| Route and navigation owner | Legacy menu: `menu.ts:140-145`; current manifest | Master Data, `Undang-Undang` | TODO |
| Seed and reload | Legacy category seeder; current seed script | Three categories; reload after writes | TODO |
| Framework/UI gap | Current work-items route and framework TreeTable | No gap | TODO |

### Route and action matrix

| Surface | Legacy evidence | New route/action | Permission | Reused pattern | Result | Status |
|---|---|---|---|---|---|---|
| List entry | Legacy page/menu | `/master-data/law-reference-items` | `view-law-reference-items` | Work Items route | Browser/integration | TODO |
| List row | Legacy tree row actions | TreeTable row actions | create/update/delete | Work Items TreeTable | Browser | TODO |
| Detail | No separate legacy page | API detail action only | `detail-law-reference-items` | Standard resource action | API test | TODO |
| Child row | Legacy add child at levels 1-2 | TreeTable row action | `create-law-reference-items` | Work Items add-child | Browser | TODO |
| Create form | Legacy modal | DialogForm root/child | `create-law-reference-items` | DialogForm | Browser/API | TODO |
| Edit form | Legacy modal | DialogForm edit | `update-law-reference-items` | DialogForm | Browser/API | TODO |
| Delete | Legacy confirmation | Recursive soft delete | `delete-law-reference-items` | Work Items confirmation | Browser/API | TODO |

### User-facing label ledger

| Surface or field | Legacy label | New label | Status |
|---|---|---|---|
| Page heading | `Master Regulasi & Perundangan HSSE` | `Master Regulasi & Perundangan HSSE` | TODO |
| Tree heading | `Undang-Undang` | `Undang-Undang` | TODO |
| Name column | `Nama` | `Nama` | TODO |
| Type column | `Tipe` | `Tipe` | TODO |
| Status column | `Status` | `Status` | TODO |
| Create action | `Tambah` | `Tambah` | TODO |
| Active status | `Berlaku` | `Berlaku` | TODO |
| Inactive status | `Tidak Berlaku` | `Tidak Berlaku` | TODO |
| Root type | `Reference` | `Reference` | TODO |
| Root type | `Applicable` | `Applicable` | TODO |
| Help text | Legacy lines 71-72 | Exact legacy help text | TODO |

### Contract and data checks

- [ ] Database, API schema, operation, resource, and route names align.
- [ ] API authorization is tested for allowed and denied cases.
- [ ] Category and parent relation objects are present in list/detail and
      returned create/update records.
- [ ] Write fields keep scalar category and parent values; display fields use
      relation `read` projections.
- [ ] Flat list supports category, type, and level filters for lookup consumers.
- [ ] Seed is idempotent and the three records are present.
- [ ] Soft-deleted records are absent from list, detail, and tree reads.

### Workflow and UI checks

- [ ] Tree route uses approved framework surfaces.
- [ ] Default category is `Lingkungan`; category order is preserved.
- [ ] First load shows expected tree and labels.
- [ ] Root and child creation enforce level rules.
- [ ] Level 3 has no add-child action.
- [ ] Edit and delete actions remain on their intended row surface.
- [ ] Reload after create, update, and recursive delete shows correct hierarchy.
- [ ] Failed writes keep the form open and show an error.
- [ ] Authenticated browser evidence records URL, surface, action, temporary ID,
      and visible result.

### Independent verification

- [ ] Worksheet state is `VERIFY` and no implementation step is active.
- [ ] `$verify-ads-hk-module` reviewed the plan, design, diff, legacy evidence,
      focused checks, seed, and browser journey.
- [ ] Verifier verdict is `PASS`.

### Final evidence

- [ ] Focused API tests pass.
- [ ] Focused web tests pass.
- [ ] API and web type checks pass.
- [ ] Focused API and web lint pass.
- [ ] Seed smoke passes.
- [ ] `git diff --check` passes.
- [ ] Reused, Searched, and Gap are reported.
- [ ] No unchecked item remains.
