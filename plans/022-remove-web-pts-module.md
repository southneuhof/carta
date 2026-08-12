# Plan 022: Remove the web PTS module

> **Implementation instructions**: Remove only the web PTS surface. Keep the API, database, domain, and PTS master-data modules.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/quality/pts' apps/web/src/manifest apps/web/src/framework/notifications apps/web/src/route-map.d.ts`

## Status

- **Priority**: P1
- **Status**: DONE
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

The current web PTS module is not part of the target frontend and must not consume migration work. Its backend stays in use. Removing the web route, navigation, notification target, generated route types, and route tests before module migration prevents a false requirement to support its complex old resource.

## Current state

- `apps/web/src/manifest/navigation.ts:3,21` imports `pts` and adds the Quality/PTS entry.
- `apps/web/src/framework/notifications/moduleRoutes.ts:5` maps `qhsse-pts` notifications to the web PTS detail route.
- `apps/web/src/route-map.d.ts:303-326` declares four `quality-pts*` routes.
- `apps/web/src/routes/(authenticated)/quality/pts/` contains four routes, the old resource and operations, and one route spec.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| PTS scan | `rg -n "quality-pts|quality/pts|ptsOperations|ptsFields" apps/web/src` | no matches |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0, except a separately recorded pre-existing failure |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Backend check | `git diff --name-only -- apps/api packages/domain packages/contracts packages/sdk` | no matches |

## Scope

**In scope**:

- Delete all files under `apps/web/src/routes/(authenticated)/quality/pts/`
- `apps/web/src/manifest/navigation.ts`
- `apps/web/src/manifest/__tests__/manifest.spec.ts`
- `apps/web/src/framework/notifications/moduleRoutes.ts`
- Its focused notification mapping test, if one exists under `apps/web/src/framework/notifications/`
- `apps/web/src/route-map.d.ts`

**Out of scope**:

- `apps/api/src/routes/qhsse-pts/`
- Database schemas, migrations, contracts, SDK, and domain code
- `master-data/pts-work-categories`
- A replacement PTS page or redirect

## Git workflow

- Branch: `codex/022-remove-web-pts`
- Commit: `refactor(web): remove PTS frontend`
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Remove entry points

Remove the Quality/PTS navigation entry and the `qhsse-pts` notification route mapping. When no valid web target exists, the notification module must use its existing no-target behavior. Do not invent a replacement route.

**Verify**: focused manifest and notification tests pass.

### Step 2: Delete the route module

Delete the entire web PTS route directory, including its old resource, operations, and tests.

**Verify**: `find 'apps/web/src/routes/(authenticated)/quality/pts' -type f` must report that the path does not exist.

### Step 3: Refresh generated route types

Use the repository's route generation path through the normal web type check or build. Confirm that only PTS route entries leave `route-map.d.ts`. Do not hand-edit unrelated route declarations.

**Verify**: the PTS scan has no matches and web type check exits 0.

### Step 4: Run final checks

Run all commands in the table. Confirm that backend paths have no diff.

## Test plan

- Remove the deleted PTS route spec with the module.
- Update manifest and notification mapping tests to prove no PTS entry or target remains.
- Use generated route types, full web tests, type check, and the source scan as deletion evidence.
- Do not add a redirect test because no replacement route is approved.

## Done criteria

- [ ] No web PTS route, resource, operation, navigation item, route type, or notification target remains.
- [ ] Backend PTS code is unchanged.
- [ ] PTS work categories still exist.
- [ ] Web checks pass with no new failure.

## STOP conditions

- Stop if another active web workflow imports PTS code outside the listed scope.
- Stop if notification handling requires a product decision instead of the existing no-target behavior.
- Stop if route generation changes non-PTS routes.

## Maintenance notes

If PTS returns to the web app, build it as a new module against the unified schema and action API. Do not restore these deleted files.
