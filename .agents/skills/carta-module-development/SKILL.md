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
reported failures together. Run the full command once at the end. Use the
[foreground procedure](../verify-carta-module/references/runtime.md#verification-commands)
for both verification commands.
Use the optional [plan format](references/planning.md) when execution or resume
needs a file.

Before writing code in any layer, open its owning skill and reference:

| Change | Required guidance |
|---|---|
| API, data, permissions, transactions | [$api-conventions](../api-conventions/SKILL.md) |
| Pages, resources, views, custom workspaces, navigation | [$web-ui-surfaces](../web-ui-surfaces/SKILL.md), [capability index](../web-ui-surfaces/references/capabilities.md), and [DESIGN.md](../../../DESIGN.md) |
| Forms, lookups, inline tables, and file inputs | [$build-resource-form](../build-resource-form/SKILL.md) |

For each changed interaction or operation, look up its existing framework owner
in the [capability index](../web-ui-surfaces/references/capabilities.md) and
inspect a current consumer (such as `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts`)
before writing custom code. Build resource modules on `defineResource`,
`defineTable`, `defineDetail`, `defineForm`, `ListView`, `DetailView`,
`FormView`, `Form`, `TreeTable`, and `TableInput` instead of raw `<table>`,
`<form>`, or manual `reactive()` CRUD state. Preserve standard View defaults
(`ListView`, `DetailView`, `FormView`, default `Create` label) unless the
approved design requires custom behavior. Group non-standard requirements in
task notes by owner and state the unsupported requirement for each custom part.
Reuse the owner's loading, validation, persistence, access, and mutation
lifecycle.

If a design record exists, mark implementation `In progress`.
Complete required migrations, seed data, access, navigation, and preview setup.
Apply new migrations to the configured development database; a migrated test
database alone does not complete setup. Report failures and continue
independent work. Return material contract changes to design; resolve routine
choices locally.

## Finish

Complete [module verification](../verify-carta-module/SKILL.md) and, for any
`apps/web` change, complete every gate in
[UI review](../web-ui-surfaces/references/verification.md) including zero new
lint warnings and rendered browser inspection. For Gate 3, select about 10 to
16 captures across the changed pages. Cover desktop light mode, mobile at
375 px, and dark mode on custom workspaces. Review custom code against its
stated unsupported requirement. Mark an existing design's implementation
`Current` only when requirements, setup, checks, and rendered UI review are
complete. Report delivered behavior, setup status, checks, and remaining gaps.
