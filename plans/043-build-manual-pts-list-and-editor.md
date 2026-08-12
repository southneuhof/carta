# Plan 043: Build the manual PTS list and report editor

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. Use the completed framework and API contracts from plans
> 040-042. Do not change framework code in this plan. If a STOP condition occurs,
> stop and report it. When implementation and review are complete, update this
> plan row in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 1b8ae46..HEAD -- packages/is-vue-framework apps/web/src/framework apps/web/src/routes/'(authenticated)'/quality apps/web/src/manifest apps/api/src/routes/qhsse-pts`
> Plans 040-042 are expected to change framework and API paths. Confirm their
> done criteria. Treat any other material mismatch as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans 040, 041, and 042
- **Category**: migration
- **Planned at**: commit `1b8ae46`, 2026-08-12

## Why this matters

The web PTS module was removed because it used the old resource API. Rebuild the
manual report list and editor on the current schema-bound resource API. The
table and card grid must use the framework's one collection lifecycle, and the
visible screen must keep legacy business parity.

## Current state

- Commit `ee44ad5` removed
  `apps/web/src/routes/(authenticated)/quality/pts/` so it could be rebuilt on
  the new resource API. There is no current PTS web module to preserve.
- `apps/web/src/routes/(authenticated)/master-data/projects/projects.resource.ts:23-64`
  is the current `defineFields(schema)` plus `defineResource` pattern.
- `apps/web/src/routes/(authenticated)/master-data/projects/index.route.vue:35-39`
  is the controlled-query `ListView` pattern.
- `apps/web/src/routes/(authenticated)/master-data/projects/create.route.vue`
  is the minimal `FormView` pattern.
- `apps/web/src/framework/hono/` owns the app Hono transport adapters. Use them;
  do not put Hono behavior in the framework package.
- Plan 040 adds the approved `ListView` `presentation` and `custom` slot.
- The screen and field contract is in
  `docs/superpowers/specs/2026-08-12-manual-pts-parity-design.md`, sections
  "Field rules", "Web screens: List", "Create and edit", and "Refresh and form
  behavior".

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Web tests | `pnpm --filter @southneuhof/framework-web test -- pts` | exit 0; focused PTS tests pass |
| Type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no errors |
| Lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Read and use `.agents/skills/web-ui-surface-reuse/SKILL.md`.
- Read `docs/architecture/web-application-architecture.md`,
  `packages/is-vue-framework/README.md`, and the nearest current resource and
  route examples before editing.
- Use `ponytail` to keep the card grid route-owned and avoid a generic local UI
  layer.

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/quality/pts/pts.schema.ts` (create)
- `apps/web/src/routes/(authenticated)/quality/pts/pts.actions.ts` (create)
- `apps/web/src/routes/(authenticated)/quality/pts/pts.resource.ts` (create)
- `apps/web/src/routes/(authenticated)/quality/pts/PtsCardGrid.vue` (create)
- `apps/web/src/routes/(authenticated)/quality/pts/index.route.vue` (create)
- `apps/web/src/routes/(authenticated)/quality/pts/create.route.vue` (create)
- `apps/web/src/routes/(authenticated)/quality/pts/[ptsId]/edit.route.vue` (create)
- focused route/resource/type tests in the same PTS directory
- `apps/web/src/manifest/navigation.ts`
- generated route type files only if the existing route generator updates them

**Out of scope**:

- PTS detail workflow surface; plan 044 owns it.
- Framework and API changes.
- A generic card grid, custom table, custom form, or custom input.
- Quality Inspection, print/PDF, import, and role-specific behavior.
- Client-side transition or permission rules.

## Reuse requirement

Reuse `ListView`, `FormView`, `DialogForm`, framework fields, lookup, radio,
checkbox-group, location, image, text-area, month, and current action/error
adapters. The only route-owned presentation component is `PtsCardGrid.vue`.
The final implementation report must state:

- **Reused**: exact framework surfaces used;
- **Searched**: exact framework and app paths checked;
- **Gap**: "none" for this plan, because plan 040 must already close the one
  approved gap.

## Git workflow

- Suggested branch: `codex/043-pts-list-editor`.
- Suggested commit: `feat(web): add manual PTS report screens`.
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Define the schema-bound PTS resource

Create one Zod schema and `defineFields` catalog for list, detail, create, and
update data. Reuse field references across actions. Keep labels and option
values in one place. Bind list/detail/create/update to app-owned Hono actions.
Expose the typed custom action client from `pts.actions.ts`; do not make custom
workflow actions look like standard resource mutations.

The create/update field order is:

1. division;
2. project;
3. PTS work category;
4. work-item category;
5. work item;
6. work area or zone;
7. criteria;
8. one or more root causes;
9. location;
10. before image;
11. finding description.

Required and optional rules must match the API. Do not include `date`, `source`,
QI fields, or role fields.

**Verify**:
`pnpm --filter @southneuhof/framework-web test -- pts.resource`
must pass schema/resource field, payload, and route tests. If the repository's
test filter uses file substrings, use the created test file basename.

### Step 2: Implement dependent lookup behavior

Use framework field behavior and lookup sources. Project options depend on
division and server scope. Work-item category depends on project. Leaf item
depends on project and parent category. Clear a child selection when its parent
changes. Root causes allow one or more active values. Keep server validation as
the authority.

Do not create local lookup input components. If the current framework cannot
express a required dependency with documented field behavior, stop; do not edit
the framework in this plan.

**Verify**:
focused tests must prove option parameters and child reset behavior for each
dependency.

### Step 3: Build create and edit routes with FormView

Create the report route with `FormView v-bind="pts.create()"`. Create the edit
route with the record identity and `pts.update()`. Let API `availableActions` or
record operations control the edit link. A report is editable only at `report`.

Use existing image retention and location adapters. Standard create/update
resource actions already invalidate semantic resource queries; do not add a
second invalidation mechanism.

**Verify**:

- focused route tests show all eleven fields in order;
- optional zone/description do not block submit;
- missing required fields do block submit;
- `pnpm --filter @southneuhof/framework-web type-check` exits 0.

### Step 4: Build the list controls and table presentation

Create status tabs for all, open, on progress, and closed. Add search,
start-month, end-month, and root-cause filters. Keep one controlled `query` object
so tab, filters, search, page, and presentation share state. Use existing
`ListView` export. Add create and detail actions from the resource contract.

Use the table presentation as the default. Use API record operations for edit
and delete visibility. Do not infer permissions from the current user in the
route.

**Verify**:
focused tests must assert the exact query changes for tabs and filters and must
show no separate data loader in the route.

### Step 5: Add the route-owned PTS card grid

Use `presentation="custom"` and the `custom` slot from plan 040. Pass only
loaded records and presentation-safe values into `PtsCardGrid.vue`. Show:

- reporter and report time;
- before and after images;
- criteria and status;
- project, division, number, PTS work category, work-item category, zone, root
  causes, and description;
- the same detail and delete actions as the table.

Use framework `Card`, `Chip`, `ImagePreview`, and `Button` surfaces. Do not
create a generic card-grid component. A switch between grid and table must keep
query, page, and records and must not start a new load.

**Verify**:
focused route tests must prove table/grid parity for records and actions and
must assert one loader lifecycle.

### Step 6: Add reason-based delete and explicit refresh behavior

Use a `DialogForm` with one required `deletedReason` field. On success:

1. await the custom delete action;
2. await `pts.invalidate({ id })`;
3. let active queries refetch;
4. close the dialog; and
5. show success.

On failure, keep the dialog open, show the normalized server error, do not show
success, and do not invalidate good cached data. Put this sequence in one local
PTS helper that plan 044 can reuse. Do not change generic custom-action
semantics.

**Verify**:
focused tests must cover required reason, success order, list refresh, and
failure behavior.

### Step 7: Run the web gate

**Verify**:

- `pnpm --filter @southneuhof/framework-web test -- pts`
- `pnpm --filter @southneuhof/framework-web type-check`
- `pnpm --filter @southneuhof/framework-web lint:check`
- `pnpm --filter @southneuhof/api type-check`
- `git diff --check`

All commands must exit 0. `git status --short` must show only in-scope files.

## Test plan

Add focused tests for:

- the eleven create/edit fields and required rules;
- division/project/category/item dependent lookups and resets;
- status tabs, search, month range, and root-cause filters;
- table/grid switch with one loader and retained query;
- card content and table/card action parity;
- edit availability only at report;
- delete reason and post-action invalidation order;
- failed delete keeps the dialog and cache state.

Test behavior and transport input. Do not snapshot full pages or framework
markup.

## Done criteria

- [ ] Current schema-bound resource and app Hono actions exist.
- [ ] List controls and query values match the approved contract.
- [ ] Table and grid share one `ListView` collection lifecycle.
- [ ] Card content and actions match the table.
- [ ] Create/edit fields, order, dependencies, and rules match the design.
- [ ] Update is available only before disposition.
- [ ] Delete requires a reason and refreshes without page reload.
- [ ] No framework, API, generic UI, QI, or role-exception code was added.
- [ ] Focused tests, type check, lint, and diff check pass.
- [ ] Reuse report contains Reused, Searched, and Gap.

## STOP conditions

Stop and report if:

- plan 040 did not supply loaded records from one `ListView` collection;
- plans 041-042 do not supply the approved list/detail/lookup/action contracts;
- a dependent input needs a new framework component;
- the route must infer transition or permission rules;
- a second loader or query owner appears necessary; or
- a check fails twice after a reasonable correction.

## Maintenance notes

Keep `PtsCardGrid.vue` route-local until a second application needs the same
contract. The local action/invalidate helper is for PTS because framework custom
actions are intentionally plain functions. Plan 044 can reuse this helper but
must not add a second refresh sequence.

