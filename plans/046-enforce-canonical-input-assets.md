# Plan 046: Move asset compatibility conversion out of framework inputs

> **Implementation instructions**: Follow every step and verification gate.
> Stop rather than guessing model compatibility. Update `plans/README.md` after
> implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat 4169fb0..HEAD -- packages/is-vue-framework/src/components/inputs/assetValue.ts packages/is-vue-framework/src/components/inputs/FileInput.vue packages/is-vue-framework/src/components/inputs/ImageInput.vue packages/is-vue-framework/src/components/inputs/__tests__/assetValue.spec.ts packages/is-vue-framework/src/components/inputs/__tests__/upload-operations.spec.ts packages/is-vue-framework/src/file-manager/contracts.ts apps/web/src/framework/adapters/fileManager.ts docs/architecture/input-data-migration.md`
>
> Stop if live callers introduce an asset model not covered below.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: `plans/043-characterize-input-migration-contracts.md`
- **Category**: migration
- **Planned at**: commit `4169fb0`, 2026-07-29

## Why this matters

Framework documentation says backend response conversion belongs to the app and
no compatibility aliases remain. `assetValue.ts` still guesses many backend
shapes and emits snake_case fields. This hides integration mistakes and couples
framework inputs to historical service responses. Establish one canonical
input-asset shape; keep backend guessing only in app adapters.

## Current state

- `docs/architecture/input-data-migration.md:3-5` says no compatibility aliases.
- `docs/architecture/input-data-migration.md:65-72` shows explicit `toModel`
  conversion and says app owns backend response conversion.
- `components/inputs/assetValue.ts:47-77` accepts strings, nested `data`,
  `path`, `url`, `content_type`, `contentType`, `mime`, `type_mime`,
  `updated_at`, and `updatedAt`.
- `components/inputs/__tests__/assetValue.spec.ts:44-63` explicitly preserves
  legacy path/data/url-only inputs.
- `file-manager/contracts.ts:3-12` already defines canonical camelCase
  `ManagedAsset`.
- `apps/web/src/framework/adapters/fileManager.ts:4-19` is the correct
  backend-normalization boundary, but `values.toModel` at lines 50-58 can return
  raw source again.

Canonical input assets are persisted form values, not File Manager tree nodes.
Use a dedicated exported/internal type with stable fields:

```ts
interface InputAssetValue {
  kind: 'file'
  path: string
  url: string
  name: string
  size?: number
  mimeType?: string
  updatedAt?: string
  metadata?: Record<string, unknown>
}
```

Exact optionality may follow plan-043 characterization, but naming must remain
camelCase and backend-neutral.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run src/components/inputs/__tests__/assetValue.spec.ts src/components/inputs/__tests__/upload-operations.spec.ts src/file-manager/__tests__ --environment jsdom` | all pass |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Diff check | `git diff --check` | no output |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/assetValue.ts`
- `packages/is-vue-framework/src/components/inputs/FileInput.vue`
- `packages/is-vue-framework/src/components/inputs/ImageInput.vue`
- `packages/is-vue-framework/src/components/inputs/__tests__/assetValue.spec.ts`
- `packages/is-vue-framework/src/components/inputs/__tests__/upload-operations.spec.ts`
- `packages/is-vue-framework/src/file-manager/contracts.ts` only if shared
  canonical conversion typing belongs there
- `packages/is-vue-framework/src/file-manager/__tests__/plugin.spec.ts`
- `apps/web/src/framework/adapters/fileManager.ts`
- `apps/web/src/framework/adapters/__tests__/fileManager.spec.ts` (create if no
  equivalent exists)
- `docs/architecture/input-data-migration.md`

**Out of scope**:

- Service endpoint/request payloads.
- Automatic migration of stored database values.
- File Manager list/tree UI.
- Upload pending/progress state; plan 045 owns it.
- Supporting arbitrary old shapes inside framework inputs.

## Git workflow

- Branch: `codex/046-canonical-input-assets`
- Commits:
  1. `refactor(framework): require canonical input assets`
  2. `refactor(web): normalize persisted assets`
- Do not push or open a PR unless requested.

## Steps

### Step 1: Inventory every current model producer and consumer

Run:

```sh
rg -n "normalizeFileAssetValue|FileAssetValue|content_type|type_mime|imageURLResolver|toModel" \
  packages/is-vue-framework/src apps/web/src --glob '*.ts' --glob '*.vue'
```

Classify each match as backend adapter, framework input, test fixture, or
unrelated API payload. Record the accepted persisted model shape in tests before
deleting aliases. Do not expand scope to unrelated `content_type` request
payloads.

**Verify**: add adapter tests proving raw backend shapes become canonical before
reaching `FileInput`/`ImageInput`.

### Step 2: Replace guessing normalizer with strict canonical validation

Rename types/functions to describe canonical behavior, for example
`InputAssetValue` and `toInputAssetValue`. Accept only the canonical object
shape. Return `null` or throw a clear development error for malformed values;
choose behavior based on existing invalid-upload tests. Do not infer MIME type
from filename or pull values from nested backend payloads.

Arrays may still be normalized element-by-element if scalar/multi inputs require
that convenience.

**Verify**: asset tests accept canonical camelCase objects and reject each old
alias family.

### Step 3: Update FileInput and ImageInput

Use canonical `kind`, `name`, `mimeType`, `updatedAt`, `path`, and `url`.
`toModel` must return canonical input value. File Manager selection must call
its configured `values.toModel`, then validate the result strictly.

Do not change scalar/multi behavior, ordering, delete, replace, limits, or
controlled `v-model`.

**Verify**: focused component tests pass with canonical values.

### Step 4: Move backend conversion into web adapter

Update `apps/web/src/framework/adapters/fileManager.ts`:

- `canonicalAsset()` may continue reading backend aliases because this file is
  app-owned;
- `values.toModel()` must always return canonical persisted input asset, never
  raw `metadata.source`;
- `values.fromModel()` accepts that canonical persisted shape;
- add round-trip tests for backend snake_case → `ManagedAsset` → canonical
  persisted value.

Do not expose backend response objects in framework model values.

**Verify**: web adapter tests and web typecheck pass.

### Step 5: Update migration guidance and run gates

Document canonical input asset shape beside upload example. State that legacy
backend aliases belong in app `toModel`/File Manager adapters.

Run:

```sh
rg -n "content_type|type_mime|updated_at|rawData" \
  packages/is-vue-framework/src/components/inputs
```

Expected: no matches except explicitly unrelated test descriptions, ideally
none. Run all framework/web gates.

## Test plan

- Canonical scalar and array values.
- Malformed/legacy alias rejection.
- Upload-result `toModel` conversion.
- File Manager selection conversion.
- Image MIME validation using `mimeType`.
- Web adapter round trip with nested/snake_case backend fixture.

## Done criteria

- [ ] Framework input assets use one documented camelCase shape.
- [ ] Framework code contains no backend alias guessing.
- [ ] Web adapter owns backend normalization.
- [ ] Scalar/multi and image ordering behavior remain unchanged.
- [ ] Focused/full tests and both typechecks pass.
- [ ] Old-alias `rg` gate returns no framework-input matches.
- [ ] `git diff --check` passes.
- [ ] `plans/README.md` marks plan 046 DONE.

## STOP conditions

- Current production fields persist more than one incompatible asset shape.
- No app-owned conversion boundary can distinguish File and Image requirements.
- Changing model shape requires database migration or API contract changes.
- A public consumer outside this monorepo is known to depend on
  `content_type`/`filename`; report compatibility strategy before proceeding.

## Maintenance notes

Backend formats may evolve inside app adapters. Framework inputs must continue
to consume only canonical values. Review future `toModel` implementations for
raw response leakage.
