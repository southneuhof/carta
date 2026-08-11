# Plan 026: Migrate the scoped project-vendors resource

> **Implementation instructions**: Migrate only the nested vendor module. Preserve its project scope in every route and request.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors'`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans 018-021 and the `projects` checkpoint in plan 025
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

Project vendors use standard CRUD, but the resource is a factory that captures `projectId`. Its list/create routes and detail/update route parameter functions must retain that parent scope. This makes it unsafe for the plain CRUD cohort.

## Current state

- `project-vendors.resource.ts:5-23` creates a resource inside `projectVendors(projectId)`.
- Lines 16-19 inject `projectId` into all navigation targets.
- The four routes create the scoped resource and pass parent initial data or table search parameters.

```ts
export function projectVendors(projectId: string) {
  return defineResource({ ... })
}
```

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Focused spec | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/project-vendors.resource.spec.ts'` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Boundary | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src framework/__tests__/route-resource-boundary.spec.ts` | exit 0 |
| Old API scan | `rg -n "defineFields|capabilities:|schemas:|\.operations|:resource=|table-options|form-options" 'apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors'` | no matches |

## Scope

**In scope**: all files under `apps/web/src/routes/(authenticated)/master-data/projects/[projectId]/detail/vendors/`, plus the shared boundary spec.

**Out of scope**: the parent projects module, API route changes, framework changes, and a generic nested-resource abstraction.

## Git workflow

- Branch: `codex/026-project-vendors-schema`
- Commit: `refactor(web): migrate project vendors resource`
- Do not push or open a pull request unless asked.

## Steps

1. Create `project-vendors.schema.ts` from the typed Hono contract and entity schemas. Keep it independent of `projectId`.
2. Keep `projectVendors(projectId)` as the honest scoped resource factory. Define per-action fields and preserve exact route targets with the captured project ID.
3. Bind all four routes with scoped action prop bags. Pass `projectId` as request scope or initial data exactly where the current API requires it.
4. Delete `project-vendors.operations.ts`, update the focused spec, and run all checks.

Each step must end with the focused spec or web type check at exit 0.

## Test plan

Test two different project IDs to prove that route targets, list scope, initial create data, and detail/update targets do not leak between resource instances. Keep one mutation invalidation assertion.

## Done criteria

- [ ] Schema is scope-independent.
- [ ] Resource factory preserves project scope.
- [ ] All routes use action prop bags.
- [ ] Old operations and resource API are absent.
- [ ] Focused and package checks pass.

## STOP conditions

- Stop if the Hono route cannot represent project scope without changing the API.
- Stop if memoization or route registration leaks one project ID into another.
- Stop if the parent projects module must change.

## Maintenance notes

Do not generalize this factory into a nested-resource kind. The captured parent ID is ordinary application scope.
