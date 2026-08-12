# Plan 050: Apply the remaining permission verb convention

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat aa30f1d..HEAD -- apps/api/src/authorization/catalog.ts apps/api/src/routes/roles apps/api/src/routes/business-categories apps/api/src/routes/uoms apps/api/src/routes/number-configs apps/api/src/routes/number-variables apps/web/src/routes/(authenticated)/settings apps/web/src/routes/(authenticated)/master-data`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/049-align-owner-list-docs.md`
- **Category**: migration
- **Planned at**: commit `aa30f1d`, 2026-08-13

## Why this matters

Plans 046-049 fix the PTS owners. The rest of the catalog still uses
`view-*` as a data gate and `manage-*` as a write bag. The approved
addendum applies the same verbs everywhere else. Do this after PTS is
stable so the first series stays reviewable.

## Current state

Addendum:
`docs/superpowers/specs/2026-08-13-permission-verb-convention-addendum.md`.

Modules still on the old verbs after 046-048:

| Module | Today | Target |
| --- | --- | --- |
| users | `view` / `create` / `update` plus `list` / `detail` from 046 | add `delete-users` only if the API deletes |
| roles | `view-roles` / `manage-roles` | `view` / `list` / `detail` / `create` / `update` / `delete` |
| permissions | `view-permissions` / `view-role-permissions` / `manage-role-permissions` | same verbs; keep the mapping module separate |
| system-role-assignments | `view` / `manage` | split as the routes need |
| project-role-assignments | `view` / `manage` | split as the routes need |
| business-categories | `view` / `manage` | split like divisions |
| uoms | `view` / `manage` | split like divisions |
| number-variables | `view` only | add `list` / `detail` |
| number-configs | `view` / `manage` | split like divisions |

Dashboard and To Do stay `permission: null`.

Current authorize examples:

- `apps/api/src/routes/business-categories/business-categories.ts` —
  `view-business-categories` / `manage-business-categories`
- `apps/api/src/routes/uoms/uoms.ts` — `view-uoms` / `manage-uoms`
- `apps/api/src/routes/number-configs/number-configs.ts` —
  `view-number-configs` / `manage-number-configs`
- `apps/api/src/routes/number-variables/number-variables.ts` —
  `view-number-variables` only
- `apps/api/src/routes/roles/roles.ts:22-24` —
  `view-roles` / `manage-roles` / `view-permissions`
- `apps/api/src/routes/roles/role-permissions.routes.ts` —
  `view-role-permissions` / `manage-role-permissions`
- `apps/api/src/routes/roles/system-role-assignments.routes.ts` —
  `view-system-role-assignments` / `manage-system-role-assignments`
- `apps/api/src/routes/roles/project-role-assignments.routes.ts` —
  `view-project-role-assignments` / `manage-project-role-assignments`

Web resources still use `manage-*` on those modules, for example
`apps/web/src/routes/(authenticated)/master-data/uoms/uoms.resource.ts:19-40`.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Catalog tests | `pnpm --filter @southneuhof/api test -- catalog.spec.ts` | exit 0 |
| Roles / users / master-data tests | `pnpm --filter @southneuhof/api test -- roles users business-categories uoms number` | exit 0 |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**:

- `apps/api/src/authorization/catalog.ts` and `catalog.spec.ts`
- API route authorize arrays and web resource `permission` values for the
  modules in the table
- Seed mapping (automatic by realm; only touch `scripts/seed.ts` if a
  compile break appears)
- Focused tests that name the old codes
- A short status note in the addendum spec that the remaining modules are
  now implemented

**Out of scope**:

- PTS owners already converted by 046-048
- Dashboard / To Do permissions
- New operational roles
- Framework code
- Changing assignment coverage rules

## Git workflow

- Commit message style: `fix(rbac): apply list and detail verbs to remaining modules`
- Do NOT push or open a PR unless asked

## Steps

### Step 1: Extend the catalog

Add the target codes. Remove `manage-*` on these modules only. Keep
role-permission as its own module. Do not add `delete-users` unless
`users` already has a delete route.

**Verify**: `pnpm --filter @southneuhof/api test -- catalog.spec.ts` → exit 0

### Step 2: Switch API authorize arrays

For each module in the table, list uses `list-*`, detail uses `detail-*`,
writes use `create-*` / `update-*` / `delete-*`. Copy the authorize split
from divisions after plan 047.

**Verify**: the module's existing spec still passes; add one 403 case for
missing `list-*` if the spec already tests authorize.

### Step 3: Switch web resource permissions

Admin list/detail stay `view-*`. Create / update / delete use the new
write verbs. Menus stay on `view-*`.

**Verify**: `rg "manage-roles|manage-uoms|manage-business-categories|manage-number-configs|manage-role-permissions|manage-system-role-assignments|manage-project-role-assignments" apps`
→ no matches

### Step 4: Mark the addendum shipped

In
`docs/superpowers/specs/2026-08-13-permission-verb-convention-addendum.md`,
set status to shipped and date the implementation. Do not change the rule.

**Verify**:
`pnpm --filter @southneuhof/api type-check` → exit 0
`pnpm --filter @southneuhof/framework-web type-check` → exit 0

## Test plan

- Catalog realm tests
- One authorize 403 per converted list if a spec already covers authorize
- Existing CRUD tests must keep passing

Do not repeat the PTS owner-list filter matrix.

## Done criteria

- [ ] Remaining modules have `list-*` and `detail-*`
- [ ] `manage-*` is gone from those modules
- [ ] Dashboard and To Do are still open
- [ ] API and web type checks exit 0
- [ ] Addendum spec status is shipped
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plans 046-049 are not DONE.
- A remaining module is actually a project-realm workflow, not an owner
  catalog.
- Users delete is requested but no delete route exists.
- A role-permission split would mix two modules into one code family.

## Maintenance notes

- Reviewers should confirm PTS owner codes were not renamed again.
- New modules must ship with `view` / `list` / `detail` / write verbs from
  day one. Do not add `manage-*`.
