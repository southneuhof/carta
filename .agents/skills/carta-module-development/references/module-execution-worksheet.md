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

Each Acceptance row names a surface (`API`, `UNIT`, `BROWSER`, `VISUAL`), test case
as `file::exact test title` (or a named visual check), implementation owner and
evidence. Plan cycle Test case values must match these rows. Split acceptance cases when they
need independently reviewed outcomes. Use `PENDING` until evidence exists.
Report links are paths relative to the feature folder. Use one report per evidence
cell; the report can link multiple runs. `Red` links observed failure or a report
explaining existing coverage/visual applicability under verification strategy.
`Green` links successful checks. `Review` links the orchestrator verdict.

Run the structural check before assignment and after handoff:

```sh
python3 .agents/skills/carta-module-development/scripts/check_worksheet.py plans/<feature>
```

The checker requires the current inventory/table format. For an older approved
layout, map its IDs into the current tables without changing rules or approval.
It checks coverage, ownership, cycle/test mapping, file links and state consistency. It cannot prove
inventory completeness, assertion quality, report truth or input freshness; the
reviewer checks those against design, source and recorded command results.

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
