# Plan 013: Make Table column resizing deterministic and crash-safe

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. This plan supersedes only the column-resize
> implementation and resize acceptance criteria in Plan 012. Preserve every
> unrelated Table/ListView change already present in the dirty working tree.
>
> **Drift check (run first)**:
>
> ```sh
> git diff --stat aaec97a..HEAD -- \
>   packages/is-vue-framework/src/components/core/Table.vue \
>   packages/is-vue-framework/src/components/core/useTablePreferences.ts \
>   packages/is-vue-framework/src/components/core/__tests__/table.spec.ts \
>   packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts \
>   packages/is-vue-framework/src/components/views/ListView.vue \
>   packages/is-vue-framework/src/components/views/__tests__/views.spec.ts \
>   packages/is-vue-framework/vitest.browser.config.ts
>
> git diff --stat -- \
>   packages/is-vue-framework/src/components/core/Table.vue \
>   packages/is-vue-framework/src/components/core/useTablePreferences.ts \
>   packages/is-vue-framework/src/components/core/__tests__/table.spec.ts \
>   packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts \
>   packages/is-vue-framework/src/components/views/ListView.vue \
>   packages/is-vue-framework/src/components/views/__tests__/views.spec.ts \
>   packages/is-vue-framework/vitest.browser.config.ts
> ```
>
> `HEAD` was `aaec97a` when this plan was written. The second command is
> expected to show user-owned, uncommitted work from Plans 006–012. Compare the
> current-state excerpts below to the live files and preserve unrelated hunks.

## Status

- **State**: DONE
- **Priority**: P0
- **Effort**: M
- **Risk**: MED — pointer lifecycle, physical table layout, controlled Vue
  state, and persisted preferences meet in this interaction
- **Depends on**: none; supersedes only Plan 012 Step 4 and its resize tests
- **Category**: bug
- **Planned at**: commit `aaec97a`, 2026-07-28, against the current dirty
  working tree

## Why this matters

Column resizing is both unreliable and capable of crashing the browser tab.
The current drag starts from TanStack's logical width while CSS can render a
different physical width, so the first movement may shrink, stall, or jump.
Every mousemove also emits through controlled ListView state and performs a
synchronous localStorage write, multiplying full table renders on the hottest
event path. The replacement must measure actual geometry, bound visual updates
to animation frames, and commit/persist exactly once per completed gesture.

## Current state

### Repository and architectural constraints

- `packages/is-vue-framework/src/components/core/Table.vue` is the
  resource-agnostic collection renderer. It may use TanStack internally, but
  framework fields, props, events, and slots remain the public contract.
- `packages/is-vue-framework/src/components/views/ListView.vue` is the surface
  shell and controlled owner of namespaced column preferences.
- `packages/is-vue-framework/src/components/core/useTablePreferences.ts`
  validates and persists namespace-scoped sizes and visibility.
- `docs/architecture/web-application-architecture.md:31-37` requires core
  `Table` to stay configurable outside resources and normal usage to remain
  short with explicit escape hatches.
- `docs/architecture/web-application-architecture.md:242-255` declares
  TanStack private runtime machinery. Do not expose TanStack headers, resize
  handlers, or sizing-info state in public component contracts.

### Physical and logical widths disagree

`packages/is-vue-framework/src/components/core/Table.vue:237-240` derives a
minimum from TanStack's logical total:

```ts
const tableMinimumWidth = computed(() =>
  table.getTotalSize() + (slots['row-actions'] ? 64 : 0)
)
```

`packages/is-vue-framework/src/components/core/Table.vue:281-294` then lets CSS
stretch that logical geometry:

```vue
<table
  class="w-full border-collapse table-fixed"
  :style="{ minWidth: `${tableMinimumWidth}px` }"
>
  <colgroup>
    <col
      v-for="column in table.getVisibleLeafColumns()"
      :style="{ width: `${column.getSize()}px` }"
    />
  </colgroup>
```

With two default 150px columns in a 700px container, TanStack still starts the
gesture from 150px while the browser can render each header near 350px. The
installed TanStack handler reads `header.getSize()`, not
`getBoundingClientRect().width`, at
`node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/src/features/ColumnSizing.ts:361-369`.
That mismatch makes direction and magnitude unreliable until logical totals
happen to exceed the container.

### The pointer hot path crosses the controlled surface and storage

`packages/is-vue-framework/src/components/core/Table.vue:217-222` publishes an
update for every mousemove:

```ts
columnResizeMode: 'onChange',
onColumnSizingChange: (updater) => {
  const next =
    typeof updater === 'function' ? updater(columnSizing.value) : updater
  setColumnSizing(next)
},
```

`setColumnSizing` assigns a new object and emits another new object at
`Table.vue:161-168`. A controlled ListView receives every update at
`packages/is-vue-framework/src/components/views/ListView.vue:135-138`:

```ts
function setColumnSizing(next: Record<string, number>) {
  columnSizing.value = { ...next }
  columnPreferences.setSizes(next)
}
```

`useTablePreferences.ts:57-59` then synchronously writes localStorage through
`setSizes`, while `ListView.vue:125` and `Table.vue:61` copy the new object back
through preference and prop watchers. On a populated table, a single mousemove
therefore causes multiple reactive invalidations plus synchronous storage I/O.
The browser crash has not been reproduced under automation because the
Chromium executable is absent locally, but this unbounded hot path is directly
present and is the high-confidence crash mechanism to remove.

### Resize completion is not a persistence boundary

`Table.vue:242-247` persists on TanStack resize completion only for an
uncontrolled raw Table:

```ts
if (previous && !current && !hasColumnSizing) {
  preferences.setSizes(columnSizing.value)
}
```

ListView is controlled, so it persists from `update:columnSizing` during every
move instead. This contradicts Plan 012's end-only persistence requirement.

### The working implementation supplies a useful interaction pattern

`/Users/gamer/Documents/projects/iso-vue/src/components/composites/Table.vue:219-247`
does three things worth adapting:

```ts
const th = columnRefs.value[field]
initialWidths.value[field] = th.getBoundingClientRect().width
initialMouseX.value = e.clientX
document.addEventListener('mousemove', onMouseMove)
// ...
const newWidth = Math.max(60, initialWidth + deltaX)
columnWidths.value[resizingField.value] = newWidth
// ...
document.removeEventListener('mousemove', onMouseMove)
document.removeEventListener('mouseup', stopResize)
```

Adapt the physical-width measurement and explicit gesture lifecycle. Do not
copy its document-global mouse-only listeners or
`Table.vue:211-217` deep watch, which writes storage during every move.

### Browser verification does not cover resizing

`packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts:22-32`
contains only a hover pseudo-element assertion. It never presses or moves a
resize handle. The configured command currently stops before collecting tests
because Playwright Chromium is not installed:

```text
browserType.launch: Executable doesn't exist ...
pnpm exec playwright install
```

Framework typecheck and the focused jsdom suites passed on 2026-07-28:

```text
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework exec vitest run \
  --environment jsdom \
  src/components/core/__tests__/table.spec.ts \
  src/components/views/__tests__/views.spec.ts

2 files, 48 tests passed
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install Chromium once | `pnpm --filter @southneuhof/is-vue-framework exec playwright install chromium` | exit 0; the matching Playwright Chromium executable exists |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0, no Vue/TypeScript errors |
| Focused unit tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/core/__tests__/table.spec.ts src/components/views/__tests__/views.spec.ts` | exit 0; all focused tests pass |
| Browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | exit 0 in Chromium; all resize and hover tests run |
| Full framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all framework tests pass |
| Web consumer typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web production build | `pnpm --filter @southneuhof/framework-web build-only` | exit 0 |
| Diff validation | `git diff --check` | exit 0, no whitespace errors |
| Graph refresh | `graphify update .` | exit 0 after source changes |

## Scope

**In scope**

- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/useTablePreferences.ts` only
  if a narrow API adjustment is required to separate transient and committed
  sizes
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`
- `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`
- `packages/is-vue-framework/src/components/views/ListView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `packages/is-vue-framework/vitest.browser.config.ts` only if a narrow typed
  provider command is required for held-button coordinate movement
- `plans/012-correct-table-listview-interactions.md` only to record that its
  resize section is superseded
- `plans/013-stabilize-table-column-resizing.md`
- `plans/README.md`
- `graphify-out/**` generated by the required final graph update

**Out of scope**

- Export, hover-state-layer, Form, filtering, pagination, or row-reorder
  behavior from Plan 012
- A public TanStack sizing or `Header` contract
- Column reordering, frozen columns, grouped headers, or virtualized rows
- Changing the default minimum from 96px
- Persisting unnamed Table instances
- Writing application-specific CSS or modifying app routes
- Copying the legacy table wholesale
- Replacing TanStack Table
- Optimizing arbitrary cell renderers unrelated to resize invalidation

## Git workflow

- Work in the current dirty tree and preserve all user-owned changes.
- Do not reset, checkout, or replace whole files from `aaec97a`.
- Do not create a branch, commit, push, or open a PR unless the operator
  explicitly requests it.
- Before handoff, run `git diff --check` and list every modified file.

## Steps

### Step 1: Add failing real-browser resize regressions

Expand `Table.browser.spec.ts` before changing implementation. Keep the existing
hover assertion and add a mount helper that can render:

1. a raw namespaced Table in a fixed 700px host with two columns;
2. a controlled Table host that records `update:columnSizing`;
3. a ListView-sized case with enough rows to expose repeated render/storage
   work without relying on a wall-clock performance threshold.

Use real Chromium layout and real pointer/mouse movement through the Vitest
Playwright provider. Do not mock `getBoundingClientRect`,
`requestAnimationFrame`, table widths, or localStorage. If Vitest's public
interaction API cannot express held-button coordinate movement, add the
smallest typed provider command in `vitest.browser.config.ts` and add that file
to this plan's scope before continuing; do not fall back to jsdom.

Add assertions for:

- the physical first-header width at gesture start;
- dragging its right handle 80px right increases that physical width by
  approximately 80px without an initial shrink or dead zone;
- at least one intermediate width is observable before pointerup;
- dragging left decreases width and clamps at 96px;
- the adjacent column absorbs available space while the table still fits its
  container; after the adjacent column reaches its minimum, horizontal
  overflow is allowed instead of reversing direction;
- one completed controlled gesture emits exactly one committed
  `update:columnSizing` value;
- one completed ListView gesture performs exactly one write to the
  `column-sizes` storage key and no visibility-key write;
- 120 move samples followed by pointerup leave the document responsive, finish
  the gesture, and still produce only one commit/storage write;
- pointer cancellation reverts the transient draft and performs no
  commit/storage write;
- unmounting during an active drag leaves no post-unmount update and no
  uncaught browser error;
- remounting the same namespace restores the completed physical width;
- the resize handle remains a focusable vertical separator with at least a
  12px hit target.

Instrument commit and storage counts, not Vue render internals. The crash guard
must prove bounded externally visible work and successful completion; do not
use a flaky millisecond budget.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test:browser
```

Expected before the fix: geometry, bounded-commit, and persistence assertions
fail. If the test cannot start, install Chromium with the setup command and
rerun.

### Step 2: Replace TanStack's drag handler with a framework-owned pointer session

Keep TanStack as the column/visibility model, but stop using
`header.getResizeHandler()` and `columnResizeMode: 'onChange'` for the physical
gesture. Implement a small private pointer-session state machine inside
`Table.vue`; do not add a public mode flag.

The session must:

1. start only for a primary pointer and left mouse button;
2. call `preventDefault` and stop propagation so text selection, sorting, and
   row actions cannot steal the gesture;
3. identify the target column by framework field key;
4. measure every visible data header with `getBoundingClientRect().width` at
   pointerdown and use that physical snapshot as the starting sizing draft;
5. record the pointer ID, start X, target width, immediate right-neighbor width
   when present, and the complete pre-gesture sizing state;
6. capture the pointer on the handle when supported, with a scoped fallback
   listener on the handle's `ownerDocument` only when capture is unavailable;
7. coalesce move samples through one pending `requestAnimationFrame`;
8. update Table's private/local sizing draft during frames without emitting or
   persisting;
9. on pointerup, flush the latest sample, release capture/listeners, publish one
   immutable final sizing map, and clear the session;
10. on pointercancel, revert the pre-gesture state and clear without publishing
    or persisting;
11. on component unmount, cancel the frame and release capture/listeners
    without a late commit;
12. make finalization idempotent so `pointerup`, `lostpointercapture`, and
    fallback cleanup cannot commit twice.

Use the existing normalized minimum calculation. During a drag, resize the
target against the measured starting width. When an immediate right neighbor
exists, let it absorb the inverse delta down to its own 96px/default minimum so
the table continues to fill its container. Any remaining positive delta grows
the table and uses the existing horizontal overflow wrapper. A leftward drag
must never increase the target column.

Keep the active visual affordance on the handle using the private session's
column key. Keep `role="separator"`, `aria-orientation="vertical"`,
focusability, `touch-action: none`, and the 12px hit target. Use one pointer
event family; do not register parallel mouse and touch paths.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework test:browser
```

Expected: typecheck exits 0; live geometry, direction, minimum, cancellation,
and cleanup tests pass.

### Step 3: Make completion the only controlled and persistence boundary

Refactor `setColumnSizing` responsibilities in `Table.vue` so transient layout
updates and committed public updates are distinct:

- `applyColumnSizingDraft` normalizes and assigns local state only;
- `commitColumnSizing` normalizes once, assigns once, emits one
  `update:columnSizing`, and persists once only for an uncontrolled namespaced
  raw Table.

Remove the TanStack `columnResizeMode`, `onColumnSizingChange`, and
`columnSizingInfo` completion watch when the private session replaces them.
Do not leave two resize state machines active.

For controlled Table:

- keep rendering the local draft during the active session;
- ignore same-gesture prop echoes until the session is complete;
- after completion, the parent prop remains authoritative for later external
  replacements;
- emit only the completed immutable map.

For ListView:

- keep it as the namespaced preference owner;
- receive the one completed update, replace `columnSizing`, and call
  `columnPreferences.setSizes` once;
- never call storage from transient movement;
- do not change visibility persistence.

For an uncontrolled namespaced raw Table, commit directly to
`useTablePreferences.setSizes` once. For a namespace-less raw Table, perform no
storage access. Do not add debounce timers; completion is the natural boundary.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework exec vitest run \
  --environment jsdom \
  src/components/core/__tests__/table.spec.ts \
  src/components/views/__tests__/views.spec.ts

pnpm --filter @southneuhof/is-vue-framework test:browser
```

Expected: unit tests preserve controlled/uncontrolled semantics; Chromium
proves one commit/write per completed gesture and none on cancel/unmount.

### Step 4: Make rendered geometry follow the measured sizing model

Keep semantic `<table>`, `<colgroup>`, `<thead>`, and `<tbody>` markup. Render
all visible data-column widths from the private/TanStack `columnSizing` state
after the physical snapshot is established.

Required layout rules:

- before any explicit or restored sizing exists, the table may fill its
  container using its default layout;
- at first pointerdown, snapshot all visible physical widths so logical and
  rendered widths become identical before applying delta;
- persist the complete visible-column snapshot, not only the dragged column,
  so remount restores the same geometry;
- preserve widths for temporarily hidden fields in stored state, while only
  visible widths contribute to current table geometry;
- the 64px row-action column stays non-resizable and outside data-column
  redistribution;
- header and body geometry comes from `<colgroup>`; remove redundant per-cell
  width bindings where they cause extra vnode/style churn;
- the table must not simultaneously stretch columns through `w-full` and claim
  smaller TanStack widths. If a fill rule remains, its computed physical widths
  must be fed back into the sizing snapshot before the gesture starts;
- horizontal overflow remains on the existing wrapper;
- changing sizes must not recreate field definitions, reload data, reset query,
  or rebuild ListView controls.

Do not add a `ResizeObserver` unless the browser tests prove that container
resizing after mount cannot be handled with the snapshot/neighbor model. If an
observer is genuinely required, it must be disconnected on unmount and must
never persist or emit merely because the container changed.

**Verify**:

```sh
pnpm --filter @southneuhof/is-vue-framework test:browser
```

Expected: physical deltas match pointer deltas within the test tolerance,
restored widths match, and shrinking never reverses direction.

### Step 5: Run focused, full, and consumer verification

Run in this order:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
pnpm --filter @southneuhof/is-vue-framework exec vitest run \
  --environment jsdom \
  src/components/core/__tests__/table.spec.ts \
  src/components/views/__tests__/views.spec.ts
pnpm --filter @southneuhof/is-vue-framework test:browser
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web build-only
git diff --check
graphify update .
git status --short
```

Review every resize-related hunk and confirm:

- no storage API is reachable from pointermove;
- no public update event is emitted from pointermove;
- at most one animation frame is pending;
- every capture/listener/frame has an unmount cleanup path;
- physical start widths come from the DOM;
- no second resize state machine remains;
- unrelated dirty Table/ListView features were preserved.

If the pre-existing web route test failure described in Plan 012 appears only
when somebody additionally runs the web test suite, record it as pre-existing;
do not modify application route files under this focused plan.

## Test plan

### Unit/jsdom tests

- controlled `columnSizing` prop replacement still updates Table outside an
  active gesture;
- completed controlled update is immutable;
- uncontrolled namespaced commit writes only the sizes key;
- namespace-less Table performs no storage writes;
- visibility changes remain independent of size persistence;
- field changes prune unknown sizing keys without erasing valid hidden-field
  preferences;
- existing Table, ListView, pagination, reorder, and export tests remain green.

Use `table.spec.ts` for raw Table state and `views.spec.ts` for ListView-owned
preferences. Do not assert physical layout in jsdom.

### Chromium tests

- rightward live growth with no initial jump/shrink;
- leftward shrink and 96px clamp;
- adjacent-column redistribution and overflow fallback;
- intermediate feedback before release;
- 120-sample crash guard with one commit and one storage write;
- cancel rollback;
- unmount cleanup;
- remount restoration;
- controlled versus uncontrolled storage behavior;
- handle semantics and hit target;
- existing hover assertion.

## Done criteria

- [x] Dragging right grows the target header during the gesture by the pointer
  delta within the browser-test tolerance.
- [x] Dragging left shrinks it and never reverses direction.
- [x] No data column becomes narrower than 96px by default.
- [x] No visual dead zone or initial shrink occurs in a 700px/two-column table.
- [x] Move work is coalesced to at most one pending animation frame.
- [x] A completed gesture emits exactly one `update:columnSizing`.
- [x] ListView writes the size preference exactly once per completed gesture.
- [x] Pointermove performs no localStorage write.
- [x] Cancel and unmount perform no commit or persistence.
- [x] Completed widths survive remount under the same namespace.
- [x] Controlled Table and namespace-less raw Table perform no direct storage
  writes.
- [x] The resize handle remains focusable, 12px wide, and exposed as a vertical
  separator.
- [x] Table sorting, row actions, visibility, pagination, reorder, hover, and
  export characterization remains green.
- [x] Framework typecheck, focused unit tests, full unit tests, and Chromium
  tests exit 0.
- [x] Web typecheck and production build exit 0.
- [x] `git diff --check` exits 0.
- [x] `graphify update .` completes after source changes.
- [x] No file outside scope changed, excluding pre-existing user changes and
  generated graph outputs.
- [x] Plan 012 records that Plan 013 supersedes its resize implementation and
  resize acceptance criteria.
- [x] `plans/README.md` marks Plan 013 DONE only after implementation review.

## STOP conditions

Stop and report back; do not improvise if:

- current source no longer matches the excerpts or the resize path has already
  been replaced;
- a real Chromium test still cannot start after installing the pinned
  Playwright browser;
- provider-level coordinate movement would require changing workspace-wide
  test infrastructure outside this plan;
- correct resizing requires abandoning semantic table markup;
- grouped/nested headers are introduced before implementation, because the
  neighbor and physical-snapshot algorithm must then be redesigned;
- a correct fix requires changing the public `TableProps.columnSizing` value
  shape rather than keeping `Record<string, number>`;
- the fix requires application-specific CSS or route changes;
- any verification command fails twice after one focused correction;
- an out-of-scope file must change for runtime correctness; report the file and
  reason first.

## Maintenance notes

- The DOM is the geometry authority at gesture start; TanStack remains the
  normalized state/model authority after the snapshot.
- Keep transient interaction state private. Public controlled state and
  browser preferences are commit-level state.
- Do not reintroduce per-move persistence, parent emits, deep storage watches,
  or parallel mouse/touch listeners.
- If virtualized rows are added later, preserve the same bounded header/colgroup
  update path and rerun the 120-sample browser guard.
- If grouped headers are added, replace the immediate-leaf neighbor algorithm
  deliberately and add group-span browser tests.
- Playwright Chromium is a required local/CI prerequisite for physical Table
  behavior; jsdom passing is not resize verification.
