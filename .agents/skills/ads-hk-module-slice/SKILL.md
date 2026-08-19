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
- `plan <module>`: use an approved design to create one or more self-contained
  numbered `$improve` plans without source edits.
- `execute <plan>`: use `$improve execute`, then run
  `$verify-ads-hk-module`.
- `simple-master-data <module>`: use the bounded manifest pipeline below only
  after direct evidence proves that the module is eligible.
- `verify <module or plan>` and `review <module>`: invoke the read-only
  `$verify-ads-hk-module` skill.

When the user names only this skill and a module, use `develop`. Do not ask
for the default legacy path again.

## Feature artifact folder and worksheets

Read `references/module-execution-worksheet.md` before creating or executing a
module plan. Every new feature or module execution uses one folder under
`plans/`:

```text
plans/<feature-slug>/
├── design.md
├── worksheet.md
├── 01-<implementation-slice>.md
└── 02-<implementation-slice>.md
```

Use the feature folder as the human-facing handoff. `design.md` is the stable
business and architecture authority. `worksheet.md` is the feature-level
coordinator for discovery evidence, plan decomposition, dependencies, overall
status, and cross-plan blockers. Each numbered plan is one technical slice and
contains its own execution worksheet section. Keep `plans/README.md` as the
global index only. Do not create new feature artifacts directly under
`plans/`, and do not migrate old executions.

Create the feature folder and a minimal `worksheet.md` before the first
module-specific source read. The worksheet is a tracking envelope, not an
approved design or a technical plan. Keep the same feature folder through
discovery, design, planning, execution, and verification:

1. `DISCOVERY`: initialize `worksheet.md` and record the evidence ledger.
2. `DESIGN`: write `<feature-folder>/design.md`, obtain written approval, and
   link its path from the worksheet.
3. `DECOMPOSE`: after design approval, record numbered plan boundaries and
   dependency order in the feature worksheet.
4. `PLAN`: use `$improve` to derive one or more numbered technical plans from
   the approved design. Each plan gets a local execution worksheet and the
   copied acceptance checklist.
5. `READY`: require design, feature decomposition, and selected plan approval
   before source edits.
6. `EXECUTE`: work one active numbered plan and one active local worksheet step
   at a time.
7. `VERIFY`: hand the feature folder and selected plan to
   `$verify-ads-hk-module`.
8. `DONE`: use only after the selected plan verifier returns `PASS` and the
   feature worksheet records the completed plan.

Before the design is approved, `worksheet.md` may contain only feature
identity, live state, exact next action, read/write boundaries, discovery
evidence, and unresolved questions. Generic template placeholders are allowed.
Do not add technical scope, target files, implementation commands, design
decisions, or done criteria before `design.md` exists and is approved. A chat
proposal does not replace the written design document.

The approved design remains the authority for business and architecture
decisions. The feature worksheet owns discovery and cross-plan coordination.
Each numbered plan owns its technical contract, acceptance checklist, reports,
and local live execution state. Do not use a worksheet note to bypass a design
or planning decision.

## Route before broad reading

Read `references/module-discovery.md` before module source discovery. The
required sequence is:

1. Create or open `plans/<feature-slug>/worksheet.md` and initialize it in
   `DISCOVERY` state. Do not create separate task notes or numbered technical
   plans at this point.
2. Read the repository `AGENTS.md`, the user request, and any plan or design
   path supplied by the user.
3. Search exact module identifiers: slug, table, symbol, legacy title, and
   direct route. Use `rg --files` and `rg -n -F`; do not scan every file with a
   shared prefix.
4. Read the direct legacy owner and the current owner or direct route when
   they exist. Record each answer in the evidence ledger.
5. Classify the shape from evidence. If any contract is ambiguous, escalate
   to the full path.
6. Use the bounded path only when its eligibility conditions are all proven.
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

Use one explicit manifest at `plans/<feature-slug>/module.json` with
`kind: "simple-master-data"`. It must define
the identity, every domain field, exact labels, six permission entries,
navigation placement, and optional seed records. The scaffold does not invent
`name`, `description`, `active`, `code`, audit, relation, or seed fields.
Create the manifest and any technical plan only after discovery, the required
brainstorming and design gate, and written approval. The manifest is the
approved bounded contract; it does not replace an unresolved design decision.

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
module's named machine report under the feature folder, preferably in a
`reports/` subfolder. Record its absolute path in the numbered plan. The
independent verifier consumes a fresh report and does not repeat passing
commands only to reproduce them. It reruns a command when the report is
missing, stale, failed, or does not cover a required risk.

## Full path for complex or unclear modules

Use the full path when the triage finds a relation, child record, dependent
lookup, workflow action, custom API write, custom UI, framework gap, scoped
transaction, permission or route ambiguity, legacy mismatch, or missing
business decision. Do not force these modules into the manifest pipeline.

1. Build the direct field, route/action, ownership, permission, seed, and
   first-load/reload evidence matrix in the feature worksheet.
2. For a new or legacy-backed complex module, invoke `$brainstorming` to
   validate the business and architecture. For an approved repair with no
   unresolved item, reuse the approved design and record that evidence.
3. Write `<feature-folder>/design.md`, record its path in `worksheet.md`, and
   stop for written-spec approval. Do not use a chat-only proposal as the
   design artifact.
4. After written approval, record the plan boundaries and dependencies in
   `worksheet.md`, then use `$improve` to derive one self-contained numbered
   plan per implementation slice. Include the design path, feature worksheet
   path, exact file ownership, dependency order, matrices, copied acceptance
   checklist, commands, stop conditions, and machine-checkable done criteria.
5. Complete the execution worksheet section from
   `references/module-execution-worksheet.md` in each numbered plan. Set a
   plan to `READY` only after the design, decomposition, and selected plan are
   approved.
6. Execute one numbered plan at a time in database → authenticated API → typed
   operation → resource and field catalog → standard or approved custom
   surface order.
7. Set the selected plan's local worksheet to `VERIFY`, update the feature
   worksheet, and invoke `$verify-ads-hk-module` after execution. Only `PASS`
   can mark that plan `DONE`.

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

Use the module-scoped commands from the selected numbered plan's local
worksheet or `verify:module` for every module, including the full path. The API and web test
commands must name
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
- For database-backed identifier relations or reference fields, make the API
  the source of display metadata. Add the named relation object to the API
  select schema, define the Drizzle relation, and load it for list/detail and
  returned create/update records. Keep `projectId`/`categoryCode`-style fields
  for form values and writes; use a computed `defineFields` field with a `read`
  projection for list/detail names. Do not fetch or map in the frontend only to
  label a database-owned reference. Fixed non-database enums may use an
  approved local lookup. The `read` projection does not fetch data.
- Use `ListView`, `DetailView`, and `FormView` for standard CRUD. Use a custom
  endpoint or route-local form only for an approved domain workflow.
- When a legacy tab strip only changes the query for one `ListView` collection,
  render it as the framework `ChipFilter` in the `ListView` `filters` slot,
  following `apps/web/src/routes/(authenticated)/master-data/projects/index.route.vue`.
  Keep `Tabs` for independent surfaces or route navigation. Preserve exact
  legacy labels, order, selected default, and query semantics. Do not invent an
  `all` state when the legacy contract has no such state. If the chip can clear,
  normalize `null` to the approved default before querying.
- Use the owning resource `list` and `detail` as lookup sources. Do not add a
  consumer-owned options route or ask users to enter IDs.
- Keep API authorization as the authority. Match permission names and realms.
- Put validation in the API and resource schemas. Do not duplicate it in
  route components.
- Do not add compatibility routes, generic CRUD endpoints, broad CRUD test
  matrices, or browser pixel tests.

## Acceptance and finish gate

Copy `references/module-acceptance-checklist.md` into each selected numbered
plan before editing. Complete every required route, surface, action,
permission, label, seed, reload, focused-check, local worksheet, and evidence
row. Keep feature-level status and cross-plan acceptance in
`<feature-folder>/worksheet.md`.

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
