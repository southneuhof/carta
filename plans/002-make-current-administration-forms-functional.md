# Plan 002: Make current administration forms functional

> **Implementation instructions**: Use `$ads-hk-module-slice` for every
> module group in this plan. Read the skill and this plan fully before editing.
> Complete groups in order. Run each verification gate. If a STOP condition
> occurs, stop and report it. Update this plan row after implementation and
> review.
>
> **Drift check (run first)**: `git diff --stat 7945196..HEAD -- apps/api/src/routes/users apps/api/src/routes/roles apps/api/src/routes/master-data apps/web/src/routes/(authenticated)/settings apps/web/src/routes/(authenticated)/master-data apps/web/src/App.vue`
> If a module does not match this plan's current-state list, update the module
> inventory first. Do not create a second form path.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/001-repair-shared-active-form-fields.md`
- **Category**: bug
- **Planned at**: commit `7945196`, 2026-08-10
- **Reconciled**: 2026-08-10; Plan 001 changes are present in the worktree and
  remain part of the shared form baseline. The replacement Plan 002 file is
  the selected plan; deleted predecessor plan files are preserved as user
  changes and are not part of this implementation.

## Why this matters

Plan 001 restores the shared Form renderer, but a working renderer alone does
not make a module usable. Current administration has resource forms, native
User creation, required fields absent from forms, and relationship IDs entered
as text. These paths must use the same API, operation, resource, and FormView
structure or they will continue to drift.

This plan makes all current Settings and master-data create and edit routes
functional. It uses one module inventory and fixed module groups, not fourteen
separate plans. Quality PTS is excluded because it has its own legacy field and
workflow rules in Plans 003–006.

## Current state

- `apps/web/src/routes/(authenticated)/settings/` has create and edit routes
  for Role Groups, Roles, Permissions, and Users.
- `apps/web/src/routes/(authenticated)/master-data/` has create and edit routes
  for Business Categories, Divisions, Number Configurations, Number Variables,
  Project Vendors, Projects, PTS Work Categories, Root Causes, UOMs, and Work
  Items.
- `apps/web/src/routes/(authenticated)/settings/users/create.route.vue` is the
  only current administration create route with a native form and direct RPC
  call.
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts` has
  no create capability. Its API route is special because it creates
  credentials.
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts`
  omits required `roleGroupId` and exposes `assignmentScope` as text.
- `apps/web/src/routes/(authenticated)/master-data/master-data.resources.ts`
  contains current relationship fields. Some are text renderers and need
  lookup sources rather than UUID entry.
- `apps/web/src/App.vue` captures a child error but does not render a visible
  fallback.
- `apps/web/src/routes/(demo)/input-catalog/` is the renderer smoke page. It
  is already present and must not be copied or changed.

Use `ads-hk-module-slice` as the standard:

```text
database/schema → API contract → normalized operation → resource → FormView → tests
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| API tests | `pnpm --filter @southneuhof/api test` | exit 0; all API tests pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0; all web tests pass |
| API type check | `pnpm --filter @southneuhof/api type-check` | exit 0; no type errors |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no type errors |
| Diff check | `git diff --check` | exit 0 |

## Scope

**In scope**:

- `docs/current-administration-form-inventory.md` (new)
- `apps/api/src/routes/users/` for the existing custom credential-create
  contract only
- `apps/web/src/routes/(authenticated)/settings/`
- `apps/web/src/routes/(authenticated)/master-data/`
- focused API and web tests beside the affected modules
- `apps/web/src/App.vue` and `apps/web/src/App.spec.ts` (new)

**Out of scope**:

- `apps/web/src/routes/(authenticated)/quality/pts/` and
  `apps/api/src/routes/qhsse-pts/` — Plans 003–006 own manual PTS.
- New database fields, PTS parity fields, Quality Inspection PTS, and legacy
  data import.
- New UI dependencies, CRUD builders, browser pixel tests, and framework
  package changes.

## Git workflow

- Branch: `codex/002-functional-administration-forms`
- Commit message: `fix(web): make administration forms functional`
- Do not push, open a pull request, or change `packages/is-vue-framework`
  without separate user approval.

## Steps

### Step 1: Create the module and field inventory

Use `$ads-hk-module-slice` to create
`docs/current-administration-form-inventory.md`. Add one section for each
module in this exact group order:

1. Role Groups, Roles, Permissions, Users.
2. Business Categories, Divisions, Projects, Work Items, UOMs.
3. PTS Work Categories, Root Causes, Project Vendors, Number Variables, and
   Number Configurations.

For each module, record the field inventory required by the skill: API create
and update fields, table/detail/form visibility, renderer, source, and
server-supplied values. Record the resource, API contract, and route files.
Mark each route as standard CRUD or special operation. Treat User credential
creation as special. Do not add legacy PTS fields to this document.

**Verify**: `rg -n '^## (Role Groups|Roles|Permissions|Users|Business Categories|Divisions|Projects|Work Items|UOMs|PTS Work Categories|Root Causes|Project Vendors|Number Variables|Number Configurations)$' docs/current-administration-form-inventory.md` → 14 headings.

### Step 2: Repair standard Settings resources and routes

Use the skill path for Role Groups, Roles, and Permissions. Ensure list,
detail, create, and update capabilities have matching API permissions and
typed route targets. Use `FormView` for create and edit routes.

For Roles, add required `roleGroupId` as a Role Group resource lookup and use
an existing option renderer for the two API assignment-scope values. Confirm
that a user allowed to manage Roles can read Role Groups; stop for a permission
decision if not. Do not add an ID text fallback.

For Role Groups and Permissions, expose every required API field through the
resource form or document a server default in the inventory. Keep their current
business fields; do not add legacy role mechanisms.

**Verify**: focused Settings resource tests mount each create Form/FormView and
assert every required API field has a usable renderer.

### Step 3: Repair standard master-data resources and routes by dependency group

Use the skill path for all ten current master-data modules. Keep their existing
resource route structure. Replace every current foreign-key text field with a
`lookup` that uses a list-and-detail capable existing resource. Add dependent
visibility, filtering, and reset behavior where a parent controls a child.

Implement in this order: independent catalogs; Division and Project; UOM and
Work Item; Project Vendor; Number Variable and Number Configuration. Tables
and details must display business labels, not relationship UUIDs. Keep scalar
renderer choice in the resource catalog. Do not create a direct fetch inside a
route and do not create another lookup endpoint.

**Verify**: focused master-data resource tests assert the relationship renderer,
source, parent reset behavior, and label projection for each dependency group.

### Step 4: Convert User creation through the resource path

Use the custom-operation branch of `$ads-hk-module-slice`. Keep the current
credential-creation endpoint. Extract its browser-safe input schema from
server-only route code, normalize its `{ data: user }` response in the web
operation, and add it as the Users create capability with permission
`create-users`.

Add the create-only fields `email`, `password`, and `imgPhotoUser` to the User
resource catalog. Keep password out of tables, details, and update forms.
Replace the native User create form with `FormView`. Do not enable generic
database create CRUD because it cannot create credentials.

**Verify**: User API tests cover valid input, invalid input, duplicate username,
and `create-users` authorization. Web resource tests cover create capability,
schema, normalized response, and the FormView field list.

### Step 5: Add the root error fallback

In `App.vue`, show an accessible generic failure screen when a child render
error reaches `onErrorCaptured`. Include a reload action. Do not show error
message text, stack traces, route state, or server data. Keep normal routes
unchanged when there is no error.

Add `App.spec.ts` with one failing child-route case and one healthy-route case.
Mock the reload boundary; do not reload JSDOM.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- App.spec.ts` → exit 0.

### Step 6: Run the module completion gate

Use the skill finish gate for every inventory section. Run focused module tests,
then package checks. Start the web app and inspect `/input-catalog` as a
renderer smoke page only; do not modify it.

**Verify**: `pnpm --filter @southneuhof/api test && pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/api type-check && pnpm --filter @southneuhof/framework-web type-check && git diff --check` → all exit 0.

## Test plan

- One field inventory section for every current administration module.
- Standard modules: resource capability, required-field, relationship lookup,
  and Form/FormView render tests.
- User: API authorization and validation plus normalized create capability.
- App: failing and healthy route render cases.
- No network browser tests, snapshot tests, or broad scalar-field matrices.

## Done criteria

- [ ] The inventory has all 14 named module sections.
- [ ] Every current Settings and master-data create/edit route uses FormView,
  except a documented workflow action.
- [ ] Every required API form field is visible or documented as server supplied.
- [ ] No foreign key in these modules requires manual UUID entry.
- [ ] User creation uses a typed resource capability and keeps the custom
  credential endpoint.
- [ ] Root render failures have a generic visible fallback.
- [ ] API and web tests and type checks pass.
- [ ] No framework package changed.
- [ ] `plans/README.md` marks Plan 002 as DONE.

## STOP conditions

- A listed route has a workflow action that ordinary resource CRUD cannot
  express. Document it in the inventory and stop before adding a native form.
- A required lookup source is unavailable to a user with create permission.
  Stop for an authorization decision.
- A schema-required field has no business meaning in the legacy or current
  module contract. Stop and ask for a product decision.
- A route needs a framework change. Stop and make a separate framework proposal.

## Maintenance notes

Use `$ads-hk-module-slice` for each future Settings or master-data module.
Update the inventory whenever a field, capability, or form renderer changes.
Plans 003–006 use the same skill for the manual PTS slice.
