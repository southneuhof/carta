# Plan 040: Migrate File Manager UI and web adapter to canonical assets

> **Implementation instructions:** Migrate route/input/shared UI together against
> plan 039 contracts. Backend vocabulary may exist only inside web adapter.
> Preserve current navigation, list/thumbnail, upload/drop, create, delete, and
> selection behavior where corresponding capability exists.
>
> **Drift check (run first):**
> `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/components/utils/FileManager packages/is-vue-framework/src/components/composites/form-inputs/FileManager packages/is-vue-framework/src/file-manager apps/web/src/framework/adapters/fileManager.ts apps/web/src/main.ts apps/web/src/routes`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** HIGH
- **Depends on:** 039
- **Category:** migration
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Existing UI embeds one backend's storage root, path hierarchy, response
envelopes, field names, and mutation payloads. Moving those assumptions to the
web adapter makes framework File Manager reusable and ensures its standalone
route, form input, and embedded pickers share one provider and cache.

## Current state

- `FileManager.vue:32-65` defines `DEFAULT_ACCESSIBLE_PATH`, parent/sibling path
  parsing, path-based history, and expanded paths.
- `PathTree.vue:5-9` defines `FolderItem {path}`, and lines `76-125` calls
  runtime `listFiles/deleteFile/createFolder` with `dir/folder_name`.
- `PathDetail.vue:50-76` normalizes a legacy numeric-key envelope in UI.
- `PathDetail.vue:93-105` guesses image type from `type`, `mime_type`, `url`,
  and path extension.
- `PathDetail.vue:121-226` navigates/uploads/deletes/splits paths directly.
- `FileManagerInput.vue:23-57` converts legacy file values and derives parent by
  splitting `path`.
- `apps/web/src/framework/adapters/fileManager.ts:3-19` currently forwards raw
  `files`, `sync-file`, and `delete-file` calls and logs response.
- No app-owned File Manager route was found during planning. If implementation
  finds one, migrate it; otherwise add no route merely to satisfy this plan.

## Target UI state

- Active directory: `ManagedAsset` folder or root sentinel represented by
  provider `root`.
- History/expanded state keyed by opaque asset `id`.
- Breadcrumbs cannot be derived from IDs. Maintain ancestor stack from selected
  tree nodes/list navigation, or accept optional canonical ancestry metadata
  through `metadata` only as display data. Do not require slash parsing.
- Tree lists children with `operations.list({parentId})`.
- Detail lists current directory through shared loader/cache.
- `kind` selects file/folder behavior.
- `name`, `mimeType`, `previewUrl`, `updatedAt`, `size` render directly.
- Optional operations hide create/upload/delete UI.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| File Manager tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/utils/FileManager/__tests__ src/file-manager/__tests__` | all pass |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | all pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Framework opinion audit | `rg -n "/storage/public|folder_name|updated_at|mime_type|content_type|listFiles|deleteFile|runtime\\.fileManager|\\.path\\b|\\bdir\\b" packages/is-vue-framework/src/components/utils/FileManager packages/is-vue-framework/src/components/composites/form-inputs/FileManager packages/is-vue-framework/src/file-manager` | no backend-shape/path assumptions |

## Scope

**In scope**

- Existing File Manager UI directory and tests.
- Existing FileManagerInput directory and tests.
- Plan 039 provider internals if real UI reveals a missing generic cache hook.
- `apps/web/src/framework/adapters/fileManager.ts` plus new tests.
- `apps/web/src/main.ts` for opt-in install.
- Existing app-owned File Manager route, if discovered.
- Input catalog File Manager fixture/label only after plugin setup.

**Out of scope**

- FileInput/ImageInput picker integration; plan 041.
- General upload-input refactor.
- Automatic route creation or menu registration.
- Multiple roots/providers.
- Backend/API endpoint changes.
- Visual redesign beyond replacing fields and hiding unavailable actions.

## Git workflow

- Branch: `codex/040-file-manager-ui`
- Suggested commits:
  1. `refactor(framework): use canonical file manager assets`
  2. `feat(web): install file manager adapter`

## Steps

### Step 1: Rewrite test fixtures to canonical assets

Before component edits, convert FileManager, PathTree, PathDetail, and
FileManagerInput tests to:

```ts
{ id: 'folder-a', parentId: 'root', kind: 'folder', name: 'Folder A' }
{ id: 'file-a', parentId: 'folder-a', kind: 'file', name: 'Report.pdf',
  mimeType: 'application/pdf', previewUrl: '...' }
```

Install FrameworkPlugin then FileManagerPlugin in harness. Add list-only provider
tests proving absent optional actions are not rendered.

**Verify:** target tests fail only on old runtime/path implementation.

### Step 2: Migrate FileManager navigation shell

Replace `activePath/activeObject` with canonical active folder/selected asset
props/models. Root uses provider `root`; create a presentation-only root folder
record if needed without inventing parent path. History stores folder records or
IDs plus display labels. Deletion fallback:

1. choose another sibling from parent listing;
2. otherwise navigate to known parent;
3. root cannot be deleted.

No ID parsing.

**Verify:** existing sibling/parent delete-navigation cases pass with opaque IDs
containing no `/`.

### Step 3: Migrate PathTree

Use strict `ManagedAsset` props and provider operations. Load folders through
shared loader/cache, filter `kind === 'folder'` defensively, and key recursion by
`id`. Show loading/error/empty. Create/delete context menu entries only when
capability exists. Folder duplicate-name validation may use loaded sibling
names, but backend remains final authority; do not issue unbounded `limit:1000`
requests.

After create/delete, call provider mutation/invalidation helper and refresh only
affected branches.

**Verify:** tests cover lazy expansion, cached re-expansion, create invalidation,
delete invalidation, error, empty, and capability hiding.

### Step 4: Migrate PathDetail

Use provider list result directly; remove envelope normalization. Replace raw
columns with `name` and `updatedAt`. Preview uses `mimeType` and `previewUrl`;
framework may fall back to generic file icon but must not construct backend URL
or infer storage path.

Folder click navigates; file click selects. Upload/drop/create/delete call
optional operations and invalidate parent. Track mutation pending/error per
action. Keep view-mode localStorage key, list/thumbnail behavior, history
buttons, and selection.

Breadcrumbs use navigation ancestry known to shell. If a user jumps directly to
opaque root/child with no ancestry, render root + current label; do not query or
parse unspecified ancestors.

**Verify:** component tests plus browser interaction tests cover both view modes,
navigation, selection, upload, create, delete, cache refresh, and failed preview.

### Step 5: Migrate FileManagerInput value mapping

Resolve initial model with `values.fromModel`; commit through
`values.toModel`. Multi mode maps each value independently and preserves order.
Display canonical name/preview; no `frameworkDefaults.apiUrl`, `path`,
`content_type`, or `filename`.

If conversion fails, show normalized error and keep raw model unchanged.
Opening picker starts at provider root unless converted selected folder supplies
a valid canonical parent relationship already known.

**Verify:** tests cover scalar/multi conversion, folder/file pick restrictions,
conversion error, cancel, and no-plugin renderer absence from plan 039.

### Step 6: Implement web normalization adapter

Only `apps/web/src/framework/adapters/fileManager.ts` may know:

- endpoints `files`, `sync-file`, `delete-file`;
- `/storage/public`;
- `dir`, `folder_name`, `path`, `type`, `content_type`, `mime_type`,
  `updated_at`, response envelopes;
- mapping path/UUID/object identity to canonical `id`;
- mapping canonical asset back to persisted web model.

Add `createFolder` if backend service supports it; otherwise omit capability.
Remove `console.log`. Thread `AbortSignal` into list/mutations where supported.
Return `CollectionResult<ManagedAsset>`.

**Verify:** adapter tests feed every observed response envelope and assert one
canonical result; malformed entries produce deterministic normalized behavior.

### Step 7: Install plugin in web app

After `FrameworkPlugin`, call `app.use(FileManagerPlugin, webOptions)`. Keep
route ownership unchanged. Ensure input catalog only includes File Manager when
the app plugin is installed; it may now use a local/read-only fixture or real
configured adapter according to existing catalog no-network policy.

**Verify:** web app tests mount composition root without duplicate QueryClient,
renderer is registered, and no route is added automatically.

## Test plan

- Canonical opaque IDs deliberately include no path separators.
- Unit tests for shell/tree/detail/input.
- Browser tests for row/thumbnail actions and focus/selection.
- Adapter envelope normalization and value round-trip.
- Cache invalidation asserts unrelated directory load count unchanged.
- List-only capability fixture proves read-only manager.

## Done criteria

- [ ] Framework File Manager contains no backend/path vocabulary.
- [ ] All UI uses canonical assets/provider.
- [ ] Optional actions hidden.
- [ ] Reads use shared loader/cache; mutations invalidate targeted lists.
- [ ] Value round-trip is app-configured.
- [ ] Web adapter is sole backend-opinion boundary.
- [ ] Web installs plugin after FrameworkPlugin.
- [ ] Unit/browser/typecheck gates pass.

## STOP conditions

- Backend lacks stable asset identity and adapter cannot derive one without
  lossy collisions.
- Direct deep-link route requires breadcrumbs but backend exposes neither
  ancestry nor parent lookup.
- Backend create/delete contract is unknown.
- UI migration needs multiple providers or automatic routing.
- Required framework contract change violates plan 039 canonical interface.

## Maintenance notes

Review framework directories with opinion-audit command. Path strings are
acceptable inside web adapter as opaque IDs, never parsed by framework. Future
rename/move/download operations should become optional capabilities in separate
plans.

