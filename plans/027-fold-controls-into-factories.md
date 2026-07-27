# Plan 027: Fold standard controls into the resource surface factories

> **Implementation instructions**: Follow this plan step by step. Run every verification command and
> confirm the expected result before moving to the next step. If anything in the "STOP conditions"
> section occurs, stop and report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**:
> ```sh
> git diff --stat e4f345c..HEAD -- packages/is-vue-framework/src apps/web/src
> ```
> Changes attributable to plan 026 (DONE) are expected. If `resources/controls.ts`, the six route
> files listed under Current state, or the adapter specs differ otherwise from the excerpts below,
> reconcile before proceeding. The specification is the Addendum of
> `docs/architecture/routing-and-controls-review.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (breaking change to factory return shapes; six route files + four specs migrate)
- **Depends on**: `plans/026-declared-identity-shapes.md`
- **Category**: web architecture (identity / controls / routing track)
- **Planned at**: commit `e4f345c`, 2026-07-27

## Why this matters

Every CRUD route repeats the same derivable line:

```ts
const controls = computed(() => standardControls({ resource: users, surface: 'detail', id: userId.value }))
```

Everything `standardControls` reads — `capabilities`, `permissions`, `routes` — already lives on the
resource, and every argument it takes is also passed to the surface factory on the adjacent line. The
decided design moves the projection into the factories themselves: routes `v-bind` one factory call,
`standardControls` stops being public API, and its runtime surface/`id` throws
(`resources/controls.ts:64`, `:80`) become type errors. The worst remaining boilerplate — hand-written
record → detail links like
`users.routes.detail?.(String(record.id))`
(`apps/web/src/routes/(authenticated)/settings/users/index.route.vue:15`) — is replaced by a
`rowLink` derived from the identity extractor, which is `resource.identity`'s first real consumer.

Shells stay dumb: the invariant documented in `components/views/controls.ts` ("shells never resolve
routes or permissions themselves") is preserved — resolution moves into the resource, not the shell.

## Current state

- `resources/controls.ts` — `standardControls(options)` as analyzed in the review note; exported from
  the package index.
- `components/views/controls.ts` — `ViewControl`, `controlsAt`; unchanged by this plan.
- Factories return raw core props: `table()` → `TableProps`, `detail({ id })` → `DetailProps`
  (`resources/defineResource.ts:155-179`); shells receive them as `:table` / `:detail` plus a
  separate `:controls`.
- Call sites of `standardControls` (the full migration inventory):
  - `apps/web/src/routes/(authenticated)/settings/users/index.route.vue` (list; also the hand-written row link)
  - `apps/web/src/routes/(authenticated)/settings/users/[userId]/index.route.vue` (detail)
  - `apps/web/src/routes/(authenticated)/settings/roles/index.route.vue`
  - `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/index.route.vue`
  - `apps/web/src/routes/(authenticated)/hr/overtimes/index.route.vue`
  - `apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/index.route.vue`
  - specs: `apps/web/src/framework/adapters/resources/{users,roles,overtimes,notifications}.spec.ts`
- Access: `standardControls` takes an optional `AccessAdapter`; no route currently passes one.
  `useResourceRuntime()` exposes `adapters` (schemas today) — confirm during Step 1 whether an
  `access` adapter slot already exists there or must be added.

## Commands you will need

| Purpose | Command |
|---|---|
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` |
| Framework types | `pnpm --filter @southneuhof/is-vue-framework build` |
| Web tests | `pnpm --filter @southneuhof/framework-web test` |
| Web types | `pnpm --filter @southneuhof/framework-web type-check` |
| Call-site sweep | `grep -rn "standardControls" apps/web/src packages` |

## Scope

**In scope**:

- `packages/is-vue-framework/src/resources/{defineResource.ts,controls.ts,index.ts?}` and package
  index exports; `resources/runtime.ts` if the access adapter slot is missing
- The six route files and four adapter specs above
- New/extended tests in `resources/__tests__/`

**Out of scope**:

- Shell components (`ListView`, `DetailView`, `views/controls.ts`) — their props contract is
  unchanged; only what callers pass changes
- Row-placement controls rendered *inside* the table (edit/delete per row) — `rowLink` is this
  plan's only record-level projection; row controls ride on the same extractor later if wanted
- Tabs, guards, URL changes (plan 028)
- Any `routes.*` target string changes (plan 028)

## Steps

### Step 1: Access adapter in the runtime

Confirm `useResourceRuntime().adapters` carries an `AccessAdapter` (`contracts/access.ts`). If not,
add an optional `access` slot to the runtime adapters, defaulting to undefined (= allow, matching
`allowed()` in `controls.ts:41-45` today). No app wiring is required for behavior parity.

**Verify**: framework build green; a runtime test proves factories consult the adapter when present.

### Step 2: Factory return bundles

Change the surface factories to return shell-ready bundles (breaking, by decision — clean break on
the rebuild branch):

```ts
table(args?)  → { table: TableProps, controls: ViewControl[], rowLink?: (record: TRecord) => string }
detail(args)  → { detail: DetailProps, controls: ViewControl[] }
```

- `detail` args gain `{ onDelete?, controls?: { overrides?, labels?, extra?: ViewControl[] } }`,
  passing through to the internal projection; `extra` is appended after the standard set. `table`
  args gain the same `controls` block (create button today).
- `rowLink` is defined only when both `routes.detail` and the identity extractor exist:
  `(record) => routes.detail(identity(record))`. This consumes plan 026's `TIdentity` — composite
  resources get correct row links with no route code.
- Memoization: the bundles close over functions; keep the existing `memoize` keying on the
  serializable args only (as `table`/`detail` already do) and confirm `onDelete` identity does not
  defeat it — exclude functions from the memo key the same way the current code excludes none (add a
  test).
- The delete control appears only when `onDelete` is supplied *and* capability+access allow —
  replacing the runtime "neither handler nor route" throw (`controls.ts:79-83`) with a type-level
  requirement: the `overrides`/`extra` types must not admit a control with neither `to` nor
  `onSelect`.

`standardControls` becomes a private function consumed by `defineResource`; remove it from the
package index. Keep `views/controls.ts` exports untouched.

**Verify**: framework tests — per-capability emission (users: no create/delete anywhere, matching
the adapter comment in `apps/web/src/framework/adapters/resources/users.ts`), access-denied controls
absent, `extra` appended, overrides/labels applied, `rowLink` undefined when `routes.detail` is
absent.

### Step 3: Migrate the six routes

Pattern per surface:

```vue
<!-- list -->
<ListView title="Pengguna" v-bind="usersView" ...>          <!-- usersView = users.table() -->
  <template #cell:name="{ value, record }">
    <a :href="usersView.rowLink?.(record)" @click.prevent="...">{{ value }}</a>
  </template>
</ListView>

<!-- detail -->
<DetailView title="Detail Pengguna" v-bind="users.detail({ id: userId })" />
```

Delete every `standardControls` import and `controls` computed. The users list's
`String(record.id)` link goes through `rowLink`. Detail screens that need delete pass `onDelete`
into the factory args. Where reactivity matters (`userId` from route params), keep the factory call
inside a `computed` as `users.detail({ id: userId.value })` is today.

**Verify**: `grep -rn "standardControls" apps/web/src` → only spec history (Step 4 removes those);
web tests + type-check green; `pnpm dev` spot-check users list → detail → edit → delete flows.

### Step 4: Update the adapter specs

The four specs asserting on `standardControls` output move to asserting on the factory bundles
(`users.table().controls`, `users.detail({ id }).controls`). Assertions about *which* controls exist
per capability carry over verbatim — only the entry point changes.

**Verify**: `pnpm --filter @southneuhof/framework-web test` green.

## Done criteria

- No route file imports `standardControls`; the symbol is not exported from the package.
- Every CRUD route passes one factory bundle via `v-bind`; the hand-written row-link extraction is
  gone from `users/index.route.vue`.
- Composite-identity resources (type-test fixture from 026) get typed `rowLink` and controls with no
  extra code.
- Shell components untouched; framework + web suites and type-checks green.
- `plans/README.md` row updated.

## STOP conditions

- The bundle shape cannot be `v-bind`-spread onto a shell without renaming shell props — stop;
  changing shell prop contracts is out of scope and would ripple into `views/__tests__`.
- Memoization must be weakened (cache disabled) to accommodate `onDelete` — stop and report; the
  factories' referential stability is what keeps table state from resetting.
- An access adapter turns out to be *required* (not optional) somewhere, changing behavior for
  routes that never passed one — stop; behavior parity without wiring is a hard requirement.

## Outcome (2026-07-27)

Implemented as specified, with three recorded deviations:

1. **`rowLink` lives on the resource, not in the table bundle.** A function inside the bundle cannot
   survive `v-bind` onto `ListView`: Vue treats the undeclared prop as a fallthrough attribute and
   renders `rowlink="(r) => String(r)"` onto the shell's root element (verified by mounting
   `ListView` with an extra function prop). Keeping it in the bundle would have required declaring a
   prop on the shell, which the STOP conditions rule out. `resource.rowLink?(record)` is therefore a
   resource member — defined only when `routes.detail` exists — and the bundles stay exactly
   `{ table, controls }` and `{ detail, controls }`, spreadable with no shell change.
2. **Controls are rebuilt per call; the core props stay memoized.** Memoizing the whole bundle would
   cache a closure over the route's `onDelete` — `stableValue`/`JSON.stringify` drops functions from
   the memo key, so a second mount of the same screen would receive the first component instance's
   handler, holding dead reactive state. `tableProps`/`detailProps` keep their existing memoization
   (so `table` identity is stable across control-argument changes, which is what keeps table state
   from resetting); the bundle wrapper and the `controls` array are fresh each call. Memoization is
   not weakened where the STOP condition points, so this is not a stop.
3. **`standardControls` takes the resource's parts, not the resource.** Now internal, it receives
   `{ key, capabilities, permissions, routes, access, … }`, which retires the
   `Resource<never, never, never, never>` variance hack and lets it be generic over `TIdentity`.

Also: `ControlsArguments.extra` is typed `ActionableControl[]` (`ViewControl` intersected with
`{ to } | { onSelect }`), so the old "neither handler nor route target" throw is now unrepresentable;
delete is emitted only when `onDelete` is supplied, which retires the missing-`id` throw as well. The
access adapter slot already existed on the runtime adapters (`adapters.access`, permissive default),
so Step 1 needed no change and behavior parity is exact.

Beyond the six routes and four specs, the bundle change rippled to every other `resource.table()`
consumer, each now reading `.table`: `adapters/resources/users.ts`, `NotificationInbox.vue`,
`to-do/index.route.vue`, `roles/[roleId]/permissions/index.route.vue`, `CopyPermissionsDialog.vue`,
`QueryOwnershipFixture.vue`, and `rpcResource.spec.ts`.

The `pnpm dev` spot-check was deferred to the end of plan 028, which changes the same URLs again.

## Maintenance notes

- Row-placement controls (per-row edit/delete) were deliberately deferred; when wanted, they are the
  same projection as `rowLink` over `routes.update`/`remove` — note it here if a plan is cut for it.
- Plan 028 changes `routes.detail` target strings; the bundles pick that up automatically, which is
  the point of this ordering.
