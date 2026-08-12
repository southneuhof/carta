# Plan 029: Migrate the assignment-catalog resource cohort

> **Implementation instructions**: Select one unchecked module per execution. Keep toggle state, permissions, toasts, identity refresh, and retry UI in the route.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail/permissions' 'apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/system-roles'`

## Status

- **Status**: DONE
- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans 018-021; `permissions`, `roles`, and `users` checkpoints
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Module checkpoints

- [x] `role-permissions`
- [x] `system-role-assignments`

## Why this matters

Both modules show a read-only assignment catalog with route-owned toggle controls and a custom set/unset endpoint. Their UI workflows differ slightly, but their resource boundary is the same: one list action and one plain custom assignment action.

## Current state

- `role-permissions.resource.ts:13-30` validates role realm during list loading. Its route calls `setRolePermission`, invalidates, and displays errors.
- `system-role-assignments.resource.ts:12-21` adapts `userId` from search parameters. Its route owns local filtering, retry UI, toggles, and current-user identity refresh.
- Both operation files derive custom endpoint types from Hono.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Role permissions | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/roles/[roleId]/detail/permissions/role-permissions.route.spec.ts'` | exit 0 |
| System roles | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/users/[userId]/detail/system-roles/system-role-assignments.route.spec.ts'` | exit 0 |
| Type fixture | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, including the selected type-test replacement |
| Old API scan | `rg -n "defineFields|capabilities:|\.operations|:resource=|\.table\(|\.invalidate\(" '<selected module root>'` | no old resource API matches |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |

## Scope

Select exactly one directory:

- `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail/permissions/`
- `apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/system-roles/`

Allowed shared file: route-resource boundary spec.

**Out of scope**: parent role/user changes, project-role assignments, framework changes, and moving UI state into the resource.

## Git workflow

- Branch per execution: `codex/029-<module>-schema`
- Commit per execution: `refactor(web): migrate <module> resource`
- Do not combine cohort modules in one commit, push, or pull request unless asked.

## Steps

1. Define an honest read-only schema for the selected assignment record and list scope.
2. Define one standard list action with complete table fields and the existing permission/route. Define one custom `set` action with only `run`.
3. Preserve role-permission realm verification or system-role list loading exactly. Use app Hono response helpers, not framework Hono imports.
4. Change the route to get list props from the new list action and call `resource.actions.set.run(...)`. Keep pending sets, switches, toast/retry behavior, and identity refresh in the route.
5. Delete the old operations file and obsolete type test, replace it with schema/resource type coverage where needed, and close only the selected checkpoint.

## Test plan

Keep the existing route spec. Cover initial list, toggle success, toggle failure, disabled controls, and the module-specific rule: realm mismatch for role permissions or current-user identity refresh for system roles.

## Done criteria

- [ ] Selected module has one list action and one plain custom set action.
- [ ] Route owns all toggle workflow state and effects.
- [ ] Old operations and resource API are absent.
- [ ] Parent and sibling modules are unchanged.
- [ ] Focused checks pass.

## STOP conditions

- Stop if a custom action needs framework permission metadata.
- Stop if the selected route cannot preserve its local table behavior with action props.
- Stop if a parent module checkpoint is incomplete.

## Maintenance notes

Do not merge the two endpoint implementations. They share an architecture pattern, not a domain service.
