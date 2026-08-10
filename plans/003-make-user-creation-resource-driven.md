# Plan 003: Make User creation resource-driven

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. If a STOP condition occurs, stop and report it. After
> the implementation and review pass, update this plan row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/api/src/routes/users apps/web/src/routes/(authenticated)/settings/users`
> If the current excerpts do not match, stop and reassess this plan.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: 001
- **Category**: tech-debt
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

User creation bypasses the resource layer. It uses native labels, inputs, and
a button, so it does not have standard form layout, validation display,
navigation, or test coverage. Its endpoint accepts a special password-bearing
payload and is not the generic database create model, so simply enabling the
generic user model create route would be incorrect.

This plan keeps the current dedicated API endpoint and makes it a normal
resource capability. The User create route then uses `FormView`, like other
administration forms, while the create contract stays single-source.

## Current state

- `apps/api/src/routes/users/users.routes.ts` owns the custom authenticated
  User creation endpoint.
- `apps/web/src/routes/(authenticated)/settings/users/create.route.vue` owns
  a separate native form and direct RPC call.
- `apps/web/src/routes/(authenticated)/settings/users/create.operations.ts`
  owns the direct call, but returns the unnormalised response wrapper.
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts` has
  list, detail, and update capabilities only.
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.spec.ts`
  is the existing resource test pattern.

Current API contract in `apps/api/src/routes/users/users.routes.ts:9-15`:

```ts
const inputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  username: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
  imgPhotoUser: z.string().trim().max(500).nullable().optional(),
})
```

Current native route in `apps/web/src/routes/(authenticated)/settings/users/create.route.vue:25-33`:

```vue
<form class="flex max-w-xl flex-col gap-4" @submit.prevent="submit">
  <h1 class="text-xl font-semibold">Create User</h1>
  <label>Name <input v-model="model.name" required /></label>
  <!-- username, email, password, and photo key follow -->
  <button type="submit" :disabled="pending">...</button>
</form>
```

Use the resource pattern in `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts` and `FormView` usage in `apps/web/src/routes/(authenticated)/settings/users/[userId]/edit.route.vue`. Use the existing `dataAdapter.normalizeRecord` method for the `{ data: user }` endpoint response.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| API tests | `pnpm --filter @southneuhof/api test` | exit 0; all API tests pass |
| User resource tests | `pnpm --filter @southneuhof/framework-web test -- users.resource.spec.ts` | exit 0; all User resource tests pass |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no type errors |
| Full checks | `pnpm --filter @southneuhof/api test && pnpm --filter @southneuhof/framework-web test` | exit 0; all tests pass |

## Scope

**In scope**:

- `apps/api/src/routes/users/users.routes.ts`
- `apps/api/src/routes/users/users.contract.ts` (new browser-safe create schema)
- `apps/web/src/routes/(authenticated)/settings/users/create.operations.ts`
- `apps/web/src/routes/(authenticated)/settings/users/users.operations.ts`
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.ts`
- `apps/web/src/routes/(authenticated)/settings/users/create.route.vue`
- `apps/web/src/routes/(authenticated)/settings/users/users.resource.spec.ts`
- focused API test file for the User creation route, if one exists; otherwise a
  new colocated route test

**Out of scope**:

- The generic `userModel` create route — it cannot create credentials.
- User role assignment UI, User update behavior, and password reset.
- Database migration or change to the current API permission `create-users`.
- Framework packages.

## Git workflow

- Branch: `codex/003-resource-driven-user-create`
- Commit message: `feat(web): make user creation resource driven`
- Do not push or create a pull request unless instructed.

## Steps

### Step 1: Extract the browser-safe User create contract

Create `apps/api/src/routes/users/users.contract.ts`. Move the current custom
Zod create schema from `users.routes.ts` into this file and export its input
type. The contract file must have no database, authentication, request, or
server imports. Update `users.routes.ts` to import the schema and preserve the
same validation and HTTP response behavior.

**Verify**: `pnpm --filter @southneuhof/api test` → exit 0; existing create-route behavior remains valid.

### Step 2: Normalize the custom create operation

Update `create.operations.ts` so `createUser` returns the created User record,
not the response wrapper. Use `dataAdapter.normalizeRecord` and throw the
existing error payload for non-OK responses. Export the create input type from
the shared contract rather than recreating a second form type from the RPC
endpoint.

Add this operation as `create` in `userOperations`. Keep list, detail, and
update handlers unchanged.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- users.resource.spec.ts` → exit 0.

### Step 3: Add the User create resource capability and fields

Update `users.resource.ts` to declare `create` with permission `create-users`
and target `settings-users-create`. Give the resource a create schema based on
the shared contract. Add create-only field metadata for `password` and
`imgPhotoUser`; keep password excluded from table and detail surfaces. Keep
email in the create form even though update excludes it.

Use one field catalog with a local draft type that supports both the custom
create payload and User update payload. Do not use `any`, unsafe casts, or a
second User create resource.

Set the create surface to `name`, `username`, `email`, `password`, and
`imgPhotoUser`. Keep the update surface unchanged.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

### Step 4: Replace the native route with FormView

Replace the local reactive model, direct submit function, native inputs, and
native button in `create.route.vue` with `FormView title="Create User"
:resource="users"`. Let `FormView` invalidate data and return to the User
list after creation. Do not duplicate input labels or validation rules in the
route.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- users.resource.spec.ts` → exit 0.

### Step 5: Add narrow API and resource tests

Add an API route test for valid data, invalid password length, duplicate
username, and missing `create-users` permission. Extend the User resource test
to assert the create capability, create fields, create schema validation, and
that the normalized create handler returns the record under `data`.

**Verify**: `pnpm --filter @southneuhof/api test && pnpm --filter @southneuhof/framework-web test` → both exit 0.

## Test plan

- API: valid payload creates a user; validation rejects invalid input; duplicate
  username returns the current conflict result; permission still protects the route.
- Web resource: create capability uses `create-users`; create form lists five
  expected fields; schema rejects a missing password; handler unwraps `data`.
- Form render: the standard `FormView` route contains framework field IDs and
  standard Cancel and Save controls. Do not test browser CSS pixels.

## Done criteria

- [ ] One browser-safe User create schema is used by API route and web resource.
- [ ] The custom endpoint remains the only credential-creation endpoint.
- [ ] User creation is a `users` resource capability with normalized record data.
- [ ] The create route contains `FormView`, not native form elements.
- [ ] API and web focused tests, type check, and full suites pass.
- [ ] Only in-scope files changed.
- [ ] `plans/README.md` marks Plan 003 as DONE.

## STOP conditions

- The API package cannot expose the contract to the web package without
  including server-only code. Stop and add a browser-safe export boundary; do
  not import route implementation into the browser.
- The API response is not a record under `data`. Stop and document its actual
  response shape before changing normalisation.
- The custom endpoint has user-creation side effects not covered by the tests.
  Stop and add characterization tests before resource conversion.

## Maintenance notes

The User create API differs from generic database CRUD because it creates
credentials. Keep that distinction. Future create fields must be added to the
shared contract, endpoint, field catalog, and resource test in one change.
