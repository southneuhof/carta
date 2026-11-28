---
name: carta-module-development
description: Implement, extend, or review a Carta application module from an approved design (plans/*/design.md) or task request across API, database migrations, seed data, and web UI.
---

# Carta module delivery

## Start

Follow the user's choice of direct or delegated work. Use this workflow instead
of Improve or a separate delegation playbook unless the user selects one.
Delegation is optional.

Read the current diff, saved work, and the module's design record. Follow the
design skill's [task classification](../carta-module-design/SKILL.md#classify-the-task)
and [source rules](../carta-module-design/SKILL.md#discover). Reuse completed
discovery and valid approval. End surveys with findings, plans with the plan,
and reviews with findings rather than implementation.

## Implement

Select checks through [$verify-carta-module](../verify-carta-module/SKILL.md).
During edits, run `pnpm verify:module --fast --api-test <spec>` and correct the
reported failures together. Run the full `pnpm verify:module` once at the end.
Use the optional [plan format](references/planning.md) when execution or resume
needs a file.

Before writing code in any layer, open its owning skill:

| Change | Owning skill |
|---|---|
| API, data, permissions, transactions | [$api-conventions](../api-conventions/SKILL.md) |
| Pages, resources, views, custom workspaces, navigation | [$web-ui-surfaces](../web-ui-surfaces/SKILL.md) and [DESIGN.md](../../../DESIGN.md) |
| Forms, lookups, inline tables, and file inputs | [$build-resource-form](../build-resource-form/SKILL.md) |

Group any non-standard UI requirements in task notes with the unsupported reason.

If a design record exists, mark implementation `In progress`.
Complete migrations, seed data, access, navigation, and preview setup. Apply
new migrations to the development database (a migrated test database alone is
insufficient). Return material contract changes to design; resolve routine
choices locally.

## Finish

Complete [$verify-carta-module](../verify-carta-module/SKILL.md) and, for any
`apps/web` change, complete every gate in
[UI review](../web-ui-surfaces/references/verification.md). Mark an existing
design `Current` only when requirements, setup, checks, and rendered UI review
pass. Report delivered behavior, setup status, checks, and remaining gaps.
