# Plan 025: Migrate the transformed CRUD resource cohort

> **Implementation instructions**: Select one unchecked module per execution. These modules share standard CRUD but each has one explicit app-level transform or custom action. Follow only the selected module note.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/master-data/divisions' 'apps/web/src/routes/(authenticated)/master-data/number-configs' 'apps/web/src/routes/(authenticated)/master-data/projects' 'apps/web/src/routes/(authenticated)/settings/roles'`

## Status

- **Priority**: P1
- **Status**: DONE
- **Effort**: L for cohort; M per module
- **Risk**: MED
- **Depends on**: plans 018-021; module dependencies below
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Module checkpoints and order

- [x] `divisions` — after `business-categories` in plan 023
- [x] `number-configs` — after `number-variables` in plan 024
- [x] `projects` — after `divisions`
- [x] `roles` — no module dependency; complete before plans 028-030

## Why this matters

These modules use the same standard CRUD resource shape but cannot use the basic cohort because they normalize files or locations, use a lookup detail override, strip an immutable field, or expose one custom action. One cohort plan can state the common migration and keep each exception explicit.

## Current state

- `divisions.operations.ts:9-31` converts stored image paths to display assets and back.
- `number-configs.operations.ts:13-16` adds the custom `reorderNumberConfig` endpoint. Its resource uses number variables as a lookup at `number-configs.resource.ts:23-35`.
- `projects.operations.ts:21-45` converts stored locations and re-exports location lookup operations.
- `roles.operations.ts:10-20` removes `realm` from update payloads. `roles.resource.ts:12-15` also preprocesses update validation to remove it.

These are application rules. Keep them outside framework core.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused resource | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src '<selected resource spec>'` | exit 0 |
| Boundary | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/__tests__/route-resource-boundary.spec.ts` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Old API scan | `rg -n "defineFields|capabilities:|schemas:|\.operations|\.capabilities" '<selected module root>'` | no matches |

Focused specs:

- `routes/(authenticated)/master-data/divisions/divisions.resource.spec.ts`
- `routes/(authenticated)/master-data/number-configs/number-configs.resource.spec.ts`
- `routes/(authenticated)/master-data/projects/projects.resource.spec.ts`
- `routes/(authenticated)/settings/roles/roles.resource.spec.ts`

## Scope

Select exactly one directory:

- `apps/web/src/routes/(authenticated)/master-data/divisions/`
- `apps/web/src/routes/(authenticated)/master-data/number-configs/`
- `apps/web/src/routes/(authenticated)/master-data/projects/` except its `detail/vendors/` subtree
- `apps/web/src/routes/(authenticated)/settings/roles/` except its `detail/permissions/` subtree

Allowed shared file: `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts`.

**Out of scope**:

- The nested project-vendor and role-permission modules
- Framework changes
- New transport abstractions
- Behavior changes to transforms, permissions, or routes

## Git workflow

- Branch per execution: `codex/025-<module>-schema`
- Commit per execution: `refactor(web): migrate <module> resource`
- Do not combine cohort modules in one commit, push, or pull request unless asked.

## Common steps

### Step 1: Create the schema

Use the app Hono contract adapter and entity schemas. Put create/update validation and preprocessing in the schema. The schema must not import route, permission, Vue, or transport runtime code.

**Verify**: web type check exits 0.

### Step 2: Keep the selected exception explicit

- **Divisions**: keep `asset` and `stored` as app action mapping around standard runs.
- **Number configs**: use `numberVariables.list().run(...)` for lookup detail loading. Expose reorder only as `numberConfigs.actions.reorder.run`.
- **Projects**: keep location conversion around standard detail/create/update runs. Import `locationOperations` from its app adapter; do not re-export it from a generic operations file.
- **Roles**: keep realm removal in update validation and run behavior. Preserve the current disabled immutable-realm UX without a route dialog.

**Verify**: add or update focused cases for the selected exception only.

### Step 3: Build per-action fields and routes

Define complete fields in each standard action. Preserve all permissions and route names. Change the selected routes to `v-bind` action objects.

**Verify**: focused spec and web type check pass.

### Step 4: Remove old module API

Delete the selected `.operations.ts`; use a small `.actions.ts` only if the transform code makes the resource hard to read. Remove `defineFields`, old peer surface keys, capability access at route call sites, and old explicit generics.

**Verify**: old API scan has no matches.

### Step 5: Close one checkpoint

Run all commands and confirm that no other cohort module or excluded subtree changed. Mark only the selected module checkpoint.

## Test plan

Use the existing resource spec. Keep one test for the special mapping or custom action, one for action availability/routes, and one mutation invalidation test. Do not assert every field definition.

## Done criteria

- [ ] The selected transform remains explicit app code.
- [ ] Its standard schema and action blocks use the approved public API.
- [ ] Its custom action, if any, exposes only `run`.
- [ ] Routes use action prop bags.
- [ ] Old module API is absent.
- [ ] Focused and package checks pass.

## STOP conditions

- Stop if the selected transform changes wire semantics.
- Stop if a lookup dependency checkpoint is incomplete.
- Stop if a route-owned effect would move into a run function.
- Stop if the selected module needs a framework change.

## Maintenance notes

Keep module-specific transforms local. Similar syntax is not a reason to create a generic transform pipeline.
