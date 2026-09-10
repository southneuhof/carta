# Verification strategy

Use this reference while planning proof obligations, collecting evidence and
reviewing a Carta module. Carta supplies Vitest, Playwright, lint and type-check
infrastructure. Package scripts/configuration own exact commands and selectors;
those tools are framework defaults, not product choices.

## Select proof by behavior and impact

For each acceptance outcome, name a plausible fault, then choose the smallest
check that detects it. Reuse one check across outcomes it proves. Test names
state behavior; file count and coverage percentage are not completion criteria.

| Risk | Useful proof |
|---|---|
| Input conversion or domain validation | Accepted and rejected values at the owning schema or API boundary; verify the stored value when persistence can change it. |
| Relationship | Valid selection persists; a wrong-parent or inaccessible reference is rejected. Check edit hydration and parent-change clearing through the form when changed. |
| Access | Direct authenticated requests with and without the required permission or record access; rejected writes leave state unchanged. |
| Workflow | Legal and illegal transitions, stored effects, and rollback of coupled writes. Test races or retries when their outcome is part of the contract. |
| UI integration | A focused browser journey through the changed interaction, with visible feedback and a persisted result after reload. |
| Cache or consumer | A successful mutation updates the affected list, detail or summary without a manual browser reload. |
| Migration | Inspect SQL and test the relevant old-to-new data shape on an isolated target. |

Use API integration tests with the real application and test database for
access, query scope, constraints and transactions. Use unit tests for domain
logic with meaningful inputs and outputs. Use browser tests for interaction
and integration; keep exhaustive permission and state combinations at the API.
A layout or copy-only change can use visual inspection and existing checks.
An explicit acceptance requirement still needs its stated evidence.

Select proof for every expected outcome within an acceptance case. One case can
require both API and browser evidence. Put the required surfaces in the worksheet
before implementation; add separate evidence rows where needed. A UI interaction
requires browser evidence even when the same case also specifies stored effects.
Use visual evidence for display/layout outcomes and source review for framework
composition. Reuse a check only for outcomes its actual assertions establish.

For visible actions, prove that the permitted user can find and complete the
action, see updated data and available actions before reload, and retain the
result after reload. For filters, change the visible control and check the
matching records. For file or relation inputs, use the actual control and verify
the saved value and display. Page-render checks establish presence only.

## Tests that earn their cost

- Assert public outcomes and persisted effects. A status code alone cannot
  prove that a write succeeded or that a denied write changed nothing.
- Create the few records that distinguish correct behavior from the fault:
  another parent for scope, a tie for sorting, a conflicting state for a
  transition. Give fixtures unique identities and clean up only owned rows.
- Separate independent rules so one failure does not hide the others. Keep
  one sequential test when the sequence itself is the behavior under test.
- Use installed test helpers and inferred types. Mock an external boundary
  when needed; keep authorization, persistence and transaction behavior real
  when those are the claim. Test-specific wrappers must remove real repeated
  setup or express a domain action.
- For a regression, show that the assertion fails on the prior behavior when
  practical. Otherwise explain which wrong outcome it detects. A test that
  still passes with the changed behavior removed needs stronger assertions.

Skip tests that only copy field arrays, labels, renderer names, route literals,
export names or source text. Check important configuration through its effect:
a hidden action, a selected value, a navigable route or rejected access.
Keep type tests at a changed type contract and framework tests at the framework
owner. Ordinary modules need neither repeated framework CRUD matrices nor
snapshots of component internals. Existing weak tests are not templates.

## Commands and environment

Resolve package scripts, filters, config and test patterns from this checkout.
Confirm that focused selectors select the intended tests; zero tests, skipped
requirements and generated scaffold smoke tests do not establish acceptance.
The root `test` command does not run the separate application Playwright suite.
Loom's browser tests and application E2E are different surfaces. Respect serial
API specifications sharing a database and serialize memory-heavy type checks.

Before DB-backed checks, use the guarded test command and explicit isolated
configuration. The API test preflight requires `.env.test`, a declared test
purpose/name and a target distinct from development. For browser tests, use the
existing guarded E2E setup described in [ui-automation.md](ui-automation.md).
A declared target identifies permitted disposable data; it is not permission
to mutate production or arbitrary remote systems.

Dependencies, browser binaries, ports and fixtures are operational prerequisites.
Prepare ordinary local prerequisites within task authority. If they cannot be
established safely, report the exact blocked checks rather than offering a new
test framework or claiming the runtime result from static checks.

## TDD and review timing

The planner selects public test boundaries, concrete fixtures and expected values
from the approved design. The executor writes executable Vitest or Playwright
tests, one cycle at a time. Acceptance YAML is a specification, not a test run.
A cycle is test → observed red → implementation → green → affected regression checks.

Red must detect the missing behavior: an expected assertion failure or a missing
planned interface/control. Environment, import mistakes, invalid fixtures, zero
selected tests and skipped cases are not behavior evidence. Inspect all planned
assertions after the interface exists. An immediate pass requires checking whether
behavior already exists or assertions are weak; preserve valid code and record
existing coverage instead of manufacturing failure. For already implemented work,
record missing historical red evidence and perform acceptance review; do not claim
TDD retroactively. A copy/layout-only change can use stated visual evidence.

Require orchestrator review of executable assertions and red output before
implementation when failure has one of these consequences:

| Consequence | Qualifying effect |
|---|---|
| Unauthorized access/action | Expose scoped data or allow an unauthorized mutation. |
| Financial error | Change a charge, payment, balance or committed cost incorrectly. |
| Data/history loss | Remove records or required evidence, including through migration. |
| Irreversible external effect | Submit, publish or issue an external instruction. |
| Invalid final decision | Approve or close work without required conditions. |
| Broken coupled effects | Lose a reservation, duplicate an effect, or partially commit an invariant. |
| User-designated consequence | The user identifies the affected rule as serious. |

Record timing, affected acceptance IDs and the concrete consequence in each plan
cycle. Complexity or a money field alone does not qualify. Other cycles receive
review after the plan. Timing changes review, not correctness or coverage.

For every review, inspect changed tests as well as code. Setup repairs preserve
assertions; proposed assertion changes return to the orchestrator. Changes to
business expectations require design authority. A before-implementation test pass
records reviewer, case IDs and red report; it does not pass module acceptance.

## Tight loop

Run focused checks after a meaningful changed boundary. On failure inspect the
output and classify the cause: source, test expectation, fixture, environment,
tooling, pre-existing failure, or an unresolved requirement. Make an evidence-led
correction inside scope, then rerun the affected checks. Preserve failures in
the record; a later pass supersedes rather than erases them.

Reuse passing evidence when it covers the obligation and its relevant inputs
and environment are still valid. A new reviewer is not a reason to rerun it.
A change to a dependency, fixture, schema, config, contract or test can make it
stale even when the module file is unchanged. Include those inputs. A live
external dependency or contaminated shared environment may need fresh checking
without a source change; fingerprints alone cannot establish runtime isolation.

## Evidence interface

Each result records exact command/argument vector and working directory,
selected cases, environment identity (no credentials), source and approved design
revision, relevant input content fingerprints, result/exit code and artifact
paths. Include untracked files, deletions and changed dependency inputs. Git SHA
and changed filenames alone cannot distinguish two edits to the same file.
Keep final reports out of the tracked source input set to avoid self-invalidating
results. Include the design, but not worksheet status churn, as a contract input.

Use `node scripts/module-evidence.mjs --help` for snapshots, command recording
and freshness checks. The recorder executes a command once, preserves stdout and
stderr, and marks results invalid when relevant inputs change during the run.
The input list is a declared scope, not an automatic dependency analysis. Include
applicable owners, tests, configuration, lockfile and affected shared dependencies.
An empty input set is invalid. Reports are evidence, not proof that their selected
scope was sufficient.

The bounded static checker reports `scope: static`, `runtime: NOT_RUN` and
`acceptance: NOT_REVIEWED`. Its runtime mode covers its listed commands, not
Playwright or semantic acceptance. Use `--reports` for a durable summary and
command logs; its helper snapshot must be supplemented with contract/dependency
inputs when they are not in the generated-module set.

## Verdicts

`PASS` for an acceptance review means all required behavior is implemented and
proved with current sufficient evidence. `REWORK` means a wrong/incomplete result
fixable inside scope. `BLOCKED` means a missing decision, environment, authority
or inaccessible evidence prevents a sound verdict. Record the exact affected
acceptance IDs. Static pass, runtime pass and module acceptance are distinct.
