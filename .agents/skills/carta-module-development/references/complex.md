# Complex path — relation, workflow, or unclear contract

Use when evidence shows a relation, child, dependent lookup, workflow, custom
write, transaction, custom surface, scoped permission, risky migration, or open
material decision.

## Grouping

Partition multiple modules into feature groups before discovery. Use one group
only when modules share a user workflow or a business or architecture decision.
Otherwise use separate groups. Each group owns `design.md`, `worksheet.md`,
numbered plans, and reports.

## Folder and worksheet

```text
plans/<feature>/
├── design.md
├── worksheet.md
├── 01-<slice>.md
└── 02-<slice>.md
```

Read [module-execution-worksheet.md](module-execution-worksheet.md) before creating a plan. Lifecycle: `DISCOVERY` → `DESIGN` → `DECOMPOSE` → `PLAN` → `READY` → `EXECUTE` → `VERIFY` → `DONE` (only after verifier `PASS`).

Create folder via:

```sh
python3 .agents/skills/carta-module-development/scripts/init_worksheet.py <feature-slug> --modules "mod-a, mod-b" --reason "shared workflow"
```

Before design approval, `worksheet.md` holds only identity, live state, next action, read/write boundaries, ledger, and open questions. Do not add technical scope or commands yet.

## Design then plan

1. Build the applicable field, route, action, permission, seed, and artifact
   evidence matrix in the worksheet.
2. Reuse a usable design. For intent or a draft, run `$brainstorming` only for
   unresolved product and architecture decisions.
3. Write or update `plans/<feature>/design.md` and link it from the worksheet.
   Get written approval for new material decisions. Preserve prior approval for
   unchanged decisions.
4. Record vertical phase boundaries and dependency order in the worksheet. One
   numbered `$improve` plan is one independently acceptable user journey with
   its database, API, web, and focused checks in one execution unit. Start with
   one plan, then split only at a boundary that changes execution or acceptance:
   a second user journey with its own observable result, a dependency that must
   pass before later work starts, an independent owner, a difficult-to-reverse
   migration, a shared framework or authorization change, an external write,
   or another stop condition. Merge proposed plans when either side is only a
   technical layer, setup, seed, navigation, tests, or other work with no
   independently usable result. Before approval, state the observable result
   and acceptance rows for each plan; if two plans have the same result or
   cannot be verified separately, merge them.
5. Put one shared acceptance matrix in `worksheet.md` from [module-acceptance-checklist.md](module-acceptance-checklist.md). Each numbered phase plan links it and names only the rows that phase owns. The plan also carries its execution worksheet, ownership map, commands, hard machine gates, and done criteria.
6. Set the phase plan local worksheet to `READY` only after design, decomposition, and plan approval.

## Execute one phase at a time

Order applicable work inside one vertical phase: database and schema → required
migration and seed verification → authenticated API contract → typed operation
→ resource → routes and navigation → focused tests → required UI evidence.

1. When schema, seed, or permissions change, test them in the plan's isolated
   environment. Run development migration or seed commands only when the plan
   requires development visibility and permits that write. Record the target
   environment. Test database output is not development evidence.
2. Record ownership before edits: backend resource folder and relation owner, frontend resource folder and routes, permission matrix, seed owner and first-load/reload.
3. Add the approved navigation entry in
   `apps/web/src/manifest/navigation.ts`. Verify its route, title, permission,
   group, and visible result in the applicable environment.
4. Invoke `$build-resource-form` for resource forms and `$web-ui-surfaces` for web surfaces. Do not copy their guidance here. Read the nearest approved sibling once per distinct surface pattern and record the routes, intended actions, `Reused/Searched/Gap`, and any framework gap. Reuse that evidence for matching routes. Follow the parent-child detail navigation pattern in [contract-rules.md](contract-rules.md). Use route-based `FormView` for supported standard create/update and child CRUD; a modal needs approved workflow evidence. Check current framework support before keeping custom table, body-slot, or dialog code. Do not edit `packages/is-vue-framework` without approval. Web server reads must use the framework query cache — see [web-query-cache.md](web-query-cache.md).
5. Before UI acceptance, add fast focused route-contract checks for applicable risks: parent child-outlet rendering, generated route names, router injection mocks, stable accessible action names, and write invalidation or reload behavior. These checks find integration faults; they do not replace Playwright evidence.

Use module-scoped checks from the plan: `pnpm --filter @southneuhof/api test:focused -- <spec>`. Keep `--` before spec paths. Run full suite only when focused failure shows cross-module risk.

Treat database, API, and web checks inside a phase as hard machine gates. A
failed gate stops later phase steps, but it does not start a separate verifier.
Rerun a failed check only after an evidence-based source, test, fixture,
environment, or tooling change. After a second failure in the same layer,
classify and fix the owning layer before another run. Do not repeat a passing
check unless later in-scope work makes its evidence stale.

For UI automation, follow [ui-automation.md](ui-automation.md). Use the
guarded E2E preparation and fixed local records defined by the journey. Do not
mutate seeded/reference records or run irreversible actions outside the
approved journey. Confirm the API and web servers are healthy before a
focused run. Submit supported forms and workflows through the visible
authenticated UI; API calls are supporting evidence, not a substitute. Use
current visible DOM nodes after each route or dialog change. If navigation is
still missing after the planned seed or setup and a hard reload, return
`BLOCKED`.

After all owned phase rows and hard gates pass, set the phase plan to `VERIFY`
and run one independent read-only review across its database-to-UI path when
delegation is available. The executor supplies evidence, not a verdict. Only a
review `PASS` marks the phase `DONE` and permits a dependent phase to start.
