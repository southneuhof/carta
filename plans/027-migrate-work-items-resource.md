# Plan 027: Migrate the work-items tree resource and workflow

> **Implementation instructions**: Preserve the custom tree screen. Use the resource only for standard record actions and explicit custom tree loading.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/master-data/work-items'`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans 018-021; `uoms` and `pts-work-categories` checkpoints in plan 023; `projects` and `divisions` checkpoints in plan 025
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

Work items are not a standard list route. The page owns division/project selection, tree flattening, dialogs, confirmation, toasts, and reload sequencing. The resource must provide typed standard create/update/delete/detail actions and one plain tree action without absorbing this workflow.

## Current state

- `work-items.operations.ts:13-32` defines the tree record and `loadWorkItemTree` custom endpoint.
- `work-items.resource.ts:18-37` defines standard CRUD and variant-aware form fields.
- `index.route.vue:14-106` owns tree state, dialog mode, load, delete confirmation, and reload.
- `index.route.vue:51-59` chooses create/update form props; line 101 calls the old resource delete method.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused spec | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/master-data/work-items/work-items.resource.spec.ts'` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | no new failure |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Old API scan | `rg -n "workItemOperations|defineFields|\.form\(|\.delete\(|capabilities:|schemas:|\.operations" 'apps/web/src/routes/(authenticated)/master-data/work-items'` | no matches |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/master-data/work-items/index.route.vue`
- `work-items.resource.ts`, `work-items.resource.spec.ts`
- `work-items.schema.ts` (create)
- `work-items.actions.ts` only if tree types and loading make the resource hard to read
- Delete `work-items.operations.ts`
- Shared boundary spec

**Out of scope**: tree UI redesign, framework tree components, API changes, source resource migrations, and moving confirmation/toasts into action functions.

## Git workflow

- Branch: `codex/027-work-items-schema`
- Commit: `refactor(web): migrate work items resource`
- Do not push or open a pull request unless asked.

## Steps

1. Create the unified work-item schema with entity create/update validation and the current record/query types.
2. Define standard actions with separate create/update field blocks. Preserve the `variant` field behavior for root, child, and edit forms.
3. Expose tree loading as `workItems.actions.loadTree.run(projectId)`. Keep it free of loading state, toasts, and flattening.
4. Change the route to use `workItems.create()`, `workItems.update({ id })`, and `workItems.delete({ id }).run()`. Keep confirmation and reload in the route.
5. Replace route-local `defineFields` calls with typed plain field objects because this module already changes those custom surfaces.
6. Delete the old operations file and update tests.

Verify after each step with the focused spec or web type check.

## Test plan

Cover root create fields, child create visibility, update detail loading, tree action response mapping, delete invalidation, and one route workflow for confirmation followed by reload. Do not test the pure flatten expression separately.

## Done criteria

- [ ] Standard and custom action ownership is clear.
- [ ] The route still owns all UI effects and sequencing.
- [ ] Root/child/edit field behavior is unchanged.
- [ ] No old resource API or `defineFields` remains in this module.
- [ ] Focused and web checks pass.

## STOP conditions

- Stop if the tree endpoint must become a standard list action.
- Stop if the route workflow needs a new framework abstraction.
- Stop if source lookup modules are not migrated.

## Maintenance notes

Keep the tree action plain. A future reusable tree surface needs a separate approved framework plan.
