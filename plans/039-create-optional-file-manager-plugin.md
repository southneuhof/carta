# Plan 039: Create an optional backend-agnostic File Manager plugin

> **Implementation instructions:** Build the subsystem boundary and tests before
> migrating File Manager UI. Keep it opt-in, route-neutral, and backend-neutral.
> Absence must be a supported state. Do not publish a separate npm package.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/package.json packages/is-vue-framework/src/index.ts packages/is-vue-framework/src/adapters/plugin.ts packages/is-vue-framework/src/renderers packages/is-vue-framework/src/components/composites/formInputRegistry.ts packages/is-vue-framework/src/components/composites/form-inputs/FileManager packages/is-vue-framework/src/components/utils/FileManager`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** HIGH
- **Depends on:** 035
- **Category:** direction
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Current File Manager is always registered, always bundled by live input imports,
and assumes one backend/path vocabulary. Optional plugin boundary lets an app
enable one shared subsystem and configure backend operations/value persistence
once. Apps without File Manager retain ordinary upload controls and never load
manager code.

## Non-negotiable design

Provide optional package subpath:

```ts
import {
  FileManagerPlugin,
  type ManagedAsset,
  type FileManagerOperations,
  type FileManagerValueAdapter,
} from '@southneuhof/is-vue-framework/file-manager'

app.use(FileManagerPlugin, {
  root,
  operations,
  values,
})
```

Do not export File Manager from root `@southneuhof/is-vue-framework`.
Do not auto-install from `FrameworkPlugin`.

Canonical model:

```ts
export interface ManagedAsset {
  id: string
  parentId?: string | null
  kind: 'file' | 'folder'
  name: string
  mimeType?: string
  size?: number
  updatedAt?: string
  previewUrl?: string
  metadata?: Record<string, unknown>
}
```

Canonical operations:

```ts
export interface FileManagerOperations {
  list(context: {
    parentId: string | null
    sort?: { field: 'name' | 'updatedAt'; direction: 'asc' | 'desc' }
    signal?: AbortSignal
  }): MaybePromise<CollectionResult<ManagedAsset>>

  upload?(file: File, context: {
    parentId: string | null
    onProgress?: (progress: UploadProgress) => void
    signal?: AbortSignal
  }): MaybePromise<ManagedAsset>

  createFolder?(context: {
    parentId: string | null
    name: string
    signal?: AbortSignal
  }): MaybePromise<ManagedAsset>

  remove?(context: {
    id: string
    signal?: AbortSignal
  }): MaybePromise<void>
}
```

Value adapter:

```ts
export interface FileManagerValueAdapter<TModel = unknown> {
  fromModel(value: TModel): MaybePromise<ManagedAsset | undefined>
  toModel(asset: ManagedAsset): MaybePromise<TModel>
}
```

`id` and `root` are opaque. A path may be an app adapter's ID, but framework
must never split/join it.

## Current state

- `runtime.ts:13,27` exposes `FrameworkFileManagerRuntime` with
  `listFiles(params)`, `uploadFile(file,directory)`,
  `createFolder(dir,folderName)`, and `deleteFile(path)`.
- `FileManager.vue:32-65` hardcodes `/storage/public`, parses parent paths, and
  stores path history.
- `PathTree.vue:47-55` treats `/storage/public` specially.
- `PathDetail.vue:52-64` exposes `dir`, `updated_at`, and path segments.
- `FileManagerInput.vue:28-57` expects `content_type`, `path`, `url`, framework
  API URL, and `/storage/public`.
- `renderers/form.ts:111` and `formInputRegistry.ts:36` register
  `file-manager` unconditionally.
- `renderer/registry.ts:54-59` creates per-app mutable form registry; plugin can
  register into provided registry at install time.
- `adapters/plugin.ts:27-49` shows standard Vue install/provide convention and
  shared query-client provisioning.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Plugin tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/file-manager/__tests__/plugin.spec.ts src/renderers/__tests__/registry.spec.ts src/__tests__/public-api.spec.ts` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Export check | `node -e "import('@southneuhof/is-vue-framework/file-manager').then(m => { if (!m.FileManagerPlugin) process.exit(1) })"` | exit 0 in workspace resolution environment |
| Opinion audit | `rg -n "/storage/public|folder_name|updated_at|content_type|\\.path\\b|\\bdir\\b" packages/is-vue-framework/src/file-manager` | no backend vocabulary in subsystem contracts/provider |

## Scope

**In scope**

- `packages/is-vue-framework/package.json`
- New `packages/is-vue-framework/src/file-manager/`:
  contracts, provider/injection, plugin, optional form renderer entry, index,
  and tests.
- `packages/is-vue-framework/src/renderers/form.ts`
- `packages/is-vue-framework/src/renderers/registry.ts` only if plugin-safe
  registration needs a narrowly typed hook.
- `packages/is-vue-framework/src/components/composites/formInputRegistry.ts`
- Public API/export tests.

**Out of scope**

- Migrating existing File Manager components; plan 040.
- Installing plugin in web app; plan 040 after adapter exists.
- Upload input integration; plan 041.
- Automatic routes, menu items, permissions, or route discovery.
- Multiple named providers/backends.
- Separate npm package.
- Removing `runtime.fileManager`; plan 042 after consumers move.

## Git workflow

- Branch: `codex/039-file-manager-plugin`
- Suggested commits:
  1. `feat(framework): add optional file manager plugin`
  2. `refactor(framework): make file manager renderer opt-in`

## Steps

### Step 1: Add contracts and validation

Create public contracts exactly around canonical record/operations/value adapter.
Define `UploadProgress` with numeric `loaded`, optional/required `total` chosen
consistently, and normalized `percentage` only if framework computes it.

Validate plugin options at install:

- options object required;
- `root` present as opaque `string`;
- `operations.list` required;
- value adapter functions required;
- optional operations determine capabilities.

Throw clear `[is-vue-framework/file-manager] ...` development errors. Never
probe backend to infer capability.

**Verify:** type/runtime tests cover minimal list-only config and each invalid
shape.

### Step 2: Add app-scoped provider

Create symbol-backed injection key and hooks:

- strict `useFileManager()` throws when component requires plugin;
- optional `useOptionalFileManager()` returns `undefined` for File/Image input
  feature detection;
- provider exposes root, operations, values, and shared query client/invalidation
  helpers without exposing raw TanStack keys publicly.

Reuse FrameworkPlugin's query client when available. Enforce installation after
FrameworkPlugin with a clear error, because cache/renderer registries must be
app-scoped. Do not create a second QueryClient.

**Verify:** two Vue apps receive isolated providers; optional hook works without
plugin; strict hook gives exact actionable error.

### Step 3: Make renderer registration opt-in

Remove `'file-manager'` from `builtInFormRenderers` and legacy
`builtInInputComponents`. During FileManagerPlugin install, register async
FileManagerInput only into current app's form renderer registry.

Because registries are provided objects, registration must affect only the
installing app. No module-global mutation. Ensure component import remains lazy.

**Verify:** tests prove:

- FrameworkPlugin alone: `form.has('file-manager') === false`;
- after FileManagerPlugin: true;
- second app without plugin: false;
- component module is not eagerly imported.

### Step 4: Add subpath export and root exclusion

Add `"./file-manager": "./src/file-manager/index.ts"` to exports. Export public
contracts/plugin/components from this subpath only. Root public API test should
assert `FileManagerPlugin` is absent; subpath test asserts it exists.

**Verify:** package typecheck and export tests pass.

### Step 5: Define cache/invalidation semantics

Provider should expose or internally implement directory list cache identity by
`parentId + sort`. Mutations in later plans need:

- upload/create: invalidate containing parent listing;
- remove file: invalidate its parent listing;
- remove folder: invalidate parent and evict/invalidate removed subtree entries
  that are known locally.

Keep key details private. Add unit tests against QueryClient showing unrelated
parent listing stays cached.

**Verify:** cache tests pass without mounting real File Manager UI.

## Test plan

- Plugin install validation.
- App/provider isolation and install order.
- Optional versus strict injection.
- Capability inference from optional operation presence.
- Renderer opt-in and lazy import.
- Subpath/root export boundaries.
- Cache key and targeted invalidation.

## Done criteria

- [ ] Backend-neutral contracts exported from optional subpath.
- [ ] One provider per app; absence supported.
- [ ] No automatic route behavior.
- [ ] File Manager renderer absent by default and app-local when enabled.
- [ ] No eager File Manager component import from root/input modules.
- [ ] Cache invalidation API tested.
- [ ] Framework tests/typecheck pass.

## STOP conditions

- Per-app renderer registration cannot be done without module-global mutation.
- Plugin must install before FrameworkPlugin to function.
- Existing export tooling cannot represent subpath without publishing compiled
  artifacts; report exact limitation.
- Canonical `id` must be parsed as path by provider logic.

## Maintenance notes

Reviewer should inspect bundle boundaries, injection isolation, and opaque-ID
handling. Multiple providers are explicitly deferred; do not add namespacing
until real app need exists. Route ownership always remains application-side.

