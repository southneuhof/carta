# Plan 003: Make login state persistence transactional and failures visible

> **Executor instructions**: Execute each step and verification gate in order. If a STOP condition occurs, stop and report rather than broadening scope. Update the plan status in `plans/README.md` when finished unless a reviewer maintains it.
>
> **Drift check (run first)**: `git diff --stat b5402b7..HEAD -- apps/web/src/routes/'(public)'/auth/login/index.route.vue apps/web/src/routes/'(public)'/auth/login/index.route.spec.ts apps/web/src/stores/permissions.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/002-characterize-auth-mutation-boundaries.md`
- **Category**: bug
- **Planned at**: commit `b5402b7`, 2026-07-12

## Why this matters

The current login flow writes `profile` and `permissions` before it knows whether the account has application access or a valid destination. A permissionless account therefore remains authenticated according to the route guard, while the empty catch block gives failed credentials and network failures no visible explanation. The fix must stage remote results, build access state, and commit browser state only after every acceptance condition succeeds.

## Current state

```ts
// apps/web/src/routes/(public)/auth/login/index.route.vue:42-60
storage.localStorage.set('profile', profile)
storage.localStorage.set('permissions', tasks)
if (tasks?.length === 0 && !BYPASS_ALL_PERMISSIONS) {
  loginMessage.value = { message: 'Anda tidak memiliki akses ke aplikasi ini', type: 'error' }
  loading.value = false
  return
}
// ...build stores, resolve destination...
} catch (_) {
  loading.value = false
}
```

- `apps/web/src/router/guards.ts:8` treats any stored `profile.id` as authenticated.
- `apps/web/src/stores/permissions.ts:8-10` only replaces the internal `Set` when the new array has a nonzero length, so `build([])` cannot clear stale permissions.
- Existing app language for login errors is Indonesian; preserve that convention and do not expose raw backend errors.
- Plan 002 creates the component test harness at `apps/web/src/routes/(public)/auth/login/index.route.spec.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Login tests | `pnpm --filter @southneuhof/framework-web test -- routes/\(public\)/auth/login/index.route.spec.ts` | all login cases pass |
| Full tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/routes/(public)/auth/login/index.route.vue`
- `apps/web/src/routes/(public)/auth/login/index.route.spec.ts`
- `apps/web/src/stores/permissions.ts`

**Out of scope**:

- Server-side session or authorization design
- Router guard semantics
- Replacing browser storage with another persistence system
- SSO logout behavior in `utils/services.ts`
- Any shared package

## Git workflow

- Suggested branch: `codex/plan-003-transactional-login`
- Suggested commit, if requested: `fix: make web login state transactional`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Add failing regression tests

Extend the plan-002 login spec with these cases:

1. zero assigned permissions with bypass disabled shows the no-access message, does not persist `profile` or `permissions`, does not navigate, and clears any staged in-memory access state;
2. no accessible destination behaves the same way with the existing no-page message;
3. invalid credentials or a failed sign-in response displays a controlled error and leaves storage/navigation untouched;
4. permission-fetch rejection leaves storage/navigation untouched and displays a controlled error;
5. the submit state returns from loading on every failure path;
6. a successful login still commits profile and permissions once and navigates once.

Do not assert the exact raw server error. Assert stable, user-facing messages owned by this component.

**Verify**: run the focused login test command -> new regression cases fail for the expected premature persistence or missing-message reasons, while plan-002 success cases remain passing.

### Step 2: Make permission rebuilding replace stale state

Change `permissions().build(data)` so it always replaces the internal set with `new Set(data ?? [])`, including an empty array. Keep `has`, bypass, role-1 behavior, and `clear` unchanged. Add a focused unit case either to the login spec through the mocked contract or a small `stores/__tests__/permissions.spec.ts` only if direct store behavior cannot be proven through the login test.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` -> exit 0.

### Step 3: Stage access state before committing browser state

Refactor `login()` into this transaction order:

1. enable loading and clear the previous message;
2. await sign-in and validate its response;
3. await role permissions and validate its response;
4. derive assigned task IDs;
5. reject zero-task access when bypass is disabled, without writing browser state;
6. build the in-memory permission/module state from the staged tasks and resolve the destination;
7. if there is no destination, clear the staged stores and reject without writing browser state;
8. only then write `profile` and `permissions`, consume the redirect at the appropriate point, and await or return `router.push(destination)`;
9. use `finally` to reset loading.

If rejecting after the server has established a session, make one best-effort typed sign-out call. Failure of that cleanup must not replace the primary user-facing error. Do not call `storage.localStorage.clear()`, because that would erase the color preference; delete only authentication keys if cleanup is necessary.

**Verify**: focused login tests -> all pass.

### Step 4: Surface controlled failures

Replace the empty catch with stable messages that distinguish rejected credentials/API response from unexpected connectivity or permission-loading failure only where the response shape makes that distinction reliable. Never display stack traces or raw response objects. Keep messages in Indonesian to match the existing component.

**Verify**:

- focused login tests -> all pass;
- full web tests -> exit 0;
- type-check -> exit 0.

## Test plan

Use the plan-002 component harness. Cover success, zero permissions, no destination, sign-in failure, permission-fetch failure, and cleanup failure. Explicitly assert storage calls, store clear/build calls, navigation, message visibility, and loading/button state. No test may use real local storage or network.

## Done criteria

- [ ] No authentication keys are written before access and destination validation succeed.
- [ ] `permissions().build([])` clears stale permissions.
- [ ] Every failure path displays a controlled message and resets loading.
- [ ] No-access and no-destination paths do not navigate.
- [ ] Successful login retains existing behavior.
- [ ] Focused tests, all web tests, and type-check exit 0.
- [ ] No files outside Scope and the plan index are modified.

## STOP conditions

Stop and report if:

- Destination resolution fundamentally requires persisted browser state rather than staged Pinia state.
- Typed sign-out is unavailable in the current RPC client shape.
- Fixing the issue requires changing API authorization/session contracts.
- The characterization harness from plan 002 is absent or materially different.
- A verification command fails twice after a reasonable correction.

## Maintenance notes

Review the ordering of redirect consumption carefully: a failed attempt should not destroy a still-useful internal redirect unless the product explicitly wants one-shot behavior. Future authentication changes should preserve the transaction boundary: remote validation and access derivation first, persistence last.

