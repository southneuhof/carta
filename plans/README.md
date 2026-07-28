# Implementation Plans

Reconciled by improve skill on 2026-07-28. New plans are written against commit
`aaec97a`; `packages/is-vue-framework/src/components/core/Table.vue` already has
user-owned working-tree edits. Every execution pass must inspect and preserve
that diff. Plan 013 is the focused authority for the crash-prone resize path and
supersedes only the resize portions of Plan 012.

## Execution order and status

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---|---|---|---|
| 001 | Honest resource terminology pass | P1 | M | — | DONE |
| 002 | Contract and docs reconciliation | P1 | M | 001 | DONE |
| 003 | Unify resource capabilities | P1 | L | 001, 002 | DONE |
| 004 | Simplify ListView standard actions | P1 | M | 003 | DONE |
| 005 | Render static ListView capability branches | P1 | M | 004 | DONE |
| 006 | Infer model-bound Form and close parity gaps | P1 | M | — | SUPERSEDED BY 012 |
| 007 | Control ListView query, search, and filter Form | P1 | L | 006 | SUPERSEDED BY 012 |
| 008 | Rebuild Table footer and hover state layers | P1 | M | 007 | SUPERSEDED BY 012 |
| 009 | Persist resizable and visible columns | P1 | L | 007, 008 | SUPERSEDED BY 012 |
| 010 | Add mutually exclusive row reordering | P2 | M | 007, 009 | SUPERSEDED BY 012 |
| 011 | Export all filtered ListView data to Excel | P2 | L | 007, 009 | SUPERSEDED BY 012 |
| 012 | Correct and browser-verify Table/ListView features | P0 | L | — | BLOCKED |
| 013 | Make Table column resizing deterministic and crash-safe | P0 | M | — | REJECTED — real-use resize still freezes tabs; replaced by 014 |
| 014 | Replace Table column resize path with physical mouse drag | P0 | S | — | DONE |
| 015 | Batch ListView column visibility changes at dialog apply | P0 | S | 014 | REJECTED — changes immediate interaction; replaced by 016 |
| 016 | Unify ListView column visibility state and defer persistence | P0 | S | 014 | DONE |
| 017 | Rebuild Table visibility rendering around one derived field list | P0 | M | 016 | DONE |

Status values: TODO | IN PROGRESS | DONE | BLOCKED | REJECTED |
SUPERSEDED BY <plan>.

## Dependency notes

- 012 supersedes acceptance of 006–011 after runtime verification found missing
  export integration, non-rendering overlay CSS, stale imperative visibility,
  and incorrect resize geometry. It preserves working behavior but replaces the
  prior plans as implementation/review authority.

Recommended order:

1. `017-rebuild-table-visibility-rendering.md`
2. Resume only non-visibility acceptance work in
   `012-correct-table-listview-interactions.md` after its unrelated web-test
   blocker is resolved.

- 013 supersedes Plan 012 Step 4 and its resize acceptance criteria because the
  current implementation still uses mismatched logical/physical start widths,
  publishes on every pointer move, persists on every controlled update, and has
  no browser resize test.
- 014 rejects Plan 013's pointer-session design after real-use failure and uses
  the proven physical-width mouse lifecycle from `iso-vue` instead.
- 015 changes the immediate column-dialog interaction and is rejected.
- 016 preserves immediate visibility while removing mirrored state and moving
  only preference durability work off the switch-click hot path.
- 017 replaces Table's cumulative visibility render path. It keeps 016's
  immediate ListView interaction and single preference owner, but removes
  TanStack ColumnVisibility from Table rendering.

## Locked decisions

- User-entered search/filter values live in `query`; fixed resource scope stays
  in `searchParameters`.
- Browser preferences require explicit namespace.
- Default column minimum is 96px.
- Row reorder automatically disables pagination and sorting and only emits;
  application owns persistence.
- Hover uses direct row hover/focus utility classes; no per-cell state layer.
- Footer default is `Showing data X–Y out of Z`; page sizes default to
  10/25/50/100 with overrides.
- Column reset lives inside column dialog.
- Export uses active search/filter/sort, excludes pagination, and exports visible
  columns in current order.

## Findings considered and rejected

- Copy legacy Form’s `static`, `formType`, API URL/method, route-query initial
  data, or toast hooks: rejected because resource factories, load/submit
  handlers, and shell events now own those concerns.
- Persist preferences under a fallback `table` namespace: rejected because
  unrelated tables would collide.
- Reuse ordinary list loader with a giant limit for export or reorder: rejected
  because backend limits and completeness would be unknowable.
- Render Vue table components into Excel: rejected; use field read/format and an
  explicit export mapper.
