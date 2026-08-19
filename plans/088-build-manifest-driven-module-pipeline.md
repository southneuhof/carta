# Plan 088: Build the manifest-driven module pipeline

> **Implementation instructions**: Execute this plan in order. Preserve
> unrelated worktree changes. Use `$skill-creator` for every edit to an
> external skill. If an integration anchor does not match the current source,
> stop and report it instead of guessing.
>
> **Drift check (run first)**: `git diff --stat 4e94c94..HEAD -- package.json AGENTS.md scripts/scaffold-master-data.mjs scripts/scaffold-master-data.test.mjs plans/README.md`. Inspect the two external skills separately before editing and validate them with the skill-creator validator.
>
> The worktree already contains the completed Plan 087 scaffold and focused
> package commands as uncommitted work. Treat those files as the starting
> implementation for this plan. Do not reset or overwrite unrelated changes.

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/087-add-simple-master-data-scaffold.md`
- **Category**: dx
- **Planned at**: commit `4e94c94`, 2026-08-19

## Why this matters

Plans 082 and 083 spent about 96 minutes on two small standard master-data
modules. Plan 087 reduced repeated file creation, but the scaffold still stops
before shared registration, exact route and label metadata, and reliable module
verification. This plan makes the approved module configuration the source for
ordinary generated code and guarded integration, then gives an agent one
targeted verification command instead of several broad commands.

The plan does not change `packages/is-vue-framework`, does not generate domain
fields by default, and does not remove the authenticated browser or verifier
gates. It changes only the app tooling and the instructions that route module
work through that tooling.

## Current state

- `scripts/scaffold-master-data.mjs` validates explicit identity and domain
  fields and creates ordinary API and web source files. It returns only
  `generated` and `manual` paths. Its route shells use one generic title and do
  not generate exact create/edit titles or success messages.
- `scripts/scaffold-master-data.test.mjs` checks output paths and a few source
  strings, but does not compile generated source or exercise shared
  integration.
- `package.json` exposes only `scaffold:master-data`.
- `apps/api/src/routes/index.ts` requires a module import plus entries in
  `domainParts` and `installedRoutes`.
- `apps/api/src/authorization/catalog.ts` stores module and permission
  definitions in one array. The standard master-data shape uses six explicit
  permissions.
- `apps/api/scripts/seed.ts` imports every entity and runs all seed operations
  from one `main` function.
- `apps/web/src/manifest/navigation.ts` and
  `apps/web/src/routes/(authenticated)/master-data/index.route.vue` both repeat
  navigation labels and route names.
- `apps/api/package.json` has `test:focused` and `lint:focused`, while the API
  `test` command also migrates and runs the complete suite. The web focused
  command uses paths relative to `src/`.
- `AGENTS.md` and
  `/Users/gamer/.agents/skills/ads-hk-module-slice/SKILL.md` describe the
  current scaffold but still tell the agent to add every shared integration
  file manually. `/Users/gamer/.agents/skills/verify-ads-hk-module/SKILL.md`
  has no module-verification script contract.

## Design contract

### Manifest input

Keep the existing explicit identity and field contract. Add required explicit
metadata for an eligible flat module:

```json
{
  "kind": "simple-master-data",
  "slug": "permit-danger-source",
  "table": "permit_danger_source",
  "symbol": "PermitDangerSource",
  "title": "Sumber Bahaya",
  "identity": { "key": "id", "type": "text", "primary": true, "generated": "uuid" },
  "fields": [],
  "labels": {
    "listTitle": "Sumber Bahaya",
    "detailTitle": "Detail Sumber Bahaya",
    "createTitle": "Tambah Sumber Bahaya",
    "editTitle": "Perbarui Sumber Bahaya",
    "submitLabel": "Submit",
    "createSuccessMessage": "Berhasil menambahkan data!",
    "updateSuccessMessage": "Berhasil mengubah data!"
  },
  "permissions": {
    "moduleName": "Permit Danger Source",
    "realm": "system",
    "entries": {}
  },
  "navigation": {
    "after": "master-data-number-configs",
    "title": "Sumber Bahaya",
    "icon": "folder",
    "separator": "Work Permit"
  },
  "seed": { "records": [], "updateFields": [] }
}
```

The example uses empty arrays and objects only to show the shape. The
validator must require real values where the module needs them. It must never
invent `name`, `description`, `active`, `code`, audit, relation, or seed
fields. A missing `seed` block means that the module has no generated seed
operation; it must not create a default record.

Permission codes may be derived only from the validated simple-module slug
and the six standard operation names. Permission display names and
descriptions remain explicit manifest values. Route names may be derived from
the flat simple-module convention, but the scaffold must return them and the
verification command must check them.

### Scaffold output

Keep generated source readable. Return sorted absolute arrays named
`generated`, `integration`, and `manual`, plus a `routes`, `permissions`, and
`checks` description in JSON output. `integration` names shared files handled
by the guarded integration command. `manual` contains only files that need a
human or another generator, such as the generated route map.

Generate, when configured:

- the existing API entity, route, route test, schema, resource, resource test,
  and four standard route shells;
- a local web integration test for this module's route names and navigation;
- a colocated seed function for explicit records;
- exact route titles, form submit label, and create/update success messages.

### Guarded integration

Add `scripts/integrate-master-data.mjs` with `--manifest`, `--check`, and
`--apply` modes. It may edit only these standard shared owners:

- `apps/api/src/routes/index.ts`;
- `apps/api/src/authorization/catalog.ts`;
- `apps/api/scripts/seed.ts` when the manifest has a seed block;
- `apps/web/src/manifest/navigation.ts`;
- `apps/web/src/routes/(authenticated)/master-data/index.route.vue`.

The command must verify exact anchors, refuse duplicate entries, refuse a
missing or changed anchor, and print changed absolute paths. `--check` must
make no edits. `--apply` must be idempotent after a successful first apply.
It must not edit `route-map.d.ts` by hand.

### Targeted verification

Add `scripts/verify-module.mjs` and the root command
`pnpm verify:module --manifest /absolute/path/module.json`.

The command must always run static manifest, generated-path, route, permission,
and integration checks. A `--run` mode must run exact focused API and web tests,
focused lint, API type-check, web type-check, and `git diff --check`. A
`--with-seed` option may run the idempotent local seed twice. The command must
report `MODULE PASS` or the exact failed check and must not run the full root
test suite as a module check. It must print the browser URLs and state that
the authenticated browser and `$verify-ads-hk-module` remain required.

## Scope

**In scope**

- `scripts/scaffold-master-data.mjs`
- `scripts/scaffold-master-data.test.mjs`
- `scripts/integrate-master-data.mjs`
- `scripts/integrate-master-data.test.mjs`
- `scripts/verify-module.mjs`
- `scripts/verify-module.test.mjs`
- `package.json`
- `AGENTS.md`
- `/Users/gamer/.agents/skills/ads-hk-module-slice/SKILL.md`
- `/Users/gamer/.agents/skills/verify-ads-hk-module/SKILL.md`
- `plans/README.md`
- this plan file

**Out of scope**

- `packages/is-vue-framework` or any framework package;
- API or web module behavior for Plans 082-086;
- migrations or changes to existing seed data;
- automatic editing of route-map declarations;
- browser automation or a replacement for the authenticated browser gate;
- a generic runtime CRUD engine;
- root repository type-check repair, which remains a separate baseline issue;
- changes to the generic `$improve` skill.

## Implementation steps

### 1. Extend the manifest and scaffold output

Update the existing validator and renderers. Require explicit labels,
permission metadata, and navigation metadata for the simple path. Validate
that all configured field, seed, and permission keys are unique and that seed
records contain the declared identity and writable fields.

Generate exact list/detail/create/edit route metadata, the local web
integration test, and the optional colocated seed function. Preserve the
refusal to overwrite files. Export or add a read-only path resolver so the
verification script can inspect expected files without writing them.

Update the scaffold test to assert:

- no undeclared domain field appears;
- exact labels and success messages appear in route shells;
- route and permission metadata is returned;
- seed output is generated only when configured;
- all returned paths are absolute and sorted;
- existing files are never overwritten.

**Verify**: `node --test scripts/scaffold-master-data.test.mjs` → passed.

### 2. Add guarded shared integration

Implement the standard source-text insertion helpers and the five shared-owner
integrations described above. Keep the command deterministic and fail closed
when an anchor or duplicate is found. Use the current quote and array style of
the shared files. Do not add a dependency or an AST package.

Add a temporary-repository test fixture containing the current owners. Run
scaffold, apply integration, check integration, apply a second time, and
assert that the second apply changes nothing. Add a missing-anchor case that
must fail without editing the fixture.

**Verify**: `node --test scripts/integrate-master-data.test.mjs` → passed.

### 3. Add targeted module verification

Implement the manifest loader, static checks, command plan, child-process
runner, result formatter, and `--json` output. Keep `--check-only` side-effect
free. Use the existing package scripts and their real path contracts.

Add tests that use a temporary repository and a harmless `--check-only` run.
Test that missing generated files, missing permission entries, duplicate
integration entries, and an invalid manifest fail with actionable messages.

**Verify**: `node --test scripts/verify-module.test.mjs` → passed.

### 4. Add root commands and repository instructions

Add these package commands:

```json
"integrate:master-data": "node scripts/integrate-master-data.mjs",
"verify:module": "node scripts/verify-module.mjs"
```

Update `AGENTS.md` with the short rule: eligible simple modules must use the
explicit manifest, scaffold, guarded integration, and module verification
commands. State that full browser and verifier gates remain mandatory and
that domain fields and labels must not be guessed.

### 5. Update external skills through `$skill-creator`

Use the skill-creator instructions to update both external skills. Keep
`ads-hk-module-slice` as the workflow owner. Its simple path must include the
exact command order, `--check` before `--apply`, `verify:module --run`, the
optional seed mode, the simple-module group rule, and the unchanged browser
and verifier gates.

Update `verify-ads-hk-module` to read the module verification result, rerun the
required checks when needed, and treat a missing module result as `BLOCKED`.
Do not move business parity or browser acceptance into the scripts.

Run the skill validator for both modified skill folders. Do not modify the
generic `$improve` skill.

### 6. Verify the complete change and close the plan

Run:

1. `node --test scripts/scaffold-master-data.test.mjs`
2. `node --test scripts/integrate-master-data.test.mjs`
3. `node --test scripts/verify-module.test.mjs`
4. `pnpm --filter @southneuhof/api type-check`
5. `pnpm --filter @southneuhof/framework-web type-check`
6. the skill-creator validator for both external skills;
7. `git diff --check`;
8. `pnpm type-check` and record the existing unrelated SDK `TS1323` baseline
   failure if it remains.

Review the full diff against this plan. Confirm that no framework package,
application module, migration, existing seed row, or route-map file changed.
Update this plan and `plans/README.md` with the result, then mark Plan 088
`DONE` only if the plan checks pass and the known baseline result is recorded.

## Done criteria

- [x] The simple-module manifest requires explicit labels, permissions,
      navigation, and fields; it creates no default domain fields.
- [x] Scaffold output includes generated, integration, manual, route,
      permission, and check metadata with absolute paths where paths apply.
- [x] Scaffold route shells contain exact create/edit titles, submit label, and
      success messages from the manifest.
- [x] Optional seed output is generated only from explicit seed records.
- [x] Guarded integration supports check/apply, refuses drift and duplicates,
      and is idempotent after apply.
- [x] `verify:module --check-only` is side-effect free and `--run` uses exact
      focused commands without the full root suite.
- [x] Scaffold, integration, and verification tests pass.
- [x] API and web package type-checks pass.
- [x] Both external skills pass the skill-creator validator after their edits.
- [x] `git diff --check` passes.
- [x] The root type-check result is recorded, including any pre-existing
      unrelated failure.
- [x] No framework or application module source changed outside the tooling
      scope.

## Execution result

- `node --test scripts/scaffold-master-data.test.mjs scripts/integrate-master-data.test.mjs scripts/verify-module.test.mjs`: 11 tests passed.
- `pnpm --filter @southneuhof/api type-check`: passed.
- `pnpm --filter @southneuhof/framework-web type-check`: passed.
- The actual repository owner files passed an integration `--check` dry run. It reported four pending owner files and wrote nothing.
- The direct Skill Creator validator could not import PyYAML in this environment. The documented standard-library shim produced `Skill is valid!` for both edited skills.
- `git diff --check`: passed.
- `pnpm type-check`: failed only in the known unrelated `@southneuhof/sdk` baseline. The error is `TS1323` at `apps/api/src/routes/quality-inspection/quality-inspection.routes.spec.ts:29` and `:30` for dynamic imports. The API and web package checks passed.
- This plan changes tooling and instructions only. No framework package, application module, migration, existing seed row, or route-map declaration was changed by this plan. No new user-flow browser check is required for this tooling-only plan.

## STOP conditions

- The current shared-file anchors differ from the inspected source.
- The manifest needs a relation, lookup, workflow, custom API operation, or
  nested route that the simple path cannot represent.
- A requested legacy label or permission value is missing from the manifest.
- Safe integration would require an AST dependency or broad source rewrite.
- A script would overwrite an existing file or seed row.
- The skill-creator validator fails after one focused correction.
- A package type-check fails because of a new error in this plan's files.
- A framework package or user-facing module needs to change.

## Maintenance notes

The manifest is the input contract, not a source of business defaults. Extend
field types, seed behavior, or route shapes only with explicit validation and
tests. Keep the simple path limited to flat standard CRUD. Nested scoped
resources remain on the normal path until the separate framework identity plan
is approved and implemented.
