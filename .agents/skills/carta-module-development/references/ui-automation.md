# Playwright UI automation

Use this reference for application UI evidence in a module plan. Keep the
module acceptance matrix and the selected plan as the contract.

## Journey contract

- One module journey uses one Playwright `test()` with named `test.step`
  sections.
- A bounded module uses the shared standard CRUD journey. A complex module
  uses one explicit workflow journey.
- Only a new or changed module needs a journey. Do not add whole-repository
  coverage for unchanged modules.
- Each journey records the route, surface, action, fixed seeded or test record,
  visible result, command, result, and current implementation state.
- A required child row has its own step that opens the parent-owned child route
  and verifies the child surface. A parent list step does not cover it.

## Debug and acceptance modes

Use the guarded E2E target in both modes. Use `apps/api/.env.e2e`; do not use
the development or Vitest database and do not write to the development bucket.

- **Debug:** run the guarded reset, migrations, minimal seed, storage clear,
  authentication, and service start once. Run the exact Playwright spec
  repeatedly against that prepared target. Debug runs cannot produce
  acceptance evidence.
- **Acceptance:** after the last in-scope change, run the approved package
  command from a clean guarded preparation. Only this fresh run can produce
  copied evidence and `PASS`.

Keep one preparation process active at a time. Before a rerun, confirm the
prior preparation and test process ended. Use an exact spec path or an exact
test match; a broad module substring is not a focused command.

The journey must use the visible authenticated application UI for create,
update, workflow, upload, export, and delete actions. API calls can support
diagnosis, but they do not replace UI evidence. Reload after each required
write and check the expected visible state.

## Focused commands and reports

Run one module at a time with the package command:

```sh
pnpm --filter @southneuhof/framework-web test:e2e -- <exact-module-spec-or-match>
```

The focused command must preserve Playwright's non-zero failure result. The
configured working report files are:

- `apps/web/playwright-report/results.json`
- `apps/web/playwright-report/index.html`

These working paths are overwritten by a later Playwright run. Immediately
after each focused pass, copy its JSON report and HTML report directory under:

```text
plans/<feature>/reports/<plan-slug>-playwright.json
plans/<feature>/reports/<plan-slug>-playwright-html/
```

Record both copied paths in the selected numbered plan. A combined cohort run
can check execution time, but its report is not focused module evidence and
must not replace either copied report.

On failure, Playwright writes the screenshot and trace under
`apps/web/test-results/<test-result>/`. Record and inspect those artifacts and
the current DOM before a selector change. Rerun only after an evidence-based
application, test, fixture, environment, or tooling change. After a second
failure in the same layer, classify and fix that owner before another run.
Screenshots and traces are required for failure diagnosis, not for a passing
journey.

Beside the copied report links in the selected numbered plan, record the exact
focused command, current Git SHA, and `git status --short` output limited to the
plan's in-scope implementation and E2E-test paths. The report is fresh only
when that focused run occurred after the last change to any recorded in-scope
path. A later in-scope change makes it stale; rerun the focused command and
replace only that plan's copied report and metadata.

## UI gate

Playwright is the only UI acceptance evidence. Preserve each failure result
and its artifacts. Extend the focused journey when a custom or visual surface
is not covered. A fresh passing report covers the UI gate
when it maps every required UI route or action row to a named step. Database,
seed, type, lint, and diff rows use command or plan evidence instead.
