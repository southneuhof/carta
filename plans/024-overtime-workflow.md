# Plan 024: Build the overtime request workflow and its verificator chain

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat <023 merge SHA>..HEAD -- apps/api/src
> ```
> This plan builds on the identity from 022 and the notification subsystem from 023. If
> `apps/api/src/identity.ts`, `apps/api/src/routes/notifications/`, or the `verification` tables differ
> from the excerpts below, reconcile before proceeding.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/023-notification-subsystem.md`
- **Category**: direction (proof slice)
- **Planned at**: commit `4ab2c8f`, 2026-07-27

## Why this matters

This is the payload of the proof slice. The workflow shape it implements —

```
draft → submit → N-step configured verificator chain → approved / rejected
                        ↓ at each step
              a log row + a notification + an after-commit dispatch
```

— repeats verbatim across roughly fifteen modules in the system being modelled. Overtime is the
smallest table that carries all of it, which is why it was chosen (`plans/NOTES-trom-proof-slice.md`).

It is also where the last unresolved framework question gets answered: a state transition here writes
three tables at once, and Sprindle's transactional guarantee covers only the source's own `create` and
`update` (`packages/sprindle/src/source/drizzle-source.ts:46`, `:162`), not a custom route's writes.
Custom routes reach `getDb()` directly, so the transaction boundary is the application's to draw. This
plan draws it explicitly and records whether that is comfortable or awkward.

## Current state

### The reference implementation

External reference, never modified: `hka-trom/backend/app/Services/Custom/HR/DoVerifOvertime.php` (243
lines) and `app/Models/Overtimes.php`.

The reference verify handler, in order:

1. Loads the report; rejects unless `status_code = 'waiting'`.
2. Finds the current `log_verifications` row (`status_code='waiting'`, lowest `order_number`).
3. Authorizes: the caller's job position matches **and** their section matches the report's, **or** the
   caller is the named recipient employee, **or** the caller's role group is `all`.
4. Writes the log row: status, `verified_by`, `verified_at`, `verified_description`.
5. Marks the current recipient's notifications `seen`.
6. On approval, activates the next step: sets its log row to `waiting`, flips its notification to
   `unseen`, and dispatches a push.
7. When no next step exists, sets the report to its terminal status.

Two behaviors this plan deliberately changes:

- **Chain seeding.** The reference seeds the chain lazily, inside the first approval, via an
  `order_number == 0` sentinel branch. This plan seeds **eagerly at submit**. The chain then exists
  before anyone acts on it, `orderNumber` starts at 1, and there is no sentinel. Recorded as a
  divergence in `plans/NOTES-trom-proof-slice.md`; state it again in a code comment.
- **Notification reuse.** The reference `UPDATE`s an existing notification row back to `unseen` when a
  later step activates. This plan inserts one notification per step at seed time with
  `statusCode = 'unset'`, and flips it to `unseen` when its step activates. Same observable behavior,
  no row rewriting, and it is why 023's `unset` value exists.

### What 022 and 023 provide

```ts
// apps/api/src/identity.ts
export type OrgIdentity = {
  userId: string; employeeId: string | null; sectionId: string | null
  jobPositionId: string | null; roleIds: string[]
  scope: RoleScope            // 'all' | 'central' | 'section' | 'owner', widest first
  permissions: ReadonlySet<string>
}
export async function orgIdentity(args: RouteHandlerArgs): Promise<OrgIdentity | null>
export function requirePermission(code: string): RouteAuthorize
```

Chain tables (023): `configVerificators` (moduleName, sectionTypeId, orderNumber, verificatorType,
jobPositionId) and `logVerifications` (moduleName, moduleId, orderNumber, verificatorType,
jobPositionId, recipientEmployeeId, statusCode, verifiedByUserId, verifiedAt, verifiedDescription).

Notification seams (023): `resolveRecipients(notification)`, `NotificationTransport`,
`notifyAfterCommit(...)`.

Organization tables (022): `sectionGroups.koregEmployeeId` and `sectionRantings.headEmployeeId` are
what the `sectionGroupHead` and `sectionRantingHead` verificator types resolve to.

### Conventions

`apps/api/AGENTS.md` for adding a resource. Custom routes follow
`apps/api/src/routes/roles/role-permissions.routes.ts`. Writes made outside the source must return
through `context.entity.source.materialize()` — see `customProductMaterialize` in
`apps/api/src/routes/products/products.routes.ts`. Vocabulary from
`packages/sprindle/docs/reference.md`.

## Commands you will need

As in plan 023. Migrations remain additive — do not reset, do not edit an applied migration.

## Scope

**In scope**:

- `apps/api/src/routes/overtimes/` (create: entity, model, routes, composition)
- `apps/api/src/routes/verification/chain.ts` (create: the reusable chain engine)
- `apps/api/src/routes/index.ts` (registration)
- `apps/api/scripts/seed.ts` (sample overtime requests)
- `apps/api/src/__tests__/overtimes.spec.ts` (create)
- `apps/api/drizzle/` (one new migration)
- `plans/README.md`

**Out of scope**:

- Any web app file — plan 025.
- Realized-hours calculation. The reference cross-checks approved overtime against attendance records
  (`presences`) to compute actual duration. That needs an attendance subsystem and proves nothing
  about the framework. The request stores its **estimated** duration only.
- Other modules that share the chain shape. The engine is written to be reusable and used **once**;
  generalizing it against a single consumer is speculative.
- `packages/sprindle/**`.

## Target schema

```ts
// overtimes/overtimes.entity.ts
overtimes: id,
           sectionId          -> tollSections.id,
           applicantEmployeeId -> employees.id,
           date (date), startTime (time), estimatedMinutes (integer),
           description (text, nullable),
           statusCode (text: 'draft' | 'waiting' | 'approved' | 'rejected'),
           createdByUserId -> users.id, createdAt, updatedAt
```

Status meanings: `draft` — created, chain not seeded. `waiting` — at least one chain step is
outstanding. `approved` — every step approved. `rejected` — any step rejected, which ends the chain.

## Steps

### Step 1: Add the overtime entity

Create `apps/api/src/routes/overtimes/overtimes.entity.ts` per the target schema, with a
`defineRelationsPart` joining `overtimes` to `employees` (applicant) and `tollSections`, and a `select`
schema extending both.

The `create` schema must **omit** `statusCode`, `sectionId`, `applicantEmployeeId`, and
`createdByUserId` — all four are derived from the caller in Step 3, never accepted from the client.
A client that could set `applicantEmployeeId` could file overtime for someone else.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 2: Write the chain engine

Create `apps/api/src/routes/verification/chain.ts`. Three functions, all taking a Drizzle transaction
handle so callers control the boundary:

```ts
/** Seeds the chain for one record and returns the steps created. Step 1 becomes 'waiting'; the rest 'pending'. */
export async function seedChain(tx: Tx, args: { moduleName: string; moduleId: string; sectionId: string; applicantEmployeeId: string }): Promise<ChainStep[]>

/** The step currently awaiting action, or null when the chain is finished. */
export async function currentStep(tx: Tx, args: { moduleName: string; moduleId: string }): Promise<ChainStep | null>

/** Records a decision on the current step and activates the next one when approved. Returns the resulting terminal status, or null while the chain continues. */
export async function advanceChain(tx: Tx, args: { moduleName: string; moduleId: string; decision: 'approved' | 'rejected'; byUserId: string; description?: string }): Promise<'approved' | 'rejected' | null>
```

`seedChain` reads `configVerificators` for the module and the section's `sectionTypeId`, ordered by
`orderNumber`, and resolves each step's recipient by `verificatorType`:

| `verificatorType` | Resolves to |
|---|---|
| `jobPosition` | no named employee; the step targets `jobPositionId` within the section |
| `sectionGroupHead` | the applicant's `sectionGroup.koregEmployeeId` |
| `sectionRantingHead` | the applicant's `sectionRanting.headEmployeeId` |

If a required head is unset, `seedChain` throws a `validationError` naming which one — the reference
does the same ("Kepala Shift Regu Anda Belum Ditentukan"), and failing at submit is far better than
stranding a record mid-chain. If the module has **no** configured verificators at all, throw rather
than silently auto-approving.

`seedChain` also inserts one notification per step: step 1 `unseen`, later steps `unset`.
`advanceChain` flips the activated step's notification to `unseen` and marks the decided step's
notifications `seen`.

Notification dispatch is **not** the engine's job. It returns which notifications became active; the
route dispatches them after commit.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 3: Add the routes

`apps/api/src/routes/overtimes/overtimes.model.ts` — `list()`, `detail()`, `create()`, `update()`,
`authorize: [authenticated()]`. No delete: a submitted request is a record.

`create` derives from the caller through a `before` hook: `applicantEmployeeId` = the caller's
`employeeId`, `sectionId` = the caller's `sectionId`, `statusCode` = `'draft'`. A caller with no
employee row cannot file overtime — answer 403 with a message saying so, not 500.

`update` is allowed only while `statusCode = 'draft'`. Anything else answers 409.

`overtimes.routes.ts` — two custom routes, each wrapping its writes in **one** `getDb().transaction()`:

- `POST /overtimes/submit/:id` — requires `draft`; calls `seedChain`; sets the record to `waiting`.
  After commit, dispatches the step-1 notification via `notifyAfterCommit`.
- `POST /overtimes/verify/:id` — body `{ decision: 'approved' | 'rejected', description?: string }`.
  Requires `waiting`. Authorizes against `currentStep`, reproducing the reference rule: the caller's
  `jobPositionId` matches the step **and** their `sectionId` matches the record's, **or** the caller is
  the step's `recipientEmployeeId`, **or** the caller's `scope` is `'all'`. Calls `advanceChain`, and
  applies the terminal status when one is returned. After commit, dispatches whatever notification
  became active.

Both return the record through `context.entity.source.materialize()` so the response matches the
`detail` wire contract.

The **list must be section-scoped**. Reuse the approach 023 settled on for notifications rather than
inventing a second one; if 023 recorded that it had to fall back to a custom list route, do the same
here and note it.

**Verify**: `pnpm --filter @southneuhof/api type-check` and `lint` → exit 0.

### Step 4: Register, seed, migrate

Register in `apps/api/src/routes/index.ts` — both arrays. Extend the seed with two overtime requests:
one `draft`, one submitted and sitting at step 1, so plan 025 has both states to render. Keep it
idempotent.

```sh
pnpm --filter @southneuhof/api db:generate
```

Review the SQL, then `db:migrate` and `db:seed`.

**Verify**: `ls apps/api/drizzle/` shows exactly three migration folders.

### Step 5: Tests

Create `apps/api/src/__tests__/overtimes.spec.ts`, patterned on `products.spec.ts`. Cover:

**Creation**
- `create` derives applicant and section from the caller and ignores client-supplied values for them
- a caller with no employee row gets 403, not 500
- `update` works on `draft` and answers 409 on `waiting`

**Chain seeding**
- submit seeds one log row per configured verificator, ordered, step 1 `waiting` and the rest `pending`
- submit inserts one notification per step: step 1 `unseen`, the rest `unset`
- a `sectionGroupHead` step with no `koregEmployeeId` fails at submit with a message naming it, and
  writes nothing — assert the record is still `draft` and no log rows exist
- a module with no configured verificators fails at submit rather than auto-approving

**Verification**
- the named recipient can verify; an unrelated user gets 403
- a job-position step accepts a caller with that position in the same section, and rejects the same
  position in a different section
- an `all`-scoped caller can always verify
- approving a non-final step activates the next: its log row becomes `waiting`, its notification flips
  `unset` → `unseen`, and the record stays `waiting`
- approving the final step sets the record to `approved`
- rejecting at any step sets the record to `rejected` and leaves later steps unactivated
- verifying a record that is not `waiting` answers 409
- verifying an already-decided step answers 403 or 409, never double-advances

**Transactionality — the framework question**
- a failure injected after the log write and before the record update leaves **nothing** persisted:
  no log row, no notification, and the record still `waiting`
- a transport that throws does not roll back an approval: assert the record is `approved` **and** the
  transport recorded a failure

## Done criteria

- [ ] `pnpm --filter @southneuhof/api type-check`, `lint`, `test` all exit 0
- [ ] `apps/api/src/__tests__/overtimes.spec.ts` exists and covers every case above, including both
      transactionality cases
- [ ] `ls apps/api/drizzle/` shows exactly three migration folders
- [ ] `pnpm --filter @southneuhof/api db:seed` run twice exits 0 both times
- [ ] `grep -rn "order_number == 0\|orderNumber === 0" apps/api/src` returns no matches (no sentinel)
- [ ] `git diff --stat packages/sprindle` is empty
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` row updated

## STOP conditions

- A single transaction cannot span the chain write, the notification write, and the record update
  through `getDb().transaction()`. Record exactly what fails — this is the plan's primary question and
  a negative answer is a result worth reporting, not working around.
- The after-commit dispatch cannot be expressed without holding the transaction open. Report rather
  than dispatching inside the transaction; delivering a notification for a rolled-back approval is
  worse than not delivering one.
- Any change appears necessary inside `packages/sprindle/`.
- The authorization rule admits a caller from another section for a job-position step. Stop and fix
  before continuing.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- **The chain engine has exactly one consumer.** It is written to be reusable but must not be
  generalized further until a second module actually needs it. The reference system's fifteen copies
  of this logic are the argument for one engine, not for a configurable one.
- **Two deliberate divergences from the reference**, both recorded here and in
  `plans/NOTES-trom-proof-slice.md`: eager chain seeding at submit rather than lazy seeding on first
  approval, and one notification per step inserted up front rather than one row rewritten repeatedly.
- Realized-hours calculation is deferred and needs an attendance subsystem.
- What a reviewer should scrutinize: that the transaction boundary really encloses all three writes;
  that dispatch is outside it; and that `create` cannot be talked into filing overtime for another
  employee.
