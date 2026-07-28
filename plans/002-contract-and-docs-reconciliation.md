# 002 — Contract and docs reconciliation after terminology pass

Status: Done
Depends on: 001-honest-resource-terminology-pass

## Goal

Reconcile exported contracts and docs with current framework reality after Plan 001 and after ViewControls removal.

## Why

Repo still contains stale public language and mismatched contracts. This hurts DX even when runtime code is correct.

Known stale areas:

- contracts and docs still mention “standard controls”
- resource contract docs do not fully match current `defineResource()` surfaces
- plan/docs history still reflects pre-removal control vocabulary

This plan is documentation/contract truth pass, not behavioral redesign.

## Evidence

Likely sources called out during audit:

- `packages/is-vue-framework/src/contracts/access.ts`
- `packages/is-vue-framework/src/contracts/resource.ts`
- `packages/is-vue-framework/src/contracts/components.ts`
- `docs/architecture/web-application-architecture.md`
- `docs/architecture/resource-migration-guide.md`
- `docs/architecture/routing-and-controls-review.md`

## In scope

- exported TypeScript contracts
- comments/docstrings
- architecture/migration docs
- plan index/docs if still stale

## Out of scope

- no runtime behavior changes except compile-fixing type surface alignment
- no action-bag collapse
- no naming changes rejected by maintainer

## Steps

### 1. Remove stale “standard controls” language

Replace with current concepts:

- route-owned page slots for page actions
- row actions for per-record affordances

Do this in contracts and docs only where stale wording remains.

### 2. Reconcile resource contracts with actual framework surface

Audit exported contract types against current `defineResource()` outputs.

Focus on making docs/types honest about:

- table surface
- detail surface
- form surface
- row actions
- detail route helper
- delete method naming from Plan 001

If old contract types are dead/misleading, either fix or remove them. Prefer one truthful public contract over parallel stale contract layers.

### 3. Reconcile docs after ViewControls removal

Update architecture docs so current framework story is:

- page-level controls live in route/view slots
- row-level actions derive from resource `actions`
- no generic ViewControls system remains

### 4. Verification

- `rg "standard control|standard controls|rowControls|rowLink|remove\\(" packages/is-vue-framework docs apps/web`
- framework typecheck passes
- docs/examples compile where covered by tests or type tests

## Done criteria

- no stale ViewControls-era wording remains in active framework contracts/docs
- exported contracts describe current framework truth
- docs use `rowActions`, `detailRoute`, and `resource.delete()` consistently
- no duplicate public contract story remains for same concept

## Risks

Medium.

Biggest risk: deleting or changing exported types that downstream code still imports. Prefer staged contract cleanup with clear compile verification.

## Maintenance note

When action-bag collapse happens later, revisit contract language again. This plan should not pre-bake old `operations`/`actions` split deeper into docs.
