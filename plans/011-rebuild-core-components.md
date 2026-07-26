# Plan 011: Rebuild Form, Table, and Detail as resource-agnostic cores

> **Implementation instructions**: Build the three core primitives as new components; legacy composites and their internals stay untouched until plan 016 deletes them (clean break, no external consumers, no compatibility normalization). Where a legacy export name collides, rename the legacy export with a `Legacy` prefix and update its in-repo call sites — the new cores own the canonical names. Cores must remain chrome-free and must not learn routing, permissions, CRUD operation names, or resource conventions. Update the index after review.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- packages/is-vue-framework/src/components/composites packages/is-vue-framework/src/fields packages/is-vue-framework/src/query packages/is-vue-framework/src/validation packages/is-vue-framework/src/index.ts docs/architecture/web-application-architecture.md`; verify architecture hash `ea637318ae94c0bc677012f7fcca332c0df7bf67`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: `plans/008-add-project-adapters-and-query-runtime.md`, `plans/009-build-field-catalog-and-renderers.md`, `plans/010-derive-validation-from-schemas.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

Form, Table, and Detail are the durable heart of the system, but their current prop shapes predate the shared catalog and automatic load/query runtime. This phase gives them elegant native props that resources can bind directly, while retaining temporary compatibility for current screens. The cores remain broadly reusable because all CRUD chrome and navigation stay outside them.

## Current state

- `Form.vue:15-25` accepts field maps plus `load`, `submit`, `getInitialData`, `beforeSubmit`, and `extraData`; `Form.vue:234-267` owns load/submit orchestration and exposes reload at `356-368`.
- `Table.vue:15-39` accepts parallel field maps, either `data` or `load`, search parameters, and pagination; `100-127` warns when both `data` and `load` are supplied.
- `Detail.vue:9-20` has parallel maps and data/load; `48-64` performs reload/data fallback.
- Target invariants: every data-bearing core accepts exactly one of `data` or `load`; `load` may be sync/offline/async; resources bind native prop bags; Form has no create/update mode; components expose state and events, not an action object passed into state.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework focused | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/composites` | all focused tests pass |
| Framework full | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web regression | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/composites/Form.vue`
- `packages/is-vue-framework/src/components/composites/Table.vue`
- `packages/is-vue-framework/src/components/composites/Detail.vue`
- their adjacent types, composables, and tests
- compatibility helpers under `packages/is-vue-framework/src/compat/`
- framework exports

**Out of scope**:

- Cards, page headers, back/create/edit/delete/detail buttons, dialogs, or navigation
- CRUD shells/composite removal
- Feature resources/routes
- Permission policy
- Requiring resources as component props

## Git workflow

- Suggested branch: `codex/plan-011-core-components`
- Suggested commit: `refactor(framework): modernize core data components`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Freeze public native prop contracts

Define exported `FormProps`, `TableProps`, and `DetailProps` as the authoritative public prop types — these exact names, matching what every Vue developer expects; never export "bag"-named types ("prop bag" is plan prose only). Use the field catalog directly. Express `data XOR load` at the type level where Vue permits and enforce it at runtime with a clear diagnostic. Keep slots/events named for component concepts.

**Verify**: contract tests from plan 007 compile directly against each component's public props.

### Step 2: Rework Table data/query behavior

Route `load` through the internal query executor, derive namespace from resource context when supplied through the prop bag, and preserve explicit namespace/local-query escape hatches. Separate rows, pagination metadata, loading, empty, and error state. Emit query changes declaratively; do not expose raw TanStack objects.

**Verify**: tests cover data-only, sync/async load, automatic namespace, duplicate instance override, cancellation, pagination/search changes, loading/empty/error slots, and data+load rejection.

### Step 3: Rework Detail data behavior

Use the same load/result/error vocabulary and shared catalog projection. Support record identity in load context, explicit data, reload exposure, renderer override slots, and partial/error states. Do not infer navigation or edit permissions.

**Verify**: tests cover data-only, load/reload, identity changes, cancellation, computed reads, renderer overrides, and data+load rejection.

### Step 4: Rework Form orchestration without mode

Treat Form as draft/field/validation orchestration. Its optional data fetcher supplies initial data; `submit` supplies behavior. Support schema selection, catalog default writes, exceptional writes, dirty/touched state, async submit, server issue mapping, reset/reload, disabled/read-only, and slots. Whether the behavior creates or updates is invisible to Form.

Form applies the catalog's field behavior (plan 009) through the framework's computed-per-option evaluation: each declared `behavior` function becomes one computed over the reactive draft, subscribing only to the properties it actually reads; `resetWhen` becomes one watcher on its result identity. Form owns only the reactive wiring and rendering consequences — applying `visible`/`disabled`/merged `props`/`derived` results to rendered inputs. Hidden fields contribute no value to the submitted draft (preserving today's `Form.vue:256` behavior), and validation runs on the visibility-filtered draft per plan 010.

**Verify**: use one Form fixture for create-like submit and the same component fixture for update-like load+submit without a mode prop; cover offline synchronous load/submit too. Behavior tests cover show/hide on draft change, no re-evaluation when an unread field changes, disabled propagation to inputs, derived values, `resetWhen` cascading resets, hidden-field exclusion from submit payload, and re-showing a field restoring editability without stale state.

### Step 5: Keep legacy screens green without compatibility code

Do not modify legacy composite components or their internal Table/Detail/Form. If an export name collides with a new core, rename the legacy export with a `Legacy` prefix and update its in-repo call sites mechanically. No prop normalization, converters, or deprecation warnings exist.

**Verify**: all pre-existing framework and web tests pass unchanged apart from mechanical import renames; new cores share no code path with legacy components.

## Test plan

- Separate focused suites for Form/Table/Detail and shared data/load XOR behavior.
- Type tests for exact native prop bags.
- Regression fixtures based on current `form-bindings.spec.ts` and component default tests.
- Accessibility assertions for labels, validation association, disabled state, table semantics, loading, and error announcements.

## Done criteria

- [ ] All three cores consume the shared catalog directly.
- [ ] `data` and `load` paths work; supplying both is rejected.
- [ ] Form has no mode/create/update vocabulary.
- [ ] Field `behavior` options drive visibility/disabled/props/derived values reactively with automatic dependency tracking, and hidden fields are excluded from submission.
- [ ] Cores contain no Card, router, permission, resource registry, or CRUD action imports.
- [ ] Legacy screens remain green because legacy components are untouched (no compatibility layer exists).
- [ ] Framework/web validation passes and index row is `DONE`.

## STOP conditions

- A core must import Vue Router, an app permission store, or CRUD operation resolver.
- Native resource props require an adapter component.
- Form behavior cannot support both create/update workflows without adding mode.
- Compatibility changes alter a current route before a vertical-slice plan.

## Maintenance notes

Review core APIs for concept leakage. Convenience belongs in resource prop creation or shells, not in these components.
