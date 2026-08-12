# Plan 024: Migrate the read-only resource cohort

> **Implementation instructions**: Select one unchecked module per execution. The two modules share a list/detail public shape, but their record sources differ. Follow the module-specific note.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/master-data/number-variables' 'apps/web/src/routes/(authenticated)/settings/permissions'`

## Status

- **Priority**: P1
- **Status**: DONE
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans 018-021
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Module checkpoints

- [x] `number-variables`
- [x] `permissions`

## Why this matters

Both modules expose only list and detail. They need no create, update, delete, or form contract. Grouping them prevents repeated plan text while the one-module execution rule keeps the enriched permission loader isolated.

## Current state

- `number-variables.resource.ts:4-17` defines list and detail over a conventional Hono resource.
- `permissions.operations.ts:14-31` loads permissions and enriches each record with its module.
- `permissions.resource.ts:6-23` uses explicit generics because the enriched record differs from the direct permission endpoint record.

Representative enriched path:

```ts
const result = await permissionTransport.list(context)
return { ...result, data: await Promise.all(result.data.map(withModule)) }
```

Do not change this data behavior in this migration.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Number variables | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; this module has no focused spec |
| Permissions test | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/permissions/permissions.resource.spec.ts'` | exit 0 |
| Boundary test | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/__tests__/route-resource-boundary.spec.ts` | exit 0 |
| Web test | `pnpm --filter @southneuhof/framework-web test` | no new failure |
| Old API scan | `rg -n "defineFields|capabilities:|table: \{ fields|detail: \{ fields|\.operations" '<selected module root>'` | no matches |

## Scope

Select exactly one directory:

- `apps/web/src/routes/(authenticated)/master-data/number-variables/`
- `apps/web/src/routes/(authenticated)/settings/permissions/`

Allowed shared file: `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts`.

**Out of scope**:

- Adding write actions
- Optimizing the permission/module request pattern
- API response changes
- Framework package changes

## Git workflow

- Branch per execution: `codex/024-<module>-schema`
- Commit per execution: `refactor(web): migrate <module> resource`
- Do not combine cohort modules in one commit, push, or pull request unless asked.

## Steps

### Step 1: Define the selected schema

For number variables, derive the contract from `rpc['number-variables']` and use the entity select schema. For permissions, define the enriched `Permission` record contract explicitly; the direct endpoint schema does not describe the joined `module` object. It is valid for a schema part to have no runtime validator.

**Verify**: web type check exits 0.

### Step 2: Define list and detail action blocks

Keep complete list and detail fields, permissions, route names, and current run behavior. For permissions, move `withModule` and its list/detail functions into the resource or a small `permissions.actions.ts`; do not keep an `operations` file only as a renamed bucket.

**Verify**: focused checks pass and neither returned resource exposes create, update, or delete.

### Step 3: Change list and detail routes

Bind `resource.list()` and `resource.detail({ id })` with `v-bind`. Preserve page titles and back targets.

**Verify**: web type check exits 0.

### Step 4: Delete the old file and close the checkpoint

Delete the selected `.operations.ts`, update tests and the boundary fixture, run all checks, and mark only the selected checkpoint.

## Test plan

- Number variables: rely on type checking, boundary checks, and the full web suite. Do not create a field-list test only to fill a gap.
- Permissions: preserve enrichment, missing-module error, exact routes, and read-only action availability in the existing spec.

## Done criteria

- [ ] The selected module exposes only list and detail.
- [ ] Its schema tells the truth about the actual frontend record.
- [ ] Its routes use action prop bags.
- [ ] Its old operations and field-selection API are absent.
- [ ] All selected checks pass.

## STOP conditions

- Stop if permission enrichment must change for correctness or performance; make that a separate plan.
- Stop if a runtime permission record schema is required but no honest schema exists.
- Stop if another module must change.

## Maintenance notes

If the API later returns the permission module inline, simplify the permission schema and loader in a separate change.
