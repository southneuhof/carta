# Plan 030: Migrate project-role assignments with explicit coverage

> **Implementation instructions**: Preserve the three coverage modes and the route-owned assignment workflow. Do not force coverage into a generic resource identity.
>
> **Drift check**: `git diff --stat 138f9e7..HEAD -- 'apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/project-roles'`

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans 018-021, 028, and the `roles`, `divisions`, and `projects` checkpoints
- **Category**: migration
- **Planned at**: commit `138f9e7`, 2026-08-11

## Why this matters

Project-role assignment list and mutation requests depend on `all_projects`, division, or project coverage. The page also loads assignment options and manages filters and toggles. This contract is more complex than the simple assignment cohort and needs its own plan.

## Current state

- `project-role-assignments.operations.ts:5-27` derives option, list, put, delete, coverage, and result types from Hono.
- Lines 34-53 map coverage to list query and use the same coverage JSON for put/delete.
- `project-role-assignments.resource.ts:19-43` converts search parameters into coverage for the old list capability.
- `index.route.vue` owns option selection, query state, pending toggles, errors, and visible table data.

## Commands

| Purpose | Command | Expected result |
|---|---|---|
| Route spec | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src 'routes/(authenticated)/settings/users/[userId]/detail/project-roles/project-role-assignments.route.spec.ts'` | exit 0 |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | exit 0 |
| Old API scan | `rg -n "defineFields|capabilities:|\.operations|\.table\(|:table=|loadProjectRole|setProjectRole" 'apps/web/src/routes/(authenticated)/settings/users/[userId]/detail/project-roles'` | no old resource API matches |

## Scope

**In scope**: all files in the project-role assignment directory, new schema/action files if needed, and the shared boundary spec.

**Out of scope**: users, roles, projects, divisions, system-role assignments, API contracts, and a generic coverage framework.

## Git workflow

- Branch: `codex/030-project-role-assignments-schema`
- Commit: `refactor(web): migrate project role assignments`
- Do not push or open a pull request unless asked.

## Steps

1. Create a schema that names the assignment record, list query/scope, and exact `ProjectRoleCoverage` union. Keep coverage type equality checks as compile-time fixtures.
2. Define a standard list action. Define `options` and `set` as plain custom actions with only `run`.
3. Keep `queryForCoverage` as app mapping. Do not encode coverage as resource identity or framework metadata.
4. Change the route to call the list, options, and set actions through the resource. Preserve all route-owned filters, pending state, error handling, and toggle rules.
5. Delete the old operations file, update the route spec and type fixture, and run all checks.

## Test plan

Cover all three coverage modes, option loading, list query mapping, put/delete payload equality, toggle success/failure, locked/effective rows, and query change. Avoid snapshots of all fields.

## Done criteria

- [ ] Coverage remains an explicit discriminated union.
- [ ] List is standard; options and set are plain custom actions.
- [ ] Route owns UI workflow.
- [ ] Old operations/resource API is absent.
- [ ] Focused and package checks pass.

## STOP conditions

- Stop if put and delete coverage contracts no longer match.
- Stop if list coverage cannot be represented without a new framework concept.
- Stop if a dependency module is not migrated.

## Maintenance notes

Coverage belongs to this domain. Do not promote it into generic resource scope until another real module proves the need.
