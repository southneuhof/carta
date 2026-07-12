# Plan 004: Reconcile optimistic permission toggles with mutation outcomes

> **Executor instructions**: Follow this plan exactly and keep the fix inside `apps/web`. Run each verification command. Stop and report if the shared framework component must change; do not expand scope. Update `plans/README.md` when complete unless a reviewer owns it.
>
> **Drift check (run first)**: `git diff --stat b5402b7..HEAD -- apps/web/src/routes/'(authenticated)'/settings/roles/RolesDetailUnder.vue apps/web/src/routes/'(authenticated)'/settings/roles/RolesDetailUnder.spec.ts apps/web/src/routes/'(authenticated)'/settings/users/UsersMappingRole.vue apps/web/src/routes/'(authenticated)'/settings/users/UsersMappingRole.spec.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/002-characterize-auth-mutation-boundaries.md`
- **Category**: bug
- **Planned at**: commit `b5402b7`, 2026-07-12

## Why this matters

Both administrative switches update their bound row immediately, but neither caller reconciles that optimistic state with the server result. The role-permission path discards RPC responses entirely, and the user-role path returns a promise that the shared switch does not await. This plan keeps the shared framework untouched while giving each web caller an explicit pending, success, and rollback path.

## Current state

```vue
<!-- RolesDetailUnder.vue:41-48 -->
<Switch
  v-model="rowData.active"
  :onToggle="(nextValue: boolean) => {
    const route = rpc.roles[':roleId'].permissions[':permissionId']
    const request = { param: { roleId: String(data.value?.id || data.id), permissionId: String(rowData.id) } }
    if (nextValue) route.$put(request)
    else route.$delete(request)
  }"
/>
```

```vue
<!-- UsersMappingRole.vue:35-38 -->
<Switch
  v-model="data.active"
  :onToggle="(nextValue) => services.post('mapping-user-roles/toggle', { ... })"
/>
```

- The direct framework boundary `packages/is-vue-framework/src/components/inputs/Switch.vue:79-89` mutates the model before calling `onToggle` and discards its return value. This plan must work within that contract.
- `RolesDetailUnder.vue` already imports `toast`; use the same `vue-sonner` convention in both callers.
- Plan 002 creates shallow component tests that invoke the stubbed Switch's `onToggle` prop.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Mutation tests | `pnpm --filter @southneuhof/framework-web test -- RolesDetailUnder.spec.ts UsersMappingRole.spec.ts` | all toggle cases pass |
| Full tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Type-check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/settings/roles/RolesDetailUnder.vue`
- `apps/web/src/routes/(authenticated)/settings/roles/RolesDetailUnder.spec.ts`
- `apps/web/src/routes/(authenticated)/settings/users/UsersMappingRole.vue`
- `apps/web/src/routes/(authenticated)/settings/users/UsersMappingRole.spec.ts`

**Out of scope**:

- `packages/is-vue-framework/src/components/inputs/Switch.vue`
- Server authorization or endpoint semantics
- Replacing the unavailable user-role list operations
- Copy-role-permission dialog behavior
- Global error-handling refactors

## Git workflow

- Suggested branch: `codex/plan-004-reliable-permission-toggles`
- Suggested commit, if requested: `fix: reconcile permission toggle failures`
- Do not push or open a pull request unless instructed.

## Steps

### Step 1: Add regression tests for rejected and non-OK mutations

Extend both plan-002 specs:

- successful activation keeps `active === true`;
- successful deactivation keeps `active === false`;
- a rejected request restores the previous value and emits one error toast;
- a role RPC response with `ok === false` is treated as failure even when the promise resolves;
- a second click for the same row while its request is pending does not issue a duplicate mutation;
- pending state is released after success and failure.

Use deferred promises to assert the pending window deterministically; do not use timers or real network calls.

**Verify**: run the mutation test command -> the new failure/pending cases fail against current code for the expected reasons.

### Step 2: Extract explicit app-local toggle handlers

In each component, replace the inline callback with a named async function receiving the row and `nextValue`. Maintain a component-local reactive set of pending row IDs. The handler must:

1. ignore a duplicate call for an already-pending row;
2. record the row as pending;
3. await the mutation;
4. on the typed RPC path, inspect `response.ok` and throw a controlled error payload for non-OK responses;
5. on failure, restore `row.active = !nextValue` and show a stable Indonesian error toast;
6. remove pending state in `finally`.

Bind `:disabled` on each Switch while its row ID is pending. Because the Switch has already updated the model before invoking the handler, rollback must explicitly assign the prior boolean.

**Verify**: mutation tests -> all success, failure, and duplicate-click cases pass.

### Step 3: Preserve request contracts

Keep the existing role PUT/DELETE route selection and request parameters unchanged. Keep the user-role legacy endpoint and payload unchanged. This plan changes reliability, not API shape.

**Verify**: plan-002 request-selection assertions still pass, then run full tests and type-check -> exit 0.

## Test plan

Use shallow mounts and stubbed slot rows. Assert row state before invocation, immediately after the Switch's optimistic update, while the promise is pending, and after settlement. Assert toast count and request count. Test distinct row IDs to ensure pending state is per-row rather than global.

## Done criteria

- [ ] Both mutation callbacks are named, async, and await their requests.
- [ ] Non-OK role RPC responses are failures.
- [ ] Failed requests restore the prior row value and show one controlled toast.
- [ ] Same-row duplicate requests are blocked while pending.
- [ ] Successful request payloads and methods remain unchanged.
- [ ] Focused tests, full tests, and type-check exit 0.
- [ ] No shared-package or API file is modified.

## STOP conditions

Stop and report if:

- Correct rollback cannot be implemented without changing the shared Switch contract.
- The returned role RPC object is not a standard `Response`-like object with `ok` and `json()`.
- A row has no stable identifier suitable for pending-state tracking.
- The API requires different toggle semantics than the current PUT/DELETE and legacy-post contracts.
- A verification command fails twice after a reasonable correction.

## Maintenance notes

This is intentionally an app-local containment fix. If three or more consumers need the same pending/rollback behavior, propose a separately reviewed shared Switch API change rather than copying it again. Reviewers should scrutinize double-click handling and ensure rollback cannot overwrite a newer successful value.

