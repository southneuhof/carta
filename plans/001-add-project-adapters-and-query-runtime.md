# Plan 001: Add project adapters and the namespaced query runtime

> **Implementation instructions**: Implement infrastructure without migrating feature routes. Keep TanStack Query internal; public component/resource APIs remain `load` and `submit`. Run every verification and update `plans/README.md` when reviewed.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- packages/is-vue-framework/package.json packages/is-vue-framework/src apps/web/src/framework apps/web/src/main.ts pnpm-lock.yaml docs/architecture/web-application-architecture.md`; then verify architecture hash `6fbc44a012d92c4462e08914ca75b5b4226845c8` with `git hash-object`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/000-establish-migration-contracts.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

Components need automatic caching, request cancellation, invalidation, and URL-owned query state without exposing a second framework language. Project-specific response and error conventions also cannot live in reusable components. This phase supplies those mechanisms behind adapter interfaces while preserving `load` as the only data-acquisition contract.

## Current state

- `packages/is-vue-framework/src/adapters/plugin.ts:6-27` provides only a runtime and defaults.
- `apps/web/src/framework/adapters/crud/operations.ts` translates resource names to the app RPC client; response normalization is coupled to CRUD operations.
- `apps/web/src/framework/rpc.ts:1-10` creates the typed Hono client and resource proxy.
- `Table.vue` currently accepts one external `searchParameters` object and directly calls its `load`; independent tables do not have automatic URL namespaces.
- Target behavior: query state defaults to a stable resource-derived namespace, supports multiple tables per view, permits an explicit namespace or local query-state override, and delegates URL encoding/decoding to a project adapter. TanStack Query owns cache and cancellation internally; query keys are framework-generated identities used to prevent cache collisions and target invalidation.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0 |
| Framework test/types | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web test/types | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/package.json`
- `packages/is-vue-framework/src/adapters/`
- `packages/is-vue-framework/src/query/` (create)
- `packages/is-vue-framework/src/index.ts`
- framework adapter/query tests
- `apps/web/src/framework/adapters/` (project-specific implementations)
- `apps/web/src/main.ts`
- `pnpm-lock.yaml`

**Out of scope**:

- Core component or route migration
- Public exposure of `useQuery`, `QueryClient`, query keys, or TanStack option objects through resource definitions
- Opinionating one backend envelope in the framework
- Encoding namespaces into resource names or adding nested-resource vocabulary

## Git workflow

- Suggested branch: `codex/plan-001-query-adapters`
- Suggested commit: `feat(framework): add query and project adapters`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Install and own TanStack Query in the framework package

Add `@tanstack/vue-query` at the reconfirmed current compatible version (recon found `5.101.4`) to `packages/is-vue-framework`. Register one `QueryClient` through the framework plugin, with an optional injected client for tests/advanced projects. Do not require apps to install a second Vue plugin manually.

**Verify**: frozen install, framework type-check, and a plugin test proving isolated app instances receive isolated clients all pass.

### Step 2: Define the project adapter boundary

Extend plugin options with a named `adapters` object. Implement interfaces for collection/record normalization, backend-error normalization, query-string read/write, and optional RPC schema lookup. Defaults must be conservative and framework-owned; app-specific implementations belong under `apps/web/src/framework/adapters/`, not in components or resources.

Update `apps/web/src/main.ts` to install the app adapter bundle. Preserve `{ runtime, defaults }` during compatibility.

**Verify**: unit tests prove app adapter overrides are isolated per Vue app and missing optional adapters use defaults.

### Step 3: Implement deterministic query identities

Create an internal query-key factory from resource identity, operation (`list`/`detail`), record identity where applicable, normalized query input, and an optional instance discriminator. Keys must be serializable and deterministic. Expose invalidation helpers by resource/record semantics, not raw array manipulation.

**Verify**: tests prove equal logical inputs produce equal keys; two resources, two record IDs, and two explicit table instances cannot collide; object property order does not change identity.

### Step 4: Implement namespaced URL query ownership

Create a composable/service that derives a default namespace from resource identity and supports dotted URL keys such as `victims.page`. The public prop for overriding it is `namespace`: when the same resource appears twice in one route, only the second instance must supply a stable `namespace` (e.g. `<Table namespace="archived">` → `archived.page`). Support an explicit local query-state object that bypasses router persistence. Define replace-vs-push behavior in the app query adapter and prevent update loops. Do not expose "discriminator" or other coined terms in the public API.

Sibling-tab preservation (decided 2026-07-26): links between sibling routes under a shared parent layout preserve the other siblings' namespaced query params within that subtree, so tab round-trips keep each table's page/search. Navigating out of the subtree drops them.

**Verify**: tests cover one table with no explicit binding, two different resources, duplicate resource instances, back/forward restoration, unrelated query parameter preservation, malformed values, and local-state override.

### Step 5: Wrap `load` with internal query execution

Add an internal loader composable that accepts the public `load` function and context, forwards `AbortSignal`, normalizes project results, and uses the key factory. Support sync/offline return values without special vocabulary. Define retry defaults and stale-time in adapters/defaults, not resources. Mutations must invalidate the appropriate list/detail identities through semantic helpers.

Load re-execution is governed by the deterministic query key, never by `load` function/closure identity. This is load-bearing for plan 006: resource prop factories return fresh closures per call, and equal logical inputs must dedupe to the same cached execution.

**Verify**: fake-timer tests prove deduplication, cancellation on key change/unmount, cache separation, sync values, normalized failures, and targeted invalidation.

## Test plan

- Plugin isolation and optional injection.
- Query-key determinism/collision suite.
- Router-backed namespace suite using memory history.
- Loader suite using deferred promises and abort assertions.
- Adapter contract tests for at least two distinct response-envelope shapes.

## Done criteria

- [ ] TanStack Query is an internal dependency and one client is installed per app.
- [ ] App-specific normalization/query behavior lives only in `apps/web/src/framework/adapters/`.
- [ ] Default resource-derived query namespaces work without `v-model:query`.
- [ ] Duplicate instances and local query ownership have explicit escape hatches.
- [ ] No feature route or core component migrated.
- [ ] Framework/web test, type-check, and lint commands pass.
- [ ] Index row updated to `DONE`.

## STOP conditions

- Public contracts must expose TanStack-specific types to remain usable.
- Router synchronization cannot preserve unrelated query keys or creates a navigation loop.
- App-specific envelopes leak into framework contracts.
- Existing runtime/plugin consumers break rather than coexist.

## Maintenance notes

Query keys are private implementation details; reviewers should reject resources that author raw keys. A future cache backend may replace TanStack without changing resource definitions if this boundary remains intact.
