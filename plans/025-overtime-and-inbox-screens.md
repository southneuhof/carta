# Plan 025: Build the overtime screens, the notification inbox, and a typed deep-link registry

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat <024 merge SHA>..HEAD -- apps/web/src packages/is-vue-framework/src
> ```
> This plan consumes the API built by plans 022–024. If those routes differ from the excerpts below,
> reconcile before proceeding.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: `plans/024-overtime-workflow.md`
- **Category**: direction (proof slice)
- **Planned at**: commit `4ab2c8f`, 2026-07-27

## Why this matters

This closes the slice. It is where the Vue framework's claims get tested against a workflow rather
than against CRUD: a control whose availability depends on **record state** rather than on
capabilities, one resource rendered twice with independent query namespaces, a child collection scoped
by an ordinary `searchParameters` entry, and a deep-link mechanism that replaces the reference app's
stringly-typed routing.

That last one is worth stating plainly. The reference app resolves a notification to a screen with a
nested ternary over `module_name`, duplicated in two files —
`hka-trom/frontend/src/components/navigations/topbar/layouts/Notifications.vue` and
`src/views/authenticated/to-do/_layouts/Verification.vue`. Both build route names by string
concatenation and `replace(/_/g, '-')`, with special cases threaded through query parameters. A
mistyped module name fails silently at runtime. Replacing that with one typed registry is a concrete,
checkable improvement, not a stylistic one.

## Current state

### What the framework provides

View shells (`packages/is-vue-framework/src/components/views/`):

```ts
ListView   { table: TableProps,   title?, description?, controls?: readonly ViewControl[] }
DetailView { detail: DetailProps, title?, description?, controls?: readonly ViewControl[] }
FormView   { form: FormProps,     title?, description?, submitLabel?, controls? }
           emits 'submitted' (result: unknown) and 'error' (error: SubmitError)
```

`ViewControl` (`components/views/controls.ts`) is an identity, a label, a placement
(`'primary' | 'secondary' | 'row'`), and **either** `onSelect` **or** `to`. It is explicitly not a
command or a workflow interpreter — the file says so, and anything with branching belongs in route
code reached through a handler or a slot.

`standardControls` (`resources/controls.ts`) infers list/detail/create/update/delete from
`resource.capabilities`, `resource.routes`, and an optional `AccessAdapter`. It accepts `record`, and
passes it to `access.allows({ operation, permission, record })` — so record-dependent visibility is
supported for standard controls. **Verify and Reject are not standard controls**; they are custom
`ViewControl` descriptors with `onSelect`.

Resources (`resources/defineResource.ts`) expose `table()`, `detail({ id })`, `form()` /
`form({ id })`, `remove(id)`, `invalidate({ id? })`. `table()` accepts `namespace` and
`searchParameters`.

### The exemplar to follow

`apps/web/src/routes/(authenticated)/settings/users/[userId]/roles/index.route.vue` is the pattern for
an optimistic workflow next to a collection: a `computed` table with an explicit `namespace` and
`searchParameters`, a `pending` set for per-row concurrency, an `optimistic` record for immediate
feedback, rollback with a toast on failure, and targeted `invalidate`. Read it before writing Step 4.

`apps/web/src/framework/adapters/resources/roles.ts` is the pattern for a resource definition
(including `rolePermissions`, an ordinary collection scoped by `searchParameters`, with the toggle as
explicit exported code).

### Routing

Filesystem routing under `apps/web/src/routes/`, `(authenticated)` and `(public)` layout groups,
`definePage({ name, meta })` inside each route file. `apps/web/src/router/legacy-urls.ts` normalizes
old URLs; the resource-migration guide (`docs/architecture/resource-migration-guide.md`, section 6)
requires an entry per migrated feature.

### API surface from plans 022–024

```
GET    /overtimes/list            GET  /overtimes/detail/:id
POST   /overtimes/create          PATCH /overtimes/update/:id
POST   /overtimes/submit/:id      POST /overtimes/verify/:id   { decision, description? }
GET    /notifications/list        GET  /notifications/detail/:id
GET    /notifications/unread-count            -> { data: { total } }
POST   /notifications/mark-seen   { ids }     -> { data: { updated } }
```

Notification records carry `moduleName`, `moduleId`, `statusCode` (`unseen` / `seen` / **`unset` —
a chain step whose turn has not come, not a read state**), and `payload`.

## Commands you will need

| Purpose | Command |
|---|---|
| Web dev server | `pnpm dev` |
| Web tests | `pnpm --filter @southneuhof/framework-web test` |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` |
| Web lint | `pnpm --filter @southneuhof/framework-web lint` |
| Web build | `pnpm --filter @southneuhof/framework-web build` |
| API (for manual checks) | `pnpm --filter @southneuhof/api dev` |

## Scope

**In scope**:

- `apps/web/src/framework/adapters/resources/{overtimes.ts,notifications.ts}` (create) and their specs
- `apps/web/src/framework/notifications/moduleRoutes.ts` (create: the typed registry) and its spec
- `apps/web/src/routes/(authenticated)/hr/overtimes/` (create: `index`, `new`, `[overtimeId]`)
- `apps/web/src/routes/(authenticated)/to-do/index.route.vue` (create)
- `apps/web/src/components/navigations/` — the inbox drawer and its unread badge
- `apps/web/src/router/legacy-urls.ts` (entries for the migrated screens)
- `apps/web/src/components/navigations/navigation-manifest.ts` (menu entries)
- `plans/README.md`

**Out of scope**:

- `packages/is-vue-framework/**`. If a framework change looks necessary, STOP and report — that is a
  finding this slice exists to produce. The one anticipated pressure point is a record-state-dependent
  control, and the analysis above says custom `ViewControl` covers it without a framework change.
- Any `apps/api` file. The API is finished; if something is missing, report rather than patching
  across the boundary.
- Real-time delivery (WebSocket, SSE). The badge polls.
- Screens for other modules. The registry is built with one real entry plus the mechanism.

## Steps

### Step 1: Add the resources

`apps/web/src/framework/adapters/resources/overtimes.ts` — modelled on `roles.ts`. Fields with
Indonesian labels matching the existing app (`Tanggal`, `Jam Mulai`, `Durasi (menit)`, `Pemohon`,
`Status`). `operations: createRpcOperations(rpc.overtimes)`. `schemas` from the entity module
(`overtime.schemas.create` / `.update`), as `roles.ts` does — there is no mirror any more. Route
targets under `/hr/overtimes`.

Export the two workflow calls as explicit functions, not as fabricated CRUD operations:

```ts
export async function submitOvertime(id: string): Promise<void>
export async function verifyOvertime(id: string, decision: 'approved' | 'rejected', description?: string): Promise<void>
```

`apps/web/src/framework/adapters/resources/notifications.ts` — list and detail only, since the API
exposes no writes. Plus:

```ts
export async function unreadNotificationCount(): Promise<number>
export async function markNotificationsSeen(ids: string[]): Promise<number>
```

Also export a `verificationSteps` resource: an ordinary collection scoped by
`searchParameters: { module_name, module_id }`, reading the record's chain for the timeline in Step 3.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

### Step 2: Build the typed deep-link registry

Create `apps/web/src/framework/notifications/moduleRoutes.ts`. One map from `moduleName` to a function
returning a route location:

```ts
/**
 * Where a notification points. The reference application resolved this with a
 * nested ternary over module_name, duplicated across two components; a mistyped
 * module fell through to a route that did not exist, silently, at runtime.
 */
export const notificationRoutes = {
  overtimes: (n: NotificationRecord) => ({ name: 'overtime-detail', params: { overtimeId: n.moduleId } }),
} satisfies Record<string, (n: NotificationRecord) => RouteLocationRaw>

/** Null for an unregistered module — callers render a non-navigating card. */
export function notificationRoute(n: NotificationRecord): RouteLocationRaw | null
```

`satisfies` keeps the values checked while leaving the key set inferred, so adding a module is one
line and a wrong shape is a type error.

Unregistered modules must return `null` and the UI must render them as plain, non-navigating cards.
Notifications arrive from the server for modules the web app may not have screens for yet; that is a
normal state, not an error, and must not throw.

**Verify**: a new `moduleRoutes.spec.ts` asserts a registered module resolves, an unregistered one
returns `null`, and a registered module with a null `moduleId` returns `null` rather than a route with
`undefined` params.

### Step 3: Build the overtime screens

```text
routes/(authenticated)/hr/overtimes/
  index.route.vue              -> /hr/overtimes
  new.route.vue                -> /hr/overtimes/new
  [overtimeId]/index.route.vue -> /hr/overtimes/:overtimeId
  [overtimeId]/edit.route.vue  -> /hr/overtimes/:overtimeId/edit
```

`index` — `ListView` with `overtimes.table()` and `standardControls({ resource: overtimes, surface: 'list' })`.

`new` and `edit` — `FormView` with `overtimes.form()` and `overtimes.form({ id })`. On `submitted`,
navigate to the detail route.

`[overtimeId]/index` — `DetailView` with `overtimes.detail({ id })`, plus:

- the verification timeline: `verificationSteps.table({ searchParameters: { module_name: 'overtimes', module_id: id } })`,
  an ordinary scoped collection, no nested-resource vocabulary
- `standardControls({ resource: overtimes, surface: 'detail', id, record })` for the ordinary controls
- **Submit** — a custom `ViewControl`, present only while `statusCode === 'draft'`
- **Verify** / **Reject** — custom `ViewControls`, present only while `statusCode === 'waiting'` **and**
  the current step is the caller's to act on

Availability is computed from the loaded record and the current session, and a control that is
unavailable is **absent, not disabled** — that rule is stated in `resources/controls.ts` and in
`plans/README.md`'s invariants. Reject opens a dialog for the required description before calling
`verifyOvertime`.

Do not re-implement the authorization rule client-side beyond what the record already reveals. The
server is authoritative (plan 024 enforces it); the UI is deciding what to render, and a 403 must
still be handled with a toast.

Follow the optimistic pattern from the users-roles exemplar: guard against double submission, roll
back on failure with a toast, then `overtimes.invalidate({ id })`.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` and `test` → exit 0.

### Step 4: Build the inbox and badge

Add a notification drawer to `apps/web/src/components/navigations/`. It renders
`notifications.table({ namespace: 'inbox' })`, resolves each row's target with `notificationRoute`,
navigates on click, and calls `markNotificationsSeen` for the rows it displayed.

Treat `statusCode` correctly: **`unset` is not unread.** Only `unseen` counts toward the badge and only
`unseen` rows are marked seen. Getting this wrong inflates every badge in the system.

The badge polls `unreadNotificationCount` on an interval. Use a single interval owned by one component,
clear it on unmount, and pause it while the tab is hidden (`useDocumentVisibility` from
`@vueuse/core`, already a dependency). Do not poll per-component.

Create `routes/(authenticated)/to-do/index.route.vue` — the same notifications resource, filtered to
verification-type notifications, in a **second namespace**:

```ts
notifications.table({ namespace: 'to-do', searchParameters: { notification_type: 'verification' } })
```

Two independent query namespaces over one resource is a stated release gate in `plans/README.md`; this
is that proof, in production code rather than a fixture.

**Verify**: `pnpm --filter @southneuhof/framework-web test` → exit 0, including a spec asserting the two
namespaces do not share query state.

### Step 5: Wire navigation and legacy URLs

Add menu entries to `apps/web/src/components/navigations/navigation-manifest.ts` for
`/hr/overtimes` and `/to-do`.

Add `apps/web/src/router/legacy-urls.ts` entries mapping the reference app's query-state URLs
(`?overtimes_view=detail&overtimes_id=…`) to the new paths, preserving unrelated query values. Section
6 of `docs/architecture/resource-migration-guide.md` requires this per migrated feature; the existing
roles entries are the pattern, and `router/__tests__/legacy-urls.spec.ts` is where the test goes.

**Verify**: `pnpm --filter @southneuhof/framework-web test` → the legacy-url spec covers the new entries.

### Step 6: Update the index and the note

Add the 025 row to `plans/README.md`. In `plans/NOTES-trom-proof-slice.md`, replace the "what the slice
is meant to prove" section's open items with what was actually found — specifically whether the scoped
`ModelSource` worked (023), whether one transaction spanned the workflow writes (024), and whether any
framework change proved necessary (this plan). That note is the slice's verdict; leaving it phrased as
open questions after the work lands makes it useless.

## Test plan

- `overtimes.spec.ts` — `submitOvertime` / `verifyOvertime` call the real RPC routes. Assert against
  the RPC client, not a mocked generic `post`; a mocked `post` assertion is exactly what hid the dead
  `mapping-user-roles/toggle` endpoint that plan 022 had to fix.
- `moduleRoutes.spec.ts` — registered, unregistered, and null-`moduleId` cases.
- `notifications.spec.ts` — `unset` rows are excluded from the unread count and from mark-seen.
- A detail-screen spec — Submit appears only on `draft`; Verify/Reject only on `waiting` and only for
  the acting user; unavailable controls are **absent** from the DOM, not disabled.
- A namespace spec — the inbox and to-do tables hold independent query state.
- `router/__tests__/legacy-urls.spec.ts` — the new redirects.
- Pattern for all of these: `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/permissions/index.route.spec.ts`.

## Done criteria

- [ ] `pnpm --filter @southneuhof/framework-web type-check`, `test`, `lint`, `build` all exit 0
- [ ] Every spec listed in the test plan exists and passes
- [ ] `git diff --stat packages/is-vue-framework` is empty
- [ ] `grep -rn "replace(/_/g" apps/web/src` returns no matches — no stringly-typed module routing
- [ ] The unread badge counts `unseen` only; a spec asserts `unset` is excluded
- [ ] `plans/NOTES-trom-proof-slice.md` records the slice's actual findings
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` row updated

## STOP conditions

- A record-state-dependent control cannot be expressed with a custom `ViewControl` plus `standardControls`'
  `record` argument. Record precisely what is missing — this is a primary finding of the slice.
- Two namespaces over one resource share query state. That contradicts a stated release gate; stop and
  report rather than working around it with a second resource key.
- Any change appears necessary inside `packages/is-vue-framework/`.
- Any change appears necessary inside `apps/api/`. Report the gap instead of patching across the
  boundary mid-plan.
- The polling badge causes a request storm in development (more than one request per interval per tab).
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- **Adding a module to the inbox is one line** in `notificationRoutes`. If anyone reaches for a string
  transform or a ternary over `moduleName` again, that is a review failure — the registry exists
  specifically to replace the reference app's duplicated ternaries.
- **`unset` is not unread.** Stated in plan 023, restated here, and it is the most likely subtle bug in
  this plan.
- Polling is a deliberate simplification. Real-time delivery needs a transport the API does not have;
  it is a separate decision, not a refinement of this one.
- What a reviewer should scrutinize: that unavailable controls are absent rather than disabled; that
  the two namespaces are genuinely independent; and that no client-side check is mistaken for
  authorization — the server decides, the UI only chooses what to draw.
- After this lands, `plans/NOTES-trom-proof-slice.md` is the record of what the slice proved. Read it
  before starting a second module.
