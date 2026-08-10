# Plan 002: Complete the Role creation form contract

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. If a STOP condition occurs, stop and report it. After
> the implementation and review pass, update this plan row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/api/src/routes/roles/roles.entity.ts apps/web/src/routes/(authenticated)/settings/roles apps/web/src/routes/(authenticated)/settings/role-groups`
> If the current excerpts do not match, stop and reassess this plan.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: 001
- **Category**: bug
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

The Role database and create schema require `roleGroupId`, but the Role form
does not display or submit it. After Plan 001 restores form rendering, Role
creation will still fail validation. A text input for `assignmentScope` also
allows values outside the API enum.

This plan gives Role creation a required Role Group lookup and a constrained
assignment scope selection. It does not attempt full legacy Role parity; Plan
006 owns that wider master-data alignment.

## Current state

- `apps/api/src/routes/roles/roles.entity.ts` defines the Role table and API
  create schema.
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts` owns
  the web Role resource and current form field list.
- `apps/web/src/routes/(authenticated)/settings/role-groups/role-groups.resource.ts`
  exposes a list and detail capable source that framework lookup inputs need.
- `apps/web/src/framework/inputs/registry.ts` resolves lookup source resources
  into list and detail handlers.
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`
  is the test pattern.

Required persistence field in `apps/api/src/routes/roles/roles.entity.ts:40-44`:

```ts
roleGroupId: text("role_group_id")
  .notNull()
  .references(() => roleGroups.id),
```

Current role fields in `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts:5-9`:

```ts
roleCode: { label: 'Role Code', form: { renderer: 'text' } },
name: { label: 'Role Name', form: { renderer: 'text' } },
assignmentScope: { label: 'Assignment Scope', form: { renderer: 'text' } },
```

Current form list in the same file is `roleCode`, `name`, `assignmentScope`,
and `active`; it excludes `roleGroupId`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused Role test | `pnpm --filter @southneuhof/framework-web test -- roles.resource.spec.ts` | exit 0; all Role resource tests pass |
| API tests | `pnpm --filter @southneuhof/api test` | exit 0; all API tests pass |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no type errors |
| Full checks | `pnpm --filter @southneuhof/api test && pnpm --filter @southneuhof/framework-web test` | exit 0; all tests pass |

## Scope

**In scope**:

- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts`
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`
- existing Role API test only if a missing API contract assertion needs it

**Out of scope**:

- Database schema changes; `roleGroupId` already exists and is required.
- Role Group CRUD behavior.
- Role permissions, User-role assignment, and PTS authorization behavior.
- Full legacy Role form fields such as `roleType`, description, or
  `allowRegister`; Plan 006 owns field-parity decisions.
- Framework packages.

## Git workflow

- Branch: `codex/002-complete-role-create-form`
- Commit message: `fix(web): complete role creation form`
- Do not push or create a pull request unless instructed.

## Steps

### Step 1: Add the required Role Group lookup

Import `roleGroups` into `roles.resource.ts`. Add `roleGroupId` to the shared
Role field catalog with `renderer: 'lookup'`, `source: roleGroups`, and the
existing lookup input properties needed to submit an ID and display a group
name. Add `roleGroupId` to the create/update form field list before
`assignmentScope`.

Use the Role Group resource as the source. Do not add a second endpoint, a
hard-coded option list, or direct RPC calls in the Role route.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

### Step 2: Constrain assignment scope

Replace the free-text `assignmentScope` form renderer with the smallest
existing option renderer and the two API values: `global` and `project`. Store
the API values exactly. Use clear labels for the two options. Keep the schema
as the final validation boundary.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- roles.resource.spec.ts` → exit 0.

### Step 3: Add focused resource tests

Extend `roles.resource.spec.ts` to assert that create form fields include
`roleGroupId`; that its source is `roleGroups`; that its lookup configuration
can resolve list and detail capabilities through `appInputProps`; and that
schema validation accepts a valid group ID while rejecting a draft with no
group ID. Assert assignment scope uses only the two API enum values.

Do not call the network or create a role in these tests.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- roles.resource.spec.ts` → exit 0.

### Step 4: Run boundary checks

Run API and web suites. Check that no database change was added.

**Verify**: `pnpm --filter @southneuhof/api test && pnpm --filter @southneuhof/framework-web test && git diff --check` → all exit 0.

## Test plan

- Resource create form exposes the required `roleGroupId` lookup.
- Lookup source has list and detail capabilities and resolves to framework props.
- Schema rejects missing `roleGroupId` and accepts a valid minimal Role draft.
- Scope config provides only `global` and `project` values.

## Done criteria

- [ ] Role creation and update forms contain `roleGroupId`.
- [ ] The lookup uses the Role Group resource; no duplicate fetch code exists.
- [ ] Assignment scope cannot be entered as arbitrary text.
- [ ] Focused tests, API tests, web type check, and full web tests pass.
- [ ] Only in-scope files changed.
- [ ] `plans/README.md` marks Plan 002 as DONE.

## STOP conditions

- A user with `manage-roles` cannot read Role Groups through the current
  permission model. Stop and decide the authorization rule before exposing the lookup.
- Role Group records do not have an ID and display field compatible with the
  lookup input. Stop; do not create a second lookup adapter.
- Legacy parity requires more Role fields than this narrow create-contract fix.
  Stop and move that work into Plan 006 rather than expanding this plan.

## Maintenance notes

The API schema remains the authority for Role validity. Future Role form
changes must keep create and update lists consistent, unless the API explicitly
defines different create and update contracts.
