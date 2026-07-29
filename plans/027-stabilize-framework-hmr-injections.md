# Plan 027: Preserve framework injections across HMR and consumer installs

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If a STOP condition occurs, stop and report; do not improvise.
> Update the Plan 027 row in `plans/README.md` after implementation and review.
>
> **Drift check (run first)**: `git diff --stat 7700799..HEAD -- packages/is-vue-framework/package.json pnpm-lock.yaml packages/is-vue-framework/src/runtime.ts packages/is-vue-framework/src/adapters/defaults.ts packages/is-vue-framework/src/adapters/projectAdapters.ts packages/is-vue-framework/src/query/client.ts packages/is-vue-framework/src/renderers/registry.ts packages/is-vue-framework/src/adapters/__tests__ plans/README.md`
> If any in-scope implementation file changed since this plan was written,
> compare the excerpts below with live code. Stop if the injection-key design
> or package dependency layout differs materially.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug, dependencies, tests
- **Planned at**: commit `7700799`, 2026-07-29

## Why this matters

`FrameworkPlugin` provides five dependencies once at application bootstrap.
Route components consume those dependencies through Vue injection. Each current
key uses `Symbol(...)`, which creates a new identity whenever Vite HMR reloads
the module; a newly mounted route can therefore look up a different key and
throw `[is-vue-framework] FrameworkPlugin is not installed.`. `Form` and
`Table` then render after setup aborted, producing the misleading secondary
`$setup.loaded is undefined` error. The published framework also lists Vue and
Vue Router as both peers and runtime dependencies, which can install a second
Vue runtime in consumers and cause the same injection failure.

## Current state

- `packages/is-vue-framework/src/adapters/plugin.ts` installs all framework
  dependencies into Vue's app context once:

  ```ts
  // packages/is-vue-framework/src/adapters/plugin.ts:38-47
  app.provide(frameworkRuntimeKey, runtime)
  app.provide(frameworkDefaultsKey, resolveFrameworkDefaults(options?.defaults))
  const adapters = resolveFrameworkAdapters(options?.adapters)
  app.provide(frameworkAdaptersKey, adapters)
  app.provide(rendererRegistriesKey, createRendererRegistries(options?.renderers))
  app.provide(frameworkQueryClientKey, queryClient)
  ```

- These five source modules create process-local keys with `Symbol(...)`:

  ```ts
  // runtime.ts:35; defaults.ts:53; projectAdapters.ts:142;
  // query/client.ts:14; renderers/registry.ts:62
  export const frameworkRuntimeKey: InjectionKey<FrameworkRuntime> = Symbol('is-vue-framework-runtime')
  ```

- `Form` consumes adapters before it defines `loaded`, then its template reads
  `loaded.loading.value` (`components/core/Form.vue:46,55,262`). This confirms
  the template error is derivative, not a loader result.
- `package.json:27-30` correctly declares Vue and Vue Router as peers, but
  `package.json:51-52` repeats both in `dependencies`.
- Tests use direct `createApp(...).use(FrameworkPlugin, ...)` mounts. Follow
  `src/adapters/__tests__/runtime.spec.ts` and
  `src/adapters/__tests__/projectAdapters.spec.ts` for Vitest style and cleanup.
- The shipped web architecture requires routes to compose framework surfaces;
  see `docs/architecture/web-application-architecture.md`, “Layers”. Do not
  replace injection with a global singleton: separate Vue apps must remain
  isolated.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install/lockfile | `pnpm install --lockfile-only` | exit 0; only intended lockfile metadata changes |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Targeted regression tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/adapters/__tests__/runtime.spec.ts src/adapters/__tests__/injection-keys.spec.ts` | exit 0; all selected tests pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

Known baseline: at plan time the full framework test suite has one unrelated
`FormView` CSS assertion failure; the full web suite has six unrelated failures.
Do not change those tests in this plan. Record any regression beyond those
known failures.

## Scope

**In scope**:

- `packages/is-vue-framework/src/runtime.ts`
- `packages/is-vue-framework/src/adapters/defaults.ts`
- `packages/is-vue-framework/src/adapters/projectAdapters.ts`
- `packages/is-vue-framework/src/query/client.ts`
- `packages/is-vue-framework/src/renderers/registry.ts`
- `packages/is-vue-framework/src/adapters/__tests__/injection-keys.spec.ts` (new)
- `packages/is-vue-framework/package.json`
- `pnpm-lock.yaml`
- `plans/README.md`
- `plans/027-stabilize-framework-hmr-injections.md`

**Out of scope**:

- `apps/web/src/App.vue` error presentation. It can improve diagnostics, but
  cannot restore a lost injection key and must not hide this framework defect.
- Changes to `FrameworkPlugin` installation order. It already installs before
  the router in `apps/web/src/main.ts`.
- Existing failing form/route assertions and unrelated runtime dependencies.
- Any production build, package publishing, commit, push, or PR.

## Git workflow

- Work on current user branch; do not create a branch, commit, push, or open a PR.
- Follow existing TypeScript style: named exported constants, single quotes,
  semicolons omitted, focused Vitest `describe`/`it` tests.

## Steps

### Step 1: Stabilize every plugin-owned injection key

Replace `Symbol('is-vue-framework-...')` with `Symbol.for('is-vue-framework-...')`
for exactly these exported keys: `frameworkRuntimeKey`,
`frameworkDefaultsKey`, `frameworkAdaptersKey`, `frameworkQueryClientKey`, and
`rendererRegistriesKey`. Keep each string unchanged. `Symbol.for` preserves one
key identity within the browser realm across HMR module re-evaluation while
Vue's per-app `provide` values still isolate distinct applications.

**Verify**: `rg -n "export const (frameworkRuntimeKey|frameworkDefaultsKey|frameworkAdaptersKey|frameworkQueryClientKey|rendererRegistriesKey).*Symbol\\.for" packages/is-vue-framework/src` prints exactly five declarations.

### Step 2: Add an HMR-identity regression test

Create `packages/is-vue-framework/src/adapters/__tests__/injection-keys.spec.ts`.
Import all five public key constants from their defining modules. Assert each is
strictly equal to `Symbol.for` using its existing string. Include one test that
uses two `createApp` instances with `FrameworkPlugin` and confirms their
provided runtime values remain different, following `runtime.spec.ts:21-33`.
This guards the necessary property: key identity survives module replacement
without turning app-provided values into a global singleton.

**Verify**: run targeted regression tests; expected: all selected tests pass.

### Step 3: Make Vue runtime ownership peer-only

Remove `vue` and `vue-router` from `dependencies` in
`packages/is-vue-framework/package.json`. Add the same compatible version
ranges to `devDependencies` so package-local typechecking and Vitest retain
their direct test tooling. Keep `peerDependencies` unchanged. Run
`pnpm install --lockfile-only`; inspect the lockfile and retain only resolution
changes caused by this manifest change.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.

### Step 4: Review scope and regression behavior

Run the targeted tests and both typechecks. Inspect `git diff --check` and
`git diff --name-only`; every modified file must be listed in Scope. Update the
Plan 027 status in `plans/README.md` to `DONE` only after review passes.

**Verify**: all commands in “Done criteria” meet their expected result.

## Test plan

- New key-identity regression: every plugin-owned key equals its `Symbol.for`
  registry value.
- New isolation regression: two independently installed plugin apps receive
  their own runtime values after keys become realm-stable.
- Existing behavior: `runtime.spec.ts` continues to prove descendant injection
  and missing-installation errors.
- Execute exact targeted test command above, plus framework and web typechecks.

## Done criteria

- [ ] Exactly five plugin-owned `InjectionKey` declarations use `Symbol.for`.
- [ ] New test asserts all five registry identities and app-value isolation.
- [ ] `vue` and `vue-router` occur in framework peers and dev dependencies, not
  framework runtime dependencies.
- [ ] `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.
- [ ] Targeted framework tests exit 0.
- [ ] `pnpm --filter @southneuhof/framework-web type-check` exits 0.
- [ ] `git diff --check` exits 0 and modified files stay within Scope.
- [ ] Plan 027 row in `plans/README.md` is `DONE` after review.

## STOP conditions

- Stop if any selected key is intentionally used as cross-realm identity
  rather than browser-realm Vue injection.
- Stop if moving Vue/Vue Router makes package-local tests unable to resolve the
  peer after adding matching dev dependencies.
- Stop if lockfile changes include unrelated package upgrades/removals.
- Stop if HMR still produces missing-injection errors after keys are stable;
  then investigate duplicate physical Vue resolution before changing more code.

## Maintenance notes

- Future framework-provided Vue dependencies must use a stable `Symbol.for`
  key and be added to the same regression test.
- Keep Vue and Vue Router as peers: framework components must use the consumer
  application's renderer/runtime, not a bundled second copy.
- This plan deliberately does not solve general route exceptions or existing
  test baseline failures; review those separately.
