# Plan 038: Migrate generic app Zod schemas

> **Implementation instructions**: Run plan 037 first. Follow this plan as one
> mechanical application cohort. Change only the listed schema files. Preserve
> every type alias that another application file uses at a real input or output
> boundary.
>
> **Drift check (run first)**: `git diff --stat ab4c5ca..HEAD -- 'apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/divisions/divisions.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/number-configs/number-configs.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/number-variables/number-variables.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/projects/projects.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/project-vendors.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/root-causes/root-causes.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/uoms/uoms.schema.ts' 'apps/web/src/routes/(authenticated)/master-data/work-items/work-items.schema.ts'`
>
> These schema files are uncommitted files from the earlier resource
> migration. Compare them with the current files; do not delete or reset them.

## Status

- **Status**: DONE
- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/037-schema-first-zod-type-inference.md
- **Category**: migration
- **Planned at**: commit `ab4c5ca`, 2026-08-12

## Why this matters

These ten modules pass direct entity schemas to `fromZod` and do not add a local
preprocess or transform in the schema file. Their explicit output type
arguments repeat information already present in the Zod schema. Removing those
arguments makes the schema the type source without changing validation or wire
behavior.

This cohort includes nested and resource-special modules when their schema
binding is still direct. Resource complexity is not schema complexity.

## Current state

The files use this pattern:

```ts
export type Project = z.output<typeof project.schemas.select>
export type ProjectCreate = z.input<typeof project.schemas.create>
export type ProjectUpdate = z.input<typeof project.schemas.update>

export const projectsSchema = defineSchema<AppResourceContract<typeof rpc.projects>>({
  identity: 'id',
  record: { schema: fromZod<Project>(project.schemas.select) },
  create: { schema: fromZod<ProjectCreate>(project.schemas.create) },
  update: { schema: fromZod<ProjectUpdate>(project.schemas.update) },
})
```

The same direct binding exists in the following files:

- `apps/web/src/routes/(authenticated)/master-data/business-categories/business-categories.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/divisions/divisions.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/number-configs/number-configs.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/number-variables/number-variables.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/projects/projects.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/project-vendors.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/pts-work-categories.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/root-causes/root-causes.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/uoms/uoms.schema.ts`
- `apps/web/src/routes/(authenticated)/master-data/work-items/work-items.schema.ts`

Some aliases are used by action functions. For example,
`projects.actions.ts` consumes `ProjectCreate` and `ProjectUpdate`. Keep those
real boundaries. Remove record or write aliases that have no caller, because a
dead duplicate type only adds another place for the contract to drift.

The special schema files are excluded:

- `settings/users/users.schema.ts` — local form schema and role-ID transform;
- `settings/roles/roles.schema.ts` — update preprocess.

They are handled by plan 039.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Old calls outside special cohort | `rg -n "fromZod<" apps/web/src | rg -v 'settings/(users|roles)/'` | no output |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Whitespace | `git diff --check` | exit 0 |

The web type-check and lint gates run in plan 039 after the special callsites
also use the new signature. Plan 038 intentionally leaves those two files
unchanged.

## Scope

**In scope**:

- The ten schema files listed above.
- `plans/README.md` for status only.

**Out of scope**:

- `users.schema.ts` and `roles.schema.ts`; plan 039 owns them.
- Framework source and tests; plan 037 owns them.
- Resource actions, fields, routes, permissions, API schemas, and request
  payloads.
- Any unrelated uncommitted resource migration file.

## Steps

### Step 1: Confirm the cohort

Run the drift check. Read every listed schema and search its type aliases. Keep
aliases used by actions or other callers. Confirm that each `fromZod` call uses
the entity schema directly, with no local transform or preprocess.

**Verify**: the ten files match the Current state section and the special files
are not included.

### Step 2: Remove caller-supplied output types

Replace each `fromZod<Type>(schema)` with `fromZod(schema)`. Remove only dead
type aliases and their now-unused Zod type imports. Do not change the schema
values, `AppResourceContract` arguments, type aliases used elsewhere, or action
behavior.

**Verify**: `rg -n "fromZod<" apps/web/src | rg -v 'settings/(users|roles)/'` returns no output.

### Step 3: Run the application gates

Run the web tests. Type-check and lint remain final gates in plan 039 because
the two special schema files still use the old signature until that plan runs.

**Verify**: `pnpm --filter @southneuhof/framework-web test` and
`git diff --check` exit 0.

### Step 4: Review the cohort

Review the diff and confirm that only the ten schema files changed. Check that
no action type alias was removed and that no resource behavior changed.

**Verify**: `git diff --check` exits 0 and the scope review is clean.

## Test plan

Use the existing full web test suite and type-check. Do not add tests for a
one-token callsite change. Existing module resource tests remain the behavior
coverage.

## Done criteria

- [ ] All ten direct schema files use `fromZod(schema)`.
- [ ] No generic `fromZod<...>` call remains outside `users` and `roles`.
- [ ] Type aliases used by action functions remain available.
- [ ] Dead schema-only type aliases are removed.
- [ ] Web tests pass; the final web type-check and lint gates pass in plan 039.
- [ ] No out-of-scope file changed.
- [ ] `plans/README.md` marks plan 038 DONE after review.

## STOP conditions

- Stop if a listed schema has a local transform or preprocess not described in
  this plan.
- Stop if removing the type argument changes an action input or API payload.
- Stop if a caller needs a type alias that the current file does not export.
- Stop if a framework change is required; return to plan 037.
- Stop if a verification command fails twice after a focused fix.

## Maintenance notes

Future direct entity bindings should use `fromZod(schema)`. A module belongs in
the special cohort only when its schema changes raw input into a different
parsed value. Custom actions, nested routes, and resource transforms do not by
themselves make the schema binding special.
