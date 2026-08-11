# Plan 017: Restore session loading for the authenticated route group

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If a STOP condition occurs, stop and report it. Do not add
> authentication metadata to individual routes. When implementation and review
> are complete, update this plan's status in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f56a142..HEAD -- apps/web/src/router/file-routing/layout-groups.ts apps/web/src/router/__tests__/layout-groups.spec.ts apps/web/src/router/__tests__/routes.spec.ts apps/web/src/router/__tests__/guards.spec.ts apps/web/src/framework/identity.ts apps/web/src/manifest/navigation.ts`
> At planning time, `HEAD` is still `f56a142`, and the repository has extensive
> uncommitted RBAC work. `apps/web/src/router/__tests__/routes.spec.ts`,
> `guards.spec.ts`, `framework/identity.ts`, and `manifest/navigation.ts` contain
> user changes. Record their current diffs before editing and preserve them.
> Stop if the current excerpts below no longer match.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: `plans/011-move-browser-identity-to-memory.md`
- **Category**: bug
- **Planned at**: commit `f56a142`, 2026-08-11

## Why this matters

Plan 011 correctly moved browser identity and system permissions from local
storage to memory. A page refresh must therefore load `/me` before the
authenticated application renders or filters its navigation. The current file
route generator does not give the `(authenticated)` group its authentication
rule, so refresh skips `/me`, leaves the memory permission set empty, hides all
permission-controlled sidebar entries, and shows `Account` instead of the
current user. An anonymous browser can also render permission-free authenticated
pages such as `/dashboard`, although API authorization still protects server
data.

The route-group contract is the fix boundary: placing a route under
`(authenticated)` must imply authentication for all descendants. Do not restore
route-local `requiresAuth` blocks and do not persist identity again.

## Current state

- `apps/web/src/router/file-routing/layout-groups.ts:9-20` promotes a layout onto
  its parent but copies only metadata declared by that layout:

  ```ts
  export function applyFileRouteConventions(root: LayoutTreeNode, isRoutesRoot = true): void {
    const layouts = root.children.filter(isLayoutFile)
    if (layouts.length) {
      if (isRoutesRoot) throw new Error(`Route layout must be below routes root: ${layouts[0].component}`)
      const layout = layouts.at(-1)!
      root.components.set('default', layout.component!)
      root.meta = { ...layout.meta }
      for (const duplicate of layouts) duplicate.delete()
    }
  }
  ```

- `apps/web/src/routes/(authenticated)/authenticated.layout.vue` contains no
  route metadata. This is intentional under the desired convention: the group
  name, not each route or layout file, owns the authentication rule.
- `apps/web/src/router/guards.ts:23-30` loads identity only when the generated
  route metadata says authentication is required:

  ```ts
  const needsIdentity = to.path === '/' || to.name === 'auth-login' || Boolean(to.meta.requiresAuth)
  if (!needsIdentity) return true
  authenticated = Boolean(await loadIdentity())
  ```

- `apps/web/src/framework/identity.ts:40-47` already applies the `/me` response
  to both current identity and the permission store. Do not change this code:

  ```ts
  identity.value = payload.data
  identityStatus.value = 'authenticated'
  permissions().build(payload.data.permissions)
  ```

- `apps/web/src/components/navigations/sidebar/rail/Sidebar.vue:11` derives the
  visible sidebar from the memory permission adapter. With an empty permission
  store, `apps/web/src/manifest/navigation.ts:52-53` removes every entry whose
  permission is not `null`. This explains why login first shows the full allowed
  navigation and refresh shows only a small permission-free subset.
- `apps/web/src/router/__tests__/guards.spec.ts:53-59` uses a hand-built route
  with `meta.requiresAuth: true`. It proves the guard behavior but does not prove
  that generated `(authenticated)` routes receive that metadata.
- `apps/web/src/router/__tests__/routes.spec.ts` verifies generated paths and
  names but does not verify group authentication metadata.
- Commit `17e7ed9` removed the old layout metadata and the old route-group test
  in the same mechanical routing change. No generated group rule replaced them.
- The accepted RBAC design in
  `docs/architecture/rbac-parity-design.md:247` requires `/me` to return the
  active user and effective system permissions, with browser identity held only
  in memory. Plan 011 requires an unknown identity to be loaded before a
  protected route decision.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Record overlapping user work | `git diff -- apps/web/src/router/file-routing/layout-groups.ts apps/web/src/router/__tests__/layout-groups.spec.ts apps/web/src/router/__tests__/routes.spec.ts apps/web/src/router/__tests__/guards.spec.ts apps/web/src/framework/identity.ts apps/web/src/manifest/navigation.ts` | existing RBAC changes are understood and preserved |
| Focused session and routing tests | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src router/__tests__/layout-groups.spec.ts router/__tests__/routes.spec.ts router/__tests__/guards.spec.ts framework/identity.spec.ts stores/permissions.spec.ts` | exit 0; all selected tests pass |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0; warnings are allowed only if they were already present |
| Route-local auth scan | `rg -n "requiresAuth" "apps/web/src/routes/(authenticated)"` | no matches |
| Framework scope check | `git diff --name-only -- packages/is-vue-framework` | no matches |
| Whitespace check | `git diff --check` | exit 0 |

The current full web suite has one verified, unrelated failure in
`project-role-assignments.route.spec.ts` because its test cannot select
`Division 1`. Run `pnpm --filter @southneuhof/framework-web test` after the
focused checks. It can either pass or fail only at that same known test. Any
new failure is a STOP condition. Do not repair the unrelated test in this plan.

## Scope

**In scope** (the only source files to modify):

- `apps/web/src/router/file-routing/layout-groups.ts`
- `apps/web/src/router/__tests__/layout-groups.spec.ts`
- `apps/web/src/router/__tests__/routes.spec.ts`
- `plans/README.md` status only after implementation

**Read-only verification context**:

- `apps/web/src/router/guards.ts`
- `apps/web/src/framework/identity.ts`
- `apps/web/src/stores/permissions.ts`
- `apps/web/src/manifest/navigation.ts`
- `apps/web/src/components/navigations/layouts/ProfileSegment.vue`
- `apps/web/src/components/navigations/sidebar/rail/Sidebar.vue`
- `apps/web/src/routes/(authenticated)/authenticated.layout.vue`
- `apps/web/src/routes/(public)/public.layout.vue`

**Out of scope**:

- Adding `<route>` blocks, `definePage`, or `requiresAuth` declarations to
  individual layouts or routes
- Changing the identity store, permission store, login route, guard, sidebar,
  navigation manifest, or profile component
- Restoring local-storage identity or permissions
- API, database, session-cookie, or RBAC resolver changes
- `packages/is-vue-framework`
- Fixing the known project-role assignment test failure
- A generic route-group policy registry; only `(authenticated)` has a current
  generated policy requirement

## Git workflow

- Branch: `codex/017-authenticated-route-group`
- Commit: `fix(web): restore authenticated group session load`
- Do not push or open a pull request unless the operator asks.
- Preserve all pre-existing uncommitted user work. Stage only this plan's
  implementation files if the operator later asks for a commit.

## Steps

### Step 1: Restore the route-group contract test

Expand `apps/web/src/router/__tests__/layout-groups.spec.ts` so it tests
`applyFileRouteConventions` as well as mechanical route names. Use a small local
test node like the historical test in commit `17e7ed9^`; do not add production
test helpers.

Add these cases:

1. A direct layout inside `(authenticated)` has no explicit metadata, but its
   promoted parent gets `requiresAuth: true`.
2. A direct layout inside `(public)` does not get `requiresAuth`.
3. Existing layout metadata is preserved when `(authenticated)` adds its rule.
4. The layout is still promoted and deleted as before.

The test must derive the group from the layout component path. It must not place
`requiresAuth` into the test layout input, because that would repeat the current
coverage gap.

**Verify**: `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src router/__tests__/layout-groups.spec.ts` -> exit 1 before the production change for the new authenticated-group assertion, with the other behavior unchanged.

### Step 2: Derive authentication once during route generation

Change `applyFileRouteConventions` in
`apps/web/src/router/file-routing/layout-groups.ts` at the layout-promotion
boundary. Derive the direct parent directory name from `layout.component`.
When and only when it is exactly `(authenticated)`, merge
`{ requiresAuth: true }` into the promoted parent metadata.

Keep the implementation local and small. Preserve layout metadata and existing
layout promotion. The generated authentication rule must win over an accidental
false value because membership in `(authenticated)` is the contract. Do not add
a configuration map, route catalog, new dependency, or framework API.

Target behavior:

```ts
const group = layout.component?.split('/').at(-2)
root.meta = {
  ...layout.meta,
  ...(group === '(authenticated)' ? { requiresAuth: true } : {}),
}
```

Equivalent shorter code is acceptable if it keeps the same behavior.

**Verify**: `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src router/__tests__/layout-groups.spec.ts` -> exit 0; all route-group and naming tests pass.

### Step 3: Lock the generated route result

Add one focused test to `apps/web/src/router/__tests__/routes.spec.ts` using the
existing generated `routes` and memory router. Assert:

- `router.resolve('/dashboard').meta.requiresAuth` is `true`;
- `router.resolve('/settings/users').meta.requiresAuth` is `true`;
- `router.resolve('/auth/login').meta.requiresAuth` is not `true`.

Do not test every authenticated route. These three checks cover one
permission-free route, one permission-controlled route, and the public
boundary without a brittle route inventory.

**Verify**: run the focused session and routing command from the command table -> exit 0; all selected tests pass.

### Step 4: Verify the real refresh behavior

Use the running local web and API applications in a browser.

1. With no session, open `/dashboard` directly. Expected: the browser ends at
   `/auth/login`; the authenticated shell and `Account` profile do not render.
2. Sign in with an operator-provided active local test account. Before refresh,
   record the profile name and the visible sidebar link text and targets.
3. Refresh the current authenticated URL. Expected: the same profile name and
   the same permitted sidebar links are present after `/me` completes.
4. Confirm that system permission routes do not disappear while
   permission-free project entry points remain visible.

Do not record credentials in the plan, test output, screenshots, or source. If
no local test account is available, complete the anonymous check and STOP before
claiming the signed-in refresh criterion passed.

**Verify**: browser evidence matches all four expected results; no source edit is needed in this step.

### Step 5: Run final checks and review scope

Run the focused tests, type check, lint, route-local auth scan, framework scope
check, full web test, and `git diff --check`. Review every changed hunk. Confirm
that each source hunk implements Step 1, Step 2, or Step 3 and that no existing
RBAC route-test edits were removed.

If the full suite still has the known project-role assignment failure, record it
as a pre-existing out-of-scope failure. Do not mark this plan blocked when all
focused checks pass and no new failure exists.

**Verify**: all focused commands meet the command-table expectations; the full
suite has no new failure; the browser check passes; only in-scope files contain
new implementation hunks.

## Test plan

- Extend `router/__tests__/layout-groups.spec.ts` with three semantic group
  cases and keep its existing route-name case.
- Extend `router/__tests__/routes.spec.ts` with one generated-route boundary
  test containing the three route assertions above.
- Reuse `router/__tests__/guards.spec.ts` unchanged. It already proves that
  `requiresAuth: true` causes the guard to await identity and redirect an
  anonymous request.
- Reuse `framework/identity.spec.ts` and `stores/permissions.spec.ts` unchanged.
  They already prove that `/me` restores identity and replaces the memory
  permission set.
- Use browser acceptance for the observable profile and sidebar behavior.
- Do not add snapshots, a route inventory, or per-route authentication tests.

## Done criteria

- [ ] `(authenticated)` generates `requiresAuth: true` once at its parent route.
- [ ] `(public)` does not generate the authentication rule.
- [ ] No route under `apps/web/src/routes/(authenticated)` declares
  `requiresAuth` locally.
- [ ] An anonymous direct `/dashboard` visit redirects to `/auth/login`.
- [ ] After login and refresh, the profile name and permitted sidebar links are
  unchanged.
- [ ] Focused session and routing tests exit 0.
- [ ] Web type check and lint exit 0.
- [ ] Full web tests have no new failure beyond the recorded unrelated
  project-role assignment failure.
- [ ] No framework, API, identity-store, permission-store, navigation, or route
  component source changed.
- [ ] `git diff --check` exits 0.
- [ ] The Plan 017 row in `plans/README.md` is updated after implementation.

## STOP conditions

Stop and report back instead of improvising if:

- The generated group cannot be identified from the direct layout component
  path without changing the file-router integration contract.
- `(authenticated)` is not a URL-transparent parent of `/dashboard` in the
  generated route tree.
- The guard does not call `loadIdentity()` after the generated metadata is
  restored.
- `/me` returns a valid identity but does not populate the permission store.
- The signed-in refresh still loses sidebar entries after generated metadata is
  confirmed.
- The repair appears to require a route-local marker, framework-package change,
  API change, or persistent browser authorization state.
- An in-scope current-state excerpt has drifted.
- A verification command fails twice, except for the one recorded unrelated
  project-role assignment test failure.
- Any new full-suite failure appears.

## Maintenance notes

- Treat `(authenticated)` as a semantic group, not only a pathless naming
  group. Future route-generator refactors must keep its authentication test.
- Keep one generated-route integration assertion. Guard tests with hand-built
  metadata cannot detect this regression alone.
- Do not cache `/me` data in browser storage. Refresh must rebuild identity and
  permissions from the server.
- If another route group later needs a generated policy, add it only for a real
  requirement. Do not create a generic policy registry in advance.
