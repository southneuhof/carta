# Plan 003: Prevent route import cycles from reaching requests

> Follow the steps in order. Check the result of each command. Update the index
> only after implementation and review. This file is a plan, not a completed fix.
>
> Drift check: `git diff --stat 83c0cf9..HEAD -- packages/sprindle apps/api apps/web/playwright.config.ts`
> Also run `git diff -- apps/api/src/domains.ts` and `git status --short`.
> Compare changes with the facts below. Preserve all work that is not part of this plan.

## Status

- Priority: P1
- Effort: M
- Risk: MED — static local import cycles will become build errors.
- Depends on: none. Plans 001 and 002 are complete.
- Category: bug
- Planned at: `83c0cf9`, 2026-09-10, with local changes present
- Status: DONE
- Confidence: HIGH for the initialization fault; live E2E failure not reproduced.

## Why this matters

The route bundle stores an undefined auth domain in the domain array. A later
request reads its `tables` field and fails. Moving the request or waiting for
startup cannot repair that stored value. Break the application cycle, reject
static local cycles during manifest generation, and use source imports for E2E
so the server and its routes use the same application modules.

This selects the report's build-time rejection option. It does not promise to
support every cyclic ESM graph. It keeps the existing source and bundle modes.

## Claim check and current state

1. `packages/sprindle/src/tooling/manifest.ts:31` defaults to `bundle = true`.
   Lines 36–37 put scope imports before route imports. Line 41 already runs
   esbuild with `write: false` and `metafile: true` for dependency analysis.
   Lines 48–52 publish the runtime file and declarations:

   ```ts
   if (bundle) await build({ /* ... */ bundle: true, packages: 'external', /* ... */ })
   else await writeFile(temporary, source(hash))
   const publishDeclaration = await emitRouteDeclarations(/* ... */)
   await rename(temporary, target)
   await publishDeclaration()
   ```

2. `apps/api/src/domains.ts:1` imports the auth domain from the auth service:

   ```ts
   import { domain as auth } from './routes/auth/auth'
   // Other domain imports follow.
   ```

   `apps/api/src/routes/auth/auth.ts:5` imports `getDb`. The same file declares
   `domain` with the sessions, accounts, and verifications tables.
   `apps/api/src/db.ts:5` imports `domains`. The root `+scope.ts:2` imports `getAuth`.
   The graph is `scope → auth → db → domains → auth`.

3. The local `.sprindle/routes.mjs:476` contains
   `var domains = [domain5, domain, domain2, domain3, domain4]`.
   `domain5` is assigned at line 560. These are observations of a generated
   artifact, not stable source locations. Do not edit that artifact.
   `packages/sprindle/src/model/domain-schema.ts:101` reads `part.tables`.
   That line exposes the fault; it does not cause the invalid array.

4. A read-only, in-memory check used Node ESM modules and the installed esbuild
   with the report's minimal graph. Results:

   | Entry and execution | Result |
   | --- | --- |
   | Native ESM, scope first | `ReferenceError: Cannot access 'authDomain' before initialization` |
   | Native ESM, db first, then scope | `null` |
   | Bundled ESM, scope first | Import succeeds; identity throws the reported `TypeError` |

   Thus the claim that this is an unconditionally valid ESM graph is incorrect.
   The source control in the report first imports `app.ts`; `create-app.ts`
   imports `db.ts` before the dynamic manifest load. That is not the same entry
   order as a scope-first import. The experiment shows why that difference
   matters. It does not test Better Auth or a database reset.
   Esbuild documents its top-level declaration rewrite in its
   [FAQ](https://esbuild.github.io/faq/#top-level-var).

5. `apps/api/scripts/dev.ts` and `scripts/compile-routes.ts` already pass `false`
   to the compiler and use separate development and test outputs.
   `apps/web/playwright.config.ts` starts `src/server.ts` directly without a
   compile step or a manifest override. `apps/api/src/app.ts` therefore selects
   `.sprindle/routes.mjs`, unless an environment override is present.
   `loadRouteManifest` in `packages/sprindle/src/hono/index.ts:48` only imports
   the file; it does not wait for a registry to become ready.

6. `apps/api/scripts/build-production.ts:14` generates source imports, then
   bundles the whole application once. Keep that shared production build.
   A read-only esbuild dependency check from the current root scope found one
   static local cycle: `db.ts → domains.ts → auth.ts → db.ts`.

## Contracts and conventions

- `plans/README.md` records shared application state, separate source manifests
  for development/tests, and plain Node production execution without app source.
- `packages/sprindle/docs/reference.md` separates domain ownership from route
  ownership. Auth domain data can move without a route or schema change.
- Use the `api-conventions` skill for the API changes. Preserve identity and
  access behavior. No change to tables, migrations, credentials, or sessions.
- Use the fixture, cleanup, package symlink, and child-process patterns in
  `packages/sprindle/src/tooling/manifest.spec.ts`. Use Vitest assertions.
- A runtime scope stores identity at `scope.config.identity`, as shown by
  `packages/sprindle/src/routes/define-scope.ts`. Do not call `scope.identity`.

## Scope

Only these source and documentation files may change:

- `packages/sprindle/src/tooling/manifest.ts`
- `packages/sprindle/src/tooling/manifest.spec.ts`
- `packages/sprindle/src/tooling/tooling.spec.ts` — review extension for process timeouts and cleanup
- `packages/sprindle/docs/file-routing-tooling.md`
- `apps/api/src/routes/auth/auth.domain.ts` — new declaration owner
- `apps/api/src/routes/auth/auth.ts`
- `apps/api/src/domains.ts`
- `apps/api/scripts/compile-routes.ts`
- `apps/api/src/__tests__/production-bundle.spec.ts`
- `apps/api/src/__tests__/auth-manifest.spec.ts` — new process-level regression
- `apps/web/playwright.config.ts`
- `.gitignore` — ignore only the new `.sprindle-e2e/` output
- This plan and `plans/README.md` — evidence and status

Out of scope: Loom, route handlers, domain-schema validation, database reset
code, migrations, seed data, retries, readiness delays, dependency upgrades,
new bundlers, a new module compiler, and hand edits to generated files.

## Commands

Run from the repository root. Use installed dependencies. No install is needed.

| Purpose | Command | Expected result |
| --- | --- | --- |
| Focused framework tests | `pnpm --filter @southneuhof/sprindle exec vitest run src/tooling/manifest.spec.ts` | All pass after the fix |
| Framework checks | `pnpm --filter @southneuhof/sprindle type-check` | Exit 0; also refreshes packaged tooling |
| Framework suite | `pnpm --filter @southneuhof/sprindle test:tooling` | All pass |
| Framework lint | `pnpm --filter @southneuhof/sprindle lint` | Exit 0 |
| API build | `pnpm --filter @southneuhof/api build` | Exit 0; produces current production artifacts |
| API regression tests | `pnpm --filter @southneuhof/api test:focused -- src/__tests__/auth-manifest.spec.ts src/__tests__/production-bundle.spec.ts src/routes/auth/auth.routes.spec.ts` | All pass |
| API lint | `pnpm --filter @southneuhof/api lint` | Exit 0 |
| Patch check | `git diff --check` | Exit 0 |

The API test command migrates its configured test database. Before execution,
read `apps/api/scripts/test-target.mjs` and confirm the separate test target.
Do not use the development database. No E2E reset is needed for this plan.
Do not run these mutating commands during planning.

## Steps

### 1. Add a failing framework regression

Extend `manifest.spec.ts` with the five-file graph from the claim check. Include
an actual `routes/health/+server.ts` so the scope belongs to a manifest entry.
Use `defineScope({ identity: () => getAuth() })`, and give all fixture exports
valid types so declaration errors cannot hide the runtime fault.

For both `bundle = true` and `false`, require compilation to reject with a
cycle message that names `auth.ts`, `db.ts`, and `domains.ts` in a closed chain.
The current compiler should fail these assertions because it accepts the graph.
Record the pre-fix runtime result with a fresh child process if needed. Do not
leave a passing test that requires the broken runtime behavior.

**Verify:** Run the focused framework command. Only the new rejection cases
must fail. If the existing fixture cannot compile for another reason, repair
that fixture before continuing.

### 2. Reject static local cycles before publication

Use `analysis.metafile.inputs` from the existing analysis build. Do not add a
parser, filesystem scan, package, or second dependency resolver.

- Traverse non-external `import-statement` edges whose targets are input keys.
  Use those keys for graph identity; use project-relative paths for messages.
- Use a visited set, active path, and depth-first traversal. Sort nodes and
  edges for a stable error. A diamond is not a cycle. A self-import is a cycle.
- Reject the first cycle with a closed path and an instruction to move shared
  declarations into a module that does not import the service.
- Apply the rule to both output modes. Source mode also feeds production
  bundling. Document that all static local cycles are unsupported, including
  cycles that happen to run under a particular entry order.
- Ignore external package edges, erased type imports, and dynamic-import or
  require edges. Do not claim that this detects every runtime dependency fault.
- Run the check before temporary output, declarations, or target publication.
  Keep dependency tracking available for watch recovery, including dependencies
  outside the project directory. Preserve the last good runtime and declaration.

Add tests for the reported cycle, a self-cycle, a shared acyclic dependency,
a type-only cycle, failed-build preservation, and watch recovery after a cycle
is removed. Use bounded waits and always close watchers in `finally`.

**Verify:** Run focused framework tests, framework type-check, tooling tests,
and framework lint. All must pass.

### 3. Remove the application cycle

Move only the `defineDomainPart` import and `domain` declaration from `auth.ts`
to `auth.domain.ts`. The new file imports only the three existing auth tables
and `defineDomainPart`. Change the auth import in `domains.ts` to that file.
Keep the auth service's table imports for its Better Auth adapter. Do not add
a re-export in `auth.ts`; there is no compatibility requirement.

Search all callers before the move:
`rg -n 'auth/auth|auth\.domain|defineDomainPart' apps/api/src apps/api/scripts`.
Update only consumers of the moved domain export. Keep all other domain entries.

Add `auth-manifest.spec.ts`. In fresh child processes, compile the actual API
routes to a unique temporary output under the API project, load each output
mode scope-first, and invoke the root scope identity with a no-cookie request.
It must resolve to `null`. No process may preload `app.ts` or `db.ts` before the
manifest. Use the API's existing tsx executable and test environment. Close
pools and remove only the test's own output in `finally`.

**Verify:** Run API build, then the API regression command. The import-order
case must fail on the old application graph and pass after this move.

### 4. Use a fresh source manifest for E2E

In `scripts/compile-routes.ts`, accept an optional output argument. Keep
`.sprindle-test/routes.mjs` as the default and keep `bundle = false`.
In the Playwright API server command, first run this script with
`.sprindle-e2e/routes.mjs`; start the server only if compilation succeeds.
Set `SPRINDLE_ROUTE_MANIFEST` to `.sprindle-e2e/routes.mjs` in that server's
explicit environment. Keep the current E2E env files and port handling.
Ignore the new output directory. Do not reuse the test or development output.

Extend the process test to invoke this exact compile script and output mode.
Check that the manifest root scope is the same object as the directly imported
root scope in that process. Then create the app and assert that a no-cookie
`/api/auth/get-session` request returns 200 with JSON `null`. Check that output
has static source imports. This verifies fresh generation and shared module
identity without a database reset or a running web browser.

**Verify:** Run the API regression command and API lint. All must pass. Review
the Playwright command against the tested command. If browser E2E is not run,
record that limit; do not report a complete E2E pass.

### 5. Check production and document the limit

Extend `production-bundle.spec.ts` to request `/api/auth/get-session` without a
cookie and assert 200 with JSON `null`. Keep its existing source-free plain
Node process and asset module identity assertions. Do not replace the test with
an import under tsx. Run the build before this test so it cannot use old output.

Update `file-routing-tooling.md` with the static cycle rule, error example,
declaration-module remedy, source-mode module identity, and the dynamic import
limit. Explain that source-mode consumers need the existing TS loader; production
still uses the application's shared ESM build.

**Verify:** Run API build, API regression tests, framework checks and tooling
tests, both lint commands, and `git diff --check`. Record results in this plan.
Review the final diff against the original dirty worktree. Do not commit or push.

## Done criteria

- [x] Both manifest modes reject static local cycles with a stable closed path.
- [x] A failed compile leaves the last good runtime and declaration unchanged.
- [x] Watch mode recovers after the cycle is removed.
- [x] Type-only cycles and acyclic shared dependencies pass.
- [x] Actual auth identity works when either generated manifest is loaded first.
- [x] E2E compiles its own source manifest before startup and selects that file.
- [x] Source manifest and direct source import share the root scope object.
- [x] Source and plain Node production session requests return 200 and `null`.
- [x] All commands above pass, or failures are reported and status stays incomplete.
- [x] Only in-scope implementation changes are added; prior work is preserved.
- [x] Index status and verification evidence are updated after review.

## Implementation verification evidence

- Focused manifest tests: 10 passed.
- Sprindle type-check and both lint checks: exit 0.
- Sprindle tooling suite: 36 passed. One initial 5-second timeout passed alone,
  and the complete suite passed on the next run.
- API build: exit 0.
- API regression tests: 4 passed. The test target guard reported `VALID` for
  the separate test database before migration.
- `git diff --check`: exit 0.
- Browser E2E was not run. The tested compile script and manifest environment
  match the Playwright API server command.
- Review verdict: APPROVE. All implementation files are in scope. Existing

## Stop conditions

Stop and report if a check fails twice after a reasonable fix attempt, a new
static cycle needs changes outside scope, the metafile cannot represent the
required resolved edges, or an existing contract requires support for static
cycles. Do not silently make the rejection rule optional.
Stop if testing needs a reset, production access, or changes to unrelated local
work. A missing test database is a blocked check, not a reason to use development.

## Maintenance and rejected options

Keep cycle checks attached to the shared compiler so CLI, watch, test, and
production preparation cannot omit them. Do not sort generated imports to make
this one graph work. Do not skip undefined domains or add a delay at `getDb()`.
A compiled-module emitter is deferred: native ESM alone does not make the
reported scope-first graph valid, and the current source mode already supplies
shared module identity where the TS runtime is available.

This was a focused plan for manifest generation, auth domain imports, and E2E
startup. Loom, other modules, reset safety, and the full repository were not
audited. No live database, HTTP request, production build, or browser E2E was
run during planning.

## Planning verification evidence

- `pnpm --filter @southneuhof/sprindle exec vitest run src/tooling/manifest.spec.ts`:
  passed, 1 file and 6 tests, about 12 seconds.
- Minimal native ESM and bundled ESM checks: produced the three results in the
  claim table, without source edits or database access.
- Existing root-scope dependency graph: one static local cycle found.
- `git diff --check`: passed before final plan review.
- API build, API tests, lint, type-check, and browser E2E: not run during planning.

## Independent review and second revision

The parent reviewed the implementation against this plan after the user reported
completion. The first review found two gaps: watch mode did not refresh external
dependency watchers after a failed compile, and the auth process test did not
call the generated root identity function. A GPT-5.6 Sol agent with low reasoning
effort corrected both. The parent checked the changed code. All 11 manifest
checks passed in the later parent tooling runs.

Parent verification before the second revision:

- Sprindle type-check: exit 0.
- Sprindle lint and API lint: exit 0.
- API build with the first revision: exit 0.
- Test database guard: VALID for the separate `carta_test` target.
- Standard tooling suite, first run: 33 passed, 4 process-test timeouts.
- Standard tooling suite, second run: 36 passed, 1 timeout in the published
  build test with its default 5-second limit.
- Tooling suite with `--no-file-parallelism`: 36 passed. The installed-package
  check failed because its 1-second language-server response wait expired.
  The earlier build timeout passed in this run. Assertions were not changed.

The user confirmed heavy background work and authorized generous timeouts.
The second Sol revision owns bounded process waits, test timeouts, and child
cleanup in `tooling.spec.ts`, plus process-test budgets in `manifest.spec.ts`.
This supporting test-file scope extension changes no application behavior.
The parent will review the resulting code and evidence before restoring DONE.

The subagent also found a pre-existing declaration-emission limit for direct
`../shared` source imports outside the project. The declaration overlay omits
those external files. This remains outside the auth-cycle fix. The external
watch regression uses a directory symlink to files physically outside the
project, which the existing declaration emitter supports. Browser E2E has not
been run. No database reset was performed during this review.

## Final independent review — 2026-09-10

VERDICT: PASS
SCOPE: Plan 003, including the approved process-timeout and cleanup changes.
REVIEW: Independent parent review of the implementation and both Sol revisions.
DESIGN: This plan, based on commit `83c0cf9`, with the user-approved generous timeouts.

IMPLEMENTATION: The compiler rejects static local cycles before publication.
The watcher refreshes external dependency watches after failure. The auth domain
has a separate declaration owner. E2E uses its own fresh source manifest.
The root identity test calls the generated resolver before other application
imports. The process tests retain their assertions, use generous bounded waits,
and close the owned development and language-server processes in `finally`.

ACCEPTANCE: All done criteria pass. Tests cover both manifest modes, local and
external cycle recovery, unchanged last-good output, type-only cycles, shared
acyclic dependencies, source module identity, auth identity, session HTTP output,
and plain Node production execution without application source.

CHECKS:

- Final `pnpm --filter @southneuhof/sprindle type-check`: exit 0.
- Final standard `pnpm --filter @southneuhof/sprindle test:tooling`: exit 0;
  5 files and 37 tests passed in 7.43 seconds. This run followed the last test
  source edit. No serial-run flag or retry setting was used.
- Final Sprindle lint and `git diff --check`: exit 0.
- Parent API build and API lint: exit 0.
- Parent API focused command selected `auth-manifest.spec.ts`,
  `production-bundle.spec.ts`, and `auth.routes.spec.ts`: all 3 files and 4 tests
  passed. The saved Vitest result at 19:31:51 confirms the completed run after
  its terminal session expired. The separate test target guard was VALID.
- SHA-256 comparisons confirmed no later change to the manifest compiler,
  API process tests, auth service/domain, domain list, compile script,
  Playwright configuration, or lockfile used for the API checks.

The earlier timeout and readiness failures remain recorded above. They are
superseded by the final standard-suite pass, not removed from the record.

UI: No browser interaction changed. Browser E2E was not run; the compile path,
module identity, auth requests, and production behavior were tested directly.
REWORK: None within this plan.
BLOCKERS: None within this plan.

Known limit outside this fix: direct source imports outside the project can
still fail declaration emission. The existing external-watch test uses the
supported symlink layout. No claim is made that this separate limit is fixed.
