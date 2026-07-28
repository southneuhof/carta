# Plan 014: Replace Table column resize path with physical mouse drag

> **Implementation instructions**: Follow each step. Preserve unrelated dirty-tree work. Do not expose TanStack resize state or change public `TableProps`.

> **Drift check**: `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/core/Table.vue packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`

## Status

- **State**: DONE
- **Priority**: P0
- **Effort**: S
- **Risk**: LOW — behavior changes only while user drags a resize handle
- **Depends on**: none
- **Category**: bug/performance
- **Planned at**: commit `aaec97a`, 2026-07-28

## Why this matters

Current implementation adds pointer capture, fallback listener paths, animation-frame queueing, full sizing snapshots, and explicit neighbor redistribution. It runs against TanStack column-sizing state during every drag. User reports tab freeze/crash in real use despite passing tests.

Working `/Users/gamer/Documents/projects/iso-vue/src/components/composites/Table.vue` proves smaller model: measure dragged header once, add `document` `mousemove`/`mouseup` listeners, set only dragged width from start width plus pointer delta, then persist once on release. `Table` must retain TanStack for rows/sorting/pagination but own resize geometry locally.

## Current state

- `packages/is-vue-framework/src/components/core/Table.vue` manages `ResizeSession`, pointer capture/fallback, `requestAnimationFrame`, all-column measurements, and neighbor width in lines 252–405.
- Same file passes `columnSizing` to `useVueTable` state and enables TanStack resizing even though template owns `<col>` widths.
- `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts` asserts pointer-only lifecycle and direct neighbor redistribution, neither required by working reference behavior.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Browser test | `pnpm --filter @southneuhof/is-vue-framework test:browser` | exit 0 |
| Focused unit test | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/core/__tests__/table.spec.ts src/components/views/__tests__/views.spec.ts` | exit 0 |
| Diff check | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/core/Table.vue`
- `packages/is-vue-framework/src/components/core/__tests__/Table.browser.spec.ts`

**Out of scope**:

- `ListView.vue`, preferences storage API, public contracts, column visibility, sorting, pagination, touch resizing, keyboard resizing, table layout outside width drag.

## Steps

1. Remove `ResizeSession`, pointer capture/fallback, animation-frame queue, neighbor calculation, and TanStack column-resize state/configuration from `Table.vue`.
2. Add local drag state: active column key, start X, and physical start width. On `mousedown`, measure only target `<th>`, attach `document` `mousemove` and `mouseup` listeners. On movement, clamp only target local width. On `mouseup`, remove listeners and call existing commit path exactly once. Clean listeners on unmount without creating an extra commit.
3. Bind handle with `@mousedown.prevent`; retain visible active styling and vertical separator semantics. Keep template `<col>` widths driven from local state.
4. Rewrite browser assertions around reference contract: physical starting width, live dragged width, min clamp, no controlled emit/storage write during movement, exactly one commit/write on release, no extra commit after unmount.

## Done criteria

- [ ] No `ResizeSession`, `requestAnimationFrame`, `setPointerCapture`, `pointermove`, or `enableColumnResizing` remains in `Table.vue`.
- [ ] Browser drag begins from rendered header geometry and changes only dragged width.
- [ ] Controlled and uncontrolled paths commit/persist once after `mouseup`, never while moving.
- [ ] All commands above exit 0.
- [ ] No files outside scope changed for this plan, except plan/index/graph generated files.

## STOP conditions

- Stop if measured `<th>` width cannot drive `<col>` width under existing `table-fixed` layout.
- Stop if a browser test requires changing `ListView`, preferences API, or public contracts.

## Maintenance notes

Keep resize local. If touch or keyboard resizing is later required, add it as an explicit separate interaction; do not rebuild a universal gesture session around mouse drag.
