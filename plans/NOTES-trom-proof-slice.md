# Note: accepted HKA TROM proof slice

**Status**: accepted, not scheduled. No plan files written yet.
**Decided**: 2026-07-27, against commit `4ab2c8f`.
**Reference repository**: `/Users/gamer/Documents/projects/hka-trom` (submodules `backend`,
`frontend`, `mobile`). Read-only reference — never modified by this repository's work.

This note records *which* slice we agreed to build and *why*, so the decision does not have to
be re-derived. It is not an implementation plan.

## The slice

**Overtime request (`overtimes` / "Pengajuan Lembur") end to end, plus a slice of the
notification subsystem.**

Primary evidence in the reference backend:

- `app/Services/Custom/HR/DoVerifOvertime.php` — the verification state machine (243 lines)
- `app/Models/Overtimes.php` — table shape
- `app/Models/Notifications.php`, `app/Models/NotificationTypes.php` — notification shape
- `app/Models/ConfigVerificators.php`, `app/Models/LogVerifications.php` — the chain
- `app/Jobs/sendPushNotif.php` — recipient fan-out and transport dispatch
- `app/Services/Custom/MyAction/GetTotalNotification.php` — the unread-count query
- Frontend: `src/components/navigations/topbar/layouts/Notifications.vue`,
  `src/views/authenticated/to-do/_layouts/Verification.vue`

## Why this one

HKA TROM's backend is a generic CRUD engine (`CrudController` plus ~200 model classes holding
const arrays). The real logic lives in `app/Services/Custom/**` — 41 modules — and nearly all of
them repeat one shape:

```
draft → submit → N-step verificator chain → approved/rejected
                       ↓ at each step
             log_verifications row + notifications row + push fan-out
```

The chain is configuration-driven: `config_verificators` keyed by `(module_name,
section_type_id)`, ordered, with `verificator_type` in `job_position | ka_shift | ka_ranting`.
The latter two resolve their recipient dynamically at runtime (the koreg of the submitter's regu;
the ka ranting of the submitter's ranting).

Overtime is the **smallest table that carries that entire shape**. Proving it once covers roughly
fifteen modules that repeat it verbatim.

### Rejected alternatives

| Candidate | Why not |
|---|---|
| General Transactions | Most representative, but `CreateGeneralTransaction.php` is 603 lines with three optional side-effect subsystems (vehicle issue, towing, asset damage) plus contract and shift-schedule validation. Too much surface for a proof. |
| Incidents / Accident reports | Heaviest module in the system, worst effort-to-signal ratio. |
| Inspection damages | Drags in SPM/SLA calculation and asset hierarchy. |
| Master data (roles, users) | Already migrated in `apps/web`; proves nothing new. |

## Decided parameters

1. **Schema**: re-model fresh in `apps/api` conventions (text/uuid ids, camelCase columns, own
   Drizzle migration). Not a mirror of the legacy Postgres schema.
2. **Location**: build in `apps/api` + `apps/web` alongside the existing products/roles/users
   exemplars, so framework gaps surface immediately and the slice doubles as a permanent
   acceptance fixture.
3. **Depth**: full verificator chain including dynamic `ka_shift` / `ka_ranting` resolution.
   Push stops at a `NotificationTransport` seam with an in-memory implementation — no FCM, no
   APNs, no OneSignal, no queue.

## Scope

**Tables in** (~10): `overtimes`, `log_verifications`, `notifications`, `config_verificators`,
`employees`, `job_positions`, `toll_sections`, `section_types`, `m_section_groups`,
`m_section_rantings`. Reuses the existing `users` / `roles` / `permissions`.

**Explicitly out**: file attachments and uploads, Excel/PDF export, langpacks, the mobile app, and
the legacy `notifications2` duplicate table (old `DoVerif*` services write to both).

**Screens**

| Route | Proves |
|---|---|
| `/hr/overtimes` | `ListView` plus a section-scoped list |
| `/hr/overtimes/new` | `FormView` plus schema-derived validation |
| `/hr/overtimes/:id` | `DetailView` plus the verification timeline as a child collection scoped by an ordinary `searchParameters` entry |
| verify / reject action | a custom workflow as ordinary Vue code plus `invalidate()` |
| `/to-do/verification` | the same notifications resource in a second query namespace |
| topbar drawer and badge | a typed module→route registry replacing the legacy ternary map |

**Notification sub-slice**

1. `notifications` entity — polymorphic target (`userReceiverId` / `jobPositionId` / `roleId`
   scoped by `sectionId`), `moduleName` + `moduleId` deep link, `unseen | seen | unset`.
2. Recipient resolution as a named seam (`resolveRecipients(notification) => userId[]`),
   replacing the raw SQL fan-out inside `sendPushNotif.php`.
3. `NotificationTransport` interface with an in-memory implementation.
4. `GET /notifications/list` scoped to the caller, `GET /notifications/unread-count`,
   `POST /notifications/mark-seen`.

## What the slice is meant to prove

Resolved during investigation, no longer open questions:

- **Transactions inside custom routes** — fine. `getDb().transaction()`; precedent in
  `apps/api/src/routes/roles/role-permissions.routes.ts`. Raw writes bypass the source, so
  responses must go back through `context.entity.source.materialize()` to keep the wire contract
  (see `customProductMaterialize` in `apps/api/src/routes/products/products.routes.ts`).
- **Record-state-dependent controls** — fine. `standardControls` already accepts `access` and
  `record` (`packages/is-vue-framework/src/resources/controls.ts:41`); Verify/Reject is a custom
  `ViewControl` with `onSelect`.

Still open, and the actual reason to build this:

1. **The inbox list cannot be expressed as list query parameters.** `buildListPlan` in
   `packages/sprindle/src/source/drizzle-source.ts` turns every filter key into `eq` and rejects
   unknown keys with 400. The inbox needs `(roleId IN my_roles OR jobPositionId = mine OR
   userReceiverId = me) AND section scope AND createdAt >= now() - 30 days`. Agreed direction: a
   custom `ModelSource` wrapping `createDrizzleSource` with a scope predicate — it keeps the
   `list()` wire contract and pagination, and it exercises the "implement `ModelSource`" escape
   hatch that `packages/sprindle/docs/reference.md` advertises and nothing currently uses.
2. **Per-request organizational context.** `identity()` returns only the better-auth session. The
   legacy equivalents are `getUserSectionId()`, `getUserJobPositionId()`, `getUserRoles()`. A
   model-level `before` hook can resolve this into `state`, but there is no way to share one hook
   across models except exporting a function. Whether that deserves a framework primitive is a
   question to answer by building it.
3. **Notification write versus transport ordering.** With no queue, the rule must be explicit:
   notification rows are written *inside* the verification transaction; transport dispatch happens
   *after commit*, fire-and-forget. Otherwise a failed push rolls back an approved overtime.

## Identity model — decided 2026-07-27

The current `apps/api` identity has one axis (`users.roleId`, a single `notNull` FK, also wired into
better-auth as `additionalFields: { roleId: { required: true, input: true } }`). TROM's helpers in
`backend/app/helpers/function.php:113-209` resolve five things:

| Question | Legacy source |
|---|---|
| who am I | `users.id` |
| which roles | `mapping_users_roles`, **many**, with an `active` flag |
| what scope class | `min(roles.role_group_id)` → `all` / `pusat` / `ruas` / `owner` |
| which section | `users.employee.section_id` |
| which job position | `users.employee.job_position_id` |

`hasPermission($code)` walks active roles → `mapping_roles_permissions` → `permissions.permission_code`,
honoring `active` on both the mapping and the permission.

Decisions:

1. **Person and login are separate.** `users` stays auth-only and better-auth keeps owning it. A new
   `employees` table holds the person and their organizational placement (section, job position) with
   a **nullable** `userId`. This is required, not stylistic: the verificator chain resolves
   `koreg_id` / `ka_ranting_id` to employees who may have no account, and every notification target is
   an employee.
2. **Roles are many-to-many.** `users.roleId` goes away, and with it the better-auth
   `additionalFields.roleId` requirement. The seed and `apps/web`'s role-assignment screen change with it.
3. **Scope is an explicit column**, `roles.scope`, an ordered enum `'all' | 'central' | 'section' |
   'owner'`. When a user holds several roles the widest wins — the same behavior as the legacy
   `min(role_group_id)` without the hardcoded id sets (`[1,2] → all`, `[10] → pusat`).
4. **Plan 022's mirror deletion folds into this work**, since the same entity files are being
   rewritten anyway.
5. **The database gets a clean reset**: every table in `public` dropped, the migration history and the
   single existing `20260726165456_lively_scarecrow` folder deleted, one fresh baseline migration
   generated, then re-seeded. Authorized 2026-07-27; to be confirmed once more immediately before
   running.

### Trap to carry into implementation

`notifications.user_receiver_id` **holds an employee id, not a user id**. `sendPushNotif.php` joins
`employees e ON e.id = n.user_receiver_id` and then uses `e.user_id` to reach the device. The new
schema should name this column for what it holds.

### Defect found while investigating

`apps/web/src/framework/adapters/resources/users.ts:103` posts to `mapping-user-roles/toggle`, a route
that does not exist in `apps/api`. The screen at `routes/(authenticated)/settings/users/[userId]/roles/`
calls it and `users.spec.ts:76` mocks `post`, so no test catches it. The role-assignment UI is
non-functional against the new backend. It is fixed as part of the identity rework, not separately.

## Open questions to settle before planning

1. **Schema source of truth** — *narrowed, no longer blocking.* The legacy model files have drifted
   from the real database: `app/Models/LogVerifications.php`'s `FIELD_TYPE` declares neither
   `user_receiver_id` nor `verificator_type`, yet every `DoVerif*` service inserts both. Since the
   decision is to re-model fresh rather than mirror, a dump would inform **column semantics** but not
   table shape, so its absence no longer blocks planning. Default: reconstruct from service usage and
   state that explicitly in each plan. A dump would still be worth having to confirm the semantics of
   `config_verificators` and the notification status values.
2. **Chain seeding.** `DoVerifOvertime.php` seeds the verificator chain lazily on first approval
   (`$dataVerif->order_number == 0` branch). Do we reproduce that, or seed the chain at submit
   time — cleaner, but a behavior change?

## Dependency

Plan 021 (browser-safe entity schemas) should land first. Without it this slice's ~10 tables each
need a hand-mirrored Zod schema in `packages/contracts`, which is the cost that decides whether
the architecture scales to HKA TROM's ~200 models.
