# Intake and discovery

Find the strongest usable artifact before you create files or ask questions.

## Read order

1. User request and linked artifacts.
2. `plans/<feature>/` and exact feature-name search results.
3. Current module code and one nearest sibling for each missing pattern.
4. Repository scripts and package commands needed to verify the plan.

Use exact searches first:

```sh
rg --files plans apps/api apps/web | rg '(^|/)<feature>(/|[.])'
rg -n -F '<feature>' plans apps/api apps/web
```

Widen a search only to answer a named gap.

## Artifact ledger

Record each artifact, approval state, currentness, decisions it owns, gaps, and
conflicts. Then classify it as intent, draft, approved design, approved plan, or
partial implementation.

Judge the content, not the filename. A draft can contain a complete design; a
file named `design.md` can still have open contract decisions.

## Design gate

A design is usable when it defines the applicable user journey, domain and data
ownership, actions, permissions, routes and navigation, UI behavior, validation
and failures, and observable acceptance outcomes. Mark a concern `NOT NEEDED`
with a reason.

Use `$brainstorming` only for gaps that can change behavior, architecture,
scope, or acceptance. Preserve all compatible settled decisions.

## Plan gate

A plan is usable when it links a usable design, divides work by observable
vertical result, names dependencies and owned areas, gives focused verification
commands and UI evidence, and states stop conditions and allowed side effects.

For partial code, compare the plan with the working tree and recorded evidence.
Passing current evidence stays complete. Resume the first missing, stale, or
failed item.

## Stop conditions

Stop and ask when artifacts conflict on a material decision, required authority
is absent, the requested behavior needs an unapproved framework change, or the
next action would make a product or architecture decision for the user.
