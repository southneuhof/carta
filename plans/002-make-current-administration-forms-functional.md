# Plan 002: Make current administration forms functional

> **Implementation instructions**: Use `$ads-hk-module-slice` for every
> module group in this plan. Read the skill and this plan fully before editing.
> Complete groups in order. Run each verification gate. If a STOP condition
> occurs, stop and report it. Update this plan row after implementation and
> review.
>
> **Drift check (run first)**: `git diff --stat 7945196..HEAD -- apps/api/src/routes "apps/web/src/routes/(authenticated)/settings" "apps/web/src/routes/(authenticated)/master-data" apps/web/src/App.vue`
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
- **Status**: TODO — 2026-08-10; the legacy parity record and the approved
  module-group choices define the implementation scope below.
- **Review**: WITHDRAWN — the current-schema review missed legacy field and
  workflow contracts. A legacy parity inventory must be completed before
  application code changes continue.

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
- The ten master-data web resource folders contain relationship fields. Their
  colocated resource definitions must use lookup sources rather than UUID entry.
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
- `plans/002-make-current-administration-forms-functional.md` legacy-parity
  revision and decision record
- database migrations and API contracts for Division media, Project
  media/location, Project completion, the Work Item core tree, UOM type, and
  Number Configuration display-order generation
- `apps/api/src/routes/users/` for the existing custom credential-create
  contract only
- direct resource folders under `apps/api/src/routes/`; do not create or use
  `apps/api/src/routes/master-data/`
- `apps/web/src/routes/(authenticated)/settings/`
- `apps/web/src/routes/(authenticated)/master-data/`
- focused API and web tests beside the affected modules
- `apps/web/src/App.vue` and `apps/web/src/App.spec.ts` (new)
- `apps/web/src/reload.ts` (new testable browser reload boundary)

**Out of scope**:

- `apps/web/src/routes/(authenticated)/quality/pts/` and
  `apps/api/src/routes/qhsse-pts/` — Plans 003–006 own manual PTS.
- Excel import/export, ITP callbacks, scheduling side effects, Quality
  Inspection PTS, and legacy data import.
- New UI dependencies, CRUD builders, browser pixel tests, and framework
  package changes.

## Git workflow

- Branch: `codex/002-functional-administration-forms`
- Commit message: `fix(web): make administration forms functional`
- Do not push, open a pull request, or change `packages/is-vue-framework`
  without separate user approval.

## Steps

### Step 1: Create the module and field inventory — DONE

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

### Step 2: Repair standard Settings resources and routes — DONE

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

First complete `plans/basic-master-data-alignment/001-separate-resource-modules.md`.
Use the skill path for all ten colocated resource modules. Keep the frontend
route group and each resource's local route structure. Replace every current
foreign-key text field with a
`lookup` that uses a list-and-detail capable existing resource. Add dependent
visibility, filtering, and reset behavior where a parent controls a child.

Implement in this order: independent catalogs; Division and Project; UOM and
Work Item; Project Vendor; Number Variable and Number Configuration. Tables
and details must display business labels, not relationship UUIDs. Keep scalar
renderer choice in the resource catalog. Do not create a direct fetch inside a
route and do not create another lookup endpoint.

**Verify**: focused master-data resource tests assert the relationship renderer,
source, parent reset behavior, and label projection for each dependency group.

### Step 4: Convert User creation through the resource path — DONE

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

### Step 5: Add the root error fallback — DONE

In `App.vue`, show an accessible generic failure screen when a child render
error reaches `onErrorCaptured`. Include a reload action. Do not show error
message text, stack traces, route state, or server data. Keep normal routes
unchanged when there is no error.

Add `App.spec.ts` with one failing child-route case and one healthy-route case.
Mock the reload boundary; do not reload JSDOM.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- App.spec.ts` → exit 0.

### Step 6: Run the module completion gate — DONE

Use the skill finish gate for every inventory section. Run focused module tests,
then package checks. Start the web app and inspect `/input-catalog` as a
renderer smoke page only; do not modify it.

**Verify**: `pnpm --filter @southneuhof/api test && pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/api type-check && pnpm --filter @southneuhof/framework-web type-check && git diff --check` → all exit 0.

Completion gate (2026-08-10): API 3 files and 21 tests passed; web 38 files and
172 tests passed; both type checks and the diff check passed.

### Step 7: Use the accepted legacy parity contract for implementation — TODO

The prior acceptance is withdrawn. The current-schema inventory and passing
tests do not prove parity with `/Users/gamer/Documents/projects/ads-hk-legacy`.
No application source changes were made during this audit. The product choices
in this section are accepted build scope. This section is the legacy parity
record that implementation must follow.

Start with `plans/basic-master-data-alignment/README.md`. That folder owns the
ordinary CRUD subset: Business Categories, PTS Work Categories, and Root
Causes. It must complete before the remaining Plan 002 modules. Do not expand
those plans into relationship, media, lifecycle, tree, seed, or numbering
work.

#### Approved correction decisions

- The correction covers all 14 Settings and current master-data modules in
  Plan 002. Manual PTS work does not resume until this scope is complete.
- Catalog codes remain required and unique for Business Categories,
  Divisions, UOMs, PTS Work Categories, and Root Causes. Show each code in
  its form, table, and detail surfaces.
- Restore Division thumbnail and Project short name, thumbnail, and
  structured location fields. Project location is one validated JSON object
  with `address`, `lat`, and `lng`, collected through standard framework
  fields. The implementation must use a migration/API subplan and the
  existing framework image/file inputs; a plain text file key, map provider,
  or new input integration is not an accepted replacement.
- Restore Project completion as a separate workflow. It sets Project state
  and creates project periods. Ordinary Project edit remains separate.
- Restore the Work Item tree needed by manual PTS: category, parent/child,
  level, volume, UOM, and high-risk rules. Excel import/export, ITP
  callbacks, and scheduling side effects are deferred.
- UOM type is server-owned and injected/filtered by workflow. Number
  Configuration display order is allocated by the server. Neither is a
  normal client form input.
- Keep both Project Vendor access paths: standalone CRUD has a required
  Project lookup, and Project detail has a scoped Vendor child screen. Both
  use the same Vendor resource and API contract.
- Better Auth and many-to-many role assignment are deliberate current
  improvements. Preserve the intended legacy outcomes through them; do not
  restore the legacy single-role architecture.
- User creation requires at least one role. The credential-create workflow
  must collect one or more role IDs and create the account plus its
  many-to-many role mappings as one managed operation. Do not create an
  unassigned account and defer all role assignment to its detail screen.
- User normal create and update forms include name, username, email,
  password, and photo. The update contract treats password as optional. It
  must use a custom account-update operation that applies email and password
  changes through Better Auth, enforces email/username uniqueness, and uses
  the existing image input for the photo; it must not expose a generic user
  database patch for credential fields.
- IDs remain UUIDs. The server/database generates them. No ID is a client form
  field or client write input.
- Employee-linked SSO provisioning is deferred and is outside Plan 002.
- User status must use the lifecycle values `user_active`, `user_nonactive`,
  `on_verification`, `user_rejected`, and `email_unverified` through the new
  account design. Status is not a normal editable User form field.
- A current field, constraint, or workflow remains unless this record
  explicitly replaces it. This preserves deliberate improvements such as
  Better Auth, many-to-many roles, required catalog codes, and explicit
  permission checks. Do not remove a current behavior only because legacy
  does not contain it.

#### Classification

- **Preserve**: keep the legacy business field and behavior in the current
  contract.
- **Intentionally omit**: keep the field out of this form or surface because
  it is technical, display-only, or owned by another workflow.
- **Server-generated**: the server supplies the value or audit transition.
- **Changed workflow**: the current path is not ordinary CRUD and needs a
  named operation or parent workflow.
- **Product decision**: the legacy and current contracts disagree. Stop and
  obtain a decision before changing schema, API, or UI.

#### Shared legacy conventions

Evidence: legacy `backend-ads-laravel/app/Services/Crud/{Add,Edit,Dataset,Find,Get,Delete}.php`,
the `app/Models/*.php` files below, and the custom services listed in each
section.

- Legacy IDs are auto-increment integer IDs. Current entities use text UUIDs;
  preserve the current UUID type. UUIDs are generated only by the
  server/database and must never be client form fields or write inputs.
- Legacy list and detail fields contain IDs, audit columns, and timestamps.
  Current audit IDs and timestamps are server-owned. Classify IDs, passwords,
  audit fields, and technical timestamps as **server-generated** or
  **intentionally omit**, never as normal form fields.
- Legacy add/edit services fill `created_by` and `updated_by` from the
  authenticated user. Current API routes fill `createdByUserId` and
  `updatedByUserId`; keep this server-side.
- Legacy `active` defaults to true in model constants. Current schemas and
  database defaults are the authority for active defaults. Do not make a
  status field editable only because a default exists.
- Legacy uniqueness is declared in `FIELD_UNIQUE`; current database indexes
  and API validation must be compared field by field. A different constraint
  is a **product decision**, not an automatic fix.
- Legacy files use temporary upload paths and model upload lists. Current
  image fields and upload operations need an explicit parity decision before
  a text key is used as a replacement.
- Legacy relations return `rel_*` display fields. Current resources must use
  lookup resources and label projections, not UUID text entry.
- Legacy models use custom callbacks and services for relationship assignment,
  status transitions, tree side effects, and generated numbering. These are
  **changed workflow** items, not ordinary form fields.

#### Settings parity

##### Role Groups

Evidence: legacy `backend-ads-laravel/app/Models/RoleGroups.php:26-29,66,111-115`,
legacy `frontend-ads-vuejs/src/app/configs/role-groups.ts`, current
`apps/api/src/routes/roles/roles.entity.ts`, `apps/api/src/routes/roles/roles.ts`,
`apps/web/src/routes/(authenticated)/settings/role-groups/role-groups.resource.ts`,
and current four route files under that directory.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit form | `role_group_code`, `role_group_name`, `description`, `active` | `roleGroupCode`, `name`, `description`, `active` | **Preserve** mapped business fields |
| List/detail | Same business fields plus `id`, audit columns, timestamps | Code, name, active, audit record fields | **Preserve** business display; **intentionally omit** technical fields |
| Constraints | Code and name unique; code/name required; description nullable | Code unique; name required; description nullable | Missing name uniqueness is a **product decision** |
| Workflow/defaults | `active` defaults true; audit set by service | Active defaults true; audit set by API | **Server-generated** audit/default handling |

##### Roles

Evidence: legacy `backend-ads-laravel/app/Models/Roles.php:26-29,71-72,101-135,154-198`,
legacy `frontend-ads-vuejs/src/app/configs/roles.ts`, current roles entity/routes/resource,
and `settings/roles/[roleId]/detail/permissions/index.route.vue`.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit form | `role_group_id`, `role_code`, `role_name`, `description`, `allow_register`, `active` | `roleGroupId`, `roleCode`, `name`, `description`, `assignmentScope`, `active` | Code/name/group/description/active **preserve**; role group is a lookup |
| List/detail | Business fields, `allow_register`, group ID, audit fields | Code/name/assignment scope/active and current relation fields | Audit/ID **intentionally omit** from form; `assignmentScope` is a **product decision** because legacy UI does not expose it |
| Constraints | `role_code` unique; group required; legacy filter hides lower groups for some users | Role code unique; group required; explicit permission lookup | Legacy role-group visibility rule is a **product decision** |
| Workflow/defaults | `allow_register` is backend field; active true; audit service fields | `roleType`, `allowRegister`, and assignment defaults are current API behavior | **Server-generated** defaults unless product decides to expose them |
| Child workflow | Role permission mapping is separate from the Role form | Current permission assignment route is separate | **Preserve** separate workflow boundary |

##### Permissions

Evidence: legacy `backend-ads-laravel/app/Models/Permissions.php:26-29,56-89`,
legacy `frontend-ads-vuejs/src/app/configs/permissions.ts`, current roles entity/routes,
and current `settings/permissions/` routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit form | Code, name, description, active; legacy model also accepts `permission_group` | Code, name, permission group, description, active | Code/name/description/active **preserve**; permission group form exposure is a **product decision** because legacy UI omits it but current API requires it |
| List/detail | Code, name, permission group, description, active, timestamps | Same business fields plus current audit fields | Business display **preserve**; timestamps **intentionally omit** from forms |
| Constraints/workflow | Code unique; group nullable in legacy validation | Code unique; group required in current schema | Requiredness mismatch is a **product decision** |

##### Users

Evidence: legacy `backend-ads-laravel/app/Models/Users.php:35-39,106-107,145-237`,
`backend-ads-laravel/app/Services/User/AddUser.php:24-118`,
`EditUser.php:24-118`, `ActiveDeactiveUser.php:11-57`,
`ResetPasswordByAdmin.php`, legacy
`frontend-ads-vuejs/src/app/configs/users.ts`,
`frontend-ads-vuejs/src/views/authenticated/config/users/users.vue`, current
`apps/api/src/routes/users/users.entity.ts`, `users.routes.ts`,
`apps/web/src/routes/(authenticated)/settings/users/users.resource.ts`,
`create.operations.ts`, and the Users list/create/detail/edit routes.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| List/detail | Full name, username, email, login method, status, email verification, photo, role/group/employee relations, login/audit data | Name, username, email, status, created/updated timestamps; role assignment is a child route | Business display **preserve** where current fields map; password, IDs, audit, and login internals **intentionally omit**; role assignment is **changed workflow** |
| Normal create form | Local account: email, full name, username, password, role group, role; employee lookup switches to SSO and derives name/email/username; employee preview is conditional | Current custom credential operation accepts name, username, email, password, photo | Custom credential endpoint **preserve**. Require one or more current role IDs and create their many-to-many mappings with the account. Employee-linked SSO provisioning is explicitly deferred; do not restore the legacy employee/SSO branch. |
| Update form | Full name, username, email, role, employee, optional password, photo; duplicate and employee ownership checks | Generic current update does not write email/password/image | Normal form preserves name, username, email, optional password, and photo. Use a custom Better Auth account-update operation, not generic database patching. Employee mapping remains deferred. |
| Status | Legacy lifecycle uses `user_active`, `user_nonactive`, `on_verification`, `user_rejected`, and `email_unverified`; list filters and approve/reject actions use status | Current database default is `active`; `statusCode` is in current form field order with renderer `text` | Implement the five legacy lifecycle values through the new account design. Status remains display/filter/workflow only: **intentionally omit** it from the normal form. Remove the incompatible renderer override later; retain table/detail display defaults. |
| Defaults/uniqueness | Local login method and username are server-derived; employee-linked SSO is a legacy path; email and username unique; password hashed; audit and employee link updated in service | Current endpoint requires credential fields and server writes the user record | **Server-generated** login/status/audit/password hashing; preserve email/username uniqueness. The custom account-update operation sends email/password transitions through Better Auth. Employee-linked SSO provisioning is explicitly deferred from Plan 002. |
| Custom actions | Approve/reject, active/deactive, admin reset password, employee role mapping, user division/project mappings | Current role assignment is a many-to-many child workflow; Better Auth and this role design are deliberate current improvements | Preserve the intended legacy outcomes through the new account and many-to-many role design. Require initial role mapping during account creation; retain the child workflow for later changes. Do not restore the legacy single-role architecture. Each retained lifecycle action needs its own permission, operation, and rendered regression test. |

The immediate crash fix is therefore a later implementation step, not part of
this audit: remove `statusCode` from the User form field list and its form
renderer override, while keeping the table/detail status display. The later
User implementation must use the lifecycle values `user_active`,
`user_nonactive`, `on_verification`, `user_rejected`, and `email_unverified`
through the new account design. Do not add a source to the `text` renderer and
do not change framework code.

#### Master-data parity

##### Business Categories

Evidence: legacy `backend-ads-laravel/app/Models/BusinessCategories.php:26-29,64-93`,
legacy `frontend-ads-vuejs/src/app/configs/business-categories.ts`, current
colocated Business Category API entity/model, local web resource, and current
business-category route files.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit/list/detail | `name`, optional `code`, `description`, `active`, plus ID/audit/timestamps on reads | `code`, `name`, `description`, `active`, with code required and unique | Business fields **preserve**; technical fields **intentionally omit**; code requiredness and list/detail description visibility are **product decisions** |
| Defaults/constraints | Active true; code unique in model; audit service fields | Active true; database code unique; API trims code | **Preserve** validation intent; **server-generated** active/audit |

##### Divisions

Evidence: legacy `backend-ads-laravel/app/Models/Divisions.php:26-29,65-126`,
legacy `frontend-ads-vuejs/src/app/configs/divisions.ts`, current master-data
entity/routes/resource and division route files.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit form | Business category lookup, name, optional code/description, thumbnail, active | Business category lookup, code, name, description, active; image is absent | Category/name/description/active **preserve**; thumbnail needs an upload decision; code requiredness is a **product decision** |
| List/detail | Category relation label, name/code/description/image/active, audit fields | Code/name/category relation/active and audit fields | Relation label **preserve**; technical fields **intentionally omit**; image visibility is a **product decision** |
| Rules/workflow | Category required; upload conversion; user division filters for selected role groups | Category required; active-parent validation; current status default | Upload and role-based filtering are **changed workflow/product decisions**; status is **server-generated** unless product requires a status form |

##### Projects

Evidence: legacy `backend-ads-laravel/app/Models/Projects.php:26-29,75-152`,
legacy `backend-ads-laravel/app/Services/Projects/CompleteProjects.php`,
legacy `frontend-ads-vuejs/src/app/configs/projects.ts`,
`frontend-ads-vuejs/src/views/authenticated/initiation/projects/projects.vue`,
and `layouts/ProjectDetail.vue`; current master-data entity/routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit form | Name, short name, division lookup, number, location widget, required start date, optional end date, description, active | Name, division lookup, number, integration code, text location, dates, description, active | Shared fields **preserve**; short name/image are missing and need **product decisions**; location requires the legacy structured renderer decision |
| List/detail | Short name, division label, number, location, dates, description, derived implementation status, audit fields | Number/name/division/location/dates/description/active; no derived implementation status | Business fields **preserve**; derived status is display-only **intentionally omit** from ordinary form; current integration code is a **product decision** against the legacy contract |
| Workflow | Draft completion custom action sets dates/location/description/status and creates project periods; tabs filter active/nonactive/draft | Standard CRUD route only | Completion and project-period creation are **changed workflow**; do not replace with a generic edit form |
| Rules/defaults | Division required, number and integration uniqueness, location JSON, status/date-derived display | Division/number/integration required; active/status defaults and parent checks | Uniqueness and requiredness differences are **product decisions**; defaults/status **server-generated** |

##### Work Items

Evidence: legacy `backend-ads-laravel/app/Models/WorkItems.php:25-35,64-151`,
legacy `backend-ads-laravel/app/Http/Controllers/ImportExcelController.php`,
`GenerateImportTemplateController.php`, and custom callbacks in the model;
legacy `frontend-ads-vuejs/src/views/authenticated/initiation/work-items/work-items.vue`;
current master-data entity/routes/resource and work-item route files.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| List/detail | Project/category/name/high-risk/level/parent/volume/UOM/active, relation labels, tree-derived ITP flags, audit fields | Project/parent/code/name/level/UOM/active; volume, category, risk, and ITP data are absent from the form catalog | Tree business fields need a **product decision**; relation labels **preserve**; audit fields **intentionally omit**; `code` is current-only and needs a **product decision** |
| Create/update form | Division then project filter; root/child modal changes fields; category select, name, required volume number, UOM select, required high-risk radio; root/child IDs and level are injected | Standard FormView with project/parent/code/name/level/UOM/active | Parent/tree workflow is **changed workflow**; category/volume/high-risk are candidates to **preserve**; level/project/parent injection is **server-generated or workflow-owned** |
| Side effects | Soft delete; root level creates schedule; child removes parent ITP and clears volume/UOM; update/delete restore parent values; import endpoint | Generic CRUD with cycle, same-project parent, active-parent, and reference validation | Legacy callbacks/import and current validation are **changed workflow/product decisions**; do not implement tree semantics in a scalar form without a decision |

##### UOMs

Evidence: legacy `backend-ads-laravel/app/Models/Uoms.php:26-29,60-88`,
legacy `frontend-ads-vuejs/src/app/configs/uoms.ts`, current master-data entity/routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit/list/detail | Name, optional code, required `uom_type`, active; UI shows name/active only | Code, name, description, active; no `uomType` column | Name/active **preserve**; `uomType` is server/query supplied for work items; code/description exposure is a **product decision** |
| Workflow/defaults | List filters `uom_type=work-items`; create injects the same value | Standard list/create has no type filter/injected value | Filter and create injection are **changed workflow** and must be retained or explicitly omitted |

##### PTS Work Categories

Evidence: legacy `backend-ads-laravel/app/Models/PtsWorkCategories.php:26-29,60-87`,
legacy `frontend-ads-vuejs/src/app/configs/pts-work-categories.ts`, current
master-data entity/routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit/list/detail | Name, optional code, description, active; legacy UI shows name/active | Code, name, description, active; code required and unique | Business fields **preserve**; code requiredness and code visibility are **product decisions**; audit/ID **intentionally omit** |

##### Root Causes

Evidence: legacy `backend-ads-laravel/app/Models/RootCauses.php:26-29,60-87`,
legacy `frontend-ads-vuejs/src/app/configs/root-causes.ts`, current master-data
entity/routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit/list/detail | Name, optional code, description, active; code is shown in legacy UI | Code, name, description, active; code required and unique | Business fields **preserve**; code requiredness is a **product decision**; audit/ID **intentionally omit** |
| Filter/defaults | Active filter; active boolean | Active default and active table/form field | Active behavior **preserve**; audit **server-generated** |

##### Project Vendors

Evidence: legacy `backend-ads-laravel/app/Models/ProjectVendor.php:26-29,60-96`,
legacy `frontend-ads-vuejs/src/app/configs/project-vendor.ts`,
`frontend-ads-vuejs/src/views/authenticated/initiation/projects/layouts/layouts/ProjectVendor.vue`,
and `ProjectDetail.vue`; current master-data entity/routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit/list/detail | Nested under a project; parent supplies `project_id`; UI shows vendor name only; detail action disabled | Standalone CRUD with project lookup, name, description, active | Keep both paths: standalone CRUD preserves the current improvement, while a Project-detail child screen preserves the scoped legacy workflow. Both use the same fields and resource. |
| Rules | Project required; no model uniqueness; optional status validation; relation label | Project required; current generic relation and active validation; no status field | Parent assignment/filter **preserve** through the Project child screen; standalone creation uses the required Project lookup. Technical fields **intentionally omit**. |

##### Number Variables

Evidence: legacy `backend-ads-laravel/app/Models/NumberVariables.php:26-29,60-87`,
legacy seeder `backend-ads-laravel/database/seeders/S38NumberVariablesSeeder.php`,
absence of a dedicated legacy frontend config/route, and current master-data
entity/routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit/list/detail | Name and code required, description, active, audit fields; no model `FIELD_UNIQUE`; seeded by code upsert | Code unique, name, description, active; standard CRUD route/resource | Business fields **preserve**; current uniqueness versus legacy model is a **product decision**; current UI exposure is a **product decision** because legacy has no dedicated screen |
| Defaults/workflow | Active true; code-based seed maintenance | Active true; generic CRUD | Active/audit **server-generated**; seed/update workflow needs a decision |

##### Number Configurations

Evidence: legacy `backend-ads-laravel/app/Models/NumberConfigs.php:26-29,60-111`,
legacy `backend-ads-laravel/app/Models/NumberConfigs.php` callbacks,
`backend-ads-laravel/app/Helpers/globalFunction.php`, absence of a dedicated
legacy frontend config/route, and current master-data entity/routes/resource.

| Surface | Legacy contract | Current contract | Classification |
|---|---|---|---|
| Add/edit/list/detail | Number variable code lookup, digits, custom code, display order, description, active, audit fields | Number variable lookup by code, required display order, digits/custom code/description/active | Business fields **preserve**; relation label uses code; IDs/audit **intentionally omit** |
| Defaults/constraints | `beforeInsert` assigns next display order; no model uniqueness; variable code must exist | Display order is required by schema; active display order has a current unique index | Server-generated display order is a **product decision**; current uniqueness is a **product decision**; do not force manual order entry until resolved |
| Workflow | Used by global number generation; no legacy CRUD screen found | Standard CRUD route/resource | Generated-number dependency is **changed workflow**; preserve its authority and add a screen only by product decision |

#### Required rendered Form/FormView regression matrix

These are required after parity decisions and before Plan 002 can return to
the completion gate. Each test must mount the real framework `Form` or
`FormView` with the resource fields. A resource-shape assertion alone is not
enough. Test the field with its real source and renderer so a renderer/source
merge cannot reach production again.

| Module and test target | Combination that must render | Required assertion |
|---|---|---|
| Role Groups | text, textarea, checkbox | Form mounts and submits the mapped scalar fields |
| Roles | `lookup` source `roleGroups` plus `radio` static assignment-scope source | Both inputs mount; lookup value is an ID and radio value is an API enum |
| Permissions | scalar fields with current permission-group contract | Form mounts with the resolved required-field decision |
| Users create | custom credential FormView with password/text/photo fields, required multi-role assignment, and no `statusCode` form field | Create form mounts; no text renderer receives the status radio source; the custom operation validates one or more roles and creates the account plus mappings |
| Users update/status boundary | update FormView with name, username, email, optional password, and image photo; display-only status and lifecycle actions for the five approved values | Update form submits credential changes through the custom Better Auth operation, does not render `statusCode` as an input, and each lifecycle action uses its own workflow contract |
| Users role boundary | many-to-many role assignment child workflow | Role assignment mounts through the current child resource; no legacy single `role_id` field is restored |
| Users deferred SSO boundary | no employee-linked SSO branch in Plan 002 | The normal account form does not render an employee lookup or SSO provisioning path |
| Divisions | business-category `lookup` plus image renderer/upload path | Lookup and image field mount with the selected upload contract |
| Projects | division `lookup`, date fields, address/latitude/longitude fields mapped to one location object, status chip/complete-workflow boundary | Standard form mounts; location serializes to the validated object and the complete action remains separate |
| Work Items | project/parent/UOM/category lookups, project-filtered parent reset, number volume, boolean high-risk radio | Root and child variants render with the correct field set and no stale parent value |
| UOMs | scalar form plus server-supplied `uomType` list/create context | Type is not entered as an ID or hidden accidental form field |
| Project Vendors | Project-detail child context plus standalone Project lookup | Both access paths submit the same Project assignment and share the Vendor resource/API contract |
| Number Configurations | number-variable lookup with `pick: code`, custom detail loader, number inputs, server/default display order | Lookup source and selected value normalize; display order does not require a value if server-owned |
| All active/status displays | chip/radio status display versus checkbox/switch active input | Display-only status fields have no incompatible source; active checkbox/switch has no option source |

Do not add broad scalar-field snapshots. Add only these rendered regression
tests and the focused API tests needed for each changed workflow.

#### Implementation plan after the parity stop

1. **Apply the approved architecture boundaries.** Preserve Better Auth,
   UUIDs, and many-to-many role assignment. Never add IDs to client forms or
   write schemas. Do not restore the legacy single-role architecture.
   Employee-linked SSO provisioning is deferred and out of Plan 002. Apply
   the approved migration and API changes in this plan; do not add any field,
   permission, or workflow that is outside this parity record.
2. **Repair Settings and Users.** First remove `statusCode` from the User
   normal form and its incompatible form renderer, retaining table/detail
   status display. Add required initial multi-role assignment to the custom
   credential-create contract and complete its mappings in the managed create
   operation. Add the custom Better Auth account-update operation for name,
   username, email, optional password, and image photo; do not use generic
   database patching for credential fields. Implement `user_active`,
   `user_nonactive`,
   `on_verification`, `user_rejected`, and `email_unverified` through the new
   account design and separate lifecycle actions. Keep Better Auth and the
   many-to-many role workflow. Do not implement employee-linked SSO
   provisioning in Plan 002. Re-check Role Groups, Roles, and Permissions
   against their legacy form surfaces and constraints.
3. **Repair independent master catalogs.** Apply approved decisions to
   Business Categories, UOMs, PTS Work Categories, Root Causes, Number
   Variables, and Number Configurations. Preserve server defaults, UOM type
   filtering, and generated display order where selected. Keep lookup fields
   on existing resources.
4. **Repair dependency master data.** Align Divisions, Projects, Work Items,
   and Project Vendors. Add the Project-detail Vendor child screen while
   retaining standalone Vendor CRUD. Migrate Project location to the validated
   `{ address, lat, lng }` object and map it to standard form fields; do not
   add a map provider. Preserve parent lookup filtering and reset behavior.
   Keep Project completion and Work Item tree/import/callback behavior as
   separate workflow operations when selected; do not hide them in a generic
   FormView.
5. **Add the rendered regression matrix.** Put focused tests beside the
   affected resource/route tests. Mount real `Form`/`FormView` for every
   special source/renderer combination in the matrix, including Users. Do
   not change `packages/is-vue-framework`; report a framework gap separately.
6. **Run the completion gate.** Run focused tests first, then:
   `pnpm --filter @southneuhof/api test`,
   `pnpm --filter @southneuhof/framework-web test`,
   `pnpm --filter @southneuhof/api type-check`,
   `pnpm --filter @southneuhof/framework-web type-check`, and
   `git diff --check`. Perform the manual User Form/FormView check and the
   special-source smoke checks before marking Plan 002 complete.

#### Current stop conditions

- Do not apply the narrow `statusCode` patch before this parity record is
  accepted as the source of truth for the User form.
- Do not restore legacy integer IDs, client-supplied UUIDs, the legacy
  single-role architecture, or employee-linked SSO provisioning in Plan 002.
- Do not use a generic `active` value as a replacement for the approved User
  lifecycle values. The five lifecycle values must be explicit in the new
  account design.
- Do not add a direct route fetch, endpoint, resource facade, or untyped
  lookup placeholder for any missing source.
- Do not change framework code. The FormView operation-context suggestion is
  a separate, non-blocking framework proposal.
- Do not mark Plan 002 complete until the approved migration/API changes,
  rendered regression matrix, manual checks, and independent completion gate
  all pass.

## Test plan

- One field inventory section for every current administration module.
- Standard modules: resource capability, required-field, relationship lookup,
  and Form/FormView render tests.
- User: API authorization and validation plus normalized create capability.
- App: failing and healthy route render cases.
- No network browser tests, snapshot tests, or broad scalar-field matrices.
- The legacy parity revision requires the rendered Form/FormView matrix in
  Step 7 before the completion gate can be restored.

## Done criteria

- [x] The inventory has all 14 named module sections.
- [x] Every current Settings and master-data create/edit route uses FormView,
  except a documented workflow action.
- [x] Every required API form field is visible or documented as server supplied.
- [x] No foreign key in these modules requires manual UUID entry.
- [x] User creation uses a typed resource capability and keeps the custom
  credential endpoint.
- [x] Root render failures have a generic visible fallback.
- [x] API and web tests and type checks pass.
- [x] No framework package changed.
- [x] Legacy parity inventory and approved module-group decisions are
  recorded in Step 7.
- [ ] Rendered Form/FormView regression matrix passes, including Users.
- [ ] `plans/README.md` marks Plan 002 as DONE only after the revised gate.

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
