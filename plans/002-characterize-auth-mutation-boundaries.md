# Plan 002: Characterize authentication and administrative mutation boundaries

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving on. Stop on any condition listed below; do not change production behavior in this tests-only plan. Update the row in `plans/README.md` when complete unless a reviewer owns the index.
>
> **Drift check (run first)**: `git diff --stat b5402b7..HEAD -- apps/web/src/routes/'(public)'/auth/login/index.route.vue apps/web/src/utils/services.ts apps/web/src/routes/'(authenticated)'/settings/roles/RolesDetailUnder.vue apps/web/src/routes/'(authenticated)'/settings/users/UsersMappingRole.vue apps/web/src/**/*.spec.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: `plans/001-restore-catch-all-route.md`
- **Category**: tests
- **Planned at**: commit `b5402b7`, 2026-07-12

## Why this matters

The login component, legacy request bridge, and role-assignment controls are the app's highest-risk state transitions, but the current five test files cover router helpers and model-config merging only. Before their behavior is corrected in plans 003-005, this plan establishes reusable component and service harnesses around successful behavior. It deliberately does not lock in the known bugs: premature login persistence, discarded mutation failures, and unchecked upload completion receive regression assertions in their respective fix plans.

## Current state

- `apps/web/src/routes/(public)/auth/login/index.route.vue:27-58` performs sign-in, permission loading, storage writes, store rebuilds, redirect selection, and navigation in one function.
- `apps/web/src/utils/services.ts:57-206` owns fetch serialization, error parsing, 401 cleanup, SSO routing, uploads, downloads, and legacy endpoint suffixes.
- `apps/web/src/routes/(authenticated)/settings/roles/RolesDetailUnder.vue:41-48` chooses PUT or DELETE for permission toggles.
- `apps/web/src/routes/(authenticated)/settings/users/UsersMappingRole.vue:35-38` posts user-role toggle state to a legacy endpoint.
- Existing Vitest mocking style uses `vi.mock` before importing the subject; see `apps/web/src/router/__tests__/guards.spec.ts:1-23`.
- Vue component tests should use the already-installed `@vue/test-utils`; no new test framework is needed.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Login tests | `pnpm --filter @southneuhof/framework-web test -- routes/\(public\)/auth/login/index.route.spec.ts` | exit 0 |
| Service tests | `pnpm --filter @southneuhof/framework-web test -- utils/__tests__/services.spec.ts` | exit 0 |
| Mutation tests | `pnpm --filter @southneuhof/framework-web test -- RolesDetailUnder.spec.ts UsersMappingRole.spec.ts` | exit 0 |
| Full tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope** (tests only):

- `apps/web/src/routes/(public)/auth/login/index.route.spec.ts` (create)
- `apps/web/src/utils/__tests__/services.spec.ts` (create)
- `apps/web/src/routes/(authenticated)/settings/roles/RolesDetailUnder.spec.ts` (create)
- `apps/web/src/routes/(authenticated)/settings/users/UsersMappingRole.spec.ts` (create)

**Out of scope**:

- All production source files
- API authorization and API route implementation
- Shared framework components, including `Switch.vue`
- Testing the known broken no-permission persistence, failed-toggle rollback, or failed-upload registration behavior; later plans own those regression cases

## Git workflow

- Suggested branch: `codex/plan-002-characterization-tests`
- Use one tests-only commit such as `test: characterize web auth boundaries` if commits were requested.
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Build the login component harness

Create `index.route.spec.ts` beside the login component. Use `vi.hoisted` or equivalent stable state for mocks. Mock:

- the nested `rpc.api.auth['sign-in'].email.$post` and `rpc.roles[':roleId'].permissions.$get` calls;
- `storage.localStorage.set`;
- `permissions().build`, `modules().build`, and their values needed by navigation;
- `useRouter().push` and redirect consumption;
- visual child components as shallow stubs.

Test only currently valid success behavior:

1. credentials are sent as `{ json: { email, password } }`;
2. assigned permission IDs are persisted and used to build the stores;
3. a resolved destination is pushed exactly once;
4. a failed sign-in response does not fetch permissions or navigate;
5. a failed permission response does not navigate.

Assert storage keys and navigation outcomes, not private refs or implementation-specific call order beyond the required transaction sequence.

**Verify**: run the login test command above -> all login harness cases pass against current production code.

### Step 2: Build the service bridge harness

Create `apps/web/src/utils/__tests__/services.spec.ts`. Reset global `fetch`, browser location/storage state, and module mocks between cases. Mock router, module/permission stores, color preference, toast, and the RPC sign-out call before importing the singleton service.

Characterize:

- GET query encoding, including repeated array keys and omission of null/undefined;
- JSON request serialization and `credentials: 'include'`;
- non-OK JSON errors being thrown and toasted;
- a 401 clearing browser state and routing to login;
- detail identity segments being URI encoded;
- successful raw download creating and revoking one object URL.

Do not add upload failure cases yet; plan 005 owns that behavior.

**Verify**: run the service test command -> all cases pass with no real network calls.

### Step 3: Characterize administrative toggle requests

Create shallow-mount tests for both role components. Stub `CRUDComposite` so it renders the `list-rowActions` slot with a controlled row, and stub `Switch` so its `onToggle` prop can be invoked directly.

- For `RolesDetailUnder.vue`, assert `true` selects PUT and `false` selects DELETE with the injected role ID and row permission ID.
- For `UsersMappingRole.vue`, assert the legacy post uses `mapping-user-roles/toggle` with the resolved user ID, row role ID, and next active value.
- Do not assert optimistic rollback or response checking; those cases are added by plan 004.

**Verify**: run the mutation test command -> both request-selection suites pass.

### Step 4: Run the complete baseline

**Verify**:

- `pnpm --filter @southneuhof/framework-web test` -> exit 0.
- `pnpm --filter @southneuhof/framework-web type-check` -> exit 0.

## Test plan

This plan is itself the test plan. Prefer explicit assertions over broad snapshots. Every test must isolate browser state and restore globals in `afterEach`; no test may contact a real API or depend on execution order. Follow the mock-before-import convention in `router/__tests__/guards.spec.ts` and the plain `describe`/`it` style in `models/__tests__/mergeModelConfig.spec.ts`.

## Done criteria

- [ ] Four new test files exist at the paths above.
- [ ] Login success, sign-in failure, permission-fetch failure, 401 cleanup, request encoding, and both toggle request directions are covered.
- [ ] No production file is changed.
- [ ] `pnpm --filter @southneuhof/framework-web test` exits 0.
- [ ] `pnpm --filter @southneuhof/framework-web type-check` exits 0.
- [ ] Tests perform no real network requests.

## STOP conditions

Stop and report if:

- A passing characterization test requires changing production behavior.
- File-route macros prevent importing the login component under Vitest and cannot be handled by the existing Vite plugin.
- The framework stubs cannot expose the row-action slot without modifying shared package code.
- Plan 001 is incomplete and the full suite is still red for the catch-all assertions.
- A verification command fails twice after a reasonable test-harness correction.

## Maintenance notes

Plans 003-005 extend these files with regression tests; they should reuse the same mocks rather than create parallel harnesses. Reviewers should reject tests that merely assert mock calls without checking observable storage, navigation, row state, or thrown errors.

