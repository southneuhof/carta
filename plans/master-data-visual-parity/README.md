# Master-data visual parity plans

These plans make the current Master Data screens visually consistent with the
legacy ADS-HK screens. The legacy frontend is the user-interface reference:
`/Users/gamer/Documents/projects/ads-hk-legacy/frontend-ads-vuejs/src/app/configs/`.

`master-data` stays a frontend navigation group. Each API resource stays in
its direct colocated API module. Do not create an API `master-data` module or a
shared master-data resource catalog.

## Confirmed visual rules

- Do not show primary keys, UUIDs, audit actor IDs, timestamps, passwords, or
  other technical fields in a normal table, detail, create, or edit surface.
- Show relation names in tables and details. Use a lookup in forms. Never show
  a foreign-key value as raw text.
- A stored field is not automatically a user field. The legacy module and
  surface decide whether it is shown.
- `active` is a business field only where the legacy module exposes it. Its
  read surface is a status chip. Its form input is an explicit active/nonactive
  control with the server default. It is not a replacement for a workflow
  status.
- Use the field renderer that matches the value: image/file, date, location,
  number, lookup, or status chip. Do not turn a structured value into text to
  make a generic resource work.
- Preserve a special interaction when it is part of the legacy user task. A
  Project Vendor is project-scoped, Work Items are a project tree, and Number
  Configuration owns generated numbering rules.

## Execution order and status

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---|---|---|---|
| 001 | Lock the visual field contract | P1 | S | — | DONE |
| 002 | Align basic catalog visual surfaces | P1 | M | 001 | DONE |
| 003 | Align Division visual surfaces | P1 | M | 001 | DONE |
| 004 | Align Project and Project Vendor visual surfaces | P1 | L | 001, 003 | DONE |
| 005 | Restore the Work Item tree visual task | P1 | L | 002, 003, 004 | DONE |
| 006 | Define the Numbering Administration visual contract | P1 | M | 001 | DONE |
| 007 | Normalize standard field labels and legacy module titles | P1 | M | 001–006 | DONE |

Run each plan with `$ads-hk-module-slice`. Read the plan and the legacy module
in full before code changes. Keep changes in the owner folders that the skill
requires.

## Baseline and working-tree rule

The recorded Git baseline is `909060f`. The current resource split is
uncommitted user work, so a commit comparison alone is incomplete. Before each
plan, inspect both `git diff 909060f..HEAD -- <owner paths>` and
`git diff -- <owner paths>`. Preserve unrelated dirty changes.

## Scope exclusions

These plans do not repair Settings, Users, manual PTS reports, Project
completion, ITP callbacks, Excel import/export, or framework packages. A plan
may expose a dependency on one of those workflows, but it must not implement
it as ordinary CRUD.
