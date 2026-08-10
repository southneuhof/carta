# Basic master-data alignment plans

These plans are the first executable subset of
`plans/002-make-current-administration-forms-functional.md`. They align only
ordinary master-data CRUD screens with the legacy system. The legacy system is
the business reference. The current application keeps its deliberate technical
changes: generated UUIDs, server audit data, and API permission checks.

Run the plans in this order. Each implementation pass must use
`$ads-hk-module-slice`, read its selected plan in full, and update this table
only after implementation and review.

## Execution order and status

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---|---|---|---|
| 001 | Align Business Category CRUD surfaces | P1 | S | shared form baseline | TODO |
| 002 | Align PTS Work Category and Root Cause CRUD surfaces | P1 | S | 001 | TODO |

## Scope boundary

Included modules have only the standard list, detail, create, update, and
delete operations. Their business fields are `name`, `code`, `description`,
and `active`.

Do not add client ID inputs or legacy Laravel audit fields. The database must
generate UUIDs and the server must set audit data.

The following modules are deliberately excluded because they have a lookup,
media input, lifecycle action, tree rule, workflow-owned field, or dependent
numbering contract:

- Divisions and Projects
- UOMs and Work Items
- Project Vendors
- Number Variables and Number Configurations
- all Settings modules and all Quality/manual PTS screens

In particular, Number Variables are a foreign-key source for Number
Configurations and have legacy seed maintenance. Keep that dependent contract
in a later plan. Do not treat it as isolated CRUD.

## Legacy surface rule

For every included module, show `name`, `code`, `description`, and `active` in
the table, detail, create, and edit resource surfaces. The current approved
contract makes `code` required and unique even where the legacy Laravel
validation allowed an empty code. This is a deliberate current improvement.

## Findings considered and rejected

- Include Number Variables now: rejected. Its code is a Number Configuration
  foreign key and its legacy seed data needs a dependency decision.
- Copy legacy numeric IDs, audit columns, and manual audit inputs: rejected.
  The new database owns UUIDs and audit values.
- Add native route forms: rejected. Existing routes already use `FormView` and
  must continue to use the resource catalog.
