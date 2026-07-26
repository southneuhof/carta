# Plan 002: Build the shared field catalog and renderer registry

> **Implementation instructions**: Add the schema-driven field projection system without changing feature screens. Leave legacy components/config untouched — there are no external consumers and no compatibility wrappers; legacy code is deleted wholesale in plan 009. Update the index only after review.
>
> **Drift check (run first)**: `git diff --stat edeff25..HEAD -- packages/is-vue-framework/src/components packages/is-vue-framework/src/model-config packages/is-vue-framework/src/index.ts docs/architecture/web-application-architecture.md`; verify the architecture document hash is `6fbc44a012d92c4462e08914ca75b5b4226845c8`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/000-establish-migration-contracts.md`
- **Category**: migration
- **Planned at**: commit `edeff25`, 2026-07-22

## Why this matters

Form, table, and detail currently accept parallel field maps, aliases, proxies, and renderers, forcing resource adapters to translate between shapes. A single field catalog can project directly into all three primitives while keeping presentation decisions in Vue renderers. Defaults must handle ordinary fields; read/write hooks remain exceptional escape hatches.

## Current state

- `Table.vue:15-39`, `Detail.vue:9-20`, and `Form.vue:15-25` each declare overlapping field-related props.
- `packages/is-vue-framework/src/model-config/fields.ts` and `model-config/types.ts` encode the legacy `fieldsAlias`, `fieldsProxy`, and component-specific maps.
- `Form.vue` resolves inputs through `formInputRegistry`; table/detail have their own renderer behavior.
- `model-config/types.ts:49-73` defines `FieldDependency`: per-field `dependency` config with a `fields` depends-on list and pure `visibility`/`disabled`/`props`/`inputConfig`/`value` generators. `model-config/runtime.ts:209-230` evaluates it and `Form.vue:65-289` applies it, including nulling hidden fields' values before submit (`Form.vue:256`). This is a core Form capability and must survive the migration as a first-class catalog concept, not a legacy conversion. The manual `fields` depends-on list is a known stale-list footgun; its successor uses automatic reactive tracking (see Step 3).
- Target rules: one catalog entry can supply label, value schema, renderer selection, table/detail/form projections, access metadata, optional `read(record, context)` / `write(value, draft, context)`, and an optional `behavior` block (see Step 3). Ordinary fields use property access and assignment; `fieldsProxy` is represented by `read` only where it is genuinely needed. Presentation behavior remains in Vue implementations/registries, not serialized config.
- Vocabulary: `renderer` is the config key selecting a registry implementation on every surface (`table.renderer`, `detail.renderer`, `form.renderer`) — do not name it `type` (collides with value types, which schemas own) or `control`. The word "control(s)" is reserved exclusively for action controls in plans 005-006.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Framework | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/fields/` (create)
- `packages/is-vue-framework/src/renderers/` (create)
- `packages/is-vue-framework/src/contracts/`
- `packages/is-vue-framework/src/index.ts`
- field/renderer unit and type tests

**Out of scope**:

- Rewriting existing components, resources, or routes
- Backend/RPC validation derivation (plan 003)
- Adding arbitrary component instances or presentation callbacks to serializable field config
- Making `read`/`write` mandatory

## Git workflow

- Suggested branch: `codex/plan-002-field-catalog`
- Suggested commit: `feat(framework): add shared field catalog`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Define the catalog and projection contracts

Implement `defineFields<TRecord, TDraft>()` with literal-key preservation. Each entry may define common metadata plus optional `table`, `detail`, and `form` projections. Absence means available by default; an explicit `false` excludes that projection. Keep ordering in each consuming prop bag (`fields: ['name', ...]`) rather than duplicating order inside the catalog.

Define deterministic merge semantics: project-wide defaults < inferred schema metadata < shared field entry < surface projection < component-instance override. `undefined` inherits; `false` disables; arrays replace unless a named extension field explicitly says otherwise.

**Verify**: type tests prove key inference, record/draft types, projection exclusion, and invalid keys.

### Step 2: Implement default and exceptional data mapping

Add pure helpers to read a field from a record and write a form value to a draft. Default behavior uses the catalog key. Optional `read` handles computed/nested display values; optional `write` handles transformed/nested payloads. Hooks receive typed context and must not perform navigation or network I/O.

**Verify**: unit tests cover default property access, computed read, transformed write, immutable input handling, null records, and field exclusion.

### Step 3: Define first-class dynamic field behavior

Replace the legacy `FieldDependency` object with a dedicated `behavior` block inside the form projection, holding function-valued options evaluated reactively. There is no `dependsOn` list: dependency tracking is automatic. Each declared function is evaluated inside one Vue `computed` over the reactive draft, so it subscribes to exactly the draft properties it actually reads, re-tracked on every run (branch-accurate). This removes the legacy stale-dependency-list bug class by construction.

The `behavior` block may declare:

- `visible({ draft, context })` and `disabled({ draft, context })` — pure predicates;
- `props({ draft, context })` — renderer-option overrides, shallow-merged over the static `props` (static < behavior); results must be shallow-compared against the previous evaluation to avoid renderer churn (replaces the legacy `props`/`inputConfig` generators, which collapse into one concept);
- `derived({ draft, context })` — a fully computed field value; user edits do not stick;
- `resetWhen({ draft, context })` — a watch source; when its result changes identity, the field resets (cascading selects). The legacy `value` generator maps to `derived` or `resetWhen` case by case.

Structural rules: `behavior` accepts only function values — constants belong in the static projection level; static `form: false` still excludes the field entirely, while `behavior.visible` is the runtime question; `derived` and `resetWhen` on the same field is a contradictory-definition diagnostic. Functions must be pure and synchronous: no navigation, network I/O, or reads outside the provided context (enforce with a dev-mode recording proxy, which also yields the observed dependency graph for cycle detection and devtools diagnostics).

Contract types remain plain `(ctx) => T` functions with no Vue imports; only the evaluation strategy (computed-per-option) lives in the runtime, and a mount-free evaluation helper (reactive draft + computeds in plain vitest) keeps determinism testable. Define the submission rule here as data, applied later by Form in plan 004: a field whose `visible` evaluates false contributes no value to the submitted draft (preserving the `Form.vue:256` behavior), and how that interacts with schema validation is settled in plan 003.

Table/detail projections carry no `behavior` block for now; dynamic behavior is a draft/form concept. If table/detail ever need it, they grow their own `behavior` blocks with the same shape rather than sharing form semantics.

**Verify**: unit tests cover visibility toggling from a dependency change, branch-accurate re-tracking (`a ? b : c` subscriptions swap), disabled derivation, derived values, cascades (a `derived` field feeding another field's `visible`) without multi-pass evaluation, `resetWhen` identity semantics, shallow-compare stability of behavior-driven `props`, evaluation determinism given equal drafts, and diagnostics for `derived`+`resetWhen` and non-function `behavior` entries.

### Step 4: Add framework renderer registries

Create typed registries for table cells, detail values, and form inputs. Registry entries are Vue implementations selected by stable renderer keys (the `renderer` config key on each surface); field config stores only renderer keys and serializable options. Provide explicit per-instance renderer overrides as native component props/slots.

Renderer contexts must include value, record/draft, field definition, disabled/read-only state, and validation state as appropriate—never routes, permissions stores, or resource operations.

**Verify**: registry tests cover default lookup, project override precedence, missing-key diagnostics, and app-instance isolation.

### Step 5: Document the legacy-to-catalog mapping without building converters

There are no compatibility converters (clean break, no external consumers). Instead, record the manual translation table used when migrating each screen's config in plans 007-008: `fieldsAlias -> label`, `fieldsProxy -> read`, `type -> renderer`, `dependency -> behavior` (`visibility.validator -> visible`, `disabled.validator -> disabled`, `props`/`inputConfig` generators -> `props`, `value.generator -> derived` or `resetWhen` case by case). This table seeds plan 009's migration guide.

**Verify**: a hand-translated fixture equivalent to the current roles config preserves labels, computed values, and field order; type-check passes without `any`.

## Test plan

- Compile-time catalog inference and invalid-key cases.
- Pure projection/merge tests including every precedence layer.
- Behavior evaluation: visibility, disabled, props merge/stability, derived values, `resetWhen`, cascades, branch-accurate tracking, determinism, contradictory-definition diagnostics.
- Renderer registry isolation and override tests.
- Hand-translated roles-config fixture proving the legacy-to-catalog mapping table.

## Done criteria

- [ ] One catalog shape projects to table/detail/form without an adapter.
- [ ] Basic fields require neither `read` nor `write` nor a `behavior` block.
- [ ] Dynamic form behavior (`form.behavior` with `visible`/`disabled`/`props`/`derived`/`resetWhen`) is first-class, auto-tracked via computeds with no manual depends-on list, with hidden-field submission semantics defined.
- [ ] Widget selection is named `renderer` on every surface; "control(s)" appears only for action controls.
- [ ] Merge semantics are documented in exported types/tests.
- [ ] Renderer implementation stays in Vue registries/slots.
- [ ] Existing components and routes are unchanged.
- [ ] Framework/web validation passes and index row is `DONE`.

## STOP conditions

- The design requires separate incompatible field shapes for each component.
- Renderer contracts require router, permission-store, or RPC dependencies.
- Common field usage requires handwritten read/write functions.
- Behavior option functions require component instances, async work, or I/O, or their contract types require Vue imports.
## Maintenance notes

Treat catalog keys as stable API. Review additions for whether they are data/schema metadata or presentation behavior; only the former belongs in the shared definition.
