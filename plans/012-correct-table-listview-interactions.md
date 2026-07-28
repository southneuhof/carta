# Plan 012: Correct and browser-verify the Table/ListView feature set

> **Implementation instructions**: This plan supersedes plans 006–011 as the
> acceptance source of truth. Preserve working Form, search, pagination, and
> reorder behavior, but do not trust any prior DONE status or passing jsdom
> test. Start by adding failing regressions for the four reported runtime
> failures. Implement one coherent state and sizing model, then run every unit,
> browser, integration, and build gate below.
>
> **Resize authority**: Plan 013 supersedes Step 4 and every column-resize
> implementation/acceptance item in this plan. Execute
> `plans/013-stabilize-table-column-resizing.md` for resizing; retain this plan
> as authority for its non-resize Table/ListView work.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat aaec97a..HEAD -- \
>   packages/is-vue-framework/src/components/core \
>   packages/is-vue-framework/src/components/views \
>   packages/is-vue-framework/src/contracts \
>   packages/is-vue-framework/src/resources \
>   packages/is-vue-framework/src/services \
>   packages/is-vue-framework/src/styles
>
> git diff --stat -- \
>   packages/is-vue-framework/src/components/core \
>   packages/is-vue-framework/src/components/views \
>   packages/is-vue-framework/src/contracts \
>   packages/is-vue-framework/src/resources \
>   packages/is-vue-framework/src/services \
>   packages/is-vue-framework/src/styles
> ```
>
> The second command is expected to report the uncommitted implementation of
> plans 006–011. Treat that implementation as user-owned work: correct it in
> place; never reset, checkout, or replace whole files from commit
> `aaec97a`.

## Status

- **Priority**: P0
- **Effort**: L
- **Risk**: HIGH — Table query, TanStack state, DOM geometry, persistence, and
  export all intersect in one public component surface
- **Depends on**: none; supersedes acceptance of 006–011
- **Category**: bug
- **Planned at**: commit `aaec97a`, 2026-07-28, against the current dirty
  implementation
- **Execution**: BLOCKED — 2026-07-28. Framework typecheck, unit tests, and
  Chromium suite pass. `pnpm --filter @southneuhof/framework-web test` fails in
  `framework/__tests__/route-resource-boundary.spec.ts`: it expects
  `hono({ rpc: ... })`, while current route code calls
  `hono({ rpc: ..., dataAdapter })`. App route/test correction is outside this
  plan scope; no application file changed.

## Why this matters

Plans 006–011 compile and pass 278 jsdom tests, but the delivered UI is not
usable:

1. no application ListView renders an Excel button;
2. row hover state layers never become visible;
3. column visibility changes render only after another Table invalidation;
4. resizing has no live feedback and dragging right can shrink a column.

These are systemic failures, not four isolated class changes. The current code
splits column state between an imperative child ref, TanStack state, local
storage, and browser auto table layout. Export is optional but never wired by
any resource. Overlay CSS lives in a stylesheet the application does not load.
Passing jsdom tests missed all physical browser behavior.

Plan 012 establishes:

- ListView as controlled owner of column preferences;
- Table as controlled/uncontrolled renderer with one TanStack sizing state;
- explicit table geometry whose logical and physical widths agree;
- a component-delivered 8% on-surface state layer;
- default Excel availability for every ListView with a data source;
- real-browser regression tests for hover, visibility, and pointer resizing.

## Verified baseline and evidence

### Verification currently passes but is insufficient

The following passed on 2026-07-28:

```text
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test
  42 files, 278 tests passed
pnpm --filter @southneuhof/framework-web type-check
```

Existing tests do not assert export controls, overlay computed styles, immediate
visibility, or resize geometry.

### Export is disconnected

`packages/is-vue-framework/src/components/views/ListView.vue:208-211`:

```vue
<slot name="export-controls" :export="exportRows" :exporting="exporting">
  <Button v-if="props.export" ... aria-label="Export Excel">
```

No `apps/web` ListView passes `export`. Resource table surfaces in
`resources/defineResource.ts` do not produce export options. Consequently the
feature is unreachable in the application.

`services/excel.ts:6-10` has only a one-shot explicit `load`; the planned
all-pages fallback/chunking and its tests were not implemented.

### Overlay cannot render

`packages/is-vue-framework/src/styles/framework.css:66-72` defines a
`::after` state layer without `content`. A pseudo-element without generated
content does not paint.

The app imports only `apps/web/src/assets/main.css`
(`apps/web/src/main.ts:12`), and that file has no `.is-table-state-row` rule.
Package-level CSS therefore never reaches the reported screen.

### Column visibility has the wrong owner

`ListView.vue:115` stores only an imperative component ref:

```ts
const tableRef = ref<{ visibleColumns: string[]; ... }>()
```

`ListView.vue:196-204` reads and mutates exposed child state from inline Dialog
handlers. It does not own a reactive `visibleColumns` model or pass
`:visible-columns` to Table, despite the controlled contract added to
`TableProps`.

`ListView.vue:116` also maps the raw field catalog instead of calling
`resolveFields({ surface: 'table' })`. The dialog/export can therefore include
fields excluded with `table: false` and miss merged display/table metadata.

### Logical and physical resize widths disagree

`Table.vue:120-129` sets every initial column size to the minimum width (96px).
`Table.vue:199-204` uses `columnResizeMode: 'onEnd'`, so no size is published
during pointer movement. The template applies width only to `<td>`, while
`<table class="min-w-full">` and `<th>` remain browser auto-layout.

Result: TanStack may start a physically 300px header at a logical 96px. Dragging
right by 50px computes 146px; applying it on release visibly shrinks the
column. This exactly matches the reported behavior.

### Preference writes are coupled

`useTablePreferences.ts:43-57` writes both sizes and visibility from either
setter. If ListView and Table each use the composable, one owner can overwrite
the other owner’s newer preference with stale state. Persistence must be split
per preference or centralized.

## Target public behavior

### ListView

```vue
<!-- Export enabled by default when table has data or load. -->
<ListView :resource="users" />

<!-- Escape hatches. -->
<ListView
  :resource="users"
  :export="{
    filename: 'users.xlsx',
    pageSize: 500,
    load: customAllDataLoader,
    mapValue: customCellMapper,
  }"
/>

<!-- Explicit opt-out. -->
<ListView :resource="users" :export="false" />
```

Default toolbar always shows:

- search;
- filters only when configured;
- column Dialog;
- Excel export when Table has `data` or `load`.

### Table column state

```vue
<Table
  :visible-columns="visibleColumns"
  :column-sizing="columnSizing"
  @update:visible-columns="visibleColumns = $event"
  @update:column-sizing="columnSizing = $event"
/>
```

Both props are optional:

- ListView supplies controlled values and owns persistence;
- raw Table without controlled values owns local state and persists only when
  namespace exists.

### Resize behavior

- Default logical width uses TanStack’s normal default (150px), not min width.
- Minimum remains 96px unless overridden.
- Pointer movement updates width live.
- Drag right by `N` pixels increases physical width by approximately `N`.
- Drag left decreases width but never below minimum.
- Persistence happens at resize completion, not for every pointermove.
- Reload/remount restores the exact completed width.

### Hover behavior

Every body cell in normal and draggable rows gets a real generated
pseudo-element:

- absolute inset 0;
- `content: ''`;
- pointer-events none;
- on-surface color;
- opacity 0 normally;
- opacity 0.08 on row hover and focus-within;
- cell background remains unchanged;
- interactive content remains above the state layer.

## Commands

| Purpose | Command | Expected on success |
|---|---|---|
| Install browser-test dependencies | `pnpm install` | exit 0; lockfile synchronized |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework unit tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all existing and new unit tests pass |
| Framework browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | exit 0 in Chromium |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Web production build | `pnpm --filter @southneuhof/framework-web build-only` | exit 0 |
| Graph refresh | `graphify update .` | exit 0; graph updated after source changes |

## Suggested implementation toolkit

- TanStack Vue Table v8 column sizing state and
  `header.getResizeHandler()`.
- `@vitest/browser-playwright@4.1.10`,
  `@vitest/browser-vue@4.1.10`, and Playwright Chromium for browser component
  tests. Match installed Vitest `4.1.10`.
- Existing `vuedraggable@4.1.0`; do not replace it.
- Existing `xlsx@0.18.5`; do not add another spreadsheet library.

## Scope

**In scope**

- `packages/is-vue-framework/package.json`
- `pnpm-lock.yaml`
- `packages/is-vue-framework/vitest.config.ts`
- `packages/is-vue-framework/vitest.browser.config.ts` (create if clearer than
  one multi-project config)
- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/contracts/resource.ts`
- `packages/is-vue-framework/src/contracts/index.ts`
- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/useTablePreferences.ts`
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
- `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`
  (create)
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `packages/is-vue-framework/src/resources/defineResource.ts`
- `packages/is-vue-framework/src/resources/__tests__/resources.spec.ts`
- `packages/is-vue-framework/src/services/excel.ts`
- `packages/is-vue-framework/src/services/index.ts`
- `packages/is-vue-framework/src/services/__tests__/excel.spec.ts` (create)
- `packages/is-vue-framework/src/styles/framework.css` only to remove the dead
  table-specific rule after state-layer delivery moves into Table
- `plans/README.md` and this plan status
- `graphify-out/**` generated by required final `graphify update .`

**Out of scope**

- Redesigning Form field behavior or validation
- Adding filter declarations to resources that do not yet have real query
  fields
- Backend endpoints dedicated to export
- Server-side/streaming XLSX generation
- Changing row-reorder persistence or allowing reorder with sort/pagination
- Column drag/reorder
- Persisting preferences without namespace
- Importing package `framework.css` into every application as a workaround
- Changing application theme tokens

## Git workflow

- Work in current dirty tree; do not reset user changes.
- Do not commit, push, or open a PR unless explicitly requested.
- Keep changes grouped by regression/fix, but a commit is not required.
- Before handoff, use `git diff --check` and list every modified file.

## Steps

### Step 1: Convert the four reported failures into failing regressions

Before changing implementation, add tests that fail for the observed reasons.
Do not weaken them to fit jsdom.

#### Unit/integration tests

Add:

1. ListView with a resource/list loader and no `export` prop renders one
   `[aria-label="Export Excel"]` button.
2. `export=false` hides it.
3. Explicit export options override filename, page size, loader, sheet name,
   and mapper.
4. Clicking a column Switch immediately removes its `<th>` and matching cells
   before search, query mutation, refresh, or remount.
5. Toggling back immediately restores the column in declaration order.
6. Dialog lists only resolved table fields; `table: false` is absent.
7. Reset inside Dialog restores visibility and sizing and clears both storage
   keys.
8. Normal Table and reorderable Table keep their prior row/cell behavior.

#### Browser tests

Add a real Chromium component test that:

1. mounts Table inside a fixed-width container;
2. records first header `getBoundingClientRect().width`;
3. pointer-drags its resize handle 80px right;
4. asserts width increases during the drag, before pointerup;
5. asserts final width is within a small tolerance of start + 80;
6. remounts with same namespace and asserts persisted width;
7. drags left past the minimum and asserts 96px;
8. hovers a body row and asserts
   `getComputedStyle(cell, '::after').opacity === '0.08'`;
9. verifies the cell’s computed background color does not change between
   normal and hover states;
10. repeats hover assertion for reorderable tbody.

Use pointer coordinates and actual bounding boxes; do not mock
`getBoundingClientRect`.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework test:browser
```

Expected before fixes: new tests fail for missing button, stale visibility,
missing pseudo-element, and shrinking/no-live resize.

### Step 2: Resolve table fields once per ListView surface

Replace raw catalog mapping in `ListView.vue` with:

```ts
computed(() =>
  resolveFields({
    fields: surface.value.table.fields,
    surface: 'table',
  }),
)
```

Use this resolved ordered array for:

- column Dialog labels and keys;
- initial/default visible keys;
- Excel columns;
- stale preference normalization.

Do not expose fields with `table: false`. Preserve resolved `read`, `format`,
renderer, props, alignment, and label metadata. Table may independently call
the same pure resolver, but ListView must not reconstruct projection rules.

**Verify**: unit test with shared display metadata, table override, and
`table:false` sees identical Table/Dialog/export field keys and labels.

### Step 3: Establish one controlled column-preference owner

Refactor `useTablePreferences` so sizes and visibility have independent
read/write/remove functions:

```text
is-framework:<namespace>:table:column-sizes
is-framework:<namespace>:table:visible-columns
```

Calling `setVisible` must not write sizes. Calling `setSizes` must not write
visibility. Validate stored shapes, finite widths, current field keys, and
minimum width. No namespace means no browser storage calls.

Add public `columnSizing?: Readonly<Record<string, number>>` and
`update:columnSizing` to Table alongside `visibleColumns`.

Implement normal Vue controlled/uncontrolled behavior:

- detect explicit prop presence, including an empty object/array;
- controlled mode emits immutable normalized values and renders props;
- uncontrolled mode updates local refs and preference storage;
- prop replacements synchronize immediately;
- field changes prune unknown keys and make new fields visible;
- no component-ref mutation is required.

ListView owns both preference values through its namespace-scoped composable and
passes both to Table:

```vue
<Table
  :visible-columns="visibleColumns"
  :column-sizing="columnSizing"
  @update:visible-columns="setVisibleColumns"
  @update:column-sizing="setColumnSizing"
/>
```

Dialog Switches read/write ListView refs directly. Keep a Table ref only for
`refresh` if needed; remove exposed visibility mutation as ListView’s state
channel. “Reset columns” remains inside Dialog and atomically resets both
models/storage keys.

The all-hidden rule remains:

- without row actions, at least one data column stays visible;
- with row actions, zero data columns is allowed.

**Verify**:

- same-tick visibility assertion passes;
- no query/load call occurs solely from visibility changes;
- two namespaces remain independent;
- controlled Table performs no storage writes;
- uncontrolled namespaced raw Table persists;
- namespace-less Table performs no storage writes.

### Step 4: Make logical and physical column geometry identical

Correct TanStack configuration:

1. Do not set `columnDef.size` to `minColumnWidth`. Leave size undefined unless
   there is a deliberate field/default size; TanStack default remains 150px.
2. Keep `minSize` at validated `minColumnWidth` (default 96px).
3. Do not make the columns computed depend on the live `columnSizing` object.
   Active widths belong only in `state.columnSizing`.
4. Use `columnResizeMode: 'onChange'` for live feedback.
5. Track `columnSizingInfo` or resize start/end explicitly so persistence occurs
   once after resize completion, not on every move.
6. Render a `<colgroup>` for visible data columns and apply
   `column.getSize()` to each `<col>`. Apply matching width to headers if needed.
7. Set Table’s CSS width to TanStack’s total visible column size. Remove
   `min-w-full`/browser auto-layout behavior that stretches physical columns
   beyond TanStack state. Horizontal overflow belongs to the existing wrapper.
8. Keep the row-action column intrinsic and outside resizable data-column
   totals, or assign it one explicit non-resizable width consistently.
9. Put each resize handle absolutely on the header’s right edge:
   full header height, adequate hit target, `cursor-col-resize`, and no inline
   width contribution.
10. Pass the owning document to `header.getResizeHandler(document)` if required
    by portals/iframes; use the event target’s `ownerDocument`.

During active resize, update only controlled/local state and emit
`update:columnSizing`; after pointerup/touchend, persist the final normalized
map. Do not recreate columns or reload data.

Add a visual active-resize indicator using
`header.column.getIsResizing()`. Keep keyboard focusability and
`role="separator"`/`aria-orientation="vertical"` on handles. If keyboard resizing
is added, ArrowLeft/ArrowRight should use a documented step (for example 8px);
otherwise do not claim keyboard resize support.

**Verify**: browser test proves live rightward growth, leftward shrink, minimum,
and remount persistence with real layout.

### Step 5: Deliver the state layer from Table itself

Remove dependence on the unused package-level `.is-table-state-row` rule.
Implement the layer in Table component markup or a `<style scoped>` block that
ships with the SFC.

Required CSS shape:

```css
.is-table-state-row > td {
  position: relative;
  isolation: isolate;
}

.is-table-state-row > td::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: /* on-surface token */;
  opacity: 0;
}

.is-table-state-row:hover > td::after,
.is-table-state-row:focus-within > td::after {
  opacity: 0.08;
}
```

Resolve token color through the same Tailwind/material token mechanism already
used by `bg-on-surface`; do not hardcode a hex value. Put interactive cell
children above the layer. Preserve actual row/cell backgrounds and borders.
Apply identical class/structure to normal and draggable rows.

Delete the now-dead table-specific block from `framework.css`. Do not modify the
app’s duplicate `main.css` to make this one component work.

**Verify**: Chromium computed-style hover test passes with unchanged cell
background and 0.08 pseudo opacity.

### Step 6: Make Excel available by default with bounded all-page loading

Change ListView export contract from “absent means hidden” to:

- `export === false`: disabled/hidden;
- `export` absent: enabled with defaults when Table has `data` or `load`;
- `export` object: enabled with overrides.

Keep `export-controls` slot. The default Remix `file-excel` icon Button must
appear on current resource-backed pages without route changes.

#### Data source rules

1. **Explicit `export.load`**: authoritative all-data loader; normalize array or
   `CollectionResult`.
2. **Table `data` and no loader**: export the complete supplied array.
3. **Table `load` fallback**: call the same loader page by page with:
   - active search/filter/sort preserved;
   - `page` controlled by export loop;
   - `limit` set to configurable `export.pageSize` (default 500);
   - fixed `searchParameters` preserved;
   - AbortSignal passed through.

Stop pagination using strongest available evidence:

- returned `meta.totalPage`;
- returned `meta.total`;
- short/empty page when metadata is absent.

Guard against non-progressing/broken loaders:

- maximum page bound;
- repeated-page signature or repeated identity sequence detection;
- reject impossible metadata (negative totals/pages);
- abort on component unmount;
- one export at a time.

Do not send a giant sentinel limit.

#### Workbook rules

Use resolved visible fields in current declaration order. Exclude row actions
and hidden/table-false fields. Preserve:

- `field.read`;
- configured `field.format` through parser;
- typed number/boolean/Date cells when no display formatter;
- deterministic JSON fallback for objects/arrays;
- empty cells for nullish values;
- headers, autofilter, frozen header row, safe sheet name, bounded widths;
- `mapValue`, filename, sheet name, page size, and load overrides.

Sanitize filenames and sheet names. Prevent an empty visible-field workbook;
reuse the same all-hidden safety rule.

Do not swallow error details completely: show user toast and emit an
`export-error` event with normalized error so applications/tests can observe
failure.

**Verify**:

- existing resource ListViews render export without new props;
- one-shot data and multi-page loader tests export all rows;
- active query keeps search/filter/sort and excludes current page/limit;
- explicit opt-out and overrides work;
- no second click starts another export;
- failure restores button state and emits error;
- workbook unit tests inspect cells and metadata without writing a real file.

### Step 7: Re-characterize preserved Form, search, filter, pagination, and reorder behavior

Because this plan supersedes all prior acceptance, retain and strengthen tests
for behavior not reported broken:

- Form infers model-bound operation from actual v-model binding;
- model-bound filter Form updates query without submit controls;
- search debounce resets page and cancels stale writes;
- filter reset preserves search and limit;
- pagination range and page-size SelectInput remain correct;
- disabled pagination icons have no hover effect/not-allowed cursor;
- reorderable mode strips pagination/sort query controls;
- reorderable mode renders valid tbody markup and emits stable reorder payload;
- visibility/resizing/state layer work in both normal and reorderable modes.

Do not rewrite these implementations if characterization passes. If any fails,
make the smallest in-scope correction and document it in this plan’s execution
notes.

**Verify**: full framework tests and browser tests pass.

### Step 8: Run complete verification and review the diff

Run commands in this order:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework test:browser
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web build-only
git diff --check
graphify update .
git status --short
```

Then review every changed hunk:

- each hunk traces to a step above;
- no app route was manually patched to reveal export;
- no query/search reload is used to force column visibility;
- no duplicated CSS workaround was added to app `main.css`;
- no storage write occurs per pointermove;
- no arbitrary export sentinel limit exists;
- no test asserts implementation text when browser behavior can be asserted.

Record:

```text
STATUS: COMPLETE | STOPPED
UNIT TESTS: command and result
BROWSER TESTS: command and result
WEB CHECKS: command and result
FILES CHANGED: exact list
DEVIATIONS: exact plan deviations and reasons
```

## Test plan summary

### Unit tests

- controlled/uncontrolled query remains stable;
- independent namespace storage;
- malformed/stale preference recovery;
- immediate visibility without reload;
- resolved dialog/export field metadata;
- export availability/opt-out/overrides;
- all-page export loop termination and failure guards;
- workbook formatting;
- Form/filter/search/pagination/reorder characterization.

### Browser tests

- pseudo-element opacity and unchanged background;
- live pointer resize direction and magnitude;
- minimum width;
- completed-width persistence;
- immediate column hide/show in rendered header/body;
- normal and draggable tbody behavior.

### Consumer gates

- framework typecheck/tests/build path;
- web typecheck/tests/production build;
- no per-route export wiring required.

## Done criteria

All boxes must hold:

- [ ] Existing resource-backed ListViews show Excel Button by default.
- [ ] `export=false` hides Button.
- [ ] Export retrieves all matching pages, not current page only.
- [ ] Export respects active search/filter/sort and visible column order.
- [ ] Hover produces a computed 8% on-surface pseudo layer in Chromium.
- [ ] Hover does not replace cell background color.
- [ ] Column toggle updates header/body immediately with no query/load/reset.
- [ ] Column Dialog uses resolved table fields only.
- [ ] Dragging a resize handle right grows physical width during drag.
- [ ] Dragging left shrinks physical width but stops at 96px default minimum.
- [ ] Completed width survives remount under same namespace.
- [ ] Controlled Table performs no browser-storage writes.
- [ ] Namespace-less Table performs no browser-storage writes.
- [ ] Reset columns remains inside Dialog and resets sizes/visibility.
- [ ] Form/search/filter/pagination/reorder characterization stays green.
- [ ] Framework typecheck, unit tests, and Chromium tests exit 0.
- [ ] Web typecheck, tests, and production build exit 0.
- [ ] `git diff --check` exits 0.
- [ ] `graphify update .` completes after final source state.
- [ ] No files outside scope changed, excluding pre-existing user changes.

## STOP conditions

Stop and report; do not improvise if:

- Current dirty source no longer matches the evidence above before execution.
- A real-browser component test cannot be added without changing the workspace
  test runner outside listed manifests/configs.
- Correct sizing requires abandoning semantic `<table>` markup.
- The ordinary list loader cannot express deterministic page traversal using
  canonical `CollectionResult.meta`; define an explicit export loader contract
  and stop before enabling misleading default export.
- A backend resource demonstrably caps/ignores page and limit without returning
  usable total/totalPage metadata.
- XLSX browser bundling fails because the package build needs Node-only globals.
- Fix requires modifying every app route/resource manually.
- Fix requires merging search/filter values into fixed `searchParameters`.
- Any verification command fails twice after one focused correction.
- An out-of-scope file must change for runtime correctness; report the file and
  reason first.

## Maintenance notes

- Physical UI behavior needs browser tests. Do not delete the Chromium suite
  even if jsdom coverage grows.
- TanStack column state is logical geometry; DOM must always render those exact
  sizes or resize math becomes invalid again.
- Preference ownership must remain singular at each surface: ListView
  controlled, raw Table uncontrolled.
- Separate storage writes prevent stale visibility from overwriting sizes and
  vice versa.
- Export fallback is safe only while canonical collection metadata and
  progressive page results remain available. Very large datasets should later
  move to server-generated/streaming export.
- Any new table surface field must flow through `resolveFields` before Dialog or
  export use.
- Any future app stylesheet split must not affect component state-layer
  delivery.
