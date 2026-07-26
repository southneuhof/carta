# Plan 007: Establish the migration contracts and a green baseline

> **Implementation instructions**: Execute this plan before changing component behavior. Preserve every legacy export and runtime path. Run each verification before continuing and update this plan's row in `plans/README.md` only after implementation and review.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- package.json pnpm-lock.yaml apps/web/package.json apps/web/tsconfig*.json apps/api/package.json packages/is-vue-framework/src packages/is-vue-framework/package.json docs/architecture/web-application-architecture.md`
>
> The architecture document was uncommitted when this plan was written. Also run: `test "$(git hash-object docs/architecture/web-application-architecture.md)" = "ea637318ae94c0bc677012f7fcca332c0df7bf67"`. A mismatch is a STOP condition until the design change is reviewed.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (plans 001-006 are already complete)
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

The current public surface couples the plugin, CRUD runtime, model config, and rendered components. The migration needs stable vocabulary and type boundaries before parallel implementations can begin. This phase adds contracts and characterization tests only: it must not switch routes, visuals, or network behavior.

## Current state

- `packages/is-vue-framework/src/index.ts:1-36` exports `model-config`, plugin/runtime, CRUD operation types, and all legacy components.
- `packages/is-vue-framework/src/runtime.ts:4-27` divides runtime services into `FrameworkCRUDRuntime`, `FrameworkTableRuntime`, `FrameworkDetailRuntime`, and `FrameworkCRUDRuntimeServices`.
- `packages/is-vue-framework/src/adapters/plugin.ts:6-27` accepts `{ runtime, defaults }` and provides both globally.
- `packages/is-vue-framework/src/components/composites/types.ts:1-15` defines today's `TableLoad`, `DetailLoad`, `FormLoad`, and `FormSubmit` independently.
- `apps/web/src/main.ts:53-57` installs the framework with `{ runtime: frameworkRuntime, defaults: appDefaults }`.
- The target architecture requires one `load` vocabulary, native component prop bags, route-owned navigation, resource-owned standard data, chrome-free core components, and view shells that own CRUD presentation. It explicitly forbids a replacement god orchestrator, form modes, nested-resource vocabulary, and `actions` passed as state.
- Recon baseline: framework tests pass (27 files, 110 tests); framework type-check passes; web tests pass (13 files, 63 tests); web lint exits 0 with warnings. Web type-check currently reports `apps/api/src/routes/auth/auth.ts(2,28): Cannot find module 'better-auth'` even though `apps/api/package.json` declares `better-auth@^1.6.23`. Treat this as an installation/type-resolution baseline issue, not permission to duplicate the dependency in `apps/web`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | exit 0; lockfile unchanged |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all tests pass |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all tests pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/contracts/` (create)
- `packages/is-vue-framework/src/index.ts`
- `packages/is-vue-framework/src/**/__tests__/` for contract/type and characterization tests
- package/workspace configuration only if required to restore the already-declared `better-auth` type resolution

**Out of scope**:

- Changing `Table.vue`, `Detail.vue`, `Form.vue`, CRUD shells, routes, RPC calls, or visuals
- Adding TanStack Query or implementing field/resource behavior
- Importing API server runtime code into the browser
- Removing or renaming any existing public export

## Git workflow

- Suggested branch: `codex/plan-007-migration-contracts`
- Suggested commit: `feat(framework): define migration contracts`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Restore and record the validation baseline

Run the frozen install, then all commands above. If web type-check becomes green, record that the failure was stale installation state in the commit/PR notes. If it remains red, use `pnpm why better-auth -r` and TypeScript resolution tracing to locate the package-boundary problem; fix it at the owning API/workspace boundary without adding `better-auth` to `apps/web`.

**Verify**: the six commands above exit 0 and `git diff --exit-code -- pnpm-lock.yaml` succeeds unless a reviewed package-resolution correction was necessary.

### Step 2: Add canonical, behavior-free contracts

Create small modules under `packages/is-vue-framework/src/contracts/` and export them from `index.ts`. Define:

- `MaybePromise<T>` and `Load<TContext, TResult> = (context: TContext) => MaybePromise<TResult>`;
- normalized collection and record results, with collection metadata separated from rows;
- resource identity and resource definition base types;
- resource prop factory signatures — callable `table(args?)`, `detail({ id })`, `form()` / `form({ id })` / `form({ initialData })` — whose return types are the core component contracts (`TableProps`/`DetailProps`/`FormProps`) imported rather than duplicated, with overloads making `id` non-nullable; factory arguments use existing vocabulary only (`id`, `searchParameters`, `initialData`, `namespace` — no `parent` or other coined terms);
- query namespace/ownership types and adapter interfaces;
- field read/write, validation, access-control, and renderer context interfaces;
- field behavior option types: a `behavior` block of pure, synchronous function options (`visible`/`disabled`/`props`/`derived`/`resetWhen`) over a draft context (the typed successor to `FieldDependency` in `model-config/types.ts:49-73`). Contract types are plain `(ctx) => T` functions with no Vue imports and no manual depends-on list — reactive tracking is a runtime concern. Widget selection in field config is named `renderer` (never `type` or `control`); "control(s)" is reserved for action controls.

Use existing words where they remain accurate (`load`, `submit`, `fields`). Do not add `command`, `mode`, `nested`, or a generic action-state object.

**Verify**: `pnpm --filter @southneuhof/is-vue-framework type-check` exits 0.

### Step 3: Lock contracts with compile-time tests

Add type tests proving that resource prop factory outputs bind directly to `Table`, `Detail`, and `Form` prop types; `form()` and `form({ id })` both produce valid `FormProps` while a nullable `id` argument fails to compile; nested placement adds no resource kind; form loading does not expose create/update mode; local synchronous values and async values both satisfy `load`; and invalid prop names fail with `@ts-expect-error`.

**Verify**: framework tests and type-check pass.

### Step 4: Characterize legacy compatibility

Extend existing plugin/runtime and composite tests to prove current exports still resolve, plugin installation still provides the legacy runtime/defaults, and existing CRUD components still mount with their present props. These tests keep non-migrated screens honest until their slice migrates; they are deleted with the legacy code in plan 016 (clean break — no wrappers will exist).

**Verify**: all framework and web test/type-check commands pass; `git diff --name-only` contains only in-scope files.

## Test plan

- Contract type tests: valid direct prop binding, invalid mismatches, sync/async load, no form mode, no nested resource type.
- Compatibility tests: old plugin options, CRUD runtime resolution, existing composite mounting.
- Model new runtime tests after `packages/is-vue-framework/src/adapters/__tests__/runtime.spec.ts` and CRUD type tests after `packages/is-vue-framework/src/adapters/__tests__/crudOperations.spec.ts`.

## Done criteria

- [ ] Frozen install and all six validation commands exit 0.
- [ ] Canonical contracts are exported without behavior or Vue/app dependencies.
- [ ] Type tests prove direct native prop compatibility and rejected vocabulary.
- [ ] No existing export or rendered behavior changed.
- [ ] No files outside scope changed, except `plans/README.md` status.
- [ ] This plan's index row is `DONE`.

## STOP conditions

- Architecture document hash or current excerpts have drifted materially.
- Fixing web type resolution appears to require a browser runtime import of `apps/api` or adding an undeclared duplicate dependency to the web app.
- A contract requires `any`, a component import cycle, or a resource-specific field in a core primitive.
- A verification fails twice after a reasonable correction.

## Maintenance notes

Contracts added here are the compatibility spine. Review naming especially carefully: later phases may extend these interfaces, but should not create parallel concepts. Do not mark legacy APIs deprecated yet.
