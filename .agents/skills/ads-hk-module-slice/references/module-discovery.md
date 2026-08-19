# Module discovery and evidence budget

Use this reference before reading module source. The goal is to discover the
contract with enough context for a safe decision, then stop reading when the
decision is supported.

Create or open `plans/<feature-slug>/worksheet.md` before the first
module-specific source read. Initialize it in `DISCOVERY` state. The feature
worksheet is not the technical plan. The feature folder is the canonical
handoff; do not create separate task notes or numbered plans before the design
is approved.

## 1. Parse the request

Extract exact values from the request or supplied plan:

| Question | Result |
|---|---|
| Requested module name and user-facing title | `<value>` |
| Exact slug, table, or route | `<value>` |
| Legacy reference and exact legacy title | `<path/value>` |
| Requested behavior and actions | `<value>` |
| Explicit constraints or approved differences | `<value>` |

If the request does not identify a safe module slug, derive one candidate from
the direct legacy title, search it, and record ambiguity. Do not search every
similar name until a candidate is known.

## 2. Search exact identifiers first

Use cheap filename and literal searches. Replace each placeholder with one
exact value and run only the searches needed for the current question:

```sh
rg --files apps/api apps/web docs plans | rg '(^|/)<exact-slug>(/|[.])'
rg -n -F '<exact-slug>' apps/api apps/web docs plans
rg -n -F '<exact-table>' apps/api apps/web docs plans
rg -n -F '<exact-symbol>' apps/api apps/web docs plans
rg -n -F '<exact-legacy-title>' /Users/gamer/Documents/projects/ads-hk-legacy
```

Use `rg -n -F` for each exact term. Avoid broad prefix searches such as
`emergency-simulation`, `permit`, or `master-data` before shape triage. If an
exact search returns no result, record `NOT FOUND`; do not silently widen the
search.

## 3. Evidence ledger

Keep this small table in the feature worksheet at
`plans/<feature-slug>/worksheet.md`.
Every decision must point to a path and symbol or line. `NOT NEEDED` is valid
only with a reason. Every module-specific read must answer a ledger or plan
question; otherwise stop and record why a new read boundary is required.

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `<path:line>` | `<answer>` | `FOUND` |
| Legacy labels and behavior | `<path:line>` | `<answer>` | `FOUND` |
| Relation or child owner | `<path:line>` | `<none/owner>` | `NOT NEEDED` |
| Lookup consumer or dependency | `<path:line>` | `<none/owner>` | `NOT NEEDED` |
| Workflow or custom write | `<path:line>` | `<none/action>` | `NOT NEEDED` |
| API permission realm and verbs | `<path:line>` | `<answer>` | `FOUND` |
| Route and navigation owner | `<path:line>` | `<answer>` | `FOUND` |
| Seed and reload requirement | `<path:line>` | `<answer>` | `FOUND` |
| Framework or UI gap | `<path:line>` | `<none/gap>` | `NOT NEEDED` |

Use `AMBIGUOUS` or `STOP` instead of guessing. A simple module cannot have
an unresolved ledger row.

## 4. Bounded read order

Read in this order and stop when the shape is clear:

1. Repository `AGENTS.md`, the exact request, and any supplied design,
   manifest, or plan.
2. Exact search results for the slug, table, symbol, legacy title, route, and
   navigation key.
3. Direct legacy evidence: the matching config, model or service, migration,
   seed, menu entry, and only the list, detail, create, edit, or workflow
   surface that defines a required behavior or label.
4. Direct current owner: entity/schema, API route or model, operation,
   resource, and route files when they already exist. For new web work, obey
   the repository's required architecture and UI-reuse references before
   editing.
5. One complete sibling only when a concrete pattern gap remains. Record why
   it was needed and what was reused.

Do not read every sibling module, every file with a shared prefix, every CRUD
surface of an unrelated module, or the full generator source before its
output. Generic architecture documents are read when the selected path uses
that architecture, not as a substitute for direct evidence.

## 5. Shape triage

Classify from the ledger, not from the module label:

### Bounded standard CRUD

Use the manifest path when one resource has known identity, fields, labels,
permissions, navigation, and optional seed data, and the contract has:

- standard list, detail, create, update, and delete;
- no owned child or relation write;
- no dependent lookup or consumer-specific query;
- no workflow transition or custom write;
- no custom surface or framework gap; and
- no unresolved business, API, permission, route, action, label, or legacy
  decision.

A lookup source may remain bounded. A lookup consumer or filtered dependent
field is not bounded.

### Full complex path

Escalate when any row is `AMBIGUOUS` or `STOP`, or when evidence shows:

- a relation, child record, nested resource, or dependent lookup;
- a workflow transition, custom write, transaction boundary, or state rule;
- a custom UI surface or missing framework capability;
- project-scoped permissions, multiple owners, or route/action ambiguity;
- legacy behavior that does not map to standard CRUD; or
- an approved design, plan, or parity ledger that already requires the full
  workflow.

Escalation is safe. It does not mean every file in the repository must be
read. Read all direct evidence required by the contract and no unrelated
module family.

## 6. Generator-first rule for bounded modules

For a proven bounded module:

1. After the approved bounded design, write the explicit manifest at
   `plans/<feature-slug>/module.json` from the ledger.
2. Run `pnpm scaffold:master-data ... --json`.
3. Read the returned `generated`, `integration`, and `manual` paths.
4. Run guarded integration and the static verifier.
5. Read only the direct source that needs module-specific changes, then run
   the full selected checks and acceptance gate.

Read `scripts/scaffold-master-data.mjs`, `integrate-master-data.mjs`, or
`verify-module.mjs` only when the command output is missing, contradicts the
manifest, or exposes an error that the command report cannot explain. The
generator is an existing tool, not a discovery prerequisite.

## 7. Complex handoff

For a complex module, keep the ledger in the feature worksheet and carry its
supported answers into the design and derived plans. The approved design owns
locked business and architecture decisions. The technical plans are created
only after that design is written and approved. Each numbered plan owns its
technical contract, complete field inventory, ownership map, route/action
matrix, permission matrix, seed/reload behavior, exact legacy label evidence,
acceptance checklist, and local execution worksheet. Mark each row `PASS`,
`APPROVED DIFFERENCE`, `SERVER SUPPLIED`, `NOT NEEDED`, `STOP`, or `BLOCKED`.

For a new or legacy-backed complex module, use `$brainstorming` to validate
business and architecture, write `plans/<feature-slug>/design.md`, and stop
for written approval. Then record the plan boundaries in the feature worksheet
and use `$improve` to derive one numbered implementation plan per slice before
source edits. Add the local execution worksheet from
`references/module-execution-worksheet.md` to each plan. An approved repair
with no unresolved item may reuse its design. The feature folder is the
handoff; the next worker must not repeat broad discovery when the worksheet
already answers the question.

## 8. Stop conditions

Stop and report the exact path and question when:

- the default legacy root or exact legacy module is missing;
- a legacy label, relation owner, permission realm, route/action, or API
  contract is ambiguous;
- a lookup source cannot serve the required field;
- a standard framework surface cannot express the approved behavior; or
- the browser, required seed, focused check, or independent verifier cannot
  provide the required completion evidence.

Do not resolve these by reading more unrelated files or inventing a synonym,
route, endpoint, permission, or framework change.
