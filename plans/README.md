# Plans

Written against: current working tree after `plans/` reset  
Current direction: unify resource behavior and access metadata as
`capabilities[*].handler`; keep unrelated workflow helpers as ordinary
functions.

| ID | Title | Status | Depends on |
|---|---|---|---|
| 001 | Honest resource terminology pass | Done | - |
| 002 | Contract and docs reconciliation after terminology pass | Done | 001 |
| 003 | Unify resource behavior and access metadata under capabilities | DONE | 001, 002 |
| 004 | Make ListView render standard capability actions directly | DONE | 003 |
| 005 | Render ListView standard actions as static capability branches | DONE | 004 |
| 005 | Render ListView standard actions as static capability branches | TODO | 004 |

## Order

1. `001-honest-resource-terminology-pass.md`
2. `002-contract-and-docs-reconciliation.md`
3. `003-unify-resource-capabilities.md`
4. `004-simplify-list-view-standard-actions.md`
5. `005-static-listview-capability-branches.md`

## Notes

- `001` covers only settled renames:
  - `rowControls` → `rowActions`
  - `rowLink` → `detailRoute`
  - `resource.remove()` → `resource.delete()`
- `002` updates public contracts, docs, and stale language after `001`.
- `003` replaces the deferred two-map resource API with one
  `capabilities` map. It deliberately leaves generic UI slot/action names,
  `searchParameters`, and `namespace` unchanged. Its nested-handler inference
  and cast boundary are proven by
  `proofs/003-capability-inference.type-test.ts`.
- `004` makes ListView infer standard create/detail/update/delete affordances
  from capabilities while hardcoding their labels, icons, variants, and
  placement in the view. Custom capabilities remain route-owned.
- `005` removes the transient `RowAction[]` projection and its route-provided
  delete callback. ListView renders its four supported capabilities as direct
  template branches; custom row controls are an additive slot.
