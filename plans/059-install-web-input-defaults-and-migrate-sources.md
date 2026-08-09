# Plan 059: Install web input defaults and migrate field sources

> **Implementation instructions**: Execute only after plans 057 and 058 are DONE.
> Preserve unrelated dirty work. Run all focused and workspace gates; STOP rather
> than weakening native input contracts.
>
> **Drift check (run first)**:
> `git diff --stat 2454cf6..HEAD -- apps/web/src/main.ts apps/web/src/framework apps/web/src/configs/defaults.ts apps/web/src/routes/'(authenticated)'/hr/overtimes docs/architecture packages/is-vue-framework/README.md`
>
> Also inspect uncommitted diffs. Changed upload response shape, resource
> capability shape, or overtime lookup contract is a STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: 057, 058
- **Category**: migration / DX
- **Planned at**: commit `2454cf6`, 2026-07-30

## Why this matters

The framework mechanism becomes useful only when the app declares its invariant
translations once. Web currently repeats Lookup's `fields`, `load`,
`loadDetail`, `pick`, and `view` bundles in overtime config. Radio option arrays
sit inside native props, and every future File/Image field would need to repeat
upload transport and backend-response conversion.

Install one web registry:

- resources normalize to native Lookup/Select/Radio/CheckboxGroup props;
- static option arrays normalize to `data`;
- File/Image receive shared upload and `toModel` defaults;
- explicit field props remain the final static override.

## Target authoring

```ts
form: appInputProps.field('lookup', { source: tollSections })

form: {
  ...appInputProps.field('lookup', {
    source: sections,
    props: { searchParameters: { private: true } },
  }),
  behavior: {
    props: ({ draft }) => ({
      searchParameters: { sectionId: String(draft.sectionId ?? '') },
    }),
  },
}
```

The authored source is truthful. At runtime Lookup receives only `fields`,
`load`, `loadDetail`, `namespace`, `pick`/`view` when explicitly needed, and
search parameters.

## Current state

- `main.ts:56-63` installs adapters, field defaults, and renderers, but no input
  prop registry.
- `framework/adapters/upload.ts:1-8` wraps services without the framework
  `UploadOperation` context or cancellation.
- `utils/services.ts:196-205` owns presign/upload/register and returns
  `{ success, path, data, url }`.
- `framework/adapters/fileManager.ts:30-67` already demonstrates cancellation,
  progress forwarding, canonical asset conversion, and strict model output.
- `configs/defaults.ts:41-57` repeats static Radio `data` under keyed fields.
- `overtimes.resource.ts:6-28` creates three manual Lookup prop bundles.
- `overtimes.resource.ts:37-80` repeats those bundles and one Radio data prop.
- `overtimes.resource.spec.ts:77-101` currently asserts resource handlers inside
  authored props.
- `LookupInput.vue:27-48` requires native fields and accepts load/loadDetail;
  `:52-53` derives display from the first field and defaults pick to `id`.
- `SelectInput.vue:12-72`, `RadioGroupInput.vue:10-38`, and
  `CheckboxGroupInput.vue:9-26` accept native `data`/`load` option props.
- `FileInput.vue:19-42` and `ImageInput.vue:19-59` accept `upload` and `toModel`.
- `assetValue.ts:1-24` enforces the canonical persisted file/image shape.

## Web registry contract

Create `apps/web/src/framework/inputs/registry.ts` exporting
`appInputProps`.

Adapters:

| Renderer | Source | Normalized props/defaults |
|---|---|---|
| `lookup` | resource with `key`, `fields`, list + detail capabilities | `fields`, `load`, `loadDetail`, `namespace: key`; native `pick` defaults to `id`, view derives from first field |
| `select` | readonly option array or resource with list capability | `data`, or `load` + `namespace` |
| `radio` | readonly option array or resource with list capability | `data`, or `load` + `namespace` |
| `checkbox-group` | readonly option array or resource with list capability | `data`, or `load` + `namespace` |
| `file` | none | shared `upload`, shared strict `toModel` |
| `image` | none | same upload/model defaults; existing image URL behavior reads canonical `url` |

Use structural source types, not route-specific resource names. Require the
capabilities actually needed: Lookup must have list and detail; Select/Radio
resource sources need list only.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Web registry/upload tests | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ framework/inputs/registry.spec.ts framework/adapters/__tests__/upload.spec.ts` | all pass |
| Config/resource tests | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ configs/defaults.spec.ts 'routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts'` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass, or exact pre-existing failure recorded |
| Workspace typecheck | `pnpm type-check` | exit 0 |
| Workspace tests | `pnpm test` | all pass, or exact unrelated pre-existing failure recorded |
| Diff check | `git diff --check` | no output |

Run compound verification commands as separate commands if one fails, so the
failing package is explicit.

## Scope

**In scope**:

- `apps/web/src/framework/inputs/registry.ts` (create)
- `apps/web/src/framework/inputs/registry.spec.ts` (create)
- `apps/web/src/framework/adapters/upload.ts`
- `apps/web/src/framework/adapters/__tests__/upload.spec.ts` (create)
- `apps/web/src/main.ts`
- `apps/web/src/configs/defaults.ts`
- `apps/web/src/configs/defaults.spec.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts`
- `apps/web/src/framework/__tests__/legacy-boundary.spec.ts`
- `packages/is-vue-framework/README.md`
- `docs/architecture/input-data-migration.md`
- `docs/architecture/web-application-architecture.md`
- `plans/README.md`

**Out of scope**:

- Input component changes, new renderer keys, File Manager UI, or service API
  redesign.
- Automatically inferring endpoints from resource names.
- Generic framework knowledge of `Resource`, Hono, RPC, or web services.
- Migration of unrelated direct component usage.
- Async normalizers, deep merge, or compatibility aliases for the removed wired
  runtime.

## Steps

### Step 1: Make web upload defaults satisfy `UploadOperation`

Refactor `framework/adapters/upload.ts` to export a File/Image upload operation
with signature `(blob, { destination, signal, onProgress })`.

It must:

- validate/narrow the input to `File` where filename metadata is required;
- call `services.fileUpload` with destination, progress forwarding, and
  `{ init: { signal } }`;
- retain enough original File metadata beside the service result for conversion;
- expose a pure `toModel` that returns exactly
  `{ kind: 'file', path, url, name, size, mimeType }`;
- reject missing path/url rather than emitting an invalid model.

Do not change `services.fileUpload`, its tests, or File Manager contracts. Reuse
small canonical conversion helpers with `fileManager.ts` only if that removes
real duplication without changing `ManagedAsset`.

Test destination, progress, AbortSignal forwarding, strict output, and malformed
response rejection.

### Step 2: Define the typed web registry

Use `createInputPropsRegistry` and `InputPropsOf`/explicit prop types to define
the six adapters in the table above.

Normalizers only select references from source; they never invoke handlers.
Resource adapters set namespace from `source.key` for stable query ownership.
Array adapters return `data` unchanged. Reject a resource missing required
capabilities through typing and a defensive development error.

Registry tests prove:

- Lookup resource becomes exact native handlers/fields/namespace;
- explicit `searchParameters` overlays without removing handlers;
- applicant's first field remains the display key without repeated `view`;
- Select/Radio/CheckboxGroup accept arrays and list resources;
- File/Image share stable upload/toModel functions;
- no authored source leaks into resolved props.

### Step 3: Install the registry

Import `appInputProps` in `main.ts` and pass it as
`FrameworkPlugin`'s `inputProps`. Do not install a second plugin or mutable
global. Preserve adapters, renderer overrides, field defaults, query client, and
FileManagerPlugin ordering.

### Step 4: Migrate keyed Radio defaults

Replace `props: { data: activeOptions/statusOptions, required: true }` with the
typed Radio field helper:

```ts
form: appInputProps.field('radio', {
  source: activeOptions,
  props: { required: true },
})
```

Keep these entries in `fieldDefaults.fields`: they are valid key-specific
semantic defaults. Update `defaults.spec.ts` to assert source identity and that
registry resolution produces `data` plus `required`.

### Step 5: Migrate overtime Lookup and Radio fields

Delete `sections`, `employees`, and `positions` prop-bundle constants.

Use the actual `tollSections`, `applicants`, and `jobPositions` resources as
sources. Do not repeat `fields`, list/detail handlers, namespace, `pick`, or
`view`. The first declared resource field (`name` or `fullName`) already gives
Lookup its view key; native pick already defaults to `id`.

Convert status Radio's option array to source. Preserve:

- applicant visibility, disabled state, reset behavior;
- dynamic section-scoped `searchParameters`;
- all labels, order, schemas, and resource capabilities.

Update resource tests to distinguish authored and resolved truth:

- authored config has the exact resource under `source`;
- authored props contain only genuine overrides, not normalized handlers;
- `appInputProps.resolve` yields exact capability handler references;
- behavior props overlay normalized props and retain handlers;
- existing RPC/cancellation assertions remain.

Add one explicit regression matching the requested case:

```ts
appInputProps.field('lookup', {
  source: tollSections,
  props: { searchParameters: { private: true } },
})
```

Resolved output must contain normalized resource props plus that override.

### Step 6: Update boundaries and documentation

Keep legacy boundary protection against `runtimeDefaults`, old runtime hooks,
`getAPI`, and backend endpoint props. Add/adjust assertions so the new
`source`/`inputProps` vocabulary is allowed only through the canonical registry,
not passed into input components.

Update:

- package README plugin example to use `inputProps`; remove
  `fieldDefaults.shared.props`;
- input migration guide with source authoring, resolution precedence, sync-only
  normalizers, native resolved props, and upload defaults;
- web architecture guide to distinguish resource-generated surface props from
  app-authored field sources. Core components and inputs remain resource-
  agnostic after resolution.

State explicitly that this does not restore the removed wired runtime: the old
runtime was interpreted inside inputs and discovered APIs; this registry is
app-owned, synchronous, and resolves before renderer invocation.

### Step 7: Run gates and refresh graph

Run all focused, package, workspace, type, and diff checks. Inventory:

```sh
rg -n "renderer:\\s*['\"](lookup|select|radio|file|image)['\"].*props" apps/web/src
rg -n "getAPI|runtimeDefaults|useFrameworkRuntime" apps/web/src
```

Review every first-command match: native override props are valid; resource
objects, option arrays, and repeated upload operations under props are not.
Second command expects only deliberate boundary-test strings. Mark plan 059
`DONE` only after review.

## Done criteria

- [ ] Web installs one app-owned input-props registry.
- [ ] Lookup/Select/Radio/CheckboxGroup source normalizers return native props
  without fetching.
- [ ] File/Image receive shared signal-forwarding upload and strict model defaults.
- [ ] Explicit static and behavior props overlay the normalized base.
- [ ] Overtime resources and keyed Radio defaults no longer repeat invariant prop
  bundles.
- [ ] Inputs never receive `source` or web resource objects.
- [ ] Documentation explains the new boundary without reviving wired runtime.
- [ ] Focused, package, workspace, type, diff, and graph gates pass.

## STOP conditions

- Web resources no longer expose stable `key`, `fields`, or capability handlers.
- Lookup display/pick behavior differs when relying on its documented defaults.
- Upload response lacks enough data to produce strict `InputAssetValue` without
  changing the service API; report the missing field.
- A current field requires both `data` and `load`; inputs intentionally reject
  that ambiguous ownership.
- Migration needs changes inside an input component or endpoint inference in the
  framework.
- Unrelated dirty File/Table work overlaps a required file; preserve it and ask
  before editing.

## Maintenance notes

- New projects define their own sources and normalizers. The framework never
  standardizes web resource shape.
- Add a registry adapter only for repeated app invariants. One-off native props
  stay in the field.
- Keep handler identity stable and forward AbortSignal in the operation itself.
- A source may be a resource today and another app-domain object tomorrow; only
  the app registry owns that interpretation.
