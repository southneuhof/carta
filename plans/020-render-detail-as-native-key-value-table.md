# Plan 020: Render Detail as a native key-value table

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update this plan's status in
> `plans/README.md` after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/components/core/Detail.vue packages/is-vue-framework/src/components/core/__tests__/detail.spec.ts`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against live code before proceeding. A mismatch is a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `fc8c9ec`, 2026-07-28

## Why this matters

`Detail` currently renders an unstyled definition list, so labels and values do
not form the stable label/separator/value columns required by detail screens.
A native table gives the requested horizontal row layout and accessible row
headers without adding collection-only TanStack Table state. Data loading,
renderers, value slots, and `refresh()` must remain unchanged.

## Current state

- `packages/is-vue-framework/src/components/core/Detail.vue` owns record loading,
  field resolution, display rendering, and loading/error/empty states.
- `packages/is-vue-framework/src/components/core/__tests__/detail.spec.ts` is the
  jsdom behavior suite for this component.
- Current successful-record markup at `Detail.vue:58-75` is:

  ```vue
  <dl v-else>
    <template v-for="entry in entries" :key="entry.field.key">
      <dt>{{ entry.field.label }}</dt>
      <dd :data-emphasis="entry.field.emphasis">
        <!-- existing renderer/value-slot branch -->
      </dd>
    </template>
  </dl>
  ```

- Current tests at `detail.spec.ts:17-18` assert `dt` and `dd` nodes. They must
  move to table semantics rather than merely changing expected text.
- Architecture constraint from
  `docs/architecture/web-application-architecture.md:244-261`: core components
  own data presentation, while `Detail` owns loading and field rendering but no
  page layout or route controls.
- Styling convention: use existing design-token utilities such as
  `text-on-surface`, `text-on-surface-variant`, and
  `border-outline-variant`; do not introduce literal colors or component-local CSS.
- `Table.vue:252-255` documents TanStack Table as private collection-table
  machinery. Do not import `@tanstack/vue-table` into `Detail.vue`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/core/__tests__/detail.spec.ts` | exit 0; all Detail tests pass |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0; all package tests pass |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0; no Vue or TypeScript errors |

Dependencies are already installed. Do not run `pnpm install`.

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/core/Detail.vue`
- `packages/is-vue-framework/src/components/core/__tests__/detail.spec.ts`

**Out of scope**:

- `packages/is-vue-framework/src/components/core/Table.vue` and its tests; those
  files contain unrelated user changes.
- `packages/is-vue-framework/src/contracts/components.ts`; no new Detail prop is
  needed.
- `packages/is-vue-framework/src/components/composites/Detail.vue`; this legacy
  compatibility component uses a different contract.
- `DetailView.vue`, Cards, route navigation, and action controls; plan 021 owns
  those.
- Adding TanStack Table, sorting, paging, resizing, column preferences, or
  responsive data transformations.

## Git workflow

- Suggested branch: `codex/020-native-detail-table`
- Keep implementation and tests in one logical commit if asked to commit.
- Match recent conventional style when a descriptive commit is requested:
  `refactor(framework): render detail as native table`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Lock table semantics in tests

Update the first test in
`packages/is-vue-framework/src/components/core/__tests__/detail.spec.ts` to
assert:

- one `<table>` containing two `<tr>` rows for the two resolved fields;
- row labels are `<th scope="row">` with text `Nama` and `Ruas`;
- each row contains a separator cell whose text is `:` and which has
  `aria-hidden="true"`;
- value cells contain `Admin` and `Ruas 1`;
- no `dt` or `dd` remains.

Extend the renderer/slot test only as needed to prove registered renderers and
`value:*` overrides still render inside the value `<td>`. Keep all existing
loading, cancellation, error, empty, and refresh assertions.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/core/__tests__/detail.spec.ts`
→ the new semantic test should fail against the old `<dl>` markup while every
unrelated assertion still runs.

### Step 2: Replace only the successful-record markup

In `packages/is-vue-framework/src/components/core/Detail.vue`:

1. Keep all script logic unchanged.
2. Keep loading, error, and empty slot branches unchanged except for design-token
   utility classes needed to make their presentation consistent.
3. Replace the successful-record `<dl>` with a native `<table><tbody>`.
4. Render one `<tr>` per `entry`, keyed by `entry.field.key`.
5. Use `<th scope="row">` for the field label.
6. Use a narrow `aria-hidden="true"` `<td>` containing `:` as the visual
   separator.
7. Use the final `<td>` for the existing value slot/renderer/fallback branch and
   preserve `:data-emphasis="entry.field.emphasis"` on that value cell.
8. Keep labels and separator compact with `w-px` and `whitespace-nowrap`.
   Allow the value cell to wrap long content using `min-w-0` and an appropriate
   word-breaking utility. Put the table in an `overflow-x-auto` wrapper so
   inherently unbreakable custom renderers remain reachable at narrow widths.
9. Use only existing utility classes and semantic HTML. Do not add scoped CSS.

Target hierarchy:

```vue
<div class="is-detail ...">
  <!-- unchanged state branches -->
  <div v-else class="overflow-x-auto">
    <table class="w-full border-collapse">
      <tbody>
        <tr v-for="entry in entries" :key="entry.field.key">
          <th scope="row">...</th>
          <td aria-hidden="true">:</td>
          <td :data-emphasis="entry.field.emphasis">
            <!-- unchanged value slot/renderer/fallback -->
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

Do not add `<thead>`: each field is a row header, and the record has no column
header row.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/core/__tests__/detail.spec.ts`
→ exit 0; all Detail tests pass.

### Step 3: Run package gates and review scope

Run package tests and typecheck. Inspect the diff to confirm no data-loading or
renderer logic changed and no TanStack import appeared.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework test` → exit 0.
- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.
- `rg -n "@tanstack/vue-table|<dl|<dt|<dd" packages/is-vue-framework/src/components/core/Detail.vue`
  → no output.
- `git diff --name-only -- packages/is-vue-framework/src/components/core/Detail.vue packages/is-vue-framework/src/components/core/__tests__/detail.spec.ts`
  → exactly the two in-scope files.

## Test plan

- Replace the existing definition-list happy-path assertion with native table,
  row-header, separator, and value-cell assertions.
- Retain tests for:
  - external data and computed `read`;
  - mutually exclusive `data` and `load`;
  - identity changes, cancellation, and refresh;
  - loading, missing, and error states;
  - registered renderers and `value:*` slot overrides;
  - canonical record loader results.
- Structural pattern: continue using `mountCore`, `flush`, and DOM selectors from
  `packages/is-vue-framework/src/components/core/__tests__/detail.spec.ts`.

## Done criteria

- [ ] Successful records render one native table row per resolved detail field.
- [ ] Labels use `<th scope="row">`; separator cells are hidden from assistive
      technology; values remain in `<td>`.
- [ ] Long values may wrap; narrow viewports can reach unbreakable content.
- [ ] Existing loading, error, empty, renderer, slot, and refresh behavior passes.
- [ ] `Detail.vue` imports no TanStack Table API.
- [ ] Focused tests, package tests, and package typecheck exit 0.
- [ ] Only the two in-scope files are modified by this plan.
- [ ] `plans/README.md` marks plan 020 DONE after implementation review.

## STOP conditions

Stop and report instead of improvising if:

- `Detail.vue` script or its public props have drifted from the current-state
  description.
- Native table markup breaks a renderer because that renderer requires invalid
  direct children under `<table>`, `<tbody>`, or `<tr>`.
- Correct layout appears to require changing field contracts or renderer APIs.
- Verification fails twice after a reasonable local correction.
- Work requires touching `Table.vue`, its tests, or another out-of-scope file.

## Maintenance notes

- `Detail` is a key/value record surface, not a collection. Future requests for
  sorting, pagination, or resizable columns belong in `Table`, not here.
- Review semantic hierarchy first: browser repair of invalid table markup can
  make tests pass while producing a wrong accessibility tree.
- If section rows are later required, add a framework-owned field projection
  contract first; do not revive the legacy `"S|"` string sentinel.
