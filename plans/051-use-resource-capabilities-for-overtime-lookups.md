# Plan 051: Use resource capability handlers for overtime lookup inputs

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**:
> `git diff --stat 39dc197..HEAD -- apps/api/src/routes/overtimes apps/api/src/__tests__/overtimes.spec.ts apps/web/src/routes/'(authenticated)'/hr/overtimes apps/web/src/framework/adapters/lookup.ts apps/web/src/framework/__tests__/route-resource-boundary.spec.ts docs/architecture/input-data-migration.md`
>
> This plan was written against a dirty worktree whose current lookup/resource
> changes belong to the user. Also run `git status --short`, inspect the live
> files, and preserve all unrelated changes. If the "Current state" excerpts no
> longer describe the live behavior, stop and reconcile the plan first.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: Plan 050's implemented loader-context and Hono-signal changes;
  its unrelated full-suite blocker does not block this plan
- **Category**: migration
- **Planned at**: commit `39dc197`, 2026-07-29
- **Revised**: 2026-07-29 after resolving the applicant-authorization STOP
  condition

## Why this matters

The overtime field catalog currently recreates six loader closures from legacy
service endpoint strings. Toll sections and job positions already have suitable
typed Hono list/detail routes, but the generic employee resource is merely
authenticated and cannot safely replace the legacy applicant lookup: applicant
visibility must remain active, account-linked, and section-scoped. Add an
overtime-owned typed applicant list/detail capability, then define read-only
reference resources beside their overtime consumer and pass
`resource.capabilities.list.handler` and
`resource.capabilities.detail.handler` directly into `load` and `loadDetail`.
Delete the lookup service factory instead of retaining a compatibility layer.

## Current state

- `apps/web/src/framework/adapters/lookup.ts:3-23` dynamically imports
  `@/utils/services` and constructs endpoint-specific collection/detail
  closures. It injects `active: true`, unwraps legacy envelopes, and returns
  framework results.
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts:4-28`
  imports those factories and repeats them for three lookup configurations:

  ```ts
  load: createLookupLoad<Record<string, unknown>>('toll-sections/list'),
  loadDetail: createLookupDetail<Record<string, unknown>>('toll-sections/list'),
  ```

- The same resource uses the agreed CRUD pattern at lines 96-100:

  ```ts
  capabilities: {
    list: { handler: overtimeOperations.list, ... },
    detail: { handler: overtimeOperations.detail, ... },
  }
  ```

- `apps/web/src/routes/(authenticated)/settings/roles/roles.operations.ts`
  is the transport-module exemplar: it calls
  `createHonoResourceOperations(rpc.roles, dataAdapter)` and derives record
  types with `ResourceRecordOf`.
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.ts` is the
  declaration exemplar: fields and capability metadata live in the resource;
  RPC imports stay in the operations module.
- `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts:46-51`
  enforces that `*.resource.ts` files contain no RPC calls and
  `*.operations.ts` files import no Vue/view code. Lines 62-91 assert the exact
  set of Hono parent routes.
- Typed API routes already exist for:
  - `rpc.tollSections`: read-only list/detail;
  - `rpc.jobPositions`: read-only list/detail.
- `rpc.employees` is not an acceptable applicant lookup replacement. Its model
  at `apps/api/src/routes/employees/employees.model.ts` requires only
  `authenticated()` and its generic list/detail routes do not enforce overtime
  applicant eligibility or section visibility.
- `plans/031-overtime-api-lookups-and-filters.md:69-75` explicitly requires the
  applicant lookup to accept/require section scope, preserve authorization, and
  prove that no cross-section data leaks. That planned typed projection was not
  implemented and must be completed here.
- `apps/api/src/identity.ts` provides the authoritative `OrgIdentity`, including
  caller `sectionId` and scope. Non-`all` callers must never select or hydrate
  applicants outside that section.
- Applicant eligibility is the active, account-linked employee population:
  `apps/api/src/__tests__/seed-consistency.spec.ts:47-55` treats applicants as
  active employees with a `userId`. The typed capability must preserve both
  predicates in addition to section scope.
- The overtime model already owns custom nested operations such as
  `steps`; `packages/sprindle/src/model/route-tree.ts` compiles nested route-tree
  keys into typed Hono paths. A nested
  `applicants: { list, detail }` subtree therefore yields the conventional
  `rpc.overtimes.applicants.list` and
  `rpc.overtimes.applicants.detail[':id']` shape consumed by
  `createHonoResourceOperations`.
- `packages/sprindle/src/validation/common-schemas.ts` accepts additional list
  keys as equality filters, but the Drizzle source rejects unknown columns.
  The current employee lookup supplies `sectionId` and legacy-only
  `for: 'hr-applicant'`. The new typed route replaces that string discriminator;
  do not forward `for` to the generic Drizzle source.
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts`
  currently mocks only `rpc.overtimes` and does not prove lookup handler
  identity, route usage, query forwarding, or detail hydration.

Repository conventions:

- Route-owned `*.operations.ts` modules contain Hono calls and transport-derived
  types. `*.resource.ts` modules contain fields, schemas, surfaces, permissions,
  and capability wiring.
- No route-folder barrel files.
- Backend authorization remains authoritative. A read-only reference
  capability without a navigation action uses `permission: null` unless a
  real application grant already exists.
- Framework inputs stay backend-neutral and continue to accept `data`,
  `load`, and `loadDetail`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Overtime API tests | `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/overtimes.spec.ts` | applicant list/detail authorization and existing overtime tests pass |
| API typecheck | `pnpm --filter @southneuhof/api type-check` | exit 0, no errors |
| Overtime resource tests | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ "routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts"` | all selected tests pass |
| Boundary tests | `pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ framework/__tests__/route-resource-boundary.spec.ts` | all selected tests pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0, no errors |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all tests pass |
| Legacy lookup audit | `rg -n "createLookupLoad|createLookupDetail|framework/adapters/lookup|toll-sections/list|employees/list|job-positions/list" apps/web/src` | no production matches |
| Diff hygiene | `git diff --check` | no output |

## Scope

**In scope**:

- `apps/api/src/routes/overtimes/overtimes.routes.ts`
- `apps/api/src/routes/overtimes/overtimes.model.ts`
- `apps/api/src/__tests__/overtimes.spec.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtime-lookups.operations.ts`
  (create)
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtime-lookups.resource.ts`
  (create)
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.ts`
- `apps/web/src/routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts`
- `apps/web/src/framework/__tests__/route-resource-boundary.spec.ts`
- `apps/web/src/framework/adapters/lookup.ts` (delete)
- `docs/architecture/input-data-migration.md` only if Plan 050 did not already
  include the concrete overtime/resource example
- `plans/README.md` status only

**Out of scope**:

- Changing Lookup's `load` or `loadDetail` API.
- Introducing `source`, `operations`, a network bridge, endpoint registry, or
  compatibility aliases.
- Migrating CRUD screens, uploads, Location, or File Manager.
- Changing overtime creation authorization or derived applicant/section
  behavior.
- Weakening the generic `rpc.employees` resource or making it globally
  section-scoped; this capability is specific to overtime applicant selection.
- Moving resources into a central application registry.
- Reintroducing legacy service calls under a differently named helper.

## Git workflow

- Branch: `codex/051-resource-lookup-handlers`
- Commit: `feat(overtimes): type applicant lookup handlers`
- Do not push or open a PR unless explicitly requested.

## Steps

### Step 1: Add an overtime-owned typed applicant list/detail capability

In `apps/api/src/routes/overtimes/overtimes.routes.ts`, define two model routes
for a nested `applicants` subtree:

```ts
applicants: {
  list: overtimeApplicants,
  detail: overtimeApplicant,
}
```

Register that subtree in `overtimeModel.routes`. The compiled endpoints must be:

```text
GET /overtimes/applicants/list
GET /overtimes/applicants/detail/:id
```

This conventional shape is deliberate: the web operation module can pass
`rpc.overtimes.applicants` directly to `createHonoResourceOperations`.

The list route must:

- require authentication through the existing overtime model pipeline;
- parse `sectionId` as a required non-empty query value plus the ordinary
  `page`, `limit`, and optional `search` collection controls;
- resolve `OrgIdentity` once with `orgIdentity(args)`;
- permit `scope === 'all'` to request any section;
- require every other caller's requested `sectionId` to equal their own
  non-null `identity.sectionId`; reject a mismatch with 403 before querying;
- return only employees where `active = true`, `userId IS NOT NULL`, and
  `sectionId` equals the authorized requested section;
- apply case-insensitive search only to `fullName`;
- order deterministically by `fullName`, then `id`;
- paginate and return `{ data, page, limit, total }`;
- project only the Lookup fields required by the browser: `id`, `fullName`, and
  `sectionId`.

The detail route must:

- load by `:id`;
- apply the same `active = true` and `userId IS NOT NULL` eligibility;
- allow `scope === 'all'`, otherwise require the row's `sectionId` to equal the
  caller's non-null `identity.sectionId`;
- return 404 for missing, inactive, unlinked, or cross-section rows so it cannot
  be used as an employee-existence oracle;
- return `{ data: { id, fullName, sectionId } }`.

Use Drizzle parameterized predicates (`and`, `eq`, `isNotNull`, `ilike`) and a
count query or equivalent exact total. Do not call the generic employee model,
accept raw SQL/operator keys, or trust a client-provided authorization flag.

Extend `apps/api/src/__tests__/overtimes.spec.ts` with:

- same-section active/account-linked list success;
- exclusion of inactive and account-unlinked employees;
- search and pagination metadata;
- non-`all` cross-section list rejection;
- `all`-scope section selection;
- same-section detail success;
- cross-section/inactive/unlinked detail returning 404.

**Verify**:

- `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/overtimes.spec.ts`
  → all selected tests pass.
- `pnpm --filter @southneuhof/api type-check` → exit 0.

### Step 2: Create route-owned reference operations

Create `overtime-lookups.operations.ts` beside `overtimes.operations.ts`.
Follow the roles operation pattern:

```ts
export const tollSectionOperations =
  createHonoResourceOperations(rpc.tollSections, dataAdapter)
```

Do the same for job positions. For applicants, use the new scoped subtree:

```ts
export const applicantOperations =
  createHonoResourceOperations(rpc.overtimes.applicants, dataAdapter)
```

Do not create lookup operations from `rpc.employees`. Export record types with
`ResourceRecordOf<typeof ...>`. Do not import Vue, components, router, toasts,
field definitions, or services. Do not add wrapper functions around `list` or
`detail`.

Update the route boundary test's exact Hono parent set. Make the assertion
order-independent while retaining exactness: sort the actual and expected
parent expressions and assert equality, including `rpc.tollSections`,
`rpc.overtimes.applicants`, `rpc.jobPositions`, and all existing routes. This
avoids coupling the architecture test to
filesystem enumeration order without weakening it to a partial match.

**Verify**:
`pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ framework/__tests__/route-resource-boundary.spec.ts`
→ all boundary tests pass.

### Step 3: Define read-only reference resources

Create `overtime-lookups.resource.ts` beside the operations module. Define
narrow field catalogs:

- toll section: `name`;
- applicant: `fullName`;
- job position: `name`.

Define one resource per reference entity using `defineResource`. Each resource
has:

- its canonical key;
- its narrow field catalog;
- `list` and `detail` capabilities wired directly to the corresponding
  operations;
- `permission: null`;
- no route target, form, create, update, delete, or navigation surface.

Use clear exported names such as `tollSections`, `applicants`, and
`jobPositions`. Do not import `rpc` or `services` in this file.

Add tests proving each exported resource exposes the exact operation functions:

```ts
expect(tollSections.capabilities.list.handler)
  .toBe(tollSectionOperations.list)
```

Cover detail as well. These identity assertions prevent a future wrapper from
reappearing unnoticed.

**Verify**:
`pnpm --filter @southneuhof/framework-web type-check`
→ exit 0 and exact capability types remain inferred.

### Step 4: Pass capability handlers directly to Lookup

In `overtimes.resource.ts`, remove the legacy lookup-adapter import and import
the three reference resources. Configure each lookup honestly:

```ts
const sections = {
  fields: tollSections.fields,
  load: tollSections.capabilities.list.handler,
  loadDetail: tollSections.capabilities.detail.handler,
  pick: 'id',
  view: 'name',
}
```

Use the corresponding applicant and job-position resources. Preserve the
separate `load` and `loadDetail` props because Lookup really performs collection
loading and scalar-value hydration independently.

Replace the legacy `{ for: 'hr-applicant' }` discriminator with the required
`sectionId` search parameter expected by the typed applicant route. Do not send
`active`; eligibility is server-owned and cannot be weakened by caller input.
Do not wrap capability handlers to inject filters; `sectionId` belongs in the
existing `searchParameters` input contract.

Extend `overtimes.resource.spec.ts` to obtain the lookup props from
`overtimeFields` and `overtimeListFilters` and assert:

- `load` is the exact resource list capability handler;
- `loadDetail` is the exact resource detail capability handler;
- field metadata, `pick`, and `view` remain correct;
- dynamic applicant search parameters contain the selected `sectionId` and no
  legacy `for` flag;
- invoking list/detail reaches the correct mocked RPC parent.

**Verify**:
`pnpm --filter @southneuhof/framework-web exec vitest run --environment jsdom --root src/ "routes/(authenticated)/hr/overtimes/overtimes.resource.spec.ts"`
→ all selected tests pass.

### Step 5: Delete the legacy lookup adapter

Delete `apps/web/src/framework/adapters/lookup.ts`. Do not replace it with
another factory or compatibility re-export.

Audit production web source for:

```text
createLookupLoad
createLookupDetail
framework/adapters/lookup
toll-sections/list
employees/list
job-positions/list
```

All must be absent. Test descriptions or migration documentation may mention
the deleted names only when explicitly asserting their absence.

If Plan 050's documentation does not show a concrete direct-resource example,
update `docs/architecture/input-data-migration.md` now. The preferred Lookup
shape is the two direct capability handler assignments; explain that this is
not a compatibility technique but the component's actual two-operation
contract.

**Verify**:
`rg -n "createLookupLoad|createLookupDetail|framework/adapters/lookup|toll-sections/list|employees/list|job-positions/list" apps/web/src`
→ no production matches.

### Step 6: Run web convergence gates

Run focused tests, boundary tests, web typecheck, and the full web suite. Do not
change unrelated dirty Table/Card/framework work merely to clear a pre-existing
failure. If full-suite baseline failures remain, record them exactly and leave
the plan BLOCKED rather than marking it DONE.

Run `git diff --check` and inspect `git status --short`. Confirm all new source
changes are in scope and all pre-existing user changes remain intact.

**Verify**:

- `pnpm --filter @southneuhof/api type-check` → exit 0.
- `pnpm --filter @southneuhof/api exec node --env-file-if-exists=.env ./node_modules/vitest/vitest.mjs run src/__tests__/overtimes.spec.ts`
  → all selected tests pass.
- `pnpm --filter @southneuhof/framework-web type-check` → exit 0.
- `pnpm --filter @southneuhof/framework-web test` → all tests pass.
- `git diff --check` → no output.

## Test plan

- `overtimes.resource.spec.ts`:
  - exact resource-operation/capability handler identity;
  - exact lookup `load`/`loadDetail` handler identity;
  - list and detail RPC parent selection;
  - normalized list/detail results;
  - applicant section filter and absence of the legacy `for` flag;
  - existing field parity and workflow cases remain green.
- `route-resource-boundary.spec.ts`:
  - all three new operation modules use exact Hono parents;
  - resource declarations remain RPC-free;
  - operation modules remain view-free;
  - exact parent assertion becomes order-independent, not weaker.
- Do not mock `services`; its lookup adapter is deleted.
- `apps/api/src/__tests__/overtimes.spec.ts`:
  - applicant list is active, account-linked, and section-scoped;
  - non-`all` callers cannot list or hydrate another section;
  - `all` scope can select a section;
  - list search/pagination and detail 404 behavior are exact.

## Done criteria

- [ ] Overtime exposes typed
      `rpc.overtimes.applicants.list/detail` endpoints.
- [ ] Applicant list/detail enforce active, account-linked, section-scoped
      visibility with API tests proving no cross-section leakage.
- [ ] Toll sections, applicants, and job positions have route-owned operations
      and read-only resources.
- [ ] Lookup configs pass
      `resource.capabilities.list.handler` directly as `load`.
- [ ] Lookup configs pass
      `resource.capabilities.detail.handler` directly as `loadDetail`.
- [ ] No lookup wrapper, cast, endpoint string, bridge, registry, or new input
      prop was introduced.
- [ ] The web sends `sectionId` to the typed applicant route and sends no
      `for: 'hr-applicant'` discriminator.
- [ ] `apps/web/src/framework/adapters/lookup.ts` is deleted.
- [ ] The legacy lookup audit returns no production matches.
- [ ] Focused tests, boundary tests, web typecheck, and web tests pass.
- [ ] `git diff --check` returns no output.
- [ ] `plans/README.md` marks Plan 051 DONE after review.

## STOP conditions

Stop and report rather than improvising if:

- The established applicant population differs from active, account-linked
  employees in the authorized section.
- Product requirements say non-`all` callers may select applicants outside
  their own section.
- A typed reference route lacks list or detail at compile time.
- Direct capability assignment requires a cast or wrapper after Plan 050.
- Reference resource creation requires a central registry or route target.
- The generic typed list returns a materially different record projection from
  Lookup's required fields.
- A permission beyond authenticated organizational scope is required but no
  canonical permission code exists.
- The migration requires changing Lookup model, selection, or hydration
  behavior.
- Current in-scope code no longer matches the behavior described above.

## Maintenance notes

- Lookup's separate `load` and `loadDetail` props are intentional. Reviewers
  should reject attempts to obscure them behind a broad source/bridge object.
- Application filters belong in `searchParameters`; transport normalization and
  cancellation belong in resource operations.
- A reference resource may be reused by future fields. Keep it route-owned until
  a second independent route subtree creates a concrete ownership problem; do
  not preemptively add a global registry.
- Applicant eligibility is an overtime API concern. Keep its list/detail
  authorization predicates identical; a permissive detail route would undo the
  list protection during scalar hydration.
- Other lookups needing domain-specific eligibility should follow this typed
  nested-capability pattern. Do not revive endpoint string factories.
