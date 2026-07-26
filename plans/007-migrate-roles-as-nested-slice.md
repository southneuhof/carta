# Plan 007: Migrate roles and permissions as the nested vertical slice

> **Implementation instructions**: Migrate only roles/permissions end to end. Use real filesystem routes, resource-native prop bags, and shells. Preserve user-visible capabilities and add redirects for old query-state URLs. Do not migrate users in this phase.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- apps/web/src/routes/'(authenticated)'/settings/roles apps/web/src/framework apps/web/src/router apps/web/src/components/navigations apps/api/src/routes/roles packages/is-vue-framework/src docs/architecture/web-application-architecture.md`; verify architecture hash `6fbc44a012d92c4462e08914ca75b5b4226845c8`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/006-build-native-resource-definitions.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

Roles is the smallest real feature that still exercises list/detail/create/update/delete plus a nested permissions workflow. Migrating it proves that nested placement can be expressed by filesystem structure and parent identity alone, without `CRUDComposite`, injected detail data, fake unavailable operations, or a special nested-resource type.

## Current state

- `apps/web/src/routes/(authenticated)/settings/roles/index.route.vue:1-18` renders `CRUDComposite` and injects `RolesDetailUnder` through a detail-under slot.
- `apps/web/src/routes/(authenticated)/settings/roles/RolesDetailUnder.vue:13` uses `inject<any>('data')`; `27-43` performs optimistic permission RPC toggles; `45-65` fabricates unavailable CRUD operations/config; `67-76` duplicates a raw list fetch; `81-117` nests another CRUD composite and dialog form.
- `apps/web/src/routes/(authenticated)/settings/roles/roles.config.ts:1-10` is legacy model config.
- `apps/api/src/routes/roles/roles.model.ts:9-30` defines standard role routes. Permission mapping is a custom workflow and may retain explicit RPC calls because it is extraordinary behavior.
- The target route tree should express hierarchy, for example `/settings/roles`, `/settings/roles/create`, `/settings/roles/:roleId`, `/settings/roles/:roleId/edit`, and `/settings/roles/:roleId/permissions`. Exact generated route names must be asserted from the file-router output rather than guessed in navigation code.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Route tests | `pnpm --filter @southneuhof/framework-web test -- src/router` | all pass |
| Roles tests | `pnpm --filter @southneuhof/framework-web test -- roles` | all pass |
| Web full | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Framework regression | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |

## Scope

**In scope**:

- roles route tree under `apps/web/src/routes/(authenticated)/settings/roles/`
- roles components/config/resources and focused tests
- `apps/web/src/framework/adapters/resources/roles.ts`
- route/navigation manifest and router tests for roles
- narrowly required permission-toggle service/store tests
- generated route type output only through the documented generator

**Out of scope**:

- Users migration
- API response-shape changes or authorization changes
- General framework features missing from plans 000-006
- Editing the external HKA-TROM repository
- Replacing the custom permission mutation with a fake generic CRUD operation

## Git workflow

- Suggested branch: `codex/plan-007-roles-vertical-slice`
- Suggested commit: `refactor(web): migrate roles to resource routes`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Add a minimal roles resource

Define the role field catalog and RPC resource under the app adapter/resource folder. Ordinary list/detail/create/update/delete loaders and submitters must derive from RPC. Bind schemas from plan 003. Provide route targets/access policy so standard controls infer automatically; add explicit behavior only for the permissions workflow.

**Verify**: resource type tests show direct Table/Detail/Form binding and no repeated ordinary RPC implementations.

### Step 2: Create real filesystem routes additively

Add files producing the five target URLs above. Each file calls its resource prop factory (`roles.table()`, `roles.detail({ id })`, `roles.form()` / `roles.form({ id })`) and composes a view shell with the relevant core. Route params supply factory arguments. If a shared role record is needed by child routes, use a route layout/provider scoped to `:roleId`; do not use a global string-key `inject<any>` or make the resource nested.

**Verify**: router tests enumerate each path, parent/child relationship, params, and lazy component; generated type-check passes.

### Step 3: Move permission mapping to the nested route

At `/settings/roles/:roleId/permissions`, render a resource-backed or explicit-load Table inside ListView/custom shell. Pass `roleId` from route params as an ordinary `searchParameters` entry — no `parent` vocabulary. Keep the permission toggle as explicit Vue workflow code with optimistic update, rollback/error feedback, cancellation protection, and semantic cache invalidation. Remove fake create/delete operations.

**Verify**: tests cover initial load, toggle success, rollback on failure, rapid repeated toggles, parent ID change, denied control disappearance, and list/detail cache refresh.

### Step 4: Switch to HTML5 history and preserve old URLs

Move the router from `createWebHashHistory` to `createWebHistory` (decided 2026-07-26). The app stays fully static/client-side; document the required static-host fallback rule (unknown path → `index.html`) in the app README and dev-server config. Add a boot-time normalizer that rewrites legacy hash URLs (`/#/path?query`) to their history-mode equivalents.

Replace the old roles index query-state dispatcher with a compatibility redirect/normalizer from known `roles_view`/identity query combinations to the new paths. Preserve unrelated query values where safe. Unknown values go to the roles list with a diagnostic, not a blank screen. Verify sibling-tab navigation under `:roleId` preserves each tab's namespaced query params per the README subtree-preservation decision.

**Verify**: router tests cover every old list/detail/create/update form, malformed legacy query cases, hash-URL normalization, and tab-switch query preservation; the dev server serves deep links directly.

### Step 5: Remove roles-only legacy wiring

Delete the legacy roles config and `RolesDetailUnder` only after no imports remain. Update navigation targets to the generated filesystem route names/paths. Do not touch shared legacy CRUD components yet.

**Verify**: `rg "roles\.config|RolesDetailUnder|roles_view|CRUDComposite" apps/web/src/routes/'(authenticated)'/settings/roles` returns no active roles implementation matches except intentional redirect tests/comments; full validation passes.

## Test plan

- Resource inference and prop-binding tests.
- Route-tree and legacy-redirect tests.
- CRUD happy/error workflows for list/detail/create/update/delete.
- Permission toggle concurrency/rollback/access tests.
- Accessibility assertions for shell controls and form errors.

## Done criteria

- [ ] Roles uses actual filesystem routes for each screen.
- [ ] Permission placement is conveyed only by route hierarchy and `roleId` context.
- [ ] Ordinary API calls are derived; the custom toggle remains explicit.
- [ ] No roles route uses `CRUDComposite`, query-based view switching, fake operations, or `inject<any>('data')`.
- [ ] Old URLs redirect predictably.
- [ ] Full framework/web validation passes and index row is `DONE`.

## STOP conditions

- Generated filesystem routes cannot express the parent/child paths without changing global routing conventions.
- Required permission endpoints/types are missing or their behavior cannot be characterized.
- The new UI loses an existing role/permission capability.
- A fix requires changing users or broad backend authorization behavior.

## Maintenance notes

This is the reference nested implementation. Keep it readable and explicit; future app migrations should copy its route/resource composition, not its domain-specific permission workflow.
