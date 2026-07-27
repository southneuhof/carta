# Plans

Written against: current working tree after `plans/` reset  
Deferred: collapse `operations` + `actions` into single `actions` bag

| ID | Title | Status | Depends on |
|---|---|---|---|
| 001 | Honest resource terminology pass | TODO | - |
| 002 | Contract and docs reconciliation after terminology pass | TODO | 001 |

## Order

1. `001-honest-resource-terminology-pass.md`
2. `002-contract-and-docs-reconciliation.md`

## Notes

- `001` covers only settled renames:
  - `rowControls` → `rowActions`
  - `rowLink` → `detailRoute`
  - `resource.remove()` → `resource.delete()`
- `002` updates public contracts, docs, and stale language after `001`.
- Deliberately out of scope for now:
  - collapsing `operations` and `actions`
  - renaming `detail`
  - renaming `actions` / `ResourceAction*`
  - `searchParameters`
  - `namespace`
