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

## Verdict — what the slice actually found (2026-07-27)

Plans 022–025 are implemented. **No change to `packages/sprindle` or
`packages/is-vue-framework` was necessary.** That is the headline: a config-driven approval workflow,
a polymorphically-targeted notification subsystem, and caller-scoped lists were all expressible in
the frameworks as they stand.

The three questions the slice was built to answer:

1. **Can a custom `ModelSource` express a caller-scoped list?** **Yes**, and it did not need the
   fallback plan 023 held in reserve. `ModelSource.list` receives only `{ query, context }`, and
   `context` is the *model* runtime context built once by `defineModel` and shared across requests —
   so the source genuinely cannot see the caller *through the context*. But `list()` is a route
   *factory*, and a model-level `before` hook may patch `state`; `state.query` is what reaches the
   source. Identity travels that channel. See `apps/api/src/routes/notifications/notifications.source.ts`.
   *Caveat found in the same place:* `ModelSource.detail` receives only an id, so the same trick does
   not work for it. The framework `detail()` route would have read any row by id, so it is not
   registered — a scoped custom route replaces it.
2. **Can one transaction span a workflow's multi-table writes, with dispatch after commit?**
   **Yes, comfortably.** `seedChain`/`advanceChain` take a transaction handle rather than reaching for
   the database, so the route owns the boundary. Two things fell out of drawing it explicitly: the
   current-step lookup and the authorization check belong *inside* the transaction with the write
   they guard (otherwise two verifiers can both advance the chain), and recipient resolution belongs
   *outside* it with delivery. A test injects a failure after every write and before commit and
   asserts nothing survives.
3. **Can a record-state-dependent control be expressed without a framework change?** **Yes**, but not
   the way the earlier note assumed. A custom `ViewControl` is indeed enough — however `DetailProps`
   does not hand its loaded record back to the parent, so the *route* has to load the record and pass
   it to `DetailView` through `data`. That is one extra line, not a framework gap, but it is the
   part that was mispredicted.

Two further findings worth carrying to the next module:

- **Relation hydration is one level deep.** `materialize` builds its `with` clause from the entity's
  own relation fields, so a *nested* entity is loaded without its relations and then fails its own
  select schema. Anything nested inside another entity's `schemas.select` must itself be a leaf.
  `employee` had to become one so `overtimes` could nest it.
- **A route registered outside a model has no `context.entity`.** Anything returning through
  `source.materialize()` must live in a model's route tree.

### What was *not* proven

- The chain engine has exactly one consumer. It is written to be reusable and has not been reused;
  do not generalize it further until a second module needs it.
- Delivery is an in-memory transport. Nothing here proves a real push integration works.
- Realized-hours calculation was cut (it needs an attendance subsystem) and real-time delivery was
  cut (the badge polls). Neither absence was a framework limitation.

### The ordering rule, now enforced in one place

Notification rows are written *inside* the verification transaction; transport dispatch happens
*after commit*, fire-and-forget, in `notifyAfterCommit`. Both halves live there rather than at call
sites because getting either wrong is invisible until it matters: delivering inside the transaction
announces work that then rolls back, and letting `deliver` reject would roll back a verification
because a push service was down.

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
non-functional against the new backend.

**Fixed in plan 022.** Real RPC routes (`GET/PUT/DELETE /users/:userId/roles[/:roleId]`) replaced the
dead endpoint, and the spec now asserts against those routes rather than a mocked HTTP helper —
mocking the helper is precisely what let the broken call survive.

## Open questions — all settled

1. **Schema source of truth** — *narrowed, no longer blocking.* The legacy model files have drifted
   from the real database: `app/Models/LogVerifications.php`'s `FIELD_TYPE` declares neither
   `user_receiver_id` nor `verificator_type`, yet every `DoVerif*` service inserts both. Since the
   decision is to re-model fresh rather than mirror, a dump would inform **column semantics** but not
   table shape, so its absence no longer blocks planning. Default: reconstruct from service usage and
   state that explicitly in each plan. A dump would still be worth having to confirm the semantics of
   `config_verificators` and the notification status values.
2. **Chain seeding** — *settled.* The chain is seeded **eagerly at submit**. `orderNumber` starts at
   1 and there is no `order_number == 0` sentinel, so no branch has to decide whether the chain is
   real yet. Recorded again in `apps/api/src/routes/verification/chain.ts`.

### Deliberate divergences from the reference, now implemented

- **Eager chain seeding**, as above.
- **One notification per step inserted up front** (step 1 `unseen`, later steps `unset`) rather than
  one row rewritten back to `unseen` as each step activates. Same observable behavior, and the
  timeline survives.
- **Recipient resolution unions its three rules.** `sendPushNotif.php` assigns rather than appends in
  each branch, so a row naming both a job position and a role only ever reaches the role. That is a
  bug there, not a specification. Consequence: imported rows with two targets fan out more widely here.
- **`roles.scope` replaces `min(role_group_id)`** and its hardcoded id sets. If real data is ever
  imported, that mapping belongs in the import script, not the schema.

## Dependency

Plan 021 (browser-safe entity schemas) should land first. Without it this slice's ~10 tables each
need a hand-mirrored Zod schema in `packages/contracts`, which is the cost that decides whether
the architecture scales to HKA TROM's ~200 models.
