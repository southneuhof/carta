# Plan 049: Clean-break legacy configuration into core field defaults

> **Implementation instructions**: This is a breaking removal, not a staged
> migration. Delete the retired configuration/runtime surfaces and update every
> in-repo caller in the same implementation. Do not add aliases, deprecated
> overloads, compatibility adapters, fallback readers, converters, or dual
> configuration paths. Follow each step and gate. Preserve pre-existing dirty
> user work. If a STOP condition occurs, stop and report; do not improvise.
> After implementation and review, mark plan 049 DONE in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat f506fd6..HEAD -- packages/is-vue-framework/package.json packages/is-vue-framework/src apps/web/src/configs apps/web/src/framework apps/web/src/main.ts apps/web/src/models apps/web/src/types apps/web/src/routes docs/architecture plans/README.md`
>
> Save initial `git status --short` in implementation notes. Existing dirty
> files belong to the user; never overwrite, reformat, stage, or revert them.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `f506fd6`, 2026-07-29

## Clean-break decision

This plan provides **zero backward compatibility**.

When complete, all following statements must be true:

- `FrameworkPlugin` accepts one new options object only; raw legacy runtime
  objects and `{ runtime, defaults }` are compile/runtime errors.
- `FrameworkDefaultsInput`, `useFrameworkDefaults`, old defaults injection,
  mutable default maps, and `apps/web/src/configs/defaults.ts` no longer exist.
- `FrameworkRuntime`, table/detail runtime capability groups, runtime hooks,
  runtime default helpers, and web runtime adapters no longer exist.
- Legacy `model-config` types/runtime/merge helpers no longer exist or export.
- Legacy config-driven composite `Table`, `Detail`, `Form`, `DialogForm`, and
  Tree components no longer exist.
- No compatibility converter translates `fieldsAlias`, `fieldsProxy`,
  `fieldsParse`, `fieldsType`, `inputConfig`, or snake_case keys.
- New core components consume only canonical field catalogs, schemas, explicit
  operations, renderer registries, and new surface-wide `fieldDefaults`.
- Migration guidance documents the break, but runtime code supports only the
  new path.

No deprecation period. No shadow API. No transitional flags.

## Why this matters

The web bootstrap currently installs `appDefaults`, but only retired composite
components consume that older schema. Core `Table`, `Detail`, and `Form` call
`resolveFields()` without project defaults. The package simultaneously exports
new resource/field APIs and old model-config/runtime/default APIs, allowing new
code to drift back into the retired architecture.

A partial change would preserve two sources of truth. This plan finishes the
framework 2.0 clean break: one field model, one plugin signature, explicit
resource ownership, and no silent field-name compatibility behavior.

## Current state

### Legacy plugin path

`packages/is-vue-framework/src/adapters/plugin.ts:12-20`:

```ts
export interface FrameworkPluginOptions {
  runtime: FrameworkRuntime
  defaults?: FrameworkDefaultsInput
  adapters?: FrameworkAdaptersInput
  queryClient?: QueryClient
  renderers?: RendererRegistriesInput
}
```

`apps/web/src/main.ts:58`:

```ts
app.use(FrameworkPlugin, {
  runtime: frameworkRuntime,
  defaults: appDefaults,
  adapters: createFrameworkAdapters(router),
})
```

Both `runtime` and `defaults` are removed, not deprecated.

### Old defaults consumers

Direct consumers at planning commit:

- `components/composites/Table.vue`
- `components/composites/Detail.vue`
- `components/composites/Form.vue`
- `components/composites/Tree/TreeTable.vue`
- `components/composites/Tree/TreeItem.vue`

They read `useFrameworkDefaults()` and parallel maps such as `fieldsAlias`,
`fieldsProxy`, `fieldsType`, `fieldsParse`, and `inputConfig`. Delete these
components rather than teaching them the new schema.

### Old runtime consumers

`packages/is-vue-framework/src/runtime.ts` contains only `table` and `detail`
capabilities. `runtimeDefaults.ts` and `runtimeHooks.ts` serve only the retired
composites. Web files `framework/runtime.ts`,
`framework/adapters/{index,table,detail}.ts` exist solely to install those
capabilities. Delete the whole path.

### Old model-config consumers

`packages/is-vue-framework/src/model-config/` is consumed by legacy composite
Form/DialogForm and stale tests. Application production routes no longer use
it. `apps/web/src/models/__tests__/mergeModelConfig.spec.ts` and global
declaration files under `apps/web/src/types/` keep the retired vocabulary
artificially alive. Remove them and replace any discovered live global type
consumer with canonical imported types.

### Canonical core path

`packages/is-vue-framework/src/fields/resolve.ts:4-10` defines precedence:

```ts
project-wide defaults < inferred schema metadata < shared field entry
< surface projection < component-instance override
```

Core call sites currently omit the first layer:

```ts
// core/Table.vue
resolveFields({ fields: props.fields, surface: 'table' })

// core/Detail.vue
resolveFields({ fields: props.fields, surface: 'detail' })

// core/Form.vue
resolveFields({
  fields: props.fields,
  surface: 'form',
  schema: schema?.source ? inferFieldLayers(schema.source) : undefined,
})
```

The new default system wires this existing `FieldLayer` contract. It never
recreates per-key maps.

### Live internal consumers needing canonical migration

Two current inputs still reach old Form/config surfaces:

- `LookupInput.vue` imports `DialogForm.vue` for unused
  `inlineAddFormConfig`; no app caller supplies this prop. Remove prop and
  inline-add UI outright.
- `LocationInput.vue` imports legacy Form, accepts untyped `formConfig`, and
  `MultiLocationInput.vue` constructs it with `inputConfig`/`fieldsAlias`.
  Replace this with core Form and a canonical `FieldCatalog` owned by
  LocationInput.

The public input catalog compares against the legacy input component registry.
Change it to compare against canonical `builtInFormRenderers`; delete the
duplicate registry.

## Target API

### FrameworkPlugin

Final signature:

```ts
export interface FrameworkPluginOptions {
  fieldDefaults?: FrameworkFieldDefaultsInput
  adapters?: FrameworkAdaptersInput
  queryClient?: QueryClient
  renderers?: RendererRegistriesInput
}

export const FrameworkPlugin: Plugin<[options?: FrameworkPluginOptions]>
```

Supported installs:

```ts
app.use(FrameworkPlugin)
app.use(FrameworkPlugin, {
  adapters: createFrameworkAdapters(router),
  renderers: appRenderers,
  fieldDefaults: {
    shared: { props: { dense: true } },
    table: { align: 'start' },
  },
})
```

Unsupported installs—do not preserve:

```ts
app.use(FrameworkPlugin, runtime)
app.use(FrameworkPlugin, { runtime })
app.use(FrameworkPlugin, { defaults: appDefaults })
```

### Field defaults

Create:

```ts
export interface FrameworkFieldDefaultsInput {
  shared?: FieldLayer
  table?: FieldLayer
  detail?: FieldLayer
  form?: FieldLayer
}

export interface ResolvedFrameworkFieldDefaults {
  table: FieldLayer
  detail: FieldLayer
  form: FieldLayer
}
```

Expose only:

```ts
resolveFrameworkFieldDefaults(input?)
useFrameworkFieldDefaults()
frameworkFieldDefaultsKey
```

Semantics match `resolveFields`: `undefined` inherits, `null` clears, scalar
values replace, `props` shallow-merge, arrays/functions replace. Input remains
immutable. Defaults apply uniformly to every field on one surface.

Do not accept keyed maps, accessors, validation schemas, initial data,
business options, field-name normalization, or renderer implementations.

### Explicit app presets

Key-specific reuse stays visible in resource catalogs:

```ts
export function timestampField(label: string) {
  return {
    label,
    display: { format: 'datetime' },
    form: false,
  } as const
}
```

Only add a preset when at least two active resources share exactly identical
metadata. Labels remain arguments so current UI wording does not change.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Focused framework tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/fields/__tests__/resolve.spec.ts src/adapters/__tests__/plugin.spec.ts src/adapters/__tests__/injection-keys.spec.ts src/components/core/__tests__/table.spec.ts src/components/core/__tests__/detail.spec.ts src/components/core/__tests__/form.spec.ts src/components/composites/__tests__/LookupInput.spec.ts src/components/composites/__tests__/LocationInput.spec.ts src/__tests__/public-api.spec.ts --environment jsdom` | all pass |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Root tests | `pnpm test` | all selected workspace tests pass |
| Root typecheck | `pnpm type-check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Diff sanity | `git diff --check` | no output |

`pnpm build` is not mandatory while the documented missing
`apps/web/src/assets/corporate/assets/logo-hka.png` baseline failure remains.
If restored before execution, run `pnpm build` and require exit 0.

## Scope

### Create

- `packages/is-vue-framework/src/fields/defaults.ts`
- `packages/is-vue-framework/src/adapters/__tests__/plugin.spec.ts`
- `apps/web/src/framework/fields/presets.ts`
- focused preset spec beside it

### Modify

- `packages/is-vue-framework/package.json`
- `packages/is-vue-framework/src/fields/{resolve,index}.ts`
- `packages/is-vue-framework/src/adapters/plugin.ts`
- `packages/is-vue-framework/src/index.ts`
- core `Table.vue`, `Detail.vue`, `Form.vue`
- core mount harness and focused core specs
- field resolution specs
- adapter injection-key specs
- public API and source-boundary specs
- current LookupInput/LocationInput/MultiLocationInput and focused tests
- `apps/web/src/main.ts`
- public input-catalog fixture/spec
- current `*.resource.ts` files only for behavior-preserving explicit presets
- related resource specs only when needed to lock unchanged metadata
- `apps/web/src/framework/__tests__/legacy-boundary.spec.ts`
- architecture and migration docs
- `plans/README.md`
- `graphify-out/**` only through final `graphify update .`

### Delete

Framework configuration/runtime:

- `packages/is-vue-framework/src/adapters/defaults.ts`
- `packages/is-vue-framework/src/defaultsHooks.ts`
- `packages/is-vue-framework/src/runtime.ts`
- `packages/is-vue-framework/src/runtimeHooks.ts`
- `packages/is-vue-framework/src/runtimeDefaults.ts`
- all tests dedicated to those removed APIs, including
  `component-default-resolution.spec.ts`, `runtimeDefaults.spec.ts`, and
  `adapters/__tests__/types.spec.ts`

Legacy config model:

- entire `packages/is-vue-framework/src/model-config/` directory
- stale app model-config tests under `apps/web/src/models/`
- legacy global declarations under `apps/web/src/types/` after replacing any
  live consumer with canonical imported contracts

Legacy config-driven components:

- `components/composites/Table.vue`
- `components/composites/Detail.vue`
- `components/composites/Form.vue`
- `components/composites/DialogForm.vue`
- `components/composites/Tree/`
- `components/composites/common/properties.ts`
- `components/composites/formInputRegistry.ts`
- `components/composites/types.ts`
- tests/type-tests dedicated only to these deleted surfaces, including legacy
  form bindings, field slots, input resolution, and input registry tests

Web legacy bootstrap:

- `apps/web/src/configs/defaults.ts`
- `apps/web/src/configs/defaults.spec.ts`
- `apps/web/src/framework/runtime.ts`
- `apps/web/src/framework/adapters/index.ts`
- `apps/web/src/framework/adapters/table.ts`
- `apps/web/src/framework/adapters/detail.ts`

### Out of scope

- Compatibility aliases, converters, overloads, fallback reads, deprecations,
  or dual plugin signatures.
- Automatic snake_case/camelCase translation.
- Key-specific global defaults.
- Changes to API entities, wire formats, routes, capabilities, permissions,
  query semantics, or resource schemas.
- New display renderers without a current tested resource contract.
- Table/header CSS APIs added only to preserve dead config.
- Rewriting unrelated canonical input components.
- User's dirty File Manager, navigation, app-shell, or input work.

## Git workflow

- Branch: `codex/049-clean-break-field-defaults`
- Suggested commits:
  1. `feat(framework)!: replace runtime defaults with field defaults`
  2. `refactor(framework)!: remove legacy config components`
  3. `refactor(web)!: remove legacy framework bootstrap`
  4. `docs(framework): document config clean break`
- Commit bodies must include `BREAKING CHANGE:` with removed symbols/subpaths.
- Do not stage, commit, push, or open a PR unless requested.

## Steps

### Step 1: Freeze complete removal inventory

Run before editing:

```sh
rg -n \
  "FrameworkDefaultsInput|useFrameworkDefaults|frameworkDefaultsKey|resolveFrameworkDefaults|applyFrameworkDefaults|default(Table|Detail|Form)Config|FrameworkRuntime|useFrameworkRuntime|runtimeDefaults|model-config|fieldsAlias|fieldsProxy|fieldsParse|fieldsType|inputConfig" \
  packages/is-vue-framework/src apps/web/src --glob '*.{ts,vue}'
```

Classify every match:

1. file/symbol deleted by this plan;
2. current consumer migrated to canonical fields/core API;
3. migration documentation or negative boundary test.

There is no fourth category for retained compatibility.

Also inventory all identifiers declared in `apps/web/src/types/*.d.ts`. For each
identifier, search outside that declaration. Replace live consumers with direct
canonical imports; delete dead declarations. Do not keep a legacy global type
file for convenience.

**Verify**: every production-code match has an explicit deletion or migration
target in implementation notes.

### Step 2: Implement pure surface-wide field defaults

Create `fields/defaults.ts` with target types, stable `Symbol.for` key, pure
resolver, and injection hook. Extract/export one field-layer merge helper from
`fields/resolve.ts`; both default resolution and field resolution must use it.

Tests:

- empty input gives independent empty table/detail/form layers;
- shared layer reaches all surfaces;
- surface layer overrides shared;
- props shallow-merge;
- `null` clears;
- caller input is not mutated;
- separate resolutions share no mutable nested objects;
- missing plugin throws standard installation error.

**Verify**: focused field tests and framework typecheck pass.

### Step 3: Replace FrameworkPlugin signature in one cut

Rewrite plugin to accept only optional `FrameworkPluginOptions`. Remove all
runtime/default imports, type guards, raw-runtime overloads, provides, and
validation messages. Provide field defaults, adapters, renderer registries,
and query client.

Delete old runtime/default tests. Create `plugin.spec.ts` covering:

- no-options install;
- complete canonical options install;
- per-app isolation for field defaults, adapters, renderers, and query client;
- stable field-default injection key;
- arbitrary `{ table: ... }`, `{ runtime: ... }`, and `{ defaults: ... }`
  objects rejected by compile-only tests or excess-property checks—never
  interpreted as plugin state.

Update every framework/app test harness and plugin install from
`{ runtime: {}, ... }` to the canonical options object. Remove tests asserting
old runtime/default behavior; do not rewrite them as compatibility tests.

**Verify**:

```sh
rg -n "runtime:|defaults:|FrameworkRuntime|frameworkRuntimeKey|frameworkDefaultsKey" \
  packages/is-vue-framework/src apps/web/src --glob '*.{ts,vue}'
```

Expected: only unrelated resource/query `defaults` vocabulary and negative
boundary/type tests; no plugin runtime/default path.

### Step 4: Wire defaults into core components

Core Table/Detail/Form read `useFrameworkFieldDefaults()` during setup and pass
only their surface layer to `resolveFields({ defaults })`.

Extend core harness with `fieldDefaults`. Add DOM-level tests:

- Table gets default alignment/props; explicit table projection wins.
- Detail gets default emphasis/props; explicit detail projection wins.
- Form gets default renderer/props; schema inference wins next; explicit form
  projection wins last.
- defaults are isolated across two apps.
- defaults apply uniformly, never by key lookup.
- a default renderer still requires registry registration.

Do not inject inside `defineResource()` or any module-scope resource factory.

**Verify**: focused core tests, framework tests, browser tests, and typecheck
pass.

### Step 5: Delete legacy config/runtime/component implementation

Delete all files listed under Scope/Delete. Remove their root exports and
package subpath exports:

- `./adapters/defaults`
- `./runtime`
- `./runtimeDefaults`
- root `model-config` exports
- root legacy registry and composite load/result type exports

Delete tests/type-tests whose only purpose is removed behavior. Update public
API tests with removed symbols:

- `FrameworkDefaultsInput`
- `FrameworkGlobalDefaults`
- `FrameworkTableDefaults`
- `FrameworkDetailDefaults`
- `FrameworkFormDefaults`
- `ResolvedFrameworkDefaults`
- `useFrameworkDefaults`
- `resolveFrameworkDefaults`
- `FrameworkRuntime`
- `FrameworkTableRuntime`
- `FrameworkDetailRuntime`
- `useFrameworkRuntime`
- `missingRuntimeCapability`
- `mergeModelConfig`
- `resolveModelConfig`
- `buildListConfig`
- `buildDetailConfig`
- `buildFormConfig`
- `InputConfig`
- `ModelConfig`
- `getInputComponentRegistry`
- old composite `TableResult`, `TableLoad`, `DetailLoad`, `FormLoad`,
  `FormSubmit`

Keep canonical core `Table`, `Detail`, `Form`, `FieldCatalog`, resource,
renderer, adapter, and query contracts.

Add source-boundary assertions that deleted paths do not exist and removed
identifiers are not exported.

**Verify**:

```sh
test ! -e packages/is-vue-framework/src/adapters/defaults.ts
test ! -e packages/is-vue-framework/src/model-config
test ! -e packages/is-vue-framework/src/components/composites/Form.vue
test ! -e packages/is-vue-framework/src/runtime.ts

rg -n \
  "FrameworkDefaultsInput|FrameworkRuntime|useFrameworkDefaults|useFrameworkRuntime|mergeModelConfig|InputConfig|fieldsAlias|fieldsProxy|fieldsParse|fieldsType|inputConfig" \
  packages/is-vue-framework/src apps/web/src --glob '*.{ts,vue}'
```

Expected: no production matches. Negative tests/docs may quote removed names.

### Step 6: Migrate live internal input consumers

#### LookupInput

Remove `inlineAddFormConfig`, `DialogForm` import, and inline-add trigger.
No application caller uses it, so provide no replacement alias. If inline
creation returns later, design it against canonical `FormProps` in a separate
feature.

Update Lookup tests to assert removed prop/UI is absent and normal selection,
hydration, loading, and commit behavior remain unchanged.

#### LocationInput and MultiLocationInput

Import core Form directly. Replace untyped `formConfig` with a canonical
LocationInput-owned field catalog:

```ts
const locationFields = {
  name: {
    label: 'Nama Lokasi',
    form: { renderer: 'text' },
  },
} satisfies FieldCatalog<Coordinate, Coordinate>
```

Bind core Form using `v-model` and `:fields="locationFields"`. Remove
`formConfig` prop and `MultiLocationInput.locationForm`. Do not add a legacy
config converter.

Tests cover editing `name`, coordinate preservation, validation touch, and
absence of legacy config keys.

#### Input catalog

Use `builtInFormRenderers` as canonical renderer inventory. Delete
`formInputRegistry`. Update catalog test to compare keys against
`Object.keys(builtInFormRenderers)`.

**Verify**: focused Lookup/Location/input-catalog tests and both package/web
typechecks pass.

### Step 7: Replace web defaults with explicit presets, then delete them

Inventory each `appDefaults` entry. Assign one disposition:

1. already explicit in active resource catalog;
2. identical metadata shared by two or more active resources—extract preset;
3. schema/initial-data/feature-owned and already represented there;
4. dead because no active resource uses it.

Create only proven presets. Timestamp metadata is expected candidate. Preserve
every existing label, formatter, surface exclusion, option set, schema, and
initial value.

Delete web defaults file/spec and remove bootstrap imports. Main becomes:

```ts
app.use(FrameworkPlugin, {
  adapters: createFrameworkAdapters(router),
})
```

Add `fieldDefaults` only if a real uniform current requirement exists. Do not
install an empty placeholder.

Delete web runtime files/adapters and stale global/model-config tests/types.
Replace any live global type consumer with direct canonical imports.

**Verify**:

```sh
rg -n \
  "appDefaults|FrameworkDefaultsInput|frameworkRuntime|FrameworkRuntime|configs/defaults|model-config|ModelConfig|InputConfig|fieldsAlias|fieldsProxy|fieldsParse|fieldsType|inputConfig" \
  apps/web/src --glob '*.{ts,vue}'
```

Expected: no production matches.

### Step 8: Enforce clean-break boundaries

Extend framework public API/source-boundary tests and web
`legacy-boundary.spec.ts` to reject:

- deleted files/subpaths;
- removed runtime/default/model-config identifiers;
- plugin `runtime` or legacy `defaults` options;
- parallel field maps in app resources;
- imports of deleted config-driven composites;
- automatic casing converters.

Boundary tests must ignore their own literal blacklist text but scan all other
production/test source. A future reintroduction must fail CI.

**Verify**: boundary and public API specs pass.

### Step 9: Document one supported system

Update architecture, resource migration guide, field migration guide, package
README, and root README where needed:

- state clean break explicitly;
- list removed symbols/subpaths and canonical replacements;
- document `fieldDefaults` as uniform surface policy;
- document explicit presets as key-specific reuse;
- show plugin install without runtime/defaults;
- state schemas own validation and resources own initial data/accessors/options;
- state no compatibility converter or field-name normalization exists;
- remove stale docs claiming runtime/default components still exist;
- correct architecture statement that legacy components were deleted so code
  and docs finally agree.

Do not publish a shim recipe.

**Verify**:

```sh
rg -n "clean break|fieldDefaults|no compatibility|removed|FieldCatalog" \
  README.md packages/is-vue-framework/README.md docs/architecture
```

Expected: breaking migration and sole supported path are discoverable.

### Step 10: Run convergence gates and update graph

Run focused tests, framework tests/browser/typecheck, web tests/typecheck, root
tests/typecheck, lint, and `git diff --check`.

If a pre-existing full-suite failure remains, prove it against initial status.
Do not edit unrelated dirty files. All failures caused by removed APIs are
in-scope and must be migrated; none may be suppressed with compatibility code.

After final source/docs state:

```sh
graphify update .
```

Review graph changes separately; preserve pre-existing dirty graph output.

Final audits:

```sh
git status --short
git diff --stat
git diff --check

rg -n \
  "FrameworkDefaultsInput|FrameworkRuntime|useFrameworkDefaults|useFrameworkRuntime|mergeModelConfig|ModelConfig|InputConfig|fieldsAlias|fieldsProxy|fieldsParse|fieldsType|inputConfig" \
  packages/is-vue-framework/src apps/web/src --glob '*.{ts,vue}'
```

Expected: only intentional negative-test literals; zero production matches.

## Test plan

### New field-default tests

- shared/surface merge and clearing semantics;
- immutability and cross-app isolation;
- plugin provision with optional canonical options;
- Table/Detail/Form integration and precedence;
- renderer registry enforcement.

### Breaking-removal tests

- removed root exports absent;
- removed package subpaths/files absent;
- raw runtime and legacy plugin options rejected;
- model-config and parallel maps rejected in source;
- no legacy composite import can return.

### Migrated consumer tests

- Lookup remains selectable/loadable without inline legacy form;
- Location name editing uses core Form and preserves coordinates;
- MultiLocation uses no config adapter;
- input catalog exactly matches built-in form renderer keys;
- explicit resource presets preserve current metadata.

### Full regression

- all framework unit/browser tests;
- all web route/resource/acceptance tests;
- package/web/root typechecks;
- lint and diff checks.

## Done criteria

- [ ] Plan contains no deprecation, adapter, alias, fallback, or dual-path
      compatibility measure.
- [ ] FrameworkPlugin has one canonical options signature.
- [ ] Legacy defaults, runtime, model-config, and config-driven composite files
      are deleted.
- [ ] Package exports/subpaths expose none of the removed APIs.
- [ ] All in-repo plugin installs use canonical options.
- [ ] Core Table/Detail/Form consume new surface-wide field defaults.
- [ ] Key-specific behavior lives only in explicit catalogs/presets.
- [ ] Lookup/Location/MultiLocation and input catalog use canonical core
      contracts.
- [ ] Web defaults/runtime/global legacy types are deleted.
- [ ] No snake_case/camelCase converter exists.
- [ ] No legacy validation/default value is copied into renderer props.
- [ ] Boundary tests reject reintroduction.
- [ ] Breaking migration docs describe one supported path.
- [ ] Framework tests/browser/typecheck pass.
- [ ] Web tests/typecheck pass.
- [ ] Root tests/typecheck and lint pass.
- [ ] `git diff --check` passes.
- [ ] `graphify update .` completes without corruption.
- [ ] No unrelated dirty work is overwritten.
- [ ] `plans/README.md` marks plan 049 DONE after implementation/review.

## STOP conditions

Stop and report; do not add compatibility code if:

- in-scope code drift invalidates current-state excerpts;
- a consumer exists outside this monorepo and maintainer chooses to support it;
- a live in-repo consumer cannot be expressed with canonical field/resource
  contracts without a product decision;
- deleting a legacy global type reveals ambiguous business semantics;
- preserving behavior requires guessing field-name mappings or option meanings;
- a current renderer contract is missing and cannot be specified from a live
  test;
- passing verification requires changing API wire behavior, permissions,
  routes, or schemas;
- a plan-caused failure persists after two focused fix attempts;
- work requires modifying unrelated dirty files;
- graph update attempts an unintended shrink/corruption.

When stopped, leave removed APIs removed in the working attempt only if the
tree still typechecks; otherwise report before leaving a half-migrated state.
Never resolve a STOP condition with a compatibility shim.

## Maintenance notes

Future review should reject:

- `FrameworkPlugin` runtime/default overloads;
- global maps keyed by field name;
- parallel field configuration maps;
- model-config reintroduction;
- renderer props containing validation or initial values;
- automatic field-name casing conversion;
- imports of deleted composite components.

Global `fieldDefaults` affect every field on one surface. Use them sparingly.
Labels, formats, accessors, options, and renderer choices normally belong in
explicit resource catalogs or named app presets.

Any future inline-create dialog, Tree, display renderer, or column-class
feature must start from canonical contracts and a live use case. It must not
restore deleted APIs under new names.
