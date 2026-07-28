# Plan 011: Export all filtered ListView data to formatted Excel

> **Implementation instructions**: Export uses an explicit all-data loader.
> Never infer “all” by setting an arbitrary pagination limit.
>
> **Drift check (run first)**:
> `git diff --stat aaec97a..HEAD -- packages/is-vue-framework/src/components/views/ListView.vue packages/is-vue-framework/src/contracts packages/is-vue-framework/src/fields packages/is-vue-framework/src/services packages/is-vue-framework/package.json`
> plus working-tree diff.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED — large exports can block browser memory/UI
- **Execution**: DONE — 2026-07-28
- **Depends on**: `plans/007-list-query-search-filter.md`,
  `plans/009-table-column-preferences.md`
- **Category**: direction
- **Planned at**: commit `aaec97a`, 2026-07-28

## Why this matters

Users need a workbook containing every row matching active search, filters, and
sort—not only current page. Export must respect current visible column order and
reuse web display metadata where possible. Explicit loading avoids backend limit
assumptions.

## Current state

- `xlsx@0.18.5` is installed.
- List loader returns a paginated `CollectionResult`.
- Fields provide stable key, label, `read`, renderer, props, and `format`.
- `@southneuhof/utilities/parse` applies configured formatters/dictionaries by
  `format` key and is the existing legacy display-format convention.
- Vue renderer components cannot safely be executed as spreadsheet formatters.
- ListView has toast dependency and toolbar controls.

## Target API

```ts
export interface ListExportOptions<TRecord, TQuery> {
  load: (context: {
    query: TQuery // active query without page/limit
    searchParameters: Record<string, unknown>
    signal?: AbortSignal
  }) => MaybePromise<TRecord[] | CollectionResult<TRecord>>
  filename?: string | ((context) => string)
  sheetName?: string
  pageSize?: number // optional chunking escape hatch
  mapValue?: (context) => unknown
}
```

Resource integration may supply this explicitly; never automatically loop an
ordinary paginated loader unless it opted into chunking contract.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Export tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/services/__tests__/excel.spec.ts src/components/views/__tests__/views.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**

- `packages/is-vue-framework/src/services/excel.ts` (new)
- `packages/is-vue-framework/src/services/index.ts`
- ListView and related public contracts
- Resource table surface export passthrough if explicit
- Service/view tests

**Out of scope**

- Server-generated Excel
- Importing spreadsheets
- Rendering arbitrary Vue components into Excel
- Exporting hidden columns by default
- Inventing a universal streaming protocol

## Steps

### 1. Define explicit export contract

Add optional ListView `export` options. Pass active query after removing
`page`/`limit`; keep search, filters, and sort. Pass unchanged fixed
`searchParameters`. Use current visible columns in current declaration order.
No export control when options absent.

Escape hatches: filename, sheet name, explicit load, optional chunk size, and
value mapper. Default filename is sanitized namespace plus local timestamp.

**Verify**: contract compiles for raw and resource ListView paths.

### 2. Build pure workbook conversion service

Create testable functions separating:

1. rows + resolved fields → matrix/cell descriptors
2. matrix → workbook
3. workbook → browser download

Default cell value:

- `field.read(record, {})` when defined, else `record[field.key]`
- apply `parse(field.format, value)` when format exists
- preserve numbers and booleans as typed cells when no display formatter
- convert valid Date values to Excel dates
- stringify objects/arrays deterministically
- nullish → empty cell

Use field labels as headers, freeze header row, enable autofilter, bold/header
fill, reasonable computed widths with caps, and number/date formats where type
is known. Custom `mapValue` wins.

**Verify**: inspect workbook object in tests; do not require writing a real file.

### 3. Add ListView export control and progress state

Add Remix `file-excel` icon Button. On click:

- guard concurrent export
- call explicit all-data loader
- normalize result shape
- generate workbook using visible columns
- download
- show success/failure toast
- restore loading state

Expose an `export-controls` slot and export label/filename overrides. Button is
disabled while exporting.

**Verify**: view test mocks export service and checks query, fixed parameters,
visible columns, concurrent-click guard, and error recovery.

### 4. Bound large-export behavior

If loader opts into chunking, fetch sequential pages using returned metadata and
AbortSignal until total/short final page; reject non-progressing metadata.
Without chunking, one explicit load call is authoritative. Document browser
memory limits and recommend server export for very large datasets.

**Verify**: service tests cover one-shot, chunked final page, cancellation, and
non-progress guard.

## Test plan

- Active search/filter/sort kept; page/limit removed
- Hidden columns excluded; declaration order retained
- `read` and `format` applied
- typed number/boolean/date cells and deterministic object fallback
- safe filename/sheet-name truncation
- header style, filter, freeze, and widths
- one-shot and chunked loader behavior
- ListView loading/error/success behavior

## Done criteria

- [x] Export contains all explicitly loaded matching data
- [x] Current visible columns and order control workbook
- [x] Active query applies except pagination
- [x] Formatting is best-effort through field read/format and typed cells
- [x] No arbitrary huge limit is sent
- [x] All verification commands exit 0

## STOP conditions

- `xlsx` build in this package cannot run in browser bundle without Node-only
  globals.
- Required export volume needs true streaming; recommend server-side export.
- Applying a registered renderer would require mounting Vue components; use
  `mapValue` escape hatch instead and do not proceed with component rendering.

## Maintenance notes

Renderer visuals and spreadsheet values are different media. Keep the explicit
value mapper as escape hatch and treat server-side export as next step when data
volume outgrows browser memory.
