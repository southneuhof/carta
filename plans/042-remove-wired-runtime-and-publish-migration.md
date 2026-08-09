# Plan 042: Remove obsolete wired runtime capabilities and publish migration guidance

> **Implementation instructions:** Final convergence plan. Run only after plans
> 035–041 are DONE. Remove obsolete runtime/API adapters, update every caller and
> catalog/doc, then run full workspace verification. Do not broaden this into
> legacy Table/Detail removal.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/runtime.ts packages/is-vue-framework/src/runtimeDefaults.ts packages/is-vue-framework/src/runtimeHooks.ts packages/is-vue-framework/src/adapters packages/is-vue-framework/src/index.ts packages/is-vue-framework/README.md apps/web/src/framework/adapters apps/web/src/main.ts apps/web/src/routes docs`

## Status

- **Priority:** P1
- **Effort:** M
- **Risk:** MED
- **Depends on:** 035, 036, 037, 038, 039, 040, 041
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Migration is incomplete while old runtime capability groups and endpoint
adapters remain public: new code can keep using them and dead configuration
continues to look supported. Final cleanup makes explicit loaders/operations the
only convention for migrated inputs and records breaking changes for downstream
implementers.

## Current state to remove after dependencies land

At planning commit:

```ts
// packages/is-vue-framework/src/runtime.ts:16-28
export interface FrameworkRuntime {
  table?: FrameworkTableRuntime
  detail?: FrameworkDetailRuntime
  select?: FrameworkSelectRuntime
  radioGroup?: FrameworkSelectRuntime
  checkboxGroup?: FrameworkSelectRuntime
  lookup?: FrameworkLookupRuntime
  fileInput?: FrameworkFileInputRuntime
  imageInput?: FrameworkImageInputRuntime
  upload?: FrameworkUploadRuntime
  location?: FrameworkLocationRuntime
  fileManager?: FrameworkFileManagerRuntime
  dynamicForm?: FrameworkDynamicFormRuntime
}
```

This plan removes migrated groups:

- `select`
- `radioGroup`
- `checkboxGroup`
- `lookup`
- `fileInput`
- `imageInput`
- `upload`
- `location`
- `fileManager`
- `dynamicForm` should already be removed by 035.

Keep `table` and `detail` runtime capability groups only if legacy composite
Table/Detail still use them. This cycle explicitly does not migrate all legacy
composites.

Web `framework/adapters/index.ts` currently bundles all capability modules into
`frameworkRuntimeCapabilities`. After prior plans, migrated adapters should be
ordinary imported operations or FileManagerPlugin options, not runtime members.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework unit tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Root typecheck | `pnpm type-check` | exit 0 |
| Root tests | `pnpm test` | all pass |
| Runtime audit | `rg -n "runtime\\.(select|radioGroup|checkboxGroup|lookup|fileInput|imageInput|upload|location|fileManager|dynamicForm)|Framework(Select|Lookup|FileInput|ImageInput|Upload|Location|FileManager|DynamicForm)Runtime|default(Select|Lookup|FileInput|ImageInput)" packages/is-vue-framework/src apps/web/src` | no matches |
| Endpoint audit | `rg -n "getAPI|getData|getDetail" packages/is-vue-framework/src/components/inputs/{SelectInput,RadioGroupInput,CheckboxGroupInput}.vue packages/is-vue-framework/src/components/composites/form-inputs/{LookupInput,LocationInput,MultiLocationInput}.vue` | no matches |

## Scope

**In scope**

- `packages/is-vue-framework/src/runtime.ts`
- `runtimeDefaults.ts`, `runtimeHooks.ts`, adapter plugin/runtime tests.
- Root/package exports and public API tests.
- Web framework adapter index and obsolete migrated adapter files.
- `apps/web/src/main.ts`
- Resource definitions, operation modules, and tests still using migrated props.
- Input catalog fixtures/tests.
- `packages/is-vue-framework/README.md`
- New `docs/architecture/input-data-migration.md`
- New `docs/architecture/file-manager-plugin.md`
- Root/package changelog if repository has one; otherwise document in migration
  guide and do not invent release infrastructure.
- `plans/README.md` status update.

**Out of scope**

- Removing `FrameworkRuntime` entirely if legacy Table/Detail still require it.
- Migrating arbitrary legacy Table/Detail/CRUD endpoint APIs.
- Multiple File Manager providers, auto routes, separate package.
- Broad design-system or form-model redesign.
- Changes to backend endpoints.

## Git workflow

- Branch: `codex/042-wired-runtime-cleanup`
- Suggested commits:
  1. `refactor(framework): remove wired input runtime`
  2. `docs(framework): publish input migration guide`
  3. `test(framework): verify migration boundaries`

## Steps

### Step 1: Prove all consumers migrated

Run runtime and endpoint audits before deleting types. Classify every match:

- migrated component/caller: must change now;
- legacy Table/Detail: permitted and documented;
- test of removal: permitted;
- stale doc/catalog/adapter: remove/update.

Write temporary checklist in PR description or plan status, not source.

**Verify:** no unexplained matches remain.

### Step 2: Remove migrated runtime types/defaults

Delete migrated interfaces and `FrameworkRuntime` members. Remove option,
lookup, upload, image URL, location, File Manager, and dynamic form default
helpers/types after `rg` proves no callers.

Keep `missingRuntimeCapability` only while remaining legacy runtime consumers
need it. Keep `useFrameworkRuntime` only for those consumers. Narrow
`FrameworkPluginOptions.runtime` accordingly; if no runtime groups remain after
separate work already landed, make runtime optional or remove it only with
updated plugin tests and explicit review.

**Verify:** framework typecheck and adapter/runtime tests pass.

### Step 3: Simplify web composition

Remove migrated capability imports from
`apps/web/src/framework/adapters/index.ts`. Delete modules only when no ordinary
operation import uses them; otherwise rename/re-home them as explicit operation
factories. Keep File Manager configuration in FileManagerPlugin install, not
FrameworkRuntime.

Update `main.ts`:

```ts
app.use(FrameworkPlugin, { runtime: remainingRuntime, ... })
app.use(FileManagerPlugin, fileManagerOptions) // only when app opts in
```

**Verify:** composition tests assert plugin order and runtime object contains
only permitted legacy groups.

### Step 4: Finish resource and catalog conversion

Audit all renderer props for old endpoint APIs. Update resource tests to assert:

- options receive `data` or `load`;
- Lookup receives `data/load` and optional `loadDetail`;
- location receives operations;
- uploads receive mutation operation/converter;
- File Manager renderer exists only in plugin-enabled app.

Catalog fixtures stay local and deterministic. Removed inputs from plan 035 stay
absent.

**Verify:** web tests/typecheck pass; catalog route causes zero network calls.

### Step 5: Write breaking migration guide

Create `docs/architecture/input-data-migration.md` with:

- before/after examples for Select, RadioGroup, CheckboxGroup;
- Lookup core Table field catalog, `view`, collection `load`, `loadDetail`;
- loader context `{searchParameters, signal}` and Lookup `{query,...}`;
- normalized `CollectionResult.meta`;
- location operation example;
- upload mutation + `toModel` example;
- error/cancellation ownership;
- removed props/types/components;
- no compatibility-shim statement.

Examples must compile in type tests or be copied into a test fixture to prevent
drift.

**Verify:** documentation symbol/path checks and any README example test pass.

### Step 6: Write File Manager plugin guide

Create `docs/architecture/file-manager-plugin.md` containing:

- optional subpath import/install after FrameworkPlugin;
- canonical asset/operations/value adapter;
- backend normalization example;
- app-owned route example using lazy import;
- capability behavior when optional operations absent;
- File/Image picker behavior with/without plugin;
- cache invalidation semantics;
- explicit exclusions: no auto route, one provider, no backend path assumptions.

Use placeholder endpoints only; no secrets or production-specific credentials.

**Verify:** copy TypeScript snippets into a compile-only test or keep examples
importing real exported types and run package typecheck.

### Step 7: Run full verification and graph update

Run focused package/app commands first, then root `pnpm type-check` and
`pnpm test`. If browser screenshots change only because intended UI states
changed, review and update them in same plan; otherwise treat screenshot drift
as regression.

After implementation source is final:


Graph changes are expected generated output. Do not use dirty graph files as a
reason to skip update.

**Verify:** all commands exit 0; `git status --short` contains only planned
source/docs/tests, expected graph output, and pre-existing user changes.

## Test plan

- Public API test: removed runtime symbols absent; optional subpath symbols
  present only there.
- Runtime/plugin tests: remaining legacy groups still work until separately
  migrated.
- Source-boundary tests reject runtime imports in migrated components.
- Web route/resource/catalog tests lock explicit operations.
- Compile migration examples.
- Full framework browser suite.

## Done criteria

- [ ] Migrated runtime capability groups removed.
- [ ] No migrated component endpoint/runtime API remains.
- [ ] Web adapters are explicit operations/plugin config.
- [ ] Dead components/keys remain absent.
- [ ] Migration and File Manager guides are complete and compile-aligned.
- [ ] Framework package tests/typecheck/browser pass.
- [ ] Web tests/typecheck pass.
- [ ] Root tests/typecheck pass.
- [ ] No unrelated user changes overwritten.

## STOP conditions

- Any plan 035–041 is not DONE or has unresolved BLOCKED behavior.
- A live production caller still depends on a removed runtime API and its target
  operation contract is unclear.
- Full verification fails in pre-existing unrelated code; record exact baseline
  and ask before expanding scope.
- Removing a migrated group breaks legacy Table/Detail through an undocumented
  shared dependency.
- Documentation example cannot be expressed with actual exported types.

## Maintenance notes

Future review should reject new endpoint-string props or runtime capability
groups for data-bound inputs. Reads use explicit loader contracts; mutations use
explicit operations. Optional app-wide subsystems use dedicated Vue plugins with
app-local providers and lazy exports.
