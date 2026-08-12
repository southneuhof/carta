# Plan 036: Remove action field maps and reconcile the architecture

> **Implementation instructions**: Run only after every checkpoint in plan 035 is complete. Delete the migration path, then document only the field-reference API. Do not keep aliases, overloads, converters, or a migration addendum.
>
> **Drift check**: `git diff --stat ab4c5ca..HEAD -- packages/is-vue-framework apps/web/src/framework docs .agents/skills/migrate-web-resource`

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans 034 and 035, including every module checkpoint
- **Category**: tech-debt
- **Planned at**: commit `ab4c5ca`, 2026-08-12

## Why this matters

Plan 034 keeps the old action field-map input only so plan 035 can migrate one
module at a time. If that input, its flat field type, or its converter remains,
agents still have two valid ways to define resource fields. The final code and
documentation must make the low-repetition API the only resource path while
keeping raw fields available to custom core-component screens.

## Current state

- `packages/is-vue-framework/src/resources/actionResource.ts:51-79` exports the
  flat `ResourceActionField` and `ResourceActionFields` types.
- `packages/is-vue-framework/src/resources/actionResource.ts:323-359` converts
  flat fields to the complete field vocabulary.
- `packages/is-vue-framework/src/resources/index.ts:3` exports those types.
- `docs/architecture/web-application-architecture.md:86-168` states that each
  action owns a complete flat field map and rejects a shared framework field
  catalog.
- `packages/is-vue-framework/README.md:40-73` repeats the flat action map as the
  public example.
- `docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md:303-330`
  records the superseded field decision.
- `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts:22-83`
  enforces route/resource boundaries but not the final field-reference seam.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Resource map scan | `rg -n "fields:\\s*\\{" 'apps/web/src/routes/(authenticated)' -g '*.resource.ts'` | no matches |
| Legacy type scan | `rg -n "ResourceActionField|ResourceActionFields|actionFields" packages/is-vue-framework/src apps/web/src` | no matches |
| Framework checks | `pnpm --filter @southneuhof/is-vue-framework test && pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web checks | `pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Boundary checks | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/__tests__/route-resource-boundary.spec.ts framework/__tests__/entity-schema-import.spec.ts` | exit 0 |
| Documentation scan | `rg -n "complete field map|fields:\\s*\\{|plain constants and object spread|no .*field catalog" docs/architecture/web-application-architecture.md docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md packages/is-vue-framework/README.md .agents/skills/migrate-web-resource` | no obsolete guidance |
| Root gates | `pnpm test && pnpm type-check && pnpm build` | exit 0 or only separately recorded pre-existing failure |
| Whitespace | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/actionResource.ts`
- `packages/is-vue-framework/src/resources/index.ts`
- framework resource tests and type tests
- `packages/is-vue-framework/src/__tests__/public-api.spec.ts`
- `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts`
- `docs/architecture/web-application-architecture.md`
- `docs/superpowers/specs/2026-08-11-frontend-resource-schema-architecture-design.md`
- `packages/is-vue-framework/README.md`
- `.agents/skills/migrate-web-resource/SKILL.md`
- `plans/README.md` status updates

**Out of scope**:

- Resource module behavior changes
- Core `FieldsInput`, framework defaults, or custom screen changes
- A compatibility guide or deprecated aliases
- A second field builder or selector API
- Other architecture documentation

## Git workflow

- Branch: `codex/036-finalize-field-references`
- Commit: `refactor(framework): require field references`
- Do not push or open a pull request unless asked.

## Steps

### Step 1: Prove every resource migrated

Run the resource map scan and inspect all plan 035 checkpoints. Any action-local
field map means plan 035 is incomplete. Stop instead of migrating that module in
this cleanup plan.

**Verify**: all 17 checkpoints are complete and the scan has no match.

### Step 2: Delete the old resource field seam

Remove the flat resource-only field contracts, map-to-projection converter, and
temporary union or overload from plan 034. Standard list, detail, create, and
update actions must accept only ordered schema-bound references.

Keep core-component raw `FieldsInput`, surface projection, defaults, schema
metadata, and component-instance overrides unchanged.

**Verify**: the legacy type scan has no match; framework tests and type-check
pass.

### Step 3: Tighten public and boundary checks

Update the public API spec to require `defineFields` and to reject deleted flat
resource field exports. Add a boundary assertion based on TypeScript/public
types where possible. Do not add a formatting-sensitive permanent test for the
exact spelling of an array literal; keep the regex as a migration command only.

**Verify**: public API and web boundary tests pass.

### Step 4: Rewrite the canonical documentation

Update the architecture document, approved design record, package README, and
migration skill to show:

- `defineSchema` for data contracts and validation;
- `defineFields(schema, definitions)` for adjacent reusable behavior;
- nested display/table/detail/form projections;
- ordered action arrays for selection and order;
- one terminal partial `.override()` for a local difference;
- standard named actions and their current View prop bags;
- raw fields only for direct `Table`, `Detail`, and `Form` use.

Use a roles or users example that demonstrates different action order and one
form override. Replace the superseded text in place. Do not append a historical
migration section.

**Verify**: the documentation scan has no obsolete guidance.

### Step 5: Run final gates and close the migration

Run all commands. Record any pre-existing failure with its exact command and
output. Mark plans 034-036 DONE only after framework, web, and root checks have
no new failure.

## Test plan

- Reuse plan 034 merge and type fixtures.
- Reuse all migrated module resource specs from plan 035.
- Update public API and boundary coverage for the one final supported seam.
- Do not add snapshots of field definitions or source-format regex tests.
- Run package checks before root gates to make failures local.

## Done criteria

- [x] Standard resource actions accept only field-reference arrays.
- [x] Flat resource field types and conversion code are deleted.
- [x] `defineFields` is the only resource field-definition helper.
- [x] Core components still accept raw fields for custom screens.
- [x] Architecture, design record, package README, and migration skill describe
      only the shipped API.
- [x] Public and boundary checks enforce the final API without brittle syntax
      assertions.
- [x] Framework, web, and root gates have no new failure.

## STOP conditions

- Stop if any plan 035 checkpoint or resource map remains.
- Stop if a custom screen depends on the resource-only flat field type rather
  than core `FieldsInput`; report the caller before changing core contracts.
- Stop if the shipped implementation differs from a locked decision in plan
  034; resolve the design before changing the decision record.
- Stop if removing the temporary path requires a module behavior change.

## Maintenance notes

After this plan, a new standard resource has one schema, one adjacent field set,
and named actions with ordered references. There is no compatibility path.
