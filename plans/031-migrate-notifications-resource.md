# Plan 031: Migrate notifications and keep independent query namespaces

> **Implementation instructions**: Preserve both notification consumers and their independent query namespaces. Keep event dispatch and mark-seen sequencing in application code.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/to-do' apps/web/src/components apps/web/src/framework/notifications`

## Status

- **Status**: DONE
- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans 018-021
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

Notifications expose standard list/detail plus unread-count and mark-seen custom endpoints. The same resource serves the inbox UI and the To Do page with independent query namespaces. The migration must keep this production proof and must not turn custom notification workflow into framework semantics.

## Current state

- `notifications.operations.ts:8-30` defines list/detail, unread count, mark seen, and unread ID selection.
- `notifications.resource.ts:4-19` defines read-only fields and standard capabilities.
- `to-do/index.route.vue:14` creates the `to-do` table namespace.
- Other consumers import notification actions and the `NOTIFICATIONS_SEEN_EVENT`; find them before editing.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Resource spec | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/to-do/notifications.resource.spec.ts'` | exit 0 |
| Type fixture | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Consumer tests | `pnpm --filter @southneuhof/framework-web test` | no new failure |
| Old API scan | `rg -n "notificationOperations|defineFields|capabilities:|\.operations|notifications\.table\(" apps/web/src` | no matches |
| Namespace scan | `rg -n "namespace: ['\"]to-do['\"]|namespace: ['\"]notifications" apps/web/src` | both independent consumers remain |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/to-do/notifications.resource.ts`
- `notifications.resource.spec.ts`, `notifications.operations.type-test.ts`
- `notifications.schema.ts` and optional `notifications.actions.ts`
- Delete `notifications.operations.ts`
- `apps/web/src/routes/(authenticated)/to-do/index.route.vue`
- Existing notification consumers that import the old operations file
- Shared boundary spec

**Out of scope**: notification API behavior, module-to-route mapping policy, drawer redesign, polling policy, and framework notification features.

## Git workflow

- Branch: `codex/031-notifications-schema`
- Commit: `refactor(web): migrate notifications resource`
- Do not push or open a pull request unless asked.

## Steps

1. Create a read-only notification schema from the typed Hono route and entity record schema.
2. Define standard list/detail action blocks. Define unread count and mark seen as custom actions with only `run`. Keep `unreadIds` as a plain pure helper, not framework action metadata.
3. Update the To Do route and the inbox consumer. Use distinct namespace arguments on the list action. Preserve the seen event and current UI sequencing.
4. Delete the old operations file, replace its type fixture, update tests, and run all checks.

## Test plan

Cover exact list/detail availability, unread count, empty/non-empty mark seen, unread ID selection, event behavior, and two independent query namespaces. Do not test every display field.

## Done criteria

- [ ] Notifications have one schema and per-action resource.
- [ ] Unread and mark-seen actions remain plain custom actions.
- [ ] Both consumers retain independent namespaces.
- [ ] Old operations/resource API is absent.
- [ ] Focused and full web checks have no new failure.

## STOP conditions

- Stop if a consumer outside the listed scope needs a product behavior change.
- Stop if namespace independence is lost.
- Stop if custom actions need automatic invalidation to preserve current behavior; report the exact flow.

## Maintenance notes

Keep event and polling behavior at application level. Resource core owns only standard invalidation.
