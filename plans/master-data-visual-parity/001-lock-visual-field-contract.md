# 001 — Lock the visual field contract

**Priority:** P1  
**Effort:** S  
**Depends on:** —  
**Status:** DONE

## Goal

Make the visual parity contract authoritative before any module changes. This
prevents the old contradictory rule, “show `name`, `code`, `description`, and
`active` everywhere,” from forcing database fields into user screens.

## Evidence

- Legacy defaults: `/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/_defaults.tsx`.
- Legacy module configs: `business-categories.ts`, `divisions.ts`,
  `projects.ts`, `uoms.ts`, `project-vendor.ts`, `pts-work-categories.ts`, and
  `root-causes.ts` in that same legacy config folder.
- Current global defaults:
  `apps/web/src/configs/defaults.ts`.
- Current recorded plan conflicts:
  `plans/basic-master-data-alignment/README.md` and
  `plans/002-make-current-administration-forms-functional.md`.

## Changes

1. Replace the basic-alignment document rule that requires all four generic
   fields on every surface. Link it to this folder and state that every module
   uses its legacy field matrix.
2. Add the following field classification to the Plan 002 parity record. Do
   not change application code in this step.

| Class | Table/detail | Create/edit | Examples |
|---|---|---|---|
| Technical | Hidden | Hidden | `id`, UUID, audit actor IDs, timestamps |
| Relation key | Relation label | Lookup only | `divisionId`, `projectId`, `uomId` |
| Stored business field | Only if the legacy surface shows it | Only if the user owns it | `description`, `active`, `integrationCode` |
| Workflow field | Named display/action only | Not a generic input | Project status, generated display order |
| Server-owned field | Hidden or display-only by contract | Never a hidden client input | UUID, audit values, UOM type |

3. Record the source-of-truth matrices in Plans 002–006. Do not make one
   global resource helper or a new cross-module abstraction.
4. Keep the current required, unique catalog codes as user-facing business
   identifiers. They are not technical IDs. The legacy config shows code for
   Business Categories and Root Causes, and the approved current contract
   keeps code visible for Divisions, UOMs, and PTS Work Categories too.
5. Do not confuse a code with a primary key. Only UUIDs, audit values, and
   other server-owned technical fields are hidden by this contract. A module
   can omit a user-facing code only when a later approved visual contract says
   how users identify and manage the record without it.

## Tests and checks

- Re-read each listed legacy config and compare its `fields`, `list.fields`,
  `detail.fields`, `fieldsProxy`, and `fieldsType` entries to the matrices in
  Plans 002–006.
- Run `git diff --check` after the planning-document update.

## Stop conditions

- Do not remove a current catalog code from a user surface without an explicit
  approved visual contract for that exact module.
- Do not change `packages/is-vue-framework`. Report a renderer gap with the
  exact missing renderer and module instead.

## Done criteria

- The old universal four-field rule is removed from active plans.
- Required catalog codes remain distinct from technical identifiers.
- Plans 002–006 have no ambiguous field ownership.

## Classification record

The matrix below is the required classification for the six execution plans.
Each module plan records the actual table, detail, and form fields. A stored
column is not a visual field until its module matrix includes it.

| Class | Read surface | Write surface | Owner |
|---|---|---|---|
| Technical | Hidden | Hidden | Database or API |
| Relation key | Related label | Lookup | Resource and API relation |
| Stored business field | Matrix only | Matrix only | Module contract |
| Workflow field | Display or action only | Workflow operation | Named workflow |
| Server-owned field | Hidden or display-only | Never a hidden input | API or database |
