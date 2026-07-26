# Plan 008: Migrate users and prove multi-table/custom-load complexity

> **Implementation instructions**: Migrate users only after the roles slice is stable. Use this phase to exercise multiple independently querying tables, local/offline `load`, explicit query escape hatches, and a custom mapping workflow. Do not weaken the architecture merely to preserve legacy component structure.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- apps/web/src/routes/'(authenticated)'/settings/users apps/web/src/framework apps/web/src/router apps/web/src/components/navigations apps/api/src/routes/users packages/is-vue-framework/src docs/architecture/web-application-architecture.md`; verify architecture hash `6fbc44a012d92c4462e08914ca75b5b4226845c8`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/007-migrate-roles-as-nested-slice.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

Users adds a custom role-mapping workflow and supplies the second real proof that the architecture is not optimized only for textbook CRUD. The acceptance fixture must also demonstrate two tables owning separate URL query namespaces and a synchronous/offline loader, since those were explicit design requirements not fully exercised by the current app UI.

## Current state

- `apps/web/src/routes/(authenticated)/settings/users/index.route.vue:1-15` uses `CRUDComposite` plus a detail-under view.
- `apps/web/src/routes/(authenticated)/settings/users/UsersMappingRole.vue:11-18` obtains parent data by injection/query fallback; `31-43` runs mapping services; `46-57` fabricates unavailable CRUD operations/config; `61-70` renders a nested composite.
- `apps/web/src/routes/(authenticated)/settings/users/users.config.ts:1-24` disables create/delete and supplies legacy fields, aliases, filters, and form config.
- The user resource is not full CRUD. Capability inference must hide unavailable create/delete controls naturally. Role mapping is an explicit custom workflow and is not forced into generic CRUD.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| User tests | `pnpm --filter @southneuhof/framework-web test -- users` | all pass |
| Router tests | `pnpm --filter @southneuhof/framework-web test -- src/router` | all pass |
| Full web | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/framework-web build && pnpm --filter @southneuhof/framework-web lint` | exit 0 |
| Framework | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |

## Scope

**In scope**:

- users route tree, components/resources, and tests
- `apps/web/src/framework/adapters/resources/users.ts`
- users navigation/router manifest/tests
- a framework/app acceptance fixture or internal development route for multi-table/local-load proof; if a route is used, it must be excluded from production navigation and documented
- generated route types through the normal generator

**Out of scope**:

- Adding unsupported user create/delete API behavior
- General dashboard/product work
- Editing HKA-TROM
- Inventing generic mapping commands/actions
- Removing shared legacy framework code (plan 009)

## Git workflow

- Suggested branch: `codex/plan-008-users-complexity-slice`
- Suggested commit: `refactor(web): migrate users and complex loads`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Define the users resource and capability expectations

Translate the legacy fields/aliases/filters into the shared catalog and exact prop bags. Derive list/detail/update from RPC; omit unavailable create/delete behavior. Add tests asserting those controls are absent without explicit `create: false`/`delete: false` in ordinary configuration unless an override is needed for a real conflict.

**Verify**: resource tests type-check and the capability matrix contains list/detail/update only.

### Step 2: Create user filesystem routes additively

Add `/settings/users`, `/settings/users/:userId`, `/settings/users/:userId/edit`, and `/settings/users/:userId/roles`. Compose shells and native prop bags directly. Use route params or a typed route-layout context for parent identity/data; never query-based view switching or `inject<any>('data')`.

**Verify**: router tests assert paths/params and full type-check passes.

### Step 3: Rebuild role mapping as explicit workflow code

Render available roles through Table/ListView using a loader keyed by `userId`; keep assign/unassign behavior as explicit handlers with optimistic reconciliation, failure rollback, feedback, and targeted invalidation. Do not fabricate list/create/update/delete operations for mapping rows.

**Verify**: tests cover mapped/unmapped states, success/failure, rapid toggles, identity changes, cancellation, access denial, and cache refresh.

### Step 4: Prove independent table query ownership

Create an acceptance fixture that mounts at least two Table instances in one route. Use different resources so both derive namespaces with no `v-model:query`. Then mount the same resource twice and give only the second instance an explicit `namespace`. Assert URL changes affect only the owning table, survive back/forward, and preserve unrelated params.

**Verify**: automated router/component test asserts the exact namespaced query keys and independent pagination/search state.

### Step 5: Prove universal `load` and escape hatches

In the acceptance fixture, feed one component a synchronous offline `load`, one a Promise/RPC-style load, and one explicit local query-state override. Add one field using exceptional `read`, one using a `behavior` option (e.g. `visible` driven by another draft field), and one using default access to prove the normal path remains terse. Do not introduce source/mode/provider vocabulary.

**Verify**: tests assert identical component behavior across sync/async sources and that local state never mutates the URL.

### Step 6: Redirect old user URLs and remove feature legacy code

Normalize known `users_view` query URLs to new paths, update navigation, then remove `users.config.ts`, `UsersMappingRole.vue`, and user-only CRUDComposite wiring after zero-use checks.

**Verify**: `rg "users\.config|UsersMappingRole|users_view|CRUDComposite" apps/web/src/routes/'(authenticated)'/settings/users` has no active matches except redirect tests/comments; full commands pass.

## Test plan

- Users resource/capability type and runtime tests.
- Route and legacy redirect tests.
- Role mapping concurrency/error/access tests.
- Two-resource and duplicate-resource query namespace acceptance tests.
- Sync, async, and local-query load fixtures.
- Accessibility and denied-control absence assertions.

## Done criteria

- [ ] Users uses filesystem routes and direct prop bags.
- [ ] Unsupported create/delete controls disappear through inference.
- [ ] Role mapping is explicit workflow code without fake CRUD.
- [ ] Multiple tables own independent automatic query namespaces.
- [ ] Sync/offline and async loads use the same public contract.
- [ ] User legacy wiring is gone; old URLs redirect.
- [ ] Full validation passes and index row is `DONE`.

## STOP conditions

- Current APIs cannot identify or mutate mappings safely.
- Duplicate table instances cannot be distinguished without burdening every ordinary Table call site.
- The acceptance proof requires production navigation to a test-only page.
- Migration requires inventing unsupported backend capabilities.

## Maintenance notes

Keep the multi-table/load acceptance fixture after migration; it is a framework contract test, not disposable demo code. It guards the requirements most likely to regress during simplification.
