# Plan 087: Add the simple master-data scaffold and fast verification workflow

Status: DONE

Priority: P1

Effort: M

Risk: MED

Depends on: Plans 082 and 083

Category: Developer experience and workflow

Planned at commit: `4e94c94`

## Instructions

Execute this plan in the repository root:

`/Users/gamer/Documents/projects/ads-hk`

Use the existing ADS-HK module workflow. This plan changes developer tooling,
repository instructions, and the module skill. It does not implement a new
business module.

Before changing either external skill tree, invoke and follow
`$skill-creator` for:

`/Users/gamer/.agents/skills/ads-hk-module-slice/SKILL.md`

`/Users/gamer/.agents/skills/verify-ads-hk-module/SKILL.md`

Do not edit either skill directly without using `$skill-creator`. Validate both
skills with the skill-creator validator before completion.

## Drift check

Before editing, confirm that these facts still hold:

- Plan 082 and Plan 083 are complete and use the same standard master-data
  route/resource shape.
- Plans 084, 085, and 086 are still TODO and have not received source edits.
- The repository still uses pnpm and Node ESM scripts.
- The API and web package `test` and `lint` commands still run broad checks
  instead of accepting a reliable focused path.
- No unrelated worktree changes are overwritten.

If any fact has changed in a way that affects this plan, stop and report the
change before editing.

## Why

Plans 082 and 083 added two small master-data modules, but the work window
lasted about 96 minutes. The audit found repeated route, entity, route-test,
resource, route-shell, registration, and verification work. It also found
that the package test commands do not provide a reliable focused path.

Plans 084-086 will repeat this cost unless the initial file creation and the
first feedback loop become faster. The solution is a small, explicit scaffold
that creates ordinary source files, returns their absolute paths, and leaves
domain decisions to the agent. Add a bounded fast path for simple master data,
but retain the full acceptance checklist, authenticated Codex browser check,
and independent verifier gate.

## Current state

Evidence at the planning baseline:

- `scripts/instantiate-carta-app.mjs` already provides the repository style for
  a Node ESM filesystem script: `node:fs`, `node:path`, explicit writes, and
  refusal to overwrite existing output.
- `apps/api/package.json` has broad `test` and `lint` scripts. Its test script
  also runs database migrations before the complete Vitest suite.
- `apps/web/package.json` has broad Vitest and ESLint scripts, but no focused
  script with an explicit path contract.
- The API route and route-test shapes are repeated in:
  - `apps/api/src/routes/permit-work-types/permit-work-types.ts`
  - `apps/api/src/routes/permit-work-types/permit-work-types.routes.spec.ts`
  - `apps/api/src/routes/permit-danger-source/permit-danger-source.ts`
  - `apps/api/src/routes/permit-danger-source/permit-danger-source.routes.spec.ts`
- The web resource shape is repeated in:
  - `apps/web/src/routes/(authenticated)/master-data/permit-work-types/permit-work-types.resource.ts`
  - `apps/web/src/routes/(authenticated)/master-data/permit-danger-source/permit-danger-source.resource.ts`
- `plans/README.md` lists Plans 084-086 as the next module work.
- The current module skill requires discovery, approved design, an Improve
  plan, implementation, the complete acceptance matrix, browser verification,
  and an independent verifier. These gates remain required.

## Commands and toolkit

Use the following existing tools and commands:

- `apply_patch` for repository edits.
- `$ads-hk-module-slice` for the module workflow and acceptance contract.
- `$improve` for this plan and later plan execution.
- `$skill-creator` for the external skill edit.
- `node:test` for the scaffold script test. Do not add a test dependency.
- `/Users/gamer/.codex/skills/.system/skill-creator/scripts/quick_validate.py`
  for skill validation.
- `pnpm --filter @southneuhof/api ...` and
  `pnpm --filter @southneuhof/framework-web ...` for focused checks.

Do not add a package or modify framework code.

## Scope

### In scope

1. Add `scripts/scaffold-master-data.mjs`.
2. Add a small Node test for the scaffold script, such as
   `scripts/scaffold-master-data.test.mjs`.
3. Add a root package command for the scaffold.
4. Add focused API test and lint commands without changing the existing broad
   commands.
5. Add focused web test and lint commands without changing the existing broad
   commands.
6. Add the bounded simple-master-data fast path to the repository `AGENTS.md`.
7. Update `/Users/gamer/.agents/skills/ads-hk-module-slice/SKILL.md` through
   `$skill-creator`.
8. Update `/Users/gamer/.agents/skills/verify-ads-hk-module/SKILL.md` and
   `/Users/gamer/.agents/skills/ads-hk-module-slice/references/module-acceptance-checklist.md`
   through `$skill-creator`, removing stale preview-tool wording without
   weakening the browser gate.
9. Update `plans/README.md` with Plan 087 and its dependency position before
   Plans 084-086.

### Out of scope

- Implementing or changing the source of Plans 082-086.
- Generating migrations, snapshots, seeds, route registries, navigation, or
  shared catalog edits automatically.
- Generating relations, child records, lookup behavior, custom workflows, or
  custom API operations.
- Changes to `packages/is-vue-framework`, Sprindle, or another framework
  package.
- Changes to legacy designs or user-facing labels.
- Changes to the `$improve` skill.
- Installing dependencies.
- Commits, pushes, or external actions.

The module skill file is an intentional external exception to the repository
scope. No other external file may change.

## Git workflow

Preserve all pre-existing worktree changes. Do not reset, checkout, or delete
unrelated files. Do not commit or push unless the user asks in a later turn.

## Implementation steps

### 1. Add the explicit scaffold script

Create `scripts/scaffold-master-data.mjs` with only standard Node APIs and the
smallest template set that matches Plans 082 and 083.

The command must require an explicit JSON configuration path, for example:

`pnpm scaffold:master-data --config /tmp/permit-danger-source.scaffold.json --json`

The configuration must require the module identity and field declarations. A
minimal shape is:

```json
{
  "slug": "permit-danger-source",
  "table": "permit_danger_source",
  "symbol": "PermitDangerSource",
  "title": "Sumber Bahaya",
  "identity": {
    "key": "id",
    "type": "text",
    "primary": true,
    "generated": "uuid"
  },
  "fields": [
    {
      "key": "label",
      "type": "text",
      "label": "Label",
      "required": true,
      "renderer": "text"
    },
    {
      "key": "enabled",
      "type": "boolean",
      "label": "Enabled",
      "default": true,
      "renderer": "radio",
      "options": [
        { "id": true, "name": "Active" },
        { "id": false, "name": "Inactive" }
      ]
    }
  ],
  "serverFields": [],
  "auditFields": []
}
```

The exact property names may follow the existing source conventions, but the
contract must have these properties:

- `slug`, `table`, `symbol`, `title`, `identity`, and a non-empty `fields`
  array are required.
- Every domain field must be listed explicitly. There are no implicit
  `name`, `description`, `active`, `code`, audit, or other default fields.
- `serverFields` and `auditFields`, if supported, are optional explicit arrays;
  the generator must treat an omitted array as empty, not as a default schema.
- The v1 generator may support only the field types needed by the existing
  simple modules, such as `text` and `boolean`. It must reject unsupported
  types instead of guessing a template.
- Duplicate keys, invalid identifiers, invalid route slugs, and missing
  required metadata must fail with a clear error and a non-zero exit code.

Generate ordinary, editable source files for the API entity, API route, API
route test, web schema, web resource, standard list/detail/create/edit route
shells, and the resource test. Use the existing module files as templates.
Keep generated code readable and local. Do not create a runtime generic CRUD
engine.

The script must:

- Resolve and print absolute paths.
- Refuse to overwrite any existing generated file.
- Write only module-owned files under the expected API and web module paths.
- Print the files that need manual integration, including API route/catalog/
  seed paths and web navigation/route-map paths. Do not edit those shared
  files automatically.
- Return stable output in both human-readable and `--json` modes. JSON must
  contain at least:

  ```json
  {
    "generated": ["/absolute/path/to/file"],
    "manual": ["/absolute/path/to/integration-file"]
  }
  ```

  Keep the arrays sorted and use absolute paths so the next agent can locate
  the files in the same turn.

Do not add fields or infer business behavior to make the templates complete.
The implementing agent must adjust the generated files against the approved
design and legacy reference.

### 2. Test the scaffold behavior

Add `scripts/scaffold-master-data.test.mjs` using `node:test` and a temporary
directory outside the repository.

Cover only the contract that can regress:

- A small explicit configuration creates the expected source-file set and
  returns absolute `generated` and `manual` paths.
- JSON mode is valid JSON and contains those path arrays.
- The generated output does not add an undeclared `name`, `description`, or
  `active` field.
- Existing output is never overwritten.
- Missing required metadata, duplicate field keys, and an unsupported field
  type fail.

Avoid large snapshots of generated source. Assert file existence, paths, and a
few contract markers only.

### 3. Add focused package commands

Keep the existing full commands unchanged. Add the narrowest commands that
pass through user-supplied paths.

For `apps/api/package.json`, add commands equivalent to:

```json
"test:focused": "node --env-file-if-exists=.env --env-file-if-exists=.env.test ./node_modules/vitest/vitest.mjs run",
"lint:focused": "eslint"
```

The expected use is:

`pnpm --filter @southneuhof/api test:focused -- src/routes/permit-danger-source/permit-danger-source.routes.spec.ts`

`pnpm --filter @southneuhof/api lint:focused -- src/routes/permit-danger-source/permit-danger-source.ts src/routes/permit-danger-source/permit-danger-source.entity.ts src/routes/permit-danger-source/permit-danger-source.routes.spec.ts`

For `apps/web/package.json`, add commands equivalent to the current web test
environment and lint configuration, but without a fixed file list:

```json
"test:focused": "vitest run --environment jsdom --root src/",
"lint:focused": "eslint --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --ignore-path ../../.gitignore"
```

Document that web test paths are relative to the configured `src/` root while
web lint paths use repository package paths. Verify both commands narrow to a
single existing Plan 082 or 083 file/directory. Do not claim a focused command
is focused if the underlying tool still runs the full suite.

### 4. Update the repository workflow rules

Update `AGENTS.md` with a short exception to the default full module flow.
The simple-master-data fast path is allowed only when all conditions hold:

- discovery, legacy review, brainstorming, and the approved design are done;
- there are no unresolved business, API, permission, route/action, or
  framework decisions;
- the module has standard CRUD only, with no child relation, lookup consumer,
  workflow transition, custom API operation, or framework change;
- the scaffold receives an explicit field configuration.

State that the agent must inspect and adjust every generated file against the
design, use the returned absolute paths, and add manual integration files
itself. State that the full acceptance checklist, authenticated Codex browser
check, and `$verify-ads-hk-module` PASS remain mandatory.

While touching the repository instructions, remove obsolete browser-gate
wording from the affected text. Use authenticated Codex browser terminology
only.

For model delegation, state that simple master-data work uses High or Extra
High reasoning only (`high` or `xhigh` in the model control). Never use Low or
Medium for this work. A Max-level effort remains optional for complex modules.
When several simple modules follow the same approved pattern, reuse the same
worker, session, and browser context where safe instead of paying the full
bootstrap cost again.

Do not weaken the legacy label rule or any permission, database, API, browser,
or verifier requirement.

### 5. Update the module and verifier skills through `$skill-creator`

Before this step, read the complete current
`/Users/gamer/.agents/skills/ads-hk-module-slice/SKILL.md` and invoke
`$skill-creator` for the modification.

Add a concise `simple-master-data` fast path to the skill. It must describe:

- the same eligibility conditions as `AGENTS.md`;
- the explicit-config scaffold command and its `generated`/`manual` absolute
  path output;
- authenticated Codex browser terminology only; do not add a legacy browser
  gate step;
- the rule that the scaffold has no default domain fields and does not create
  seeds, relations, or shared registrations;
- the agent's responsibility to adjust the ordinary generated source against
  the approved design and legacy reference;
- focused tests/lint followed by full type checks where required;
- the unchanged full acceptance checklist, authenticated browser verification,
  and independent verifier PASS;
- High or Extra High reasoning only for this path, never Low or Medium, and
  safe reuse of the same agent context for a sequence.

Keep the existing default end-to-end path for all other modules. Do not add a
generic framework abstraction, weaken a gate, or change automatic invocation.

Run:

`python3 /Users/gamer/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/gamer/.agents/skills/ads-hk-module-slice`

Review both external skill diffs and confirm that only the intended skill
instructions changed. Update the verifier skill and acceptance checklist to
use authenticated Codex browser wording only. Do not add the legacy preview
tool. If the validator fails, stop and fix the skill through `$skill-creator`;
do not mark this plan complete.

### 6. Update the plan index

Update `plans/README.md`:

- Add Plan 087 as TODO while this plan is in progress.
- Make Plan 087 a prerequisite for Plan 084, because 084 is the next module
  that can use the scaffold.
- Keep Plans 084-086 TODO and do not imply that their source work is complete.
- Add a short note that the fast path is bounded and keeps the full acceptance
  gates.

## Test plan

Run these checks after implementation:

1. `node --test scripts/scaffold-master-data.test.mjs`
2. Run the scaffold once with a temporary explicit config and `--json`; check
   that all returned paths are absolute and that no undeclared default field
   appears.
3. Run a focused API test and lint against the existing Plan 082 or 083 files.
4. Run a focused web test and lint against the existing Plan 082 or 083 files.
5. Run the normal API and web type checks.
6. Run the skill-creator validator for both external skills and review the
   skill/checklist diffs. No available Python environment contains PyYAML, so
   use this reproducible, no-install standard-library shim:

   ```sh
   python3 - <<'PY'
   import json
   import re
   import runpy
   import sys
   import types

   class YAMLError(Exception):
       pass

   def safe_load(value):
       result = {}
       for line in value.splitlines():
           if not line.strip():
               continue
           key, separator, item = line.partition(':')
           if not separator or not re.fullmatch(r'[A-Za-z0-9_-]+', key.strip()):
               raise YAMLError(f'unsupported frontmatter line: {line}')
           item = item.strip()
           if item.startswith(('"', "'")):
               try:
                   item = json.loads(item) if item.startswith('"') else item[1:-1]
               except (json.JSONDecodeError, IndexError) as error:
                   raise YAMLError(str(error)) from error
           result[key.strip()] = item
       return result

   yaml = types.ModuleType('yaml')
   yaml.YAMLError = YAMLError
   yaml.safe_load = safe_load
   sys.modules['yaml'] = yaml
   validator = '/Users/gamer/.codex/skills/.system/skill-creator/scripts/quick_validate.py'
   validate_skill = runpy.run_path(validator)['validate_skill']
   for skill in (
       '/Users/gamer/.agents/skills/ads-hk-module-slice',
       '/Users/gamer/.agents/skills/verify-ads-hk-module',
   ):
       valid, message = validate_skill(skill)
       print(message)
       if not valid:
           raise SystemExit(1)
   PY
   ```
7. Run `git diff --check` and confirm that no out-of-scope repository files
   changed.

This plan changes tooling and instructions, not a user-facing module flow. A
new authenticated Codex browser check is not required for Plan 087. Future module
plans using the fast path still require the authenticated Codex browser gate,
the full acceptance checklist, and verifier `PASS`.

## Done criteria

- The scaffold command requires explicit module and field metadata.
- It creates readable ordinary source files only for the module-owned paths.
- It never invents `name`, `description`, `active`, audit, seed, relation, or
  workflow fields.
- It refuses overwrite and invalid configurations.
- It returns sorted absolute `generated` and `manual` path arrays in human and
  JSON output.
- Focused API and web test/lint commands accept real paths and narrow their
  work. Existing broad commands remain unchanged.
- `AGENTS.md`, both external skills, and the checklist use authenticated Codex
  browser wording; the bounded fast path preserves the full acceptance gates
  for future module plans and requires High or Extra High reasoning only.
- `$skill-creator` was used for both skill-tree edits and the documented
  validator command passes for both skills.
- The scaffold test, focused checks, type checks, validator, and
  `git diff --check` pass.
- Plans 084-086 remain TODO, with Plan 087 listed as their required setup
  step.

## STOP conditions

Stop and report if:

- the current Plan 082/083 source pattern differs materially from the template
  assumptions;
- the scaffold needs framework changes, a runtime generic CRUD layer, dynamic
  relation/workflow generation, or guessed/default fields;
- shared registries, seeds, migrations, or route maps would require risky
  automatic edits;
- an explicit design field cannot be represented without expanding scope;
- a focused command still runs the full suite;
- the skill-creator validator fails after a correction attempt;
- any generated path already exists and the script would overwrite it; or
- a user-facing label, permission, or module behavior decision appears.

Return the decision and evidence. Do not work around a stop condition by
guessing.

## Maintenance

The scaffold output is a starting point, not a domain contract. Future agents
must verify every generated file against the approved design and legacy
reference, remove unused generated pieces, and add manual integration only
where the design requires it.

Keep the scaffold field type list small. Add a new type only with an explicit
template, validation, and contract test. Keep relations, lookups, workflows,
seeds, migrations, and shared registration manual until a separate approved
plan proves that automation is safe.

Keep full test/lint commands for release and cohort checks. Focused commands
are for the short edit-feedback loop, not a replacement for final module
verification.
