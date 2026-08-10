# 005 — Restore the Work Item tree visual task

**Priority:** P1  
**Effort:** L  
**Depends on:** 002, 003, 004  
**Status:** DONE

## Goal

Replace the generic Work Item CRUD surface with the project-filtered tree task
used by manual PTS. A Work Item is not a flat master-data row.

## Legacy evidence and matrix

Evidence: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/views/authenticated/initiation/work-items/work-items.vue`.

| Area | Legacy behavior |
|---|---|
| Context | Select Division, then a Division-filtered Project. Do not load items before a Project is selected. |
| Tree table | Work-item name and category, volume (two decimal places), UOM label, high-risk chip, and three derived ITP indicators. |
| Root form | Category, name, volume, UOM, high-risk. The selected Project and level 1 are server/context owned. |
| Child form | Name, volume, UOM, high-risk. Parent, selected Project, and calculated child level are server/context owned. |
| Edit | Root uses root fields; child omits category. |
| Technical data | IDs, raw relation keys, level, and audit fields are not ordinary user fields. |

## Owner paths

- API: `apps/api/src/routes/work-items/` and its direct relations to Project,
  UOM, and PTS Work Category.
- Web: `apps/web/src/routes/(authenticated)/master-data/work-items/`.
- Reuse the existing direct resources as lookup sources. Do not create an API
  `master-data` aggregation route.

## Changes

1. Extend the direct Work Item schema/API only for fields that the approved
   manual PTS contract requires: category, volume, high risk, and the tree
   projection. Keep UUID generation, project ownership, parent relationship,
   calculated level, and audit values server-owned.
2. Provide a direct, authorized tree/list operation scoped to a selected
   Project. It must return relation labels and derived ITP flags needed by the
   table. Do not make the browser build a tree from an unrestricted flat list.
3. Replace the generic `ListView` route with a colocated Work Item task view:
   Division/Project context selector, lazy project tree table, root add,
   child add, root/child edit, and delete actions.
4. Use the framework resource and Form/FormView path for each root and child
   modal/form. Field variants must be explicit in the Work Item owner folder;
   do not put branching rules into global defaults.
5. Use relation labels, a number renderer for volume, an explicit boolean
   choice for high risk, and read-only chips/icons for ITP state. Do not add
   the current Work Item code to the tree unless the manual PTS contract gives
   it a user-facing purpose; it is not part of the legacy tree matrix.
6. Keep Excel import/export and ITP callbacks out of this plan. The visual
   table may show server-returned ITP indicators, but it must not implement
   their workflow.

## Tests and checks

- Add direct API tests for Project scope, parent/project consistency, root
  versus child category rules, server-calculated level, and tree projection.
- Add focused rendered form tests for root and child field variants, changing
  the Project resets dependent parent choices, and no technical value is an
  input.
- Manual browser checks: no Project shows an empty instruction state; selecting
  Division filters Projects; root/child operations have the correct fields;
  the table indents children and formats volume to two decimals.
- Run affected API/web tests and type checks, then `git diff --check`.

## Stop conditions

- Stop if the current PTS contract has not approved category, volume, high
  risk, and ITP projection fields. Record the gap in the manual PTS ledger.
- Do not convert this task back into a generic flat CRUD page to avoid the
  tree behavior.

## Done criteria

- Work Items are usable through the selected Project tree task.
- Root and child write forms match their legacy variants.
- IDs, levels, raw foreign keys, and audit fields are not exposed as normal
  visual fields. The Work Item tree uses only fields in its approved task
  matrix.

## Deferred by current schema

The current database has no ITP callback tables. The tree returns nullable ITP
flags and the UI shows an em dash until the manual PTS workflow supplies them.
Excel import/export and ITP callbacks remain outside this plan.
