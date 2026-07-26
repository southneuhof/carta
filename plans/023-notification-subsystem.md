# Plan 023: Build the notification subsystem and the scoped list seam

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat <022 merge SHA>..HEAD -- apps/api/src packages/sprindle/src
> ```
> This plan is written against the schema plan 022 establishes. If `apps/api/src/identity.ts` or the
> `employees` / `organization` entities differ from the excerpts below, reconcile before proceeding.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/022-rebuild-identity-and-org-structure.md`
- **Category**: direction (proof slice)
- **Planned at**: commit `4ab2c8f`, 2026-07-27

## Why this matters

The notification subsystem is the largest shared mechanism in the system being modelled — roughly
fifteen modules emit into it — and it is the part that most stresses the framework, because two of its
requirements have no expression in Sprindle's current vocabulary:

1. **The inbox list cannot be written as list query parameters.** `buildListPlan` in
   `packages/sprindle/src/source/drizzle-source.ts` turns every filter key into an `eq` and rejects
   unknown keys with a 400. The inbox needs a disjunction across three target columns plus a scope
   predicate plus a time window.
2. **Row-level scoping** has to come from the caller's organizational context, not from the query
   string, or any client can read another section's notifications by editing a URL.

The agreed answer to (1) is a custom `ModelSource` wrapping `createDrizzleSource`. That keeps the
`list()` wire contract, pagination, and the OpenAPI shape, and it exercises the "implement
`ModelSource`" extension point that `packages/sprindle/docs/reference.md` advertises under
"Extending" and which **nothing in this repository currently uses**. Whether that extension point is
genuinely usable is one of the two things this plan is built to find out.

This plan delivers no user-facing screen. Plan 024 emits notifications; plan 025 renders them.

## Current state

### What Sprindle gives you

`ModelSource` (`packages/sprindle/src/source/model-source.ts`) is six methods:

```ts
export type ModelSource<TRecord = unknown> = {
  list: (args: { query: Record<string, unknown>; context: ModelRuntimeContext }) => Promise<SourceListResult<TRecord> | TRecord[]>
  detail: (args: { id: string; context: ModelRuntimeContext }) => Promise<TRecord | null | undefined>
  create: (args: { input: unknown; context: ModelRuntimeContext }) => Promise<TRecord>
  update: (args: { id: string; input: unknown; context: ModelRuntimeContext }) => Promise<TRecord | null | undefined>
  delete: (args: { id: string; context: ModelRuntimeContext }) => Promise<boolean | TRecord | null | undefined>
  materialize: (input: unknown | unknown[], args: { context: ModelRuntimeContext }) => Promise<TRecord | TRecord[]>
}
```

`list()` (`packages/sprindle/src/routes/list.ts`) calls `context.entity.source.list({ query, context })`
and renders `{ data, page, limit, total }`. It does not inspect the query beyond
`listQuerySchema.parse`.

A custom route reaches the database directly through `getDb()`; the precedent is
`apps/api/src/routes/roles/role-permissions.routes.ts` and `products.routes.ts`. Writes made that way
bypass the source, so responses must go back through `context.entity.source.materialize()` to keep the
wire contract — `customProductMaterialize` in `products.routes.ts` shows the shape.

**Sprindle has no queue and no scheduler.** This is deliberate: `plans/README.md` records background
jobs as rejected from the framework core. Transport dispatch is therefore in-process.

### The reference behavior

External reference, never modified. From `hka-trom/backend`:

- `app/Models/Notifications.php` — the table. Targets are polymorphic: `role_id`, `job_position_id`,
  and `user_receiver_id` are each nullable and any combination may be set, always narrowed by
  `section_id`. `status_code` is `unseen` / `seen` / `unset`, where **`unset` means "a later step in a
  chain that is not this recipient's turn yet"** — it is not a read state.
- `app/Jobs/sendPushNotif.php` — recipient fan-out. Given one notification row it resolves a set of
  user ids: `user_receiver_id` → that employee's `user_id`; `job_position_id` → every employee in the
  section with that position; `role_id` → every active employee in the section holding that role.
  Then it deduplicates and hands the set to a transport.
- `app/Services/Custom/MyAction/GetTotalNotification.php` — the unread count: a `UNION` over the
  caller's roles, job position, and user id, restricted to the last 30 days and `status_code='unseen'`.
- `app/Models/Notifications.php::customFieldFilterable` — appends `AND notifications.section_id = <caller's section>`
  when the caller's role group is `ruas` (section-scoped).

**The trap, carried forward from `plans/NOTES-trom-proof-slice.md`:**
`notifications.user_receiver_id` holds an **employee id, not a user id**. `sendPushNotif.php` joins
`employees e ON e.id = n.user_receiver_id` and then reads `e.user_id` to reach the device. This plan
names the column for what it holds.

### Identity, from plan 022

```ts
export type OrgIdentity = {
  userId: string
  employeeId: string | null
  sectionId: string | null
  jobPositionId: string | null
  roleIds: string[]
  scope: RoleScope            // 'all' | 'central' | 'section' | 'owner', widest first
  permissions: ReadonlySet<string>
}
export async function orgIdentity(args: RouteHandlerArgs): Promise<OrgIdentity | null>
```

### Conventions

As in plan 022: `apps/api/AGENTS.md` for adding a resource, `createEntity` from
`@southneuhof/sprindle/entity`, no node builtins in entity modules, exemplar
`apps/api/src/routes/products/`, vocabulary from `packages/sprindle/docs/reference.md`.

## Commands you will need

Identical to plan 022's table. The ones used most here:

| Purpose | Command |
|---|---|
| API types | `pnpm --filter @southneuhof/api type-check` |
| API tests | `pnpm --filter @southneuhof/api test` |
| Generate migration | `pnpm --filter @southneuhof/api db:generate` |
| Apply migrations | `pnpm --filter @southneuhof/api db:migrate` |
| Seed | `pnpm --filter @southneuhof/api db:seed` |

**Migrations are additive from here on.** Plan 022 established the baseline; this plan adds a normal
versioned migration on top. Do not reset the database and do not edit plan 022's migration.

## Scope

**In scope**:

- `apps/api/src/routes/notifications/` (create: entity, model, routes, source, composition)
- `apps/api/src/routes/verification/` (create: `configVerificators`, `logVerifications` — the chain
  tables, no routes yet; plan 024 drives them)
- `apps/api/src/notifications/transport.ts` (create)
- `apps/api/src/routes/index.ts` (registration)
- `apps/api/scripts/seed.ts` (verificator configuration and sample notifications)
- `apps/api/src/__tests__/notifications.spec.ts` (create)
- `apps/api/drizzle/` (one new migration)
- `plans/README.md`

**Out of scope**:

- `overtimes` and anything that *emits* notifications — plan 024.
- Any web app file — plan 025.
- Real push transports (FCM, APNs, OneSignal). The seam plus an in-memory implementation is the whole
  delivery. Do not add an HTTP client, credentials, or a device-token table.
- A queue, scheduler, or retry system.
- `packages/sprindle/**`. If a framework change looks necessary, STOP and report — that finding is
  more valuable than the workaround.

## Target schema

```ts
// verification/verification.entity.ts
configVerificators: id, moduleName, sectionTypeId -> sectionTypes.id, orderNumber (integer),
                    verificatorType (text: 'jobPosition' | 'sectionGroupHead' | 'sectionRantingHead'),
                    jobPositionId -> jobPositions.id (nullable), createdAt, updatedAt

logVerifications:   id, moduleName, moduleId (text), orderNumber (integer),
                    verificatorType (text), jobPositionId -> jobPositions.id (nullable),
                    recipientEmployeeId -> employees.id (nullable),
                    statusCode (text: 'pending' | 'waiting' | 'approved' | 'rejected'),
                    verifiedByUserId -> users.id (nullable), verifiedAt, verifiedDescription,
                    createdAt, updatedAt

// notifications/notifications.entity.ts
notifications: id,
               recipientEmployeeId -> employees.id (nullable),   // legacy: user_receiver_id
               jobPositionId       -> jobPositions.id (nullable),
               roleId              -> roles.id (nullable),
               sectionId           -> tollSections.id (nullable),
               title, content,
               statusCode (text: 'unseen' | 'seen' | 'unset'),
               notificationType (text), moduleName (text), moduleId (text, nullable),
               payload (jsonb, nullable),                        // legacy: json_data
               createdByUserId -> users.id (nullable), createdAt, updatedAt
```

`statusCode` values keep their reference meanings, and the entity file must say so in a comment:
`unseen` = delivered and unread; `seen` = read; **`unset` = a later chain step whose turn has not
come**. A future reader will otherwise assume `unset` is a null-ish read state and break the chain.

`orderNumber` starts at 1. The reference system's `order_number == 0` sentinel is not reproduced; plan
024 seeds chains eagerly.

## Steps

### Step 1: Add the chain and notification tables

Create `apps/api/src/routes/verification/verification.entity.ts` (tables only, no `createEntity` — plan
024 decides whether these get endpoints) and `verification.ts` with a `defineDomainPart`.

Create `apps/api/src/routes/notifications/notifications.entity.ts` per the target schema, with a
`defineRelationsPart` joining `notifications` to `employees`, `jobPositions`, `roles`, and
`tollSections`, and a `select` schema extending those relations.

Do not register yet — Step 6 registers everything at once.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 2: Write the recipient-resolution seam

Create `apps/api/src/routes/notifications/recipients.ts`:

```ts
/** Every user who should receive this notification, deduplicated. */
export async function resolveRecipients(notification: NotificationRecord): Promise<string[]>
```

Three rules, from `sendPushNotif.php`, applied in order and unioned:

1. `recipientEmployeeId` set → that employee's `userId`, when non-null.
2. `jobPositionId` set → the `userId` of every **active** employee whose `sectionId` matches the
   notification's `sectionId` and whose `jobPositionId` matches.
3. `roleId` set → the `userId` of every active employee in that section whose user holds that role
   through an **active** `userRoles` row.

Employees without a `userId` are silently skipped — that is the person-without-login case, not an
error. Deduplicate the final set.

Note the reference implementation **overwrites** rather than unions (`$userReceiverIds = array_column(...)`
in each branch), so a row with both a job position and a role only fans out to the role. That is a bug
in the reference, not a specification. Union, and record the divergence in a comment.

**Verify**: covered by Step 5's tests.

### Step 3: Write the transport seam

Create `apps/api/src/notifications/transport.ts`:

```ts
export type DeliveredNotification = { notificationId: string; userIds: string[]; title: string; content: string }

export type NotificationTransport = {
  /** Fire-and-forget. Never throws into the caller; log and swallow. */
  deliver(message: DeliveredNotification): Promise<void>
}

/** Development and test transport: records deliveries in memory. */
export function createMemoryTransport(): NotificationTransport & { delivered: DeliveredNotification[] }
```

Two rules the implementation must honor:

- `deliver` must never reject into its caller. A transport failure must not fail the request that
  created the notification, and — critically for plan 024 — must never roll back a verification.
- Delivery is dispatched **after** the writing transaction commits. Provide a helper
  `notifyAfterCommit(...)` that plan 024 calls, so the ordering rule lives in one place rather than in
  each caller.

Install the transport alongside the database in `apps/api/src/app.ts`'s existing middleware, or export
a module-level accessor mirroring `getDb()`. Prefer the accessor — it matches the established shape.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 4: Write the scoped source — the framework question

Create `apps/api/src/routes/notifications/notifications.source.ts`.

Build a `ModelSource` that wraps `createDrizzleSource` and narrows `list` to the caller. Delegate
`detail`, `create`, `update`, `delete`, and `materialize` to the wrapped source unchanged; only `list`
gets a scope predicate.

The predicate, from `GetTotalNotification.php` and `customFieldFilterable`:

```
(recipientEmployeeId = :employeeId OR jobPositionId = :jobPositionId OR roleId IN (:roleIds))
AND (scope is 'all' or 'central'  OR  sectionId = :callerSectionId)
AND createdAt >= now() - interval '30 days'
```

A caller with no employee row and no roles matches nothing — return an empty page, never everything.
Assert that explicitly in the tests; it is the failure mode that leaks another section's data.

The source needs the caller's identity, which `ModelSource.list` receives only as
`ModelRuntimeContext`, not as request args. Resolve this in whichever of these works, in order of
preference, and **record which one you used and why** in a comment:

1. A model-level `before` hook that resolves `orgIdentity` and puts it in `args.state`, with the
   source reading it from a request-scoped store keyed by the Hono context.
2. A custom `list` route that resolves identity itself and calls the source with the scope already
   applied, keeping `list()`'s response shape by hand.

If neither is expressible cleanly, that is a genuine framework finding: `ModelSource` would then be an
extension point that cannot see the caller. **Write it up, implement option 2 as the fallback, and
report** — do not add an argument to `ModelSource` in `packages/sprindle`, which is out of scope.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 5: Add routes

Create `apps/api/src/routes/notifications/notifications.model.ts`:

- `list: list()` backed by the scoped source, `authorize: [authenticated()]`
- `detail: detail()`
- **no** `create`, `update`, or `delete` — notifications are written by workflows, never by clients.
  Their absence is the authorization; do not add them and guard them.

Create `notifications.routes.ts` with two custom routes:

- `GET /notifications/unread-count` → `{ data: { total: number } }`, the same predicate as the scoped
  list plus `statusCode = 'unseen'`.
- `POST /notifications/mark-seen` → body `{ ids: string[] }`, sets `statusCode = 'seen'` for those ids
  **only where the caller is a valid recipient under the scope predicate**. Return the number updated.
  A caller passing someone else's id must update nothing and must still get a 200 with `updated: 0` —
  not a 403, which would confirm the id exists.

**Verify**: `pnpm --filter @southneuhof/api type-check` and `lint` → exit 0.

### Step 6: Register, seed, and migrate

Register the notification and verification domain parts and the notification model in
`apps/api/src/routes/index.ts` — both `domainParts` and `installedRoutes`.

Extend `apps/api/scripts/seed.ts`, keeping it idempotent: a `configVerificators` chain for module
`overtimes` with two ordered steps (one `jobPosition`, one `sectionGroupHead`), and a handful of
notifications across all three target kinds so plan 025 has something to render.

```sh
pnpm --filter @southneuhof/api db:generate
```

Review the SQL, then:

```sh
pnpm --filter @southneuhof/api db:migrate && pnpm --filter @southneuhof/api db:seed
```

**Verify**: `ls apps/api/drizzle/` shows exactly two migration folders.

### Step 7: Tests

Create `apps/api/src/__tests__/notifications.spec.ts`, patterned on `products.spec.ts`. Cover:

**Recipient resolution**
- employee target resolves to that employee's user
- employee target with a null `userId` resolves to nobody and does not throw
- job-position target resolves to every matching employee in that section, and to nobody in another section
- role target resolves through active `userRoles` only
- a notification with two target kinds set resolves to the **union** (the divergence from the reference)
- duplicates across rules are removed

**Scoped list**
- a section-scoped caller sees only their section
- an `all`-scoped caller sees every section
- a caller with no employee row and no roles sees an empty page — assert `data.length === 0` **and**
  `total === 0`
- notifications older than 30 days are excluded
- pagination and `total` still behave like any other `list()` (page 2 differs from page 1)

**Unread count and mark-seen**
- the count matches the scoped list filtered to `unseen`
- `mark-seen` with the caller's own ids updates them
- `mark-seen` with another section's id updates nothing and returns 200 with `updated: 0`

**Transport**
- a transport that throws does not fail the caller
- deliveries are recorded by the memory transport with the resolved user ids

## Done criteria

- [ ] `pnpm --filter @southneuhof/api type-check`, `lint`, `test` all exit 0
- [ ] `apps/api/src/__tests__/notifications.spec.ts` exists and covers every case above
- [ ] `ls apps/api/drizzle/` shows exactly two migration folders
- [ ] `pnpm --filter @southneuhof/api db:seed` run twice exits 0 both times
- [ ] `grep -rn "create\|update\|delete" apps/api/src/routes/notifications/notifications.model.ts`
      shows no CRUD write routes registered
- [ ] `git diff --stat packages/sprindle` is empty
- [ ] The scoped-source comment records which identity-resolution option was used and why
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` row updated

## STOP conditions

- Neither identity-resolution option in Step 4 works. Implement option 2, write up the finding, and
  report — this is a real framework result, not a failure.
- Any change appears necessary inside `packages/sprindle/`.
- The scoped list returns rows for a caller with no employee row and no roles. That is a data leak;
  stop and fix before continuing.
- `db:generate` produces a migration that drops or recreates a table from plan 022's baseline instead
  of adding new ones.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- **`unset` is not a read state.** It marks a chain step whose turn has not arrived. Plan 024 flips it
  to `unseen` when a step activates. Treating it as "unread" inflates every badge in the system.
- **Delivery is after-commit and fire-and-forget.** If a retry or delivery-receipt requirement ever
  appears, it needs a queue, and Sprindle has none by design (`plans/README.md`, backend findings
  rejected). That is an application-level decision, not a framework change.
- The recipient union differs deliberately from the reference implementation's overwrite behavior.
  If real data is ever imported, notifications with two target kinds will fan out more widely here
  than they did there.
- What a reviewer should scrutinize: the scope predicate's default-deny behavior, and that
  `mark-seen` cannot be used to probe for the existence of other sections' notification ids.
