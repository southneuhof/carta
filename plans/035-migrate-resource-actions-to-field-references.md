# Plan 035: Migrate resource actions to field references

> **Implementation instructions**: This is a reusable cohort plan. Select and complete one unchecked module per execution. Do not change two modules in one execution. Update only that checkpoint after focused verification.
>
> **Drift check**: `git diff --stat ab4c5ca..HEAD -- 'apps/web/src/routes/(authenticated)'`

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: L for all cohorts; S per module
- **Risk**: MED
- **Depends on**: plan 034
- **Category**: migration
- **Planned at**: commit `ab4c5ca`, 2026-08-12

## Module checkpoints

### Simple CRUD and read-only

- [x] `master-data/uoms`
- [x] `master-data/business-categories`
- [x] `master-data/pts-work-categories`
- [x] `master-data/root-causes`
- [x] `master-data/number-variables`
- [x] `settings/permissions`

### Transformed and nested master data

- [x] `master-data/divisions`
- [x] `master-data/number-configs`
- [x] `master-data/projects`
- [x] `master-data/projects/[projectId]/detail/vendors`
- [x] `master-data/work-items`

### Access and notification resources

- [x] `settings/roles`
- [x] `settings/users`
- [x] `settings/roles/[roleId]/detail/permissions`
- [x] `settings/users/[userId]/detail/system-roles`
- [x] `settings/users/[userId]/detail/project-roles`
- [x] `to-do/notifications`

## Why this matters

All 17 authenticated resource files currently define fields inside action-local
maps. The result repeats labels and renderer configuration and makes field order
reuse harder than it needs to be. Each module must define its field behavior
once, then let action arrays own only selection, order, and rare local
overrides.

One plan is enough because the migration is mechanical. One-module executions
keep verification and review small.

## Current state

- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts:14-61`
  repeats `roleCode`, `name`, `realm`, and `active` in four action maps. Update
  differs only because `realm` adds a disabled form behavior.
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts:9-57`
  repeats display fields while create and update select different form fields.
- `apps/web/src/routes/(authenticated)/master-data/projects/projects.resource.ts:26-86`
  repeats display accessors and the complete create/update form map.
- `apps/web/src/routes/(authenticated)/master-data/work-items/work-items.resource.ts:21-65`
  repeats lookup sources, display renderers, and form behavior.
- `apps/web/src/routes/(authenticated)/settings/permissions/permissions.resource.ts:7-29`
  already shares a plain constant, but it has no schema identity or ordered
  references.
- The current resource inventory is enforced by
  `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts:18-35`.

Representative current form:

```ts
create: {
  fields: {
    name: { label: 'Name', renderer: 'text' },
  },
},
update: {
  fields: {
    name: { label: 'Name', renderer: 'text' },
  },
},
```

Target form:

```ts
const fields = defineFields(schema, {
  name: { label: 'Name', form: { renderer: 'text' } },
})

create: { fields: [fields.name] },
update: { fields: [fields.name] },
```

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused resource spec | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src '<selected resource spec>'` | exit 0; skip only when the module has no focused spec |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Boundary test | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/__tests__/route-resource-boundary.spec.ts` | exit 0 |
| Module scan | `rg -n "fields:\\s*\\{" '<selected resource file>'` | no action-local field map |
| Whitespace | `git diff --check` | exit 0 |

## Scope

For one execution, select exactly one checked module directory from the list
above.

In that directory, change:

- the existing `*.resource.ts`;
- its focused resource spec or type test when an assertion must reflect field
  references or an override;
- no other module.

The shared boundary test can change only if plan 036 needs a final-state rule.
Do not change it during an ordinary module execution.

**Out of scope**:

- Framework package changes
- Schema, action, permission, route, validation, or transport behavior changes
- New `*.fields.ts` files unless the existing resource file becomes less clear
- New resource abstractions or shared application field catalogs
- Full field-list snapshots in tests

## Git workflow

- Branch per execution: `codex/035-<module>-fields`
- Commit per execution: `refactor(web): reuse <module> fields`
- Do not combine modules in one commit, push, or pull request unless asked.

## Steps for the selected module

### Step 1: Inventory exact field behavior and order

Read every action field map before editing. Record, for each field, its shared
label/accessor, display renderer, table options, detail options, form renderer,
source, props, behavior, and each action order. Treat current behavior as the
acceptance baseline.

**Verify**: no current field property or action order is unaccounted for.

### Step 2: Define one adjacent field set

Call `defineFields(<module>Schema, definitions)` in the resource file. Move
shared values to the top level and move surface values into `display`, `table`,
`detail`, or `form`.

Use one definition per field key. Do not create a variable for each field. Do
not add a module-wide abstraction beyond the one field set.

**Verify**: the field set contains every field selected by the module and no
action, permission, or route data.

### Step 3: Replace maps with ordered arrays

Replace each action field map with references in the same order. Let omission
express surface membership. Use `.override()` only where the current action
really differs from the base field behavior.

Known exceptions:

- `roles`: define the common `realm.form` once. Use one update override for
  `form.behavior.disabled`; create uses the base reference.
- `users`: create and update keep different arrays. Create-only `password`,
  `email`, and `systemRoleIds` do not need overrides. Update-only `statusCode`
  is selected only by update.
- `projects`, `number-configs`, `divisions`, and `work-items`: keep lookup
  resources, accessors, `write` functions, and renderer-owned props unchanged.
- `permissions`: keep the computed `realm` read field and permission/module
  enrichment unchanged.
- `project-vendors`: define the field set once outside the resource factory;
  keep `projectId` only in action runs, routes, and initial data.
- `notifications`: preserve Indonesian labels, datetime format, and the
  different list/detail selection.

**Verify**: the module scan finds no action-local field map.

### Step 4: Keep tests behavioral

Update the existing focused spec only where needed. Assert one representative
resolved field, exact order when order is behavior, and the role override where
applicable. Do not copy every action array into an expected test array.

Modules without a focused resource spec use type-check and the boundary test;
do not create a spec only to assert syntax.

### Step 5: Close one checkpoint

Run all applicable commands. Review that only the selected module changed.
Check only that module in this plan. Keep the plan TODO until all 17 checkpoints
are complete; use IN PROGRESS after the first completed module.

## Test plan

- Preserve existing resource specs and type tests.
- Add focused coverage only for behavior that could regress during projection:
  a lookup source, custom accessor/write function, renderer, field order, or
  `.override()` result.
- Run web type-check for every module because action/schema compatibility is a
  compile-time contract.
- Run the boundary test and whitespace check for every module.

## Done criteria

- [x] All 17 module checkpoints are complete.
- [x] Every standard action uses an ordered field-reference array.
- [x] Each module has one adjacent schema-bound field set.
- [x] Repeated create/update behavior is defined once.
- [x] Roles uses one terminal override for its update-only disabled behavior.
- [x] Existing selection, order, labels, renderers, accessors, sources, props,
      behavior, permissions, routes, and action runs are unchanged.
- [x] Focused and package checks pass for every module.

## STOP conditions

- Stop a module if its field key is absent from the matching schema part and is
  not a display-only computed field with `read`.
- Stop if preserving current behavior needs a second override call.
- Stop if a framework change is needed; return to plan 034 rather than adding a
  module-local workaround.
- Stop if another module must change in the same execution.
- Stop if the migration reveals that `null` or another clear operation is
  required.

## Maintenance notes

Field references are module-owned. Do not create one application-wide field
registry. Cross-resource lookup sources remain ordinary resource references.
