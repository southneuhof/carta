# RBAC Parity Design

Date: 2026-08-11

## Purpose

This design keeps the useful authorization mechanics from `ads-hk-legacy` while it uses Better Auth for identity data. It does not copy the legacy schema or its context-switch authorization model.

The design has two independent authorization realms:

- The system realm controls system modules and system operations.
- The project realm controls project modules and project records.

A user can have many roles in each realm. All matching active roles add permissions. The two realms never add permissions to each other.

## Verified Current-State Findings

| Priority | Finding | Type | Impact | Effort | Risk | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | The installed role delete route uses generic deletion. Cascade foreign keys can remove assigned role records. A safer role delete model exists but is not installed. | Defect | High | Small | Medium | High |
| 2 | Project authorization can use a system permission together with `access-all-projects`. This mixes the system and project realms. | Design gap | High | Medium | High | High |
| 3 | The current project assignment table supports one project only. It cannot represent all-project or division project coverage. | Design gap | High | Medium | Medium | High |
| 4 | Permission records have general CRUD routes, but application routes use fixed permission codes. This permits schema state that the application does not understand. | Design gap | Medium | Small | Medium | High |
| 5 | The browser stores the user profile and permissions in local storage. These values can become stale after an account or role change. | Design gap | Medium | Medium | Medium | High |
| 6 | There is no focused test suite for the RBAC resolver and its scope rules. Existing feature tests do not define the full authorization contract. | Test gap | High | Medium | Low | High |

Evidence:

- `apps/api/src/routes/roles/roles.ts`
- `apps/api/src/routes/roles/roles.model.ts`
- `apps/api/src/routes/roles/roles.entity.ts`
- `apps/api/src/identity.ts`
- `apps/api/src/routes/roles/project-users.routes.ts`
- `apps/web/src/routes/(public)/auth/login/index.route.vue`
- `apps/web/src/router/guards.ts`
- `apps/web/src/stores/permissions.ts`

## Legacy Mechanics to Keep

The new system keeps these mechanics:

- Roles contain permissions.
- Administrators assign roles to users.
- A user can get project access through a project-related assignment.
- The server calculates permissions and enforces them.
- The user administration page shows role assignments.
- Role and assignment active states stop access without data deletion.

The new system does not keep these legacy mechanics:

- One primary role on the user record.
- Magic role group identifiers.
- A selected division or project that changes authorization.
- Division permissions.
- A project role copied into the user's system role.
- A developer role identifier that bypasses checks.
- The legacy module-to-division gate.

## Identity Boundary

Better Auth owns these identity records:

- users
- accounts
- sessions
- verifications

The application owns modules, permissions, roles, and role assignments. Better Auth does not define the application authorization model.

The first account lifecycle has these rules:

- An administrator creates an account and sets its password.
- A user can read their profile but cannot edit it.
- A disabled user cannot start a session.
- When an administrator disables a user, the system removes that user's active sessions.

Public registration, approval, invitations, SSO, and email verification are not part of this change.

## Authorization Data Model

### Module

A module is code-owned configuration.

Fields:

- `code`
- `name`
- `realm`: `system` or `project`
- `active`

Administrators can view modules. They cannot create arbitrary module codes.

### Permission

A permission is code-owned configuration.

Fields:

- `code`
- `name`
- `description`
- `module_id`
- active state

A permission gets its realm from its module. Administrators can view permissions. They cannot create arbitrary permission codes.

### Role

Fields:

- `code`
- `name`
- `description`
- `realm`: `system` or `project`
- `active`

Administrators can create custom roles. A role can contain permissions only from the same realm.

An assigned role cannot be deleted. The API returns a conflict response and assignment counts. An administrator can deactivate the role after they review its effect. An unassigned custom role can be deleted.

### Role Permission

Fields:

- `role_id`
- `permission_id`
- `active`
- audit timestamps

The database has one row for each role and permission pair. A write is idempotent. A cross-realm pair is invalid.

### System Role Assignment

Fields:

- `user_id`
- `role_id`
- `active`
- audit actor and timestamps

Only a system role is valid. A user can have many system roles. Active permissions form a set union.

### Project Role Assignment

Fields:

- `user_id`
- `role_id`
- `coverage_type`: `all_projects`, `division`, or `project`
- `division_id`, present only for division coverage
- `project_id`, present only for project coverage
- `active`
- audit actor and timestamps

Only a project role is valid. A user can have many matching project roles. Active permissions form a set union.

Coverage has these meanings:

- `all_projects` covers all current and future projects.
- `division` covers all current and future projects whose current division is the selected division.
- `project` covers one project.

Division is project metadata and a dynamic selector. It is not an authorization realm. If a project moves to another division, division coverage follows the project's current division.

## Assignment Normalization

For one user and one role, a broader assignment replaces covered narrower assignments in the same transaction.

Examples:

- An all-project assignment replaces all division and project assignments for that user and role.
- A division assignment replaces project assignments for that user and role in that division.
- A project assignment cannot be added when an active all-project or matching division assignment already covers it.

This rule removes duplicates. It does not add deny rules or exceptions.

All assignment writes are transactional and idempotent. The audit record contains the actor, time, target user, role, coverage, and before-and-after values.

### Authorization Audit Event

A single append-only audit table records role permission changes and user assignment changes.

Fields:

- actor user identifier
- event time
- event type
- target user identifier when applicable
- role identifier
- coverage and target identifier when applicable
- before value
- after value

The write transaction creates the audit event. The first version does not add an audit-log user interface.

## Permission Resolution

### System Operation

For an active user, the resolver:

1. Gets active system role assignments.
2. Keeps active roles.
3. Gets active role-permission mappings and active permissions.
4. Keeps permissions from system modules.
5. Forms one permission set.
6. Checks the required operation code.

Project roles never take part in this check.

### Project Record Operation

For an active user and one project, the resolver:

1. Gets active project role assignments that match all projects, the project's current division, or the project identifier.
2. Keeps active roles.
3. Gets active role-permission mappings and active permissions.
4. Keeps permissions from project modules.
5. Forms one permission set.
6. Checks the required operation code.

System roles never take part in this check. There is no `access-all-projects` bridge.

### Resource Scope

Every server path that returns or changes project-owned data uses the same project scope: lists, details, actions, counts, searches, and exports.

| Code | Realm | Meaning |
| --- | --- | --- |
| `view-*` | system | Menu and typed admin URL |
| `list-*` | system | `GET …/list` |
| `detail-*` | system | `GET …/:id` |
| `create-*`, `update-*`, `delete-*` | system | Owner writes |
| Workflow actions | project | Per assigned project |

Default coverage is any active assignment. There is no `access-all-projects` bridge.

The database query applies the scope. The browser does not filter unauthorized records after retrieval.

Response rules:

- No session: `401 Unauthorized`.
- The record is outside the user's project scope: `404 Not Found`.
- The record is in scope, but the required operation is missing: `403 Forbidden`.

## API and Browser Data Flow

`/me` returns the active user and effective system permissions. The browser keeps this identity state in memory. It does not use local storage as an authorization source.

Project list and detail responses include allowed operations for each returned record. The server derives these operations from the project resolver. The browser uses them to show or disable controls. The API repeats the same check for every write.

The browser does not reproduce project coverage rules.

## Administration User Interface

### System Roles

The user detail page shows all system roles with switches. An enabled checked switch is a direct assignment. The administrator can enable or remove many roles.

### Project Roles

The page has two filters:

- The Division filter contains `All Divisions` and each division.
- The Project filter contains `All Projects` and the projects in the selected division scope.

These are assignment coverage selectors. They do not change the administrator's authorization context.

The filter values map to coverage as follows:

| Division filter | Project filter | Coverage written |
| --- | --- | --- |
| All Divisions | All Projects | All projects |
| One division | All Projects | That division |
| Any division filter | One project | That project |

The roles table edits the selected coverage. Each role switch has these states:

- Unchecked and enabled: the role does not apply at the selected scope.
- Checked and enabled: a direct assignment exists at the selected scope.
- Checked and disabled: a broader assignment supplies the role.

There is no visible `Inherited` text. A tooltip on the disabled control gives the source, such as `Assigned for All Projects` or `Assigned for Jakarta Division`. The read-only switch uses disabled styling and `aria-disabled="true"`, stays available to keyboard focus, and does not accept a change. Its accessible description contains the same source text.

To remove a checked disabled assignment, the administrator selects the source scope. At that source scope, the switch is checked and enabled.

The first version does not include role copy, select-all, or a current assignments table.

### Role Editor

The role editor shows permissions grouped by module. It supports individual permission switches. It does not support permission creation, role copy, or select-all.

## Seeded Administration Roles

The seed creates:

- A full system administration role.
- A Project Administrator project role with all active project permissions.
- A superadministrator account with the full system role.
- An all-project assignment of the Project Administrator role for the superadministrator.

There is no hard-coded superadministrator bypass.

## Reset Strategy

Current RBAC records are development data. The change resets and reseeds RBAC data. It does not add a compatibility layer or a legacy import path.

The implementation removes these current concepts:

- role groups
- `assignmentScope`
- `allowRegister`
- the current `user_roles` model
- the current exact-only `project_users` RBAC model
- the `access-all-projects` authorization bridge

## Required Domain Tests

The implementation must test observable authorization behavior:

- Many system roles add permissions.
- Many matching project roles add permissions.
- System and project realms stay isolated.
- Exact project, division, and all-project coverage work.
- Coverage includes future projects.
- Division coverage follows a project move.
- An inactive user, assignment, role, mapping, permission, or module grants no permission.
- A broader assignment removes covered narrower duplicates.
- A narrower assignment cannot be added under active broader coverage.
- Lists, details, actions, counts, searches, and exports use the same scope.
- The API returns `401`, `403`, and `404` as specified.
- Assigned role deletion is blocked.
- User disablement removes active sessions.
- Code registration and role mapping reject cross-realm permission use.
- The All Divisions and All Projects filters write the correct coverage.
- A direct switch is checked and enabled.
- A broader effective switch is checked and disabled with an accessible source description.
- Filter state reloads correctly.
- The self-profile is read-only.

Tests must not depend on table layout, snapshots, or internal helper structure.

## Deferred Work

The design keeps clear extension points but adds no unused implementation for:

- public registration and approval
- invitations
- SSO
- email verification
- self-profile editing
- division roles or division permissions
- selected authorization context
- direct user permission grants
- deny rules and exceptions
- role copy and select-all
- current assignments summary UI
- legacy data import
- real-time permission updates

## Implementation Order

1. Add characterization tests for the current resolver boundaries and the new domain rules.
2. Replace the RBAC schema and seed data.
3. Implement the two realm resolvers and the shared project query scope.
4. Replace role, permission, and assignment APIs.
5. Replace browser identity caching and add allowed operations to project responses.
6. Update the role and user administration pages.
7. Run domain tests, type checks, and the relevant feature tests.

This order keeps the authorization contract visible while each layer changes.
