# Plan 060: Restore plain input-source authoring

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command. If a STOP condition occurs, stop and report; do not
> improvise. After implementation and review, update this plan and plans
> 057–059 in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b2f6b57..HEAD -- packages/is-vue-framework/src/renderers/inputProps.ts packages/is-vue-framework/src/fields/resolve.ts packages/is-vue-framework/src/components/core/Form.vue apps/web/src/configs/defaults.ts apps/web/src/routes/'(authenticated)'/hr/overtimes/overtimes.resource.ts`
>
> The input-props implementation is currently uncommitted. Also run
> `git diff --stat -- <the same paths>` and compare the live code with the
> excerpts below. A different registry or field-source design is a STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none; corrects the in-progress implementation of 057–059
- **Category**: DX / architecture
- **Planned at**: commit `b2f6b57`, 2026-07-30

## Why this matters

The implemented runtime boundary is sound, but authored resources now call
`appInputProps.field(...)`. That helper only reconstructs the object passed to
it, adds an unnecessary dependency from every resource to the application
registry, and does not deliver meaningful typing because current web prop types
are broad records. Resources should author ordinary framework fields:

```ts
form: {
  renderer: 'lookup',
  source: tollSections,
  props: { searchParameters: { private: true } },
}
```

Only application bootstrap and core Form should consume the registry.

## Current state

- `packages/is-vue-framework/src/renderers/inputProps.ts:18-37, 63-66` defines
  `FieldConfig`, `DefinedInputPropsRegistry`, and a `field()` method whose runtime
  body is only `({ renderer, ...config })`.
- `inputProps.ts:25-31` exposes a required `sourcePresent` boolean to every
  registry caller even though JavaScript property presence can express it.
- `inputProps.ts:56` silently ignores a source when no adapter is registered,
  contradicting the intended “source requires normalizer” contract.
- `packages/is-vue-framework/src/fields/resolve.ts:39-50, 178-186` exposes
  `sourcePresent` on every resolved field. Falsy sources do not require this:
  `false`, `0`, and empty arrays are already distinct from `undefined`.
- `packages/is-vue-framework/src/components/core/Form.vue:131-140` forwards the
  redundant flag to the registry.
- `apps/web/src/configs/defaults.ts:2, 53, 59` imports the runtime registry only
  to author two Radio fields.
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts:5,
  18-48` imports the runtime registry and calls `field()` eight times.
- Framework and web registry tests call `resolve` with `sourcePresent`; no test
  covers an unknown renderer carrying source.
- `docs/architecture/input-data-migration.md:115-127` describes the source
  registry but lacks the canonical plain authored example.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Framework focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/renderers/__tests__/inputProps.spec.ts src/fields/__tests__/resolve.spec.ts src/adapters/__tests__/injection-keys.spec.ts src/components/core/__tests__/form.spec.ts --environment jsdom` | all pass |
| Web focused tests | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ framework/inputs/registry.spec.ts configs/defaults.spec.ts 'routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts'` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass, or exact pre-existing failure recorded |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/renderers/inputProps.ts`
- `packages/is-vue-framework/src/renderers/__tests__/inputProps.spec.ts`
- `packages/is-vue-framework/src/fields/resolve.ts`
- `packages/is-vue-framework/src/fields/__tests__/resolve.spec.ts`
- `packages/is-vue-framework/src/adapters/__tests__/injection-keys.spec.ts`
- `packages/is-vue-framework/src/components/core/Form.vue`
- `apps/web/src/framework/inputs/registry.spec.ts`
- `apps/web/src/configs/defaults.ts`
- `apps/web/src/configs/defaults.spec.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts`
- `packages/is-vue-framework/README.md`
- `docs/architecture/input-data-migration.md`
- `docs/architecture/web-application-architecture.md`
- `plans/README.md`
- `plans/060-restore-plain-input-source-authoring.md`

**Out of scope**:

- Removing the registry, source normalization, upload defaults, or Form merge
  precedence implemented by plans 057–059.
- App-aware compile-time renderer/source mapping. Raw `source` remains opaque at
  the framework field contract; app normalizers validate it.
- Input component changes, endpoint discovery, async normalizers, or deep merge.
- Any unrelated dirty FileInput, TableInput, input-catalog, or graph work.

## Steps

### Step 1: Reduce the registry to registration and resolution

In `renderers/inputProps.ts`:

- delete `InputPropsOf`, `SourceOf`, `PropsOf`, `FieldConfig`,
  `DefinedInputPropsRegistry`, and `field`;
- make `createInputPropsRegistry` return `InputPropsRegistry`;
- type adapter defaults and normalizer results as readonly `Partial<TProps>`;
- remove `sourcePresent` from the public resolve input;
- detect source with own-property presence;
- if source is present and the renderer has no adapter or no normalizer, throw an
  error containing renderer and field key;
- if source is absent and no adapter exists, continue passing explicit native
  props through;
- enforce an actual plain-object normalizer result: object/null prototype only,
  not Array, Promise/thenable, Date, Map, or Set.

Update registry tests for falsy source, absent-source pass-through, unknown
renderer with source, adapter without normalizer, async result, array, and Map.

### Step 2: Remove redundant source-presence state

Delete `sourcePresent` from `ResolvedSurfaceField` and resolved field creation.
Keep `FieldLayer`'s local merge tracking because null still clears an inherited
source. Continue assigning `field.source` only when the merged source is not
undefined.

In Form, call registry resolution with a conditional source property:

```ts
inputProps.resolve(renderer, {
  ...(field.source !== undefined ? { source: field.source } : {}),
  props: field.props,
  context: { field: { key: field.key, label: field.label } },
})
```

Update field, Form, and injection tests. Preserve falsy source behavior and all
prop precedence.

### Step 3: Restore plain app field declarations

Remove `appInputProps` imports from `configs/defaults.ts` and
`overtimes.resource.ts`. Replace every helper call with a plain form projection:

```ts
form: { renderer: 'radio', source: activeOptions, props: { required: true } }
form: { renderer: 'lookup', source: tollSections }
```

For the applicant field, keep `renderer`, `source`, and `behavior` together in
one object; preserve dynamic search parameters, visibility, disabling, and
reset behavior.

Tests may import `appInputProps` to assert resolved output, but production
resource/default modules must not import the registry.

### Step 4: Make documentation show the canonical boundary

Add a plain `{ renderer, source, props }` example to the package README and input
migration guide. State that resources do not call/import the registry; they only
author source. Application bootstrap installs the registry, and Form consumes
it.

Adjust the web architecture guide if it implies a helper-based authoring API.
Do not document a replacement compile-time helper.

### Step 5: Verify, review, and converge plan status

Run all commands above. Confirm:

```sh
rg -n "appInputProps\\.field|DefinedInputPropsRegistry|sourcePresent" \
  packages/is-vue-framework/src apps/web/src docs
```

Expected: no matches.

Review only this plan's hunks against the pre-existing dirty implementation and
preserve unrelated work. On approval, mark plans
057–060 DONE; plan 060 supersedes only the typed `field()` authoring helper
specified in 057/059.

## Test plan

- Framework registry tests prove exact merge order remains unchanged.
- Unknown renderer plus source throws; unknown renderer without source passes
  native props.
- Falsy sources still normalize.
- Non-plain normalizer results fail.
- Field resolution still preserves/overrides/clears source without a public flag.
- Web tests prove plain authored resources resolve to exact native handlers and
  explicit props remain overlays.
- Static source checks prove production resource/default modules do not import
  `appInputProps`.

## Done criteria

- [ ] Resource/default field config uses plain `{ renderer, source, props }`.
- [ ] No production resource imports or calls `appInputProps`.
- [ ] Registry API has no `field()` or `sourcePresent`.
- [ ] Unknown renderer plus source fails loudly.
- [ ] Defaults → normalized source → explicit props → behavior/presentation →
  Form-controlled precedence remains tested.
- [ ] Focused tests, both package typechecks, package tests, and diff check pass.
- [ ] Plans 057–060 are marked DONE.

## STOP conditions

- A caller outside the listed app files uses `field()` or `sourcePresent`.
- Removing `sourcePresent` loses a supported explicit-undefined source case.
- Plain config changes runtime renderer props or overtime behavior.
- Correct typing requires a new global/module-augmentation contract; keep that
  deferred and report rather than replacing the helper with another wrapper.
- Required work overlaps unrelated dirty input/Table/catalog changes.

## Maintenance notes

- The registry is infrastructure, not an authoring DSL.
- App field declarations should remain serializable-looking plain objects even
  when `source` contains handler-bearing resources.
- If renderer-specific authoring types become valuable later, design them at the
  field schema boundary and judge their syntax independently of runtime
  registration.
