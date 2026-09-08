---
name: carta-module-plan
description: Turn an approved Carta module design into implementation plans, or reconcile existing plans with a revised design and repository.
---

# Carta module plan

Translate an approved module contract into repository-grounded implementation
plans. Record intent, affected owners, scope, steps, checks and completion.
This skill plans the selected behavior; it does not run a general audit, choose
new product scope, or implement source changes.

## Confirm authority and current context

Read the design and its approval source. Use the shared
[module contract](../carta-module-design/references/module-contract.md) to assess
readiness without requiring a rewrite into a particular layout. Keep an
existing plan that already meets the same bar.

Inspect the actual affected owners and consumers, relevant layer contracts,
and current package scripts/configuration. Record an existing exemplar for
non-obvious patterns. Separate observed repository facts from proposed technical
changes. Carta supplies Vitest, Playwright, type checking and linting; select
appropriate checks rather than asking the user to choose a testing stack.
Resolve exact commands from this checkout and distinguish script inspection
from a successful execution.

If planning exposes a missing business rule or a conflict with approved intent,
return that specific issue to `$carta-module-design`. Preserve unaffected work.
Make ordinary technical decisions within the design's delegated scope.

## Organize the work

Start with one observable vertical result. Split when a separate result,
dependency, independent owner or risk boundary justifies it. Include the
necessary data, API, web, setup and tests in that result rather than creating
one plan per layer. A migration or shared interface can be a separate prerequisite
when its acceptance and rollout boundary are genuinely independent.

Use [plan-template.md](references/plan-template.md) for numbered plans at
`plans/<feature>/001-<result>.md`. Preserve existing numbering on resume. The
complete handoff is the design, worksheet, selected plans and referenced source,
not a transcript or repeated copy of the design in each file.

Use the [worksheet contract](../carta-module-development/references/module-execution-worksheet.md)
for the dependency/status index and acceptance ownership. Map every acceptance
ID to a primary plan and a proof obligation. Use
[verification strategy](../carta-module-development/references/verification-strategy.md)
to select the smallest sufficient tests and broader checks justified by impact.

State relevant owners and symbols, intended changes, required interfaces between
plans, exact commands with working directories, and expected evidence. Code
excerpts and target code shapes belong where they resolve a fragile boundary;
implementation detail that cannot affect the contract stays with the implementer.

## Review and hand off

Check complete acceptance coverage, dependency order, actual paths and commands,
write boundaries, and design revision. Check the plan as a fresh implementer:
it must resolve what to change and how to prove it without another product
decision. Commands with unknown setup requirements stay visibly blocked.

Record source drift with commit and relevant input fingerprints, including dirty
and untracked work. On resume, reconcile actual changes; routine approved
implementation is not itself a new design conflict. Refresh technical details
when behavior is unchanged. Escalate only material scope, interface or authority
changes.

Return the plan/index paths, design revision, execution order, coverage and
blockers. A planning-only request ends here. For an already authorized module
implementation, return to `$carta-module-development` without inventing another
approval ceremony. New material decisions and additional write authority still
require user approval.
