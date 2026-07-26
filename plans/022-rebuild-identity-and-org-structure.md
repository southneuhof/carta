# Plan 022: Rebuild identity and organizational structure, retire the schema mirror, reset to one baseline migration

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **This plan destroys data.** Step 8 drops every table in the `public` schema and deletes the
> existing migration. Read the "Destructive operations" section before running anything.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat 4ab2c8f..HEAD -- apps/api/src apps/web/src/framework apps/web/src/routes packages/contracts/src
> ```
> Changes attributable to plan 021 (DONE) are expected: entity modules import `@southneuhof/sprindle/entity`,
> use `crypto.randomUUID`, and `apps/web/src/framework/adapters/resources/roles.ts` imports `role` from
> the entity. Any other change is drift and a STOP.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH (destructive; touches the auth layer)
- **Depends on**: `plans/021-browser-safe-entity-schemas.md` (DONE)
- **Category**: migration
- **Planned at**: commit `4ab2c8f`, 2026-07-27

## Why this matters

`apps/api` models identity with a single axis: `users.roleId`, one `notNull` foreign key. The system
this repository is preparing to model — recorded in `plans/NOTES-trom-proof-slice.md` — resolves five
things per request, and only one of them comes from the `users` table. Every scoped list, every
verificator chain, and every notification recipient in that system depends on the four axes this
schema does not have.

Single-role is also not merely a column: `apps/api/src/routes/auth/auth.ts` declares it to Better Auth
as `additionalFields: { roleId: { type: 'string', required: true, input: true } }`, so sign-up itself
requires it. It cannot be widened incrementally.

Three further things ride along, because they touch the same files and doing them separately means
migrating the same code twice:

1. **The schema mirror.** Plan 021 made entity modules browser-importable and the maintainer accepted
   the bundle cost (GO). `packages/contracts/src/schemas/index.ts` and
   `apps/api/src/__tests__/schema-parity.spec.ts` exist only to keep two declarations in step, and
   there is about to be one.
2. **A broken screen.** `apps/web/src/framework/adapters/resources/users.ts:103` posts to
   `mapping-user-roles/toggle`, a route that does not exist in `apps/api`.
   `apps/web/src/framework/adapters/resources/users.spec.ts:76` mocks `post`, so no test catches it.
   The role-assignment UI at `routes/(authenticated)/settings/users/[userId]/roles/` is non-functional.
   Its endpoint name is already many-to-many, which is the model this plan adopts.
3. **A clean baseline.** There is exactly one migration and it encodes the schema being replaced.

## Current state

### Identity today

`apps/api/src/routes/users/users.entity.ts`:

```ts
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  roleId: text('role_id').notNull().references(() => roles.id),   // <- the single axis
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
})
```

`apps/api/src/routes/roles/roles.entity.ts` declares `roles` (id, name, timestamps), `permissions`
(id, name — **no code column**), and `role_permissions` (composite primary key, **no active flag**).

Everything that reads `users.roleId` and must change with it:

- `apps/api/src/routes/auth/auth.ts` — `additionalFields.roleId`, `required: true, input: true`
- `apps/api/src/routes/users/users.ts` — `userRelations`: `role: r.one.roles({ from: r.users.roleId, to: r.roles.id })`
- `apps/api/src/routes/roles/roles.model.ts` — the custom delete route guards with
  `select().from(users).where(eq(users.roleId, id))` and answers 409 `role_in_use`
- `apps/api/src/routes/users/users.entity.ts` — `select` schema extends `{ role: role.schemas.select.optional() }`
- `apps/api/scripts/seed.ts` — signs up the admin with `roleId: 'admin-role'`
- `apps/web/src/framework/adapters/resources/users.ts` — `User.roleId`, `UserDraft.roleId`, the
  `roleId` field with `read: (record) => (record.role as Role | undefined)?.name ?? record.roleId`,
  and `loadAssignableRoles` which reads `userResponse.data.roleId`

### The reference model

From `hka-trom/backend/app/helpers/function.php:113-209` (external reference, never modified):

- `hasPermission($code)` — active roles → `mapping_roles_permissions` → `permissions.permission_code`,
  honoring `active` on **both** the mapping and the permission row.
- `getUserRoles()` — `mapping_users_roles` where `active = true`, returns an **array**.
- `getUserRoleGroup()` — `min(roles.role_group_id)` across active roles, then hardcoded id sets
  (`[1,2] → 'all'`, `[10] → 'pusat'`, else `'ruas'` / `'owner'`).
- `getUserSectionId()` / `getUserJobPositionId()` — `Auth::user()->employee->section_id` /
  `->job_position_id`. **The employee is a separate row from the user**, and `employees.user_id` is
  nullable: people exist in the org chart without logins.

### Conventions to match

- Adding a resource: `apps/api/AGENTS.md` — entity, model, optional routes, composition file, then
  register in `src/routes/index.ts` in **both** `domainParts` and `installedRoutes`.
- `createEntity` is imported from `@southneuhof/sprindle/entity`, never `/model` — enforced by
  `apps/web/src/framework/__tests__/entity-schema-import.spec.ts`.
- No node builtins in entity modules — same guard.
- Exemplar resource: `apps/api/src/routes/products/`.
- Sprindle vocabulary: `packages/sprindle/docs/reference.md`. Read it before naming anything.

### Entity home — decided, no move

Entity modules **stay** at `apps/api/src/routes/<name>/<name>.entity.ts`. Reasons, recorded so this is
not relitigated: `apps/web` already resolves `@southneuhof/api` and `@southneuhof/api/*` in both
`vite.config.ts` and `tsconfig.app.json`; `apps/api/AGENTS.md` documents the resource-folder
convention and moving entities out would break it; and `packages/domain` is unavailable because it
holds `src/theme/materialTokens.ts`, consumed by `apps/base-mobile/src/theme/material.ts`, so putting
Drizzle entities there would pull `drizzle-orm` into the mobile app.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| API types | `pnpm --filter @southneuhof/api type-check` | exit 0 |
| API lint | `pnpm --filter @southneuhof/api lint` | exit 0 |
| API tests | `pnpm --filter @southneuhof/api test` | all pass (needs a reachable `DATABASE_URL`) |
| Generate migration | `pnpm --filter @southneuhof/api db:generate` | writes a folder under `apps/api/drizzle/` |
| Apply migrations | `pnpm --filter @southneuhof/api db:migrate` | exit 0 |
| Reset database | `pnpm --filter @southneuhof/api db:reset` | drops `public` + history, then migrates |
| Seed | `pnpm --filter @southneuhof/api db:seed` | exit 0, idempotent |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` | exit 0, warnings only |
| Web build | `pnpm --filter @southneuhof/framework-web build` | exit 0 |

## Destructive operations

Step 8 is irreversible for local data. It destroys:

- every table in the `public` schema of the database named by `DATABASE_URL`
- the Drizzle migration history (the `drizzle` schema)
- the folder `apps/api/drizzle/20260726165456_lively_scarecrow/`
- all seeded and local development data, including the `admin@example.com` account

Authorized by the maintainer on 2026-07-27 (recorded in `plans/NOTES-trom-proof-slice.md`).
**Before running Step 8, confirm with the operator once more**, quoting the `DATABASE_URL` host and
database name you are about to drop. If `DATABASE_URL` points at anything other than a local
development database, STOP.

## Scope

**In scope**:

- `apps/api/src/routes/users/{users.entity.ts,users.model.ts,users.ts}`
- `apps/api/src/routes/roles/{roles.entity.ts,roles.model.ts,roles.ts,role-permissions.routes.ts}`
- `apps/api/src/routes/employees/` (create: entity, model, composition)
- `apps/api/src/routes/organization/` (create: `sectionTypes`, `tollSections`, `jobPositions`,
  `sectionGroups`, `sectionRantings`)
- `apps/api/src/routes/auth/auth.ts`
- `apps/api/src/identity.ts` (create)
- `apps/api/src/routes/index.ts`
- `apps/api/scripts/seed.ts`
- `apps/api/src/__tests__/` — delete `schema-parity.spec.ts`, add `identity.spec.ts`
- `apps/api/drizzle/` — delete the existing migration, generate one baseline
- `packages/contracts/src/schemas/index.ts` — delete the manifest; `packages/contracts/src/index.ts`
- `apps/web/src/framework/adapters/validation/schemas.ts`
- `apps/web/src/framework/adapters/resources/{users.ts,users.spec.ts,roles.ts,roles.spec.ts}`
- `apps/web/src/routes/(authenticated)/settings/users/[userId]/roles/index.route.vue` and its spec
- `apps/web/src/framework/__tests__/entity-schema-import.spec.ts` (widen the guard)
- `plans/README.md`

**Out of scope**:

- `notifications`, `config_verificators`, `log_verifications`, `overtimes` — those are plans 023 and 024.
- `packages/sprindle/**` — this plan needs no framework change. If it appears to, STOP and report.
- `apps/base-mobile/**` — untouched; it consumes `@southneuhof/domain` theme tokens only.
- `apps/web/src/utils/services.ts` — the legacy HTTP helper stays until its last caller goes.
- Any HKA TROM repository file. Reference only.

## Git workflow

- Branch: `advisor/022-rebuild-identity-and-org-structure`
- Conventional commits, matching `git log` style. Commit per step.
- Do NOT push or open a PR.

## Target schema

Reconstructed from service usage in the reference backend, not from a database dump — the legacy
model constants have drifted (`app/Models/LogVerifications.php` omits columns every service writes).
Column semantics are inferred; shape is re-modelled fresh.

```ts
// organization/organization.entity.ts
sectionTypes:    id, code (unique), name
tollSections:    id, code (unique), name, sectionTypeId -> sectionTypes.id
jobPositions:    id, code (unique), name
sectionGroups:   id, name, sectionId -> tollSections.id, koregEmployeeId -> employees.id (nullable)
sectionRantings: id, name, sectionId -> tollSections.id, headEmployeeId  -> employees.id (nullable)

// employees/employees.entity.ts
employees: id, fullName, userId -> users.id (nullable, unique),
           sectionId -> tollSections.id (nullable), jobPositionId -> jobPositions.id (nullable),
           sectionGroupId -> sectionGroups.id (nullable), sectionRantingId -> sectionRantings.id (nullable),
           active (boolean, default true), createdAt, updatedAt

// users/users.entity.ts  — auth only, roleId REMOVED
users: id, name, email, emailVerified, image, createdAt, updatedAt

// roles/roles.entity.ts
roles:           id, name, scope (text, notNull, default 'section'), active (boolean, default true), createdAt, updatedAt
permissions:     id, code (unique), name, active (boolean, default true)
rolePermissions: roleId, permissionId, active (boolean, default true)  -- primaryKey(roleId, permissionId)
userRoles:       userId, roleId, active (boolean, default true)        -- primaryKey(userId, roleId)
```

`roles.scope` is an ordered enum declared once and exported:

```ts
/** Widest first. A user holding several roles gets the widest scope among them. */
export const roleScopes = ['all', 'central', 'section', 'owner'] as const
export type RoleScope = (typeof roleScopes)[number]
```

This replaces the legacy `min(role_group_id)` derivation and its hardcoded id sets. Same behavior,
no magic numbers.

`sectionGroups` and `sectionRantings` reference `employees` while `employees` references them. Declare
the tables first and the references through callbacks (`() => employees.id`), which is how Drizzle
expresses mutual references; if the generated SQL cannot order the constraints, add the two
employee-facing foreign keys in a follow-up statement rather than restructuring the schema.

## Steps

### Step 1: Add the organization tables

Create `apps/api/src/routes/organization/organization.entity.ts` with `sectionTypes`, `tollSections`,
`jobPositions`, `sectionGroups`, `sectionRantings` per the target schema, plus `createEntity` entities
for the three that get read endpoints (`sectionTypes`, `tollSections`, `jobPositions`).

Create `organization.model.ts` exposing **read-only** models for those three (`list()` and `detail()`
only, `authorize: [authenticated()]`), and `organization.ts` composing a `defineDomainPart` with all
five tables.

Do not register in `src/routes/index.ts` yet — Step 6 does all registration at once, so the app never
boots against a half-built domain.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 2: Add employees

Create `apps/api/src/routes/employees/employees.entity.ts` per the target schema, with a
`defineRelationsPart` joining `employees` to `users`, `tollSections`, and `jobPositions`. Its `select`
schema extends the relations, following `apps/api/src/routes/products/products.entity.ts`.

Create `employees.model.ts` (`list`, `detail`, `create`, `update`; `authorize: [authenticated()]`) and
`employees.ts`.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 3: Rewrite roles and permissions

Rewrite `apps/api/src/routes/roles/roles.entity.ts` to the target schema: add `scope` and `active` to
`roles`, add `code` and `active` to `permissions`, add `active` to `rolePermissions`, and add the new
`userRoles` table. Export `roleScopes` and `RoleScope`.

Update `apps/api/src/routes/roles/roles.model.ts`: the delete route's in-use guard currently reads
`users.roleId`. Change it to query `userRoles` instead:

```ts
const assigned = await getDb().select().from(userRoles).where(eq(userRoles.roleId, id)).limit(1)
if (assigned[0]) return c.json({ error: 'role_in_use', message: 'Role masih dipakai oleh pengguna.' }, 409)
```

Update `role-permissions.routes.ts` so assign/revoke write the `active` flag rather than
inserting and deleting rows, matching the reference model where mappings are deactivated, not removed.
Keep the existing route paths and response shapes — `apps/web` depends on them.

Add user-role routes alongside them in a new `user-roles.routes.ts`:
`GET /users/:userId/roles`, `PUT /users/:userId/roles/:roleId`, `DELETE /users/:userId/roles/:roleId`,
modelled exactly on `role-permissions.routes.ts`. **These replace the dead
`mapping-user-roles/toggle` endpoint.**

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 4: Strip the single role from users and auth

In `users.entity.ts`, remove the `roleId` column and remove `role` from the `select` schema extension.
In `users.ts`, remove the `role` relation from `userRelations` (keep the domain part; it may end up
with no relations, which is valid).

In `auth.ts`, delete the whole `user: { additionalFields: { roleId: ... } }` block.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0, and
`grep -rn "roleId" apps/api/src/routes/users apps/api/src/routes/auth` returns no matches.

### Step 5: Add the identity resolver

Create `apps/api/src/identity.ts`. It answers the five questions in one place, resolved once per
request and memoized on the Hono context:

```ts
export type OrgIdentity = {
  userId: string
  employeeId: string | null
  sectionId: string | null
  jobPositionId: string | null
  roleIds: string[]
  /** Widest scope among the caller's active roles. */
  scope: RoleScope
  /** Active permission codes, from active roles through active mappings. */
  permissions: ReadonlySet<string>
}

/** Resolves the caller's organizational context, or null when unauthenticated. */
export async function orgIdentity(args: RouteHandlerArgs): Promise<OrgIdentity | null>

/** Authorize hook: 403 unless the caller holds `code`. */
export function requirePermission(code: string): RouteAuthorize
```

Rules the implementation must honor, each mirroring the reference behavior:

- Only rows with `active = true` count, at every hop: `userRoles`, `roles`, `rolePermissions`,
  `permissions`.
- `scope` is the widest among the caller's roles, using `roleScopes` order (index 0 is widest).
  A caller with no roles gets the narrowest scope, never the widest.
- `employeeId` / `sectionId` / `jobPositionId` come from the `employees` row whose `userId` matches;
  all three are `null` when the caller has no employee row. This is a normal state, not an error.
- Memoize per request via `c.set(...)` / `c.get(...)` so several hooks in one pipeline share one
  resolution. `args.identity()` is already lazy and memoized; wrap it, do not replace it.

Attach `requirePermission` to no model in this plan — plan 024 is its first consumer. It is written
here because it belongs with identity, and Step 7's tests cover it.

**Verify**: `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 6: Register everything and rewrite the seed

Register the new domain parts and models in `apps/api/src/routes/index.ts` — in **both**
`domainParts` and `installedRoutes`, per `apps/api/AGENTS.md`. A model missing from `domainParts` gets
no bound database.

Rewrite `apps/api/scripts/seed.ts`, keeping it idempotent and keeping the
`admin@example.com` / `demo-password` credentials documented in `apps/api/AGENTS.md`. It must now seed:

- one `sectionType`, two `tollSections`, three `jobPositions`
- permissions **with codes** (`view-user`, `create-user`, …), matching the reference `permission_code`
- one `Administrator` role with `scope: 'all'`, one `Petugas Ruas` role with `scope: 'section'`
- `rolePermissions` for both
- the admin user, an `employees` row linking it to a section and job position, and a `userRoles` row
- at least one employee **without** a `userId`, so the person-without-login case is represented in
  development data

Sign-up no longer takes `roleId`; assign the role by inserting into `userRoles` after sign-up.

**Verify**: `pnpm --filter @southneuhof/api type-check` and `lint` → exit 0.

### Step 7: Replace the parity test with identity tests

Delete `apps/api/src/__tests__/schema-parity.spec.ts`. It compares the mirror against the entity
schemas, and Step 9 deletes the mirror.

Create `apps/api/src/__tests__/identity.spec.ts`, modelled on `apps/api/src/__tests__/products.spec.ts`
(same real-Postgres setup, tables rebuilt in `beforeEach`). Cover:

- a user with two roles gets both role ids
- scope is the widest of several roles, not the first or the last
- an inactive `userRoles` row is excluded
- an inactive `rolePermissions` row, and an inactive `permissions` row, each exclude the permission
- a user with no employee row resolves `employeeId`/`sectionId`/`jobPositionId` as `null` and does not throw
- a user with no roles gets the narrowest scope
- `requirePermission` answers 403 without the code and passes with it
- assigning and revoking a user role through the new `/users/:userId/roles/:roleId` routes is idempotent

**Verify**: after Step 8's reset, `pnpm --filter @southneuhof/api test` → all pass.

### Step 8: Reset the database and generate one baseline migration

**Confirm with the operator first.** Print the target and get an explicit yes:

```sh
node -e "const u=new URL(process.env.DATABASE_URL);console.log('host:',u.host,'db:',u.pathname)"
```

If the host is not local, STOP.

Then:

```sh
rm -rf apps/api/drizzle/20260726165456_lively_scarecrow
```

```sh
pnpm --filter @southneuhof/api db:generate
```

Review the generated SQL. It must create every table in the target schema and must contain no
`ALTER`/`DROP` referring to the old schema — it is a baseline, not a diff. Then:

```sh
pnpm --filter @southneuhof/api db:reset
```

```sh
pnpm --filter @southneuhof/api db:seed
```

**Verify**: `pnpm --filter @southneuhof/api test` → all pass, including the new `identity.spec.ts`.
Then `pnpm --filter @southneuhof/api db:seed` a second time → exit 0 (idempotence).

### Step 9: Delete the schema mirror

Delete `packages/contracts/src/schemas/index.ts` and remove `export * from './schemas'` from
`packages/contracts/src/index.ts`. While in that file, delete the **dead fake `AppType`** — the stub
Hono app with hardcoded `/products/*` routes. Nothing imports it (`packages/sdk` takes the real
`AppType` from `@southneuhof/api/rpc`), and it contradicts the actual design.

If `packages/contracts` ends up with no exports at all, leave the package in place with a README
explaining that contracts are now the entity modules plus `hc<AppType>` inference, and remove it from
consumers' dependencies. Do not delete the package directory in this plan.

Rewrite `apps/web/src/framework/adapters/validation/schemas.ts`: `findSchema` no longer exists. Either
point `schemaAdapter` at a small map of entity schemas, or delete the adapter if every resource now
declares `schemas` directly. Prefer deleting it — resource-level `schemas` is the documented path and
one lookup mechanism is better than two. If you delete it, remove its registration from wherever the
runtime installs adapters and confirm no component relies on adapter-sourced schemas
(`packages/is-vue-framework/src/validation/select.ts` treats it as optional).

**Verify**: `grep -rn "@southneuhof/contracts" apps packages --include='*.ts' --include='*.vue' | grep -v node_modules`
returns only `package.json`/`tsconfig` path entries you have deliberately kept.

### Step 10: Fix the web identity surfaces

`apps/web/src/framework/adapters/resources/users.ts`:

- drop `roleId` from `User`, `UserDraft`, `userFields`, and the `table`/`detail`/`form` field lists
- replace the `schemas` mirror import with `user.schemas` from the entity module, as `roles.ts`
  already does
- rewrite `loadAssignableRoles` to read the user's roles from `GET /users/:userId/roles` instead of
  `userResponse.data.roleId`
- rewrite `setUserRole` to call the new RPC routes — `rpc.users[':userId'].roles[':roleId'].$put` /
  `.$delete` — and delete the `services.post('mapping-user-roles/toggle', ...)` call

Update `users.spec.ts` accordingly: it currently asserts the dead endpoint at line 76. The replacement
must assert the real RPC call, not a mocked `post`.

`apps/web/src/routes/(authenticated)/settings/users/[userId]/roles/index.route.vue` keeps its
optimistic-toggle workflow unchanged — only the function it calls changes.

Widen `apps/web/src/framework/__tests__/entity-schema-import.spec.ts` from `roles` alone to every
entity module, now that no mirror remains: assert each exposes `schemas.create` / `schemas.update` /
`schemas.select`, and keep both static scans.

**Verify**:
```sh
pnpm --filter @southneuhof/framework-web type-check && pnpm --filter @southneuhof/framework-web test && pnpm --filter @southneuhof/framework-web lint && pnpm --filter @southneuhof/framework-web build
```
→ all exit 0.

### Step 11: Update the index

In `plans/README.md`, add the 022 row to the Contract track table and record that the mirror and the
parity test are gone. Update the Contract-track paragraph so it no longer describes the mirror as
present.

## Test plan

- **New** `apps/api/src/__tests__/identity.spec.ts` — eight cases listed in Step 7. Pattern:
  `apps/api/src/__tests__/products.spec.ts`.
- **Rewritten** `apps/web/src/framework/adapters/resources/users.spec.ts` — asserts the real RPC
  role-assignment calls. The current version's mocked `post` assertion is exactly what let the broken
  endpoint survive; do not reproduce that shape.
- **Widened** `apps/web/src/framework/__tests__/entity-schema-import.spec.ts` — every entity module.
- **Deleted** `apps/api/src/__tests__/schema-parity.spec.ts`.
- **Regression**: `apps/api/src/__tests__/products.spec.ts` must still pass untouched. It exercises the
  Sprindle request pipeline, which this plan does not change.

## Done criteria

- [ ] `pnpm --filter @southneuhof/api type-check`, `lint`, `test` all exit 0
- [ ] `pnpm --filter @southneuhof/is-vue-framework test` and `type-check` exit 0
- [ ] `pnpm --filter @southneuhof/framework-web type-check`, `test`, `lint`, `build` all exit 0
- [ ] `grep -rn "roleId" apps/api/src/routes/users apps/api/src/routes/auth` returns no matches
- [ ] `grep -rn "mapping-user-roles" apps/web/src` returns no matches
- [ ] `packages/contracts/src/schemas/` does not exist; `apps/api/src/__tests__/schema-parity.spec.ts` does not exist
- [ ] `ls apps/api/drizzle/` shows exactly one migration folder
- [ ] `pnpm --filter @southneuhof/api db:seed` run twice in a row exits 0 both times
- [ ] `identity.spec.ts` exists with the eight cases and passes
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` row updated

## STOP conditions

- `DATABASE_URL` points at anything other than a local development database.
- The operator does not re-confirm the reset at Step 8.
- `db:generate` emits `ALTER` or `DROP` statements referencing the old schema instead of a clean
  baseline — the old migration folder was probably not deleted.
- Better Auth rejects the schema after `additionalFields.roleId` is removed, or requires a `roleId` at
  sign-up anyway. Record the exact error; do not re-add the column to make it pass.
- Drizzle cannot express the mutual `employees` ↔ `sectionGroups` / `sectionRantings` references and
  the generated SQL fails to apply. Record the error and stop; do not denormalize the schema.
- Any change appears necessary inside `packages/sprindle/`.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- `orgIdentity` is the single place that answers "who is calling, and what may they see". Plans 023
  and 024 consume it for section scoping and verificator authorization. Anything that starts reading
  roles or sections directly from the database instead is a review failure.
- The reference system's `role_group_id` magic numbers are deliberately **not** reproduced. If real
  data is ever imported, the mapping from `role_group_id` to `roles.scope` belongs in the import
  script, not in the schema.
- `notifications.user_receiver_id` in the reference system holds an **employee** id. Plan 023 names
  its equivalent column for what it holds; do not copy the legacy name.
- Deferred: pruning `apps/web/src/utils/services.ts` once its last caller is gone, and deleting the
  `packages/contracts` package directory if it ends up empty.
