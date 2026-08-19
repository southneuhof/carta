---
name: ads-hk-module-slice
description: Develop, plan, implement, or verify one ADS-HK authenticated module end to end. Use for legacy-backed or new modules, including master data, Settings, PTS, Quality Inspection, ITP, and modules with database, API, resource, FormView, route, permission, seed, or browser work.
---

# ADS-HK module slice

Use this skill as the module workflow router. Route early, keep an evidence
ledger, and read only the files needed to answer the current contract. Do not
replace the focused layer skills. Do not use the bounded path to hide an
unclear decision.

Use `/Users/gamer/Documents/projects/ads-hk-legacy` as the default legacy root.
If it or the exact legacy module is missing, stop with the search result and
ask for another reference or explicit approval to work without legacy parity.

## Modes

- `develop <module>` (default): route the module, then design, plan, execute,
  and verify it.
- `design <module>`: route and complete the design gate, then stop before
  source edits.
- `plan <module>`: use an approved design to create one self-contained
  `$improve` plan without source edits.
- `execute <plan>`: use `$improve execute`, then run
  `$verify-ads-hk-module`.
- `simple-master-data <module>`: use the bounded manifest pipeline below only
  after direct evidence proves that the module is eligible.
- `verify <module or plan>` and `review <module>`: invoke the read-only
  `$verify-ads-hk-module` skill.

When the user names only this skill and a module, use `develop`. Do not ask
for the default legacy path again.

## Route before broad reading

Read `references/module-discovery.md` before module source discovery. The
required sequence is:

1. Read the repository `AGENTS.md`, the user request, and any plan or design
   path supplied by the user.
2. Search exact module identifiers: slug, table, symbol, legacy title, and
   direct route. Use `rg --files` and `rg -n -F`; do not scan every file with a
   shared prefix.
3. Read the direct legacy owner and the current owner or direct route when
   they exist. Record each answer in the evidence ledger.
4. Classify the shape from evidence. If any contract is ambiguous, escalate
   to the full path.
5. Use the bounded path only when its eligibility conditions are all proven.
   Otherwise use the full path.

This triage applies to simple and complex modules. Complex modules receive
more direct reading because their contract needs it, not because the workflow
starts with an unrelated repository tour.

## Bounded standard CRUD path

Use this path only when the evidence proves all of the following:

- one resource has standard create, list, detail, update, and delete behavior;
- identity, domain fields, exact labels, permissions, navigation, and any
  seed records are known;
- no owned child relation, dependent lookup, workflow transition, custom API
  write, scoped transaction, custom surface, or framework gap is required;
- no business, API, permission, route/action, legacy-parity, or label decision
  remains unresolved.

A resource that serves as a lookup source can still use this path. A resource
that owns a dependent lookup, relation, or consumer-specific query cannot.

Use one explicit manifest with `kind: "simple-master-data"`. It must define
the identity, every domain field, exact labels, six permission entries,
navigation placement, and optional seed records. The scaffold does not invent
`name`, `description`, `active`, `code`, audit, relation, or seed fields.

Run these commands in order:

```sh
pnpm scaffold:master-data --config /absolute/path/module.json --json
pnpm integrate:master-data --manifest /absolute/path/module.json --check
pnpm integrate:master-data --manifest /absolute/path/module.json --apply
pnpm --silent verify:module --manifest /absolute/path/module.json --check-only --json
pnpm --silent verify:module --manifest /absolute/path/module.json --run --json
```

Use the scaffold JSON paths as the source list for the first implementation
review. Read the generated files and direct integration owners. Do not read
the generator implementation unless its output is missing or conflicts with
the manifest. The integration command is guarded and idempotent. Do not edit
route-map files by hand. Use `--with-seed` only when the manifest has seed
records.

The commands do not replace the acceptance checklist, legacy parity review,
authenticated Codex browser check, or independent verifier `PASS`. Use High
or Extra High reasoning (`high` or `xhigh`) for this path, never Low or
Medium. Keep one manifest, one verifier report, and one acceptance checkpoint
per module.

Capture the JSON output of the `--check-only` and `--run` commands as the
module's named machine report. Record its absolute path in the plan or task
notes. The independent verifier consumes a fresh report and does not repeat
passing commands only to reproduce them. It reruns a command when the report
is missing, stale, failed, or does not cover a required risk.

## Full path for complex or unclear modules

Use the full path when the triage finds a relation, child record, dependent
lookup, workflow action, custom API write, custom UI, framework gap, scoped
transaction, permission or route ambiguity, legacy mismatch, or missing
business decision. Do not force these modules into the manifest pipeline.

1. Build the direct field, route/action, ownership, permission, seed, and
   first-load/reload evidence matrix.
2. For a new or legacy-backed complex module, invoke `$brainstorming` to
   validate the business and architecture. For an approved repair with no
   unresolved item, reuse the approved design and record that evidence.
3. Write the approved design document and wait for written-spec approval
   before source edits.
4. Use `$improve` to create a self-contained implementation plan. Include the
   design path, exact file ownership, dependency order, matrices, copied
   acceptance checklist, commands, stop conditions, and machine-checkable
   done criteria.
5. Execute one plan at a time in database → authenticated API → typed
   operation → resource and field catalog → standard or approved custom
   surface order.
6. Invoke `$verify-ads-hk-module` after execution. Only `PASS` can mark the
   plan `DONE`.

Read all legacy list, detail, create, edit, and workflow surfaces that the
matrix marks as part of the contract. Do not read unrelated surfaces only
because they share a legacy module prefix.

## Ownership and layer handoff

Before creating or moving code, record:

- backend resource folder and relation owner;
- frontend resource folder, navigation group, entry routes, and surfaces;
- API permission realm and six standard verbs or approved workflow verbs;
- seed owner and first-load/reload behavior.

Keep each resource's table, entity schema, API model, permission checks,
validation, owned relations, operations, resource, routes, and focused tests
colocated. Composition roots register modules; they do not own module fields
or relations.

Keep the normal path:

```text
database and schema
→ authenticated API contract
→ typed operation with response normalisation
→ resource capability and field catalog
→ ListView, DetailView, and FormView routes
→ focused API and web tests
```

## Focused checks and local browser fixtures

Use the module-scoped commands from the selected plan or `verify:module` for
every module, including the full path. The API and web test commands must name
the module's spec files. Do not run a package-wide `test`, `test:unit`, or bare
`vitest run` as a default. Run a full suite only when a focused failure shows
cross-module risk or the user asks for it, and record the reason.

For an authenticated browser check against local or development data, temporary
fixtures required by the approved module journey are already authorized. Create
only clearly marked temporary records, keep their identifiers, update and reload
them as required, delete them after the check, and reload to confirm removal.
Do not ask for confirmation again. This does not cover production or external
writes, seeded/reference/existing-user records, or irreversible business actions.

Invoke `$build-resource-form` for resource-backed forms,
`$web-ui-surface-reuse` for web surfaces, and `$migrate-web-resource` only for
an approved migration. These skills own layer details; do not copy them into
this workflow. Do not change `packages/is-vue-framework` without explicit
approval. Record `Reused`, `Searched`, and `Gap` for web UI decisions.

## Non-negotiable contract rules

- Copy legacy user-facing labels exactly, including capitalization,
  punctuation, terminology, validation, and workflow text. Record an approved
  difference or stop.
- Keep database, API, operation, resource, and route field names aligned.
- Use `ListView`, `DetailView`, and `FormView` for standard CRUD. Use a custom
  endpoint or route-local form only for an approved domain workflow.
- Use the owning resource `list` and `detail` as lookup sources. Do not add a
  consumer-owned options route or ask users to enter IDs.
- Keep API authorization as the authority. Match permission names and realms.
- Put validation in the API and resource schemas. Do not duplicate it in
  route components.
- Do not add compatibility routes, generic CRUD endpoints, broad CRUD test
  matrices, or browser pixel tests.

## Acceptance and finish gate

Copy `references/module-acceptance-checklist.md` into the selected plan or
task notes before editing. Complete every required route, surface, action,
permission, label, seed, reload, focused-check, and evidence row.

Before reporting completion:

- run the exact selected-plan commands and `git diff --check`;
- verify seeded local data in an authenticated Codex browser;
- if the browser is unavailable after one valid retry, report `UI UNVERIFIED`
  or `BLOCKED`, never completion;
- run `$verify-ads-hk-module` and require `PASS`;
- leave no unresolved `STOP`, `REWORK`, or `BLOCKED` item;
- do not mark the plan `DONE` from an implementation summary alone.

Stop and report the exact evidence when the plan, API schema, resource
contract, permissions, routes, framework surface, or legacy business meaning
disagree. Do not guess.
