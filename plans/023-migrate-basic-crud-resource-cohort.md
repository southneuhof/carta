# Plan 023: Migrate the basic CRUD resource cohort

> **Implementation instructions**: This cohort plan is reusable. Select and complete one unchecked module per execution. Do not change two modules in one execution. Update the module checkpoint after focused verification. Mark the plan DONE only when all four checkpoints pass review.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/master-data/uoms' 'apps/web/src/routes/(authenticated)/master-data/business-categories' 'apps/web/src/routes/(authenticated)/master-data/pts-work-categories' 'apps/web/src/routes/(authenticated)/master-data/root-causes'`

## Status

- **Priority**: P1
- **Effort**: M per cohort; S per module
- **Risk**: LOW
- **Depends on**: `plans/018-add-unified-web-resource-schema.md`, `plans/019-replace-resource-with-per-action-api.md`, `plans/020-bind-views-to-action-prop-bags.md`, `plans/021-add-app-hono-resource-adapters.md`
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Module checkpoints

- [ ] `uoms`
- [ ] `business-categories`
- [ ] `pts-work-categories`
- [ ] `root-causes`

## Why this matters

These four modules have the same shape: typed Hono CRUD, entity Zod schemas, simple fields, standard routes, and no custom action or transport transform. One precise plan is enough. Separate executions keep diffs small and make each checkpoint independently reversible.

## Current state

Each module has `<module>.operations.ts`, `<module>.resource.ts`, list/detail/create/edit routes, and a focused resource spec.

- `uoms.resource.ts:5-21` defines full CRUD with `fields`, `table`, `detail`, `form`, `schemas`, and `capabilities`.
- `business-categories.resource.ts:9-30` has the same shape and a local `fromZod` type wrapper that must disappear.
- `pts-work-categories.resource.ts:5-21` has the same full CRUD shape.
- `root-causes.resource.ts:5-23` has the same full CRUD shape.

Representative old form:

```ts
defineResource({
  fields: defineFields(...),
  table: { fields: [...] },
  form: { fields: [...] },
  schemas: { create: fromZod(...), update: fromZod(...) },
  capabilities: { list: { handler, permission, to }, ... },
})
```

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused test | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/master-data/<module>/<module>.resource.spec.ts'` | exit 0; use the selected module name |
| Boundary test | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/__tests__/route-resource-boundary.spec.ts` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Module scan | `rg -n "defineFields|capabilities:|schemas:|table: \{ fields|detail: \{ fields|form: \{ fields|\.operations" '<selected module root>'` | no old resource API matches |
| Whitespace | `git diff --check` | exit 0 |

## Scope

For one execution, select exactly one directory:

- `apps/web/src/routes/(authenticated)/master-data/uoms/`
- `apps/web/src/routes/(authenticated)/master-data/business-categories/`
- `apps/web/src/routes/(authenticated)/master-data/pts-work-categories/`
- `apps/web/src/routes/(authenticated)/master-data/root-causes/`

The only shared file allowed is `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts` when its module inventory must change.

**Out of scope**:

- Any other cohort module during the same execution
- Framework package changes
- Field-label or permission changes
- API or entity schema changes
- New custom actions

## Git workflow

- Branch per execution: `codex/023-<module>-schema`
- Commit per execution: `refactor(web): migrate <module> resource`
- Do not combine cohort modules in one commit, push, or pull request unless asked.

## Steps for the selected module

### Step 1: Create one schema

Create `<module>.schema.ts`. Use `defineSchema<AppResourceContract<typeof rpc.<route>>>`. Use the entity select/create/update schemas through the framework Zod bridge. Put all create and update validation here. Keep the schema free of resource, route, permission, and Vue imports.

**Verify**: the module schema type-checks and contains no import from a `.resource`, `.operations`, Vue, router, or toast module.

### Step 2: Replace the resource definition

Use the app Hono action helper and `defineResource(schema, { key, actions })`. Define complete fields in each of list, detail, create, and update. Use plain constants and object spread only when field definitions are identical. Preserve the exact permissions and route names from the old capabilities.

**Verify**: the focused resource spec passes after it is changed to assert action props and standard `run` behavior.

### Step 3: Change route bindings

Change list, detail, create, and edit routes to bind the correct action object with `v-bind`. Do not change page text, navigation targets, or route structure.

**Verify**: web type check exits 0.

### Step 4: Remove the old module API

Delete `<module>.operations.ts`. Remove `defineFields`, old peer surface keys, explicit resource generics, and old imports. For business categories, also remove the local `fromZod` wrapper.

**Verify**: the module scan has no matches and the boundary test passes.

### Step 5: Close one checkpoint

Run all commands. Review that only the selected directory and allowed boundary test changed. Check only this module in the checkpoint list.

## Test plan

Update the existing resource spec. Test one representative field per View, exact action availability, route metadata, and one mutation invalidation path. Do not duplicate the full field lists in tests.

## Done criteria

- [ ] The selected module has one schema file and one resource file.
- [ ] Its operations file is deleted.
- [ ] Its routes bind action prop bags.
- [ ] Its validation belongs to the schema.
- [ ] Its permissions and routes are unchanged.
- [ ] Focused, boundary, type, lint, and whitespace checks pass.
- [ ] Only its module checkpoint is updated.

## STOP conditions

- Stop if the selected module needs a custom action, transport transform, nested scope, or route-owned workflow. It does not belong in this cohort.
- Stop if a framework change is needed.
- Stop if another cohort module must change to make this module pass.

## Maintenance notes

Use this plan only for the four named modules. Add a new module only after evidence shows that it has the same plain CRUD shape.
