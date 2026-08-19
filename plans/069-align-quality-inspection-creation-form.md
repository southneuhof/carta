# Plan 069: Align Quality Inspection creation with framework standards

> **Implementation instructions**: Read this plan fully. Invoke the
> **Web UI Surface Reuse** skill before editing `apps/web`; record `Reused`,
> `Searched`, and `Gap` in the report. Use the framework's standard `ListView`
> Create button. Do not add a route-local normal Create button. Do not edit
> framework source. Preserve the server permission guard and the existing
> schedule-origin entry.
>
> **Drift check (run first)**: `git diff --stat 08b3028 -- apps/api/src/routes/quality-inspection apps/api/src/__tests__/quality-inspection.spec.ts apps/web/src/routes/(authenticated)/quality/quality-inspection`
> If the resource, selector, or context shape differs from this plan, stop and
> report before editing.

## Status

- **Priority**: P0
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/067-align-quality-inspection-list-parity.md
- **Category**: bug
- **Planned at**: commit `08b3028`, 2026-08-19

## Why this matters

The current QI form is functional, but it hides legacy work-item data and the
list route replaces the framework Create action with a local button. The
framework already supplies the correct Create button and the PTS route shows
the approved list patterns. Reusing those surfaces removes duplicate action
code and restores the information users need to select the right work items.

## Current state

- `apps/web/src/routes/(authenticated)/quality/quality-inspection/index.route.vue:46-49`
  renders local normal and schedule buttons. The normal button must be removed.
- `packages/is-vue-framework/src/components/views/ListView.vue:447-451`
  renders the standard Create button from `createRoute`.
- `packages/is-vue-framework/src/resources/actionResource.ts:431`
  derives `createRoute` only when the client access adapter allows the create
  permission. QI create permission is project-scoped, so keep the existing
  server-filtered project check and pass an explicit `create-route` value to
  `ListView` only when that check finds at least one permitted project.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/quality-inspection.resource.ts:23-28`
  makes the root work-item lookup depend on project only. Legacy depends on
  project and quality work category.
- `apps/api/src/routes/quality-inspection/quality-inspection.service.ts:151-177`
  returns a tree with name, leaf state, and ITPs, but not the work-item unit,
  volume, high-risk state, or category display data needed by the legacy tree.
- `apps/web/src/routes/(authenticated)/quality/quality-inspection/QualityInspectionWorkItemSelector.vue:20-115`
  shows only item name, volume, and ITP types. It has English instructions and
  does not show unit or High Risk.
- The legacy selector at
  `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/work-unit-inputs/quality-inspection/layouts/ChildDataQualityInspectionWorkItemITP.vue:47-115`
  shows work description, volume, unit, High Risk, inspection method, and
  selected-row volume with its unit.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| API focused test | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/quality-inspection.spec.ts` | exit 0 |
| Web focused tests | `pnpm --filter @southneuhof/framework-web test -- quality-inspection` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Suggested implementation toolkit

- Invoke `web-ui-surface-reuse`.
- Reuse `ListView` standard Create, `FormView`, `Form`, `Table`, and
  `TreeTable`.
- Use `apps/web/src/routes/(authenticated)/quality/pts/index.route.vue` as the
  standard for route composition and controls.
- Use `defineFields` and the existing QI resource. Do not create generic local
  input or table components.

## Scope

**In scope**:

- QI list route Create control.
- QI create/update resource fields and lookup dependencies.
- QI context response metadata for existing work-item fields.
- QI work-item selector presentation and labels.
- Focused API and web tests.
- `plans/README.md` status row.

**Out of scope**:

- Framework source changes.
- Recap export, schedule-origin display, detail workflow, KPI, notifications,
  Todo, mobile, and database migration unless an existing field is missing.
- A new generic Create component.

## Steps

### Step 1: Replace the local normal Create button

Remove the local **Buat Inspection/Test** button from the QI list route. Keep
the route-local permitted-project query because the permission is project
scoped. Pass the standard framework `createRoute` prop to `ListView` only when
the permitted project result is non-empty:

```ts
const createRoute = computed(() => hasCreateProject.value
  ? { name: 'quality-quality-inspection-create' }
  : undefined)
```

Use the framework's rendered **Create** button. Do not change the framework
permission adapter. Keep the schedule-origin control separate because it is a
custom workflow, not the standard CRUD create action.

**Verify**: the QI route test finds the framework button labelled `Create`
when a permitted project exists and no Create button when the project list is
empty. The test must not depend on a route-local QI button.

### Step 2: Return the existing work-item display metadata

Extend the context tree node contract and `loadContext` query with existing
work-item values for volume, unit name, category name, and High Risk. Keep the
current leaf and active-ITP rules. Do not add a new table or migration. If the
work-item entity lacks one of these fields, stop and report the missing schema
instead of inventing a replacement.

**Verify**: the API test proves root, parent, and selectable leaf nodes return
the new metadata and that only active leaves with active ITP data remain
selectable.

### Step 3: Fix form lookup dependencies and field labels

Make the root lookup reset and reload when either project or quality work
category changes. Pass both values to the existing Work Items resource query.
Keep server validation as the authority.

Update labels to the legacy vocabulary, including `Metode Inspeksi` and
`Proses`. Use the existing framework renderers for number, lookup, and
checkbox-group inputs.

**Verify**: the web resource test proves the root lookup is disabled until both
dependencies exist and receives both query values.

### Step 4: Match the selector information

Add TreeTable columns for work description, volume, unit, and High Risk. Keep
only leaf rows selectable. Add the selected-row columns for item, inspection
method, and volume with unit suffix. Keep positive volume and one-or-more ITP
type validation.

Use `Card`, `Chip`, `Table`, `TreeTable`, and `Form` from the framework. Do not
write native controls or a second tree implementation.

**Verify**: focused selector tests cover parent rows, selectable leaves,
High-Risk display, unit display, row removal, and validation.

### Step 5: Verify the real entry path

Use T3 preview after the focused tests. Confirm the standard Create button
opens the form, the project/category dependency works, and the selector shows
the legacy columns. Confirm the schedule-origin control remains available.

**Verify**: browser check passes or the exact preview limitation is reported.

## Test plan

- Update `apps/web/src/routes/(authenticated)/quality/quality-inspection/index.route.spec.ts`
  for standard Create visibility.
- Extend the QI resource/selector tests for dependency queries and metadata.
- Extend `apps/api/src/__tests__/quality-inspection.spec.ts` for context
  metadata and invalid root/category combinations.
- Do not add snapshot tests for rendered markup.

## Done criteria

- [ ] The normal QI entry uses the framework standard Create button.
- [ ] No route-local normal Create button remains.
- [ ] The schedule workflow remains a separate custom entry.
- [ ] Root lookup depends on project and category.
- [ ] The tree shows volume, unit, and High Risk.
- [ ] Selected rows show inspection method and unit.
- [ ] All commands pass and the browser path is checked or reported.
- [ ] No framework source or migration is changed.
- [ ] `plans/README.md` marks Plan 069 DONE after review.

## STOP conditions

Stop and report if:

- the standard Create button cannot be made visible with an explicit route
  prop and the existing server-filtered project check;
- doing so requires changing the framework permission adapter or `/me`;
- the unfinished user note about removing an additional control means the
  schedule-origin entry must also be removed; or
- required work-item metadata is not present in the current schema.

## Maintenance notes

The framework standard Create action is the long-term entry control. Future
project-scoped create routes should use the same explicit `createRoute`
pattern when the browser permission store cannot represent record coverage.
Reviewers should check that this does not grant server access; the API must
continue to enforce project permission.
