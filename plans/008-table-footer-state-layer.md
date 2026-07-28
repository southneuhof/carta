# Plan 008: Rebuild Table footer and hover state layers

> **Implementation instructions**: Reconcile dirty `Table.vue`, then implement
> only scoped presentation/query controls.
>
> **Drift check (run first)**:
> `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/contracts/components.ts packages/is-vue-framework/src/styles/framework.css`
> and the same working-tree diff without a revision range.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Execution**: DONE — 2026-07-28
- **Depends on**: `plans/007-list-query-search-filter.md`
- **Category**: direction
- **Planned at**: commit `aaec97a`, 2026-07-28

## Why this matters

Footer should communicate current data range, offer page-size control, and keep
navigation compact. Hover must be a physically separate semi-transparent
on-surface state layer above existing row backgrounds, not replace them.

## Current state

- `Table.vue:204-228` places text navigation at bottom right.
- Buttons use direct `hover:bg-on-surface/[8%]`, disabled
  `cursor-not-allowed`, and no Remix icons.
- Rows at `Table.vue:155-160` replace background with
  `hover:bg-primary/[6%]`.
- Shared `framework.css:62-64` has an `.overlay` pseudo-element helper, but it
  only shows on hover and is too generic for table row/focus state.
- `CollectionMeta` already provides `total`, `page`, and `pageSize`.
- `SelectInput.vue` supports static `data`, `searchable`, `clearable`, `pick`,
  `view`, and v-model.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Target tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/core/__tests__/table.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**

- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/contracts/components.ts`
- `packages/is-vue-framework/src/styles/framework.css`
- `packages/is-vue-framework/src/components/core/__tests__/table.spec.ts`

**Out of scope**

- Resizing, visibility, reorder, and export
- Rewriting `SelectInput`
- Localization framework

## Steps

### 1. Add footer escape hatches

Add Table props with defaults:

- `pageSizeOptions?: readonly number[]` → `[10, 25, 50, 100]`
- `defaultPageSize?: number` → `10`

Validate positive unique integers and ensure current limit remains selectable
even when not in options. Add `pagination-summary` and `page-size-control`
slots with complete scope so applications can replace wording/control. Keep
default text exactly `Showing data X–Y out of Z`.

Changing limit resets page to 1. Values sent into query are numbers even if
SelectInput returns string IDs.

**Verify**: tests cover defaults, custom options/default, numeric query update,
page reset, and replacement slots.

### 2. Lay out footer

Use one responsive footer:

- left: previous icon Button, `current / totalPage`, next icon Button
- right: summary then non-searchable/non-clearable SelectInput

Use Remix `arrow-left-s` and `arrow-right-s` icons with accessible labels.
Disabled icon buttons must have no hover state and no
`cursor-not-allowed`; disabled opacity/text treatment remains. Prefer existing
Button disabled semantics, adding a narrowly scoped class only if required.

Compute:

```text
start = total === 0 ? 0 : (page - 1) * pageSize + 1
end = min(total, start + currentRows.length - 1)
```

Hide summary when `meta.total` is absent. Keep pagination visibility semantics
when only `totalPage` exists.

**Verify**: page 2/10 of 87 renders `Showing data 11–20 out of 87`; empty total
renders `0–0`; absent total omits summary.

### 3. Add physical state-layer CSS

Create a table-specific pseudo-element class in `framework.css`. Apply it to
each row cell (or an equivalent semantic-safe selector), never insert a `div`
directly under `tr`. Required behavior:

- cell retains its actual background
- `::after` is absolute, inset 0, pointer-events none
- overlay color is `on-surface`
- hover/focus-within opacity is 8%
- overlay sits above background but below interactive cell content
- border/table semantics and row actions remain usable

Remove direct row hover background mutations. Sorting and navigation buttons
should use Button’s existing state-layer system rather than direct background
replacement.

**Verify**: DOM/CSS assertions find pseudo-layer class and reject old
`hover:bg-primary`/pagination `hover:bg-on-surface` patterns.

### 4. Preserve accessibility and responsive layout

Keep `<nav aria-label="Pagination">`, icon `aria-label`s, tabular page numbers,
focus indicators, and logical reading order. Allow right group to wrap below
left on narrow screens.

**Verify**: target tests and typecheck pass.

## Test plan

- Page range math for first, middle, final, and zero-result pages
- Missing total behavior
- Default and overridden page sizes
- Disabled previous/next cannot change query and have no forbidden classes
- Icon names and accessible labels
- Physical overlay class without invalid children inside `tr`
- Custom footer slots

## Done criteria

- [x] Pagination is bottom left
- [x] Summary and page-size SelectInput are bottom right
- [x] Exact default wording is present
- [x] Row hover uses 8% `on-surface` pseudo overlay
- [x] Disabled navigation has no hover effect or not-allowed cursor
- [x] Verification commands exit 0

## STOP conditions

- Existing Button cannot suppress its state layer while disabled without a
  shared Button fix; report exact class conflict before expanding scope.
- Tailwind build cannot emit required pseudo-element utilities from package CSS.

## Maintenance notes

Range calculations must use server meta when present and current rendered row
count for final-page end. Do not derive total from `totalPage * pageSize`.
