---
name: carta-module-development
description: Route one Carta application module from intent, draft, design, plan, or partial code through design, planning, delegated implementation, and verification. Use when work spans module contracts or application layers. Not for a UI-only change or one isolated backend edit.
---

# Carta module development

Develop one coherent Carta module. Resume from the strongest usable artifact;
do not restart a completed stage.

Use `pnpm`. Keep changes in `apps/api` and `apps/web` unless the user approves a
framework package change.

## Intake and route

Read [references/workflow-strategy.md](references/workflow-strategy.md) once to
understand the adaptive stage flow. Then read
[references/discovery.md](references/discovery.md) and classify the input:

- **Intent:** no stable user journey or contract. Start `$brainstorming`.
- **Draft:** preserve settled decisions and brainstorm only material gaps.
- **Approved design:** derive the implementation plan.
- **Approved plan:** delegate implementation.
- **Partial implementation:** reconcile code and evidence with the plan, then
  resume its first incomplete item.

An artifact is usable when it is current, consistent with the repository, and
clear enough for the next stage without a new product or architecture decision.
Ask only for a decision that can materially change scope, behavior, or
acceptance.

Route by work shape after intake:

- **Bounded:** one resource, standard independent CRUD actions, known fields,
  permissions, routes, navigation, and acceptance; no relation consumer,
  workflow, custom write, custom surface, or open decision. Read
  [references/bounded.md](references/bounded.md).
- **Complex or unclear:** any relation, child, dependent lookup, workflow,
  transaction, custom surface, scoped permission, or open decision. Read
  [references/complex.md](references/complex.md).

Escalate from bounded to complex when evidence requires it. Preserve an
existing valid design or plan during escalation.

## Shared workflow

1. **Design:** create or update `plans/<feature>/design.md`. Use
   `$brainstorming` only for unresolved product and architecture decisions.
   Obtain approval for new material decisions. An approved design does not need
   a second approval.
2. **Plan:** use `$improve` to create the minimum numbered vertical plans under
   `plans/<feature>/`. Each plan must deliver an observable result and contain
   its database, API, web, focused checks, UI evidence, stop conditions, and
   allowed side effects. Accept an existing plan when it meets the same gate.
3. **Delegate:** use `$luna-execution-delegation` by default when available.
   Give one Luna agent the design, worksheet, all approved plans in dependency
   order, current evidence, success conditions, and write boundaries. Keep that
   agent for the complete slice. Execute directly only when delegation is
   unavailable.
4. **Verify:** the executor runs focused checks and records evidence. After the
   slice, use `$verify-carta-module` when delegation is available.
   Complete the module only when all acceptance rows have current evidence.

Read [references/module-execution-worksheet.md](references/module-execution-worksheet.md)
before creating or updating the feature worksheet. Read
[references/module-acceptance-checklist.md](references/module-acceptance-checklist.md)
when planning acceptance. Read [references/contract-rules.md](references/contract-rules.md)
for cross-layer contracts.

## Layer routes

- Use `$api-conventions` for every `apps/api` change or review.
- Use `$web-ui-surfaces` for web routes and surfaces.
- Use `$build-resource-form` for resource forms.
- Read [references/frontend-field-contract.md](references/frontend-field-contract.md)
  before a web resource or form edit.
- Read [references/web-query-cache.md](references/web-query-cache.md) for custom
  web server reads.
- Read [references/ui-automation.md](references/ui-automation.md) when UI
  acceptance applies.

The routed skills own layer details. This router owns stage selection,
continuity, design and plan gates, delegation, and evidence completeness.

## Boundaries

- Put unrelated modules in separate feature folders and delegations.
- Return to design or planning when implementation reveals a material decision.
- Obtain user authority before production, external, destructive, or other
  unapproved writes.
- Report failed checks, blockers, and unverified outcomes.
