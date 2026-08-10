# 006 — Define the Numbering Administration visual contract

**Priority:** P1  
**Effort:** M  
**Depends on:** 001  
**Status:** DONE

## Goal

Make Number Variables and Number Configurations safe administration screens
without pretending they have legacy frontend parity that does not exist.

## Evidence

- Legacy models:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/app/Models/NumberVariables.php`
  and `NumberConfigs.php`.
- Legacy number-variable seed source:
  `/Users/gamer/Documents/projects/ads-hk-legacy/backend-ads-laravel/database/seeders/S38NumberVariablesSeeder.php`.
- No dedicated legacy frontend config or route exists for either module.
- Current owners: `apps/api/src/routes/{number-variables,number-configs}/`
  and their matching `apps/web/src/routes/(authenticated)/master-data/` folders.

## Required decisions

1. Decide whether Number Variables are seed-managed technical values or an
   editable administration catalog. The legacy seed upserts by code, so a
   normal delete/edit screen can break number generation.
2. Decide whether Number Configuration display order is always allocated by
   the server, as the legacy `beforeInsert` callback does. If yes, remove it
   from the create form and define its update/reorder operation. Do not leave
   a required number input only because the current schema has one.
3. Decide whether the current unique active-display-order index is an intended
   new constraint. The legacy model has no matching uniqueness rule.
4. Decide the Number Variable relation label. Legacy generation uses the
   variable code, so code may be an approved read label even when UUIDs remain
   hidden.

## Candidate visual contract after decisions

| Module | Table/detail | Create/edit | Never show |
|---|---|---|---|
| Number Variables | approved business code/name/description/active surface | same only if editable by decision | UUID, audit values, seed mechanics |
| Number Configurations | Number Variable code label, digits, custom code, description, active, server display order where approved | Number Variable lookup, digits, custom code, description, active; display order only if user-owned | UUID, audit values, raw variable key, hidden sequence input |

## Recorded decisions

1. Number Variables are seed-managed technical values. They have a read-only
   list/detail view and no create, edit, delete route or navigation entry.
2. Display order is server-owned. The database sequence allocates a new order;
   the create/edit form has no order input. The direct Number Configuration API
   exposes an authenticated `up`/`down` reorder operation for a future control.
3. The active display-order unique index is intentional. It prevents two active
   configurations from occupying the same generated order.
4. Number Variable code is the relation label and lookup view. Number
   generation already identifies variables by code.

## Changes

1. Record the four decisions in this plan before API or resource changes.
2. Apply the approved ownership in the direct API modules. Server allocation
   must be transactional and protected by the database constraint; do not
   calculate the next order in a web resource.
3. Change the two colocated resources and routes to use the selected matrix.
   The Number Configuration lookup must display the approved variable label
   and write its typed code/value through the direct operation.
4. If Number Variables are seed-only, replace destructive generic CRUD with a
   read-only administration view or remove the navigation item. Do not leave a
   working-looking form that violates seed ownership.

## Tests and checks

- Add focused API tests for the selected seed/edit policy, number-variable
  reference integrity, and concurrent-safe display-order allocation if it is
  server-owned.
- Add one rendered Number Configuration lookup test after the value/label
  decision. It must prove the lookup normalizes the selected code and does not
  render a raw key.
- Manual browser checks: no ID or audit field is visible; the normal form has
  no unowned display-order field; Number Variable management reflects the
  seed/edit decision.
- Run affected API/web tests and type checks, then `git diff --check`.

## Stop conditions

- Do not change the Number Variable or Number Configuration UI before the four
  decisions are recorded.
- Do not use a client-side maximum-plus-one calculation for display order.

## Done criteria

- The Numbering screens have an explicit product contract instead of invented
  legacy parity.
- Generated order and seed-managed values have one server owner.
- No technical identifiers or audit fields appear in user surfaces.
