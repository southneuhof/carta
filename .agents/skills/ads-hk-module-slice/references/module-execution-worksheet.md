# Module execution worksheet

The feature folder is the human-facing handoff. It contains one stable design,
one feature worksheet, and one or more numbered technical plans. Do not create
a separate free-form task-notes file.

```text
plans/<feature-slug>/
├── design.md
├── worksheet.md
├── 01-<implementation-slice>.md
└── 02-<implementation-slice>.md
```

## Document ownership

| Information | Owner |
|---|---|
| Business and architecture decisions | `<feature-folder>/design.md` |
| Discovery evidence, plan map, dependencies, and feature status | `<feature-folder>/worksheet.md` |
| Technical scope, file ownership, order, commands, and stop conditions | Numbered plan file |
| Current step, next action, blockers, and completed evidence | Local execution worksheet in that numbered plan |
| Plan acceptance outcomes | Acceptance checklist in that numbered plan |
| Command output | Named report file under the feature folder, linked from the plan |
| Cohort order and module status | `plans/README.md` |

Each numbered plan may summarize approved design decisions, but it must link to
`design.md` and `worksheet.md`. Do not silently change a locked decision in a
plan or worksheet.

## Feature folder lifecycle

Create the feature folder and a minimal `worksheet.md` before the first
module-specific source read. It may identify the feature and record live
discovery evidence, but it is not the technical plan. Use the folder through
all phases:

1. `DISCOVERY`: initialize the feature worksheet and record the evidence ledger.
2. `DESIGN`: write `design.md`, obtain written approval, and link its path.
3. `DECOMPOSE`: record numbered plan boundaries and dependencies in the feature
   worksheet.
4. `PLAN`: derive one or more numbered plans from the approved design. Add a
   local execution worksheet and acceptance checklist to each plan.
5. `READY`: mark a plan ready for source edits after design, decomposition, and
   that plan's approval.
6. `EXECUTE`: work one active plan and one active local worksheet step at a time.
7. `VERIFY`: finish a plan and hand the feature folder plus selected plan to
   the independent verifier.
8. `DONE`: use only after the verifier returns `PASS` for that plan.

For a bounded simple module, the approved manifest is the bounded contract.
Create it at `<feature-folder>/module.json` only after the discovery and
design gate. The feature worksheet owns discovery and coordination; the
numbered plan owns the local worksheet, acceptance checkpoint, and reports.

## Feature worksheet template

Put this file at `<feature-folder>/worksheet.md`:

```markdown
# <Feature> worksheet

- State: `DISCOVERY`
- Feature: `<feature-slug>`
- Folder: `plans/<feature-slug>/`
- Design: `TBD during DISCOVERY`
- Active plan: `None`
- Next action: `<one exact read, decision, or planning action>`
- Read boundary: `<files or directories allowed for the active action>`
- Write boundary: `<feature worksheet or design path allowed for the action>`
- Last result: `None`
- Last evidence: `None`
- Blocker: `None`

## Discovery evidence ledger

| Question | Evidence path and symbol/line | Result | Status |
|---|---|---|---|
| Identity and fields | `<path:line>` | `<answer>` | TODO |
| Legacy labels and behavior | `<path:line>` | `<answer>` | TODO |
| Relation or child owner | `<path:line>` | `<none/owner>` | TODO |
| Lookup consumer or dependency | `<path:line>` | `<none/owner>` | TODO |
| Workflow or custom write | `<path:line>` | `<none/action>` | TODO |
| API permission realm and verbs | `<path:line>` | `<answer>` | TODO |
| Route and navigation owner | `<path:line>` | `<answer>` | TODO |
| Seed and reload requirement | `<path:line>` | `<answer>` | TODO |
| Framework or UI gap | `<path:line>` | `<none/gap>` | TODO |

## Plan map

| Plan | Scope | Depends on | Status | Evidence |
|---|---|---|---|---|
| `01-<slice>.md` | `<slice>` | `none` | TODO | — |

## Cross-plan blockers and decisions

- None.
```

## Plan execution worksheet template

Put this section near the top of each numbered plan:

```markdown
## Execution worksheet

- State: `PLAN`
- Module: `<module>`
- Feature folder: `<absolute or repository-relative feature folder>`
- Feature worksheet: `<feature-folder>/worksheet.md`
- Plan: `<feature-folder>/<numbered-plan>.md`
- Design: `<feature-folder>/design.md`
- Planned at: `<short SHA>`
- Active step: `1`
- Next action: `<one exact read, edit, or command>`
- Read boundary: `<files or directories allowed for the active action>`
- Write boundary: `<files allowed for the active action>`
- Last result: `None`
- Last evidence: `None`
- Blocker: `None`

| Step | Status | Action | Read/write boundary | Expected result | Evidence |
|---|---|---|---|---|---|
| 1 | ACTIVE | `<one exact action>` | `<paths>` | `<observable result>` | `<path/result>` |
| 2 | TODO | `<one exact action>` | `<paths>` | `<observable result>` | — |
```

Use `TODO`, `ACTIVE`, `PASS`, `REWORK`, and `BLOCKED` for worksheet step status.
Use `DONE` only for the whole worksheet after verifier `PASS`.

## Update rules

Before an action:

- set exactly one step to `ACTIVE`;
- write one exact `Next action`;
- write the `Read boundary` and `Write boundary`;
- list the expected result and the evidence that will prove it.

After an action:

- record the result and a path, command report, or browser result;
- set the step to `PASS`, `REWORK`, or `BLOCKED`;
- update `Last result` and `Last evidence`;
- activate the next step only after the current step is `PASS`.

Apply these rules:

- During `DISCOVERY`, `DESIGN`, `DECOMPOSE`, and `PLAN`, write only the feature
  worksheet, design, numbered plans, and other explicitly approved planning
  artifacts. Do not edit module source.
- Before design approval, keep `worksheet.md` limited to the discovery
  worksheet, evidence ledger, unresolved questions, and generic placeholders.
  Do not add technical scope, target files, implementation commands, design
  decisions, or done criteria.
- After discovery, write `<feature-folder>/design.md` and stop for written
  approval. A chat proposal is not a design artifact. Only after approval may
  `$improve` derive numbered technical plans.
- Set the feature worksheet to `DECOMPOSE` while recording plan boundaries and
  dependencies. Set a plan's local worksheet to `READY` only after the design,
  decomposition, and that plan are approved. Set it to `EXECUTE` when source
  edits begin.
- Every module-specific file read must answer a named ledger or plan question.
- If a required path is outside the current read boundary, record why before
  reading it. If the reason is not supported by the contract, stop.
- Do not copy source files or long command output into the worksheet. Link the
  exact path or named report instead.
- A new business, API, permission, route, framework, or legacy decision is
  `PLAN CHANGE REQUIRED`; stop and return to the design or planning gate.
- A full-suite command needs an explicit cross-module reason in the worksheet.
- Browser evidence must record the URL, surface, action, temporary data ID, and
  visible result. Local CRUD fixtures remain pre-authorized only within the
  existing browser safety rules.
- A feature has one `design.md` and one feature `worksheet.md`. Each numbered
  plan has one local worksheet. Shared roots use serial writes, and only one
  numbered plan is `EXECUTE` at a time unless the approved decomposition marks
  the plans independent.

The worksheet is a live control record, not a second design document and not a
place to bypass an approval gate.
