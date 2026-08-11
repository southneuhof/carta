# Plan 028: Migrate the users resource and move confirmation to its route

> **Implementation instructions**: Preserve create and update contracts as different schema parts. Move browser confirmation out of the update run function.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/settings/users' ':!apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/project-roles' ':!apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/system-roles'`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans 018-021 and the `roles` checkpoint in plan 025
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

Users have a dedicated create contract, different create/update fields, role selection validation, and an update confirmation currently hidden inside a data function. This is the clearest example of why schema, resource action, and route workflow need separate owners.

## Current state

- `create.operations.ts:8-16` implements the special create endpoint and record normalization.
- `users.resource.ts:11-19` extends create validation for unique system roles.
- `users.resource.ts:21-37` uses context behavior to switch create-only and update-only fields.
- `users.operations.ts:13-20` loads the current user and calls `window.confirm` before some status updates.
- Create and edit routes currently pass operation context to one shared form surface.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Resource spec | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/users/users.resource.spec.ts'` | exit 0 |
| Route specs | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/users/create.route.spec.ts' 'routes/(authenticated)/settings/users/[userId]/edit.route.spec.ts'` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| UI-effect boundary | `rg -n "window\.confirm|vue-sonner|useRouter" 'apps/web/src/routes/(authenticated)/settings/users/users.resource.ts' 'apps/web/src/routes/(authenticated)/settings/users/users.schema.ts'` | no matches |
| Old API scan | `rg -n "userOperations|defineFields|capabilities:|schemas:|\.operations|:resource=|form-options" 'apps/web/src/routes/(authenticated)/settings/users' -g '!**/detail/project-roles/**' -g '!**/detail/system-roles/**'` | no matches |

## Scope

**In scope**: user list/detail/create/edit routes and specs, `users.resource.ts`, `users.resource.spec.ts`, new `users.schema.ts`, optional `users.actions.ts`, deletion of `users.operations.ts` and `create.operations.ts`, and the shared boundary spec.

**Out of scope**: project-role and system-role submodules, role resource changes, identity/session behavior, API contracts, and a generic confirmation hook.

## Git workflow

- Branch: `codex/028-users-schema`
- Commit: `refactor(web): migrate users resource`
- Do not push or open a pull request unless asked.

## Steps

1. Create `users.schema.ts`. Use the special create contract, the user update contract, entity record schema, and the current unique system-role validation. Keep create and update definitions separate.
2. Define list, detail, create, and update action blocks. Create fields must include email, password, and system roles. Update fields must preserve status editing without exposing create-only input.
3. Use the app Hono helper where it fits. Keep the special 201 create normalization as a direct app run function when needed.
4. Remove `window.confirm` from the update run. In the edit route, wrap the returned update action `run` so the route loads the current record, asks for confirmation only for active-to-disabled transitions, and then calls the canonical resource update run. Cancellation must not send a request.
5. Bind list, detail, create, and edit routes with action prop bags. Delete both operations files and update tests.

Verify each step with the resource spec, route specs, or web type check.

## Test plan

Test create-role validation, create/update field separation, 201 create normalization, ordinary update without confirmation, active-to-disabled cancellation, confirmed update, route navigation, and no UI imports in schema/resource.

## Done criteria

- [ ] One schema owns distinct create and update validation.
- [ ] Create and update action fields are locally complete.
- [ ] Confirmation is route-owned and tested.
- [ ] Both operations files are deleted.
- [ ] Child assignment modules are unchanged.
- [ ] Focused and package checks pass.

## STOP conditions

- Stop if the special create contract cannot satisfy the schema contract honestly.
- Stop if confirmation requires a framework hook.
- Stop if a child assignment module must change.

## Maintenance notes

Keep user status confirmation in the edit route. A different route can make a different product choice without changing data actions.
