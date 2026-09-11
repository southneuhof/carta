# Module execution worksheet

The feature folder contains `design.md`, numbered plans, `worksheet.md` and
`reports/`. The design owns behavior and approval; plans own technical decisions;
the worksheet owns status and evidence links; reports own observed results.
Acceptance IDs join these artifacts. Keep rule definitions in the design.

## Coverage and ownership

Use the [template](../assets/worksheet-template.md), or initialize it:

```sh
python3 .agents/skills/carta-module-development/scripts/init_worksheet.py <feature>
```

Copy design inventory obligation IDs and acceptance links into Coverage. Compare
against the design, not only the worksheet. Every in-scope branch, invariant and
required sequence needs a row. Every acceptance case has one primary plan, listed under `- Acceptance:` in that
plan using exact IDs; extra
integration cases can belong to later plans. List dependencies by plan ID.

Before assignment, list each acceptance ID once in Required evidence with its
comma-separated required surfaces (`API`, `UNIT`, `BROWSER`, `VISUAL`). Select
them with the [verification strategy](verification-strategy.md#select-proof-by-behavior-and-impact).
The reviewer checks this selection against all expected outcomes in the design.

Each Acceptance row names one surface, test case as `file::exact test title`
(or a named visual check), implementation owner and evidence. Repeat an acceptance
ID for separate tests or surfaces; keep all its rows in the same primary plan.
The acceptance ID, surface and test case together identify a unique evidence row.
Plan cycles must cover each row's test case, and each cycle must have matching
evidence rows for its acceptance IDs. Use `PENDING` until evidence exists.
Report links are paths relative to the feature folder. Use one report per evidence
cell; the report can link multiple runs. `Red` links observed failure or a report
explaining existing coverage/visual applicability under verification strategy.
`Green` links recorder JSON for executable checks and a review report for visual
evidence. The checker rejects failed, non-command or changed-during-run command
reports. Run the recorder freshness check too; structural status is not freshness. `Review` links the orchestrator verdict.

Run the structural check before assignment and after handoff:

```sh
python3 .agents/skills/carta-module-development/scripts/check_worksheet.py plans/<feature>
```

The checker requires the current inventory/table format. For an older approved
layout, map its IDs into the current tables without changing rules or approval.
It checks coverage, required surfaces, ownership, cycle/test mapping, file links
and state consistency. It cannot prove
inventory completeness, assertion quality, report truth or input freshness; the
reviewer checks those against design, source and recorded command results.
When resuming an older worksheet, select required surfaces from the design before
mapping existing reports. Existing API passes cannot determine the UI obligations.

## Browser journey mapping

Copy design journey IDs into `Journey / Test case`; each maps to a distinct
browser evidence case with the same acceptance links. Keep both journey tables
empty only when the design explains why no changed UI workflow needs proof.
On resume, derive missing journeys from approved behavior; preserve approval.

Record the preserved Playwright JSON path under `- Browser report:`. Run:

```sh
python3 .agents/skills/carta-module-development/scripts/check_worksheet.py plans/<feature> --browser-report plans/<feature>/reports/<run>/results.json
```

The check matches files/titles and passing attempts for all selected journeys.
`DONE` runs this check using the worksheet report path. It cannot judge assertions,
report provenance or freshness; review those with the evidence recorder.

## State and gates

Feature: `INTAKE` → `DESIGN` → `PLAN` → `READY` → `EXECUTE` → `VERIFY` → `DONE`.
`READY` is the plan readiness gate. `BLOCKED` names the affected stage and missing
prerequisite. Resume from valid artifacts; keep independent work moving.

Plan: `TODO`, `IN_PROGRESS`, `IMPLEMENTED`, `VERIFIED`, `BLOCKED`, `SUPERSEDED`.
`IMPLEMENTED` requires completed work and checks. The executor stops at this state.
The orchestrator reviews every plan before assigning the next. `VERIFIED` requires
all owned acceptance rows passed with evidence and the scoped review report.
A blocked plan does not prevent a reviewed, independent plan from proceeding.

Acceptance: `PENDING`, `PASS`, `FAIL`, `BLOCKED`. Explicit exclusions belong to
approved design scope, not a checkbox that waives an obligation. The executor
records evidence; the orchestrator records acceptance and state. Direct execution
labels reviews as self-review and uses identical criteria.

`DONE` requires all selected plans verified, every required acceptance row passed
with current evidence, and final review of cross-plan effects and complete journeys.
Record its report in `Latest review`. A scoped plan pass cannot complete the feature.

## Handoff and resume

Update at plan/cycle review gates, changed decisions and material failures, not
every command. Record required/passed/failed/blocked IDs, evidence paths and the
next action. At a before-implementation gate, name reviewer, acceptance IDs, red
report and verdict. The executor waits for that verdict before implementing.

A reviewer receives the approved revision, plan, coverage and acceptance rows,
relevant diff including dirty/new files, evidence and write boundaries. Reuse
current evidence. Changed rules or relevant inputs reopen affected rows and plans;
compare dependencies before invalidating unrelated work. Preserve superseded
reports and failed runs. Missing history stays unverified rather than reconstructed.
