# Plan 021: Simplify DetailView to navigation, actions, and Detail

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update this plan's status in
> `plans/README.md` after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat fc8c9ec..HEAD -- packages/is-vue-framework/src/components/views/DetailView.vue packages/is-vue-framework/src/components/views/__tests__/views.spec.ts apps/web/src/routes/'(authenticated)'/settings/users/'[userId]'/detail.route.vue apps/web/src/routes/'(authenticated)'/settings/roles/'[roleId]'/detail.route.vue apps/web/src/routes/'(authenticated)'/hr/overtimes/'[overtimeId]'/detail.route.vue docs/architecture/web-application-architecture.md`
> If an in-scope file changed since this plan was written, compare the "Current
> state" excerpts against live code before proceeding. A mismatch is a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: `plans/020-render-detail-as-native-key-value-table.md`
- **Category**: tech-debt
- **Planned at**: commit `fc8c9ec`, 2026-07-28

## Why this matters

`DetailView` exposes six layout concepts even though the desired detail surface
has one navigation header, one far-end action region, and one record body. The
extra `description`, `header`, `body`, `print`, and `footer` APIs preserve legacy
CRUD flexibility and make application detail pages inconsistent. This plan
adopts the intentional breaking simplification, keeps routes responsible for
navigation destinations, and migrates every active consumer atomically.

## Current state

- `packages/is-vue-framework/src/components/views/DetailView.vue` accepts
  optional `title` and `description`, plus resource-first or raw Detail props.
  It exposes `header`, `controls`, `body`, `print`, `footer`, and forwarded
  `value:*` slots.
- Its current template at `DetailView.vue:37-60` has an unstyled header, a
  replaceable body, a print region, and an unconditional footer.
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts:253-295`
  promises the old footer and print regions. Those assertions must be replaced,
  not preserved.
- Three active routes consume `#footer`:
  - `apps/web/src/routes/(authenticated)/settings/users/[userId]/detail.route.vue:24-30`
  - `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail.route.vue:42-49`
  - `apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/detail.route.vue:122-131`
- The overtime route has a dedicated `onBack()` wrapper at lines 115-117 used
  only by the footer button.
- `Card.vue` is the design-system surface primitive. `ListView.vue:204-320`
  demonstrates `Card variant="outlined" color="surfaceContainerLow"`, responsive
  header flex, tokenized borders, heading typography, and padded body.
- `Button.vue` supports accessible icon links through `kind="icon"`,
  `variant="standard"`, `href`, and `aria-label`; `Icon.vue` includes
  `arrow-left`.
- Architecture rules at
  `docs/architecture/web-application-architecture.md:50-57` say routes own
  navigation while surface shells own Cards, headers, toolbars, and route-owned
  slots. Therefore `DetailView` must not call `router.back()` or infer history.
- `DetailCapableResource` exposes only `detail(args)` at
  `defineResource.ts:323-325`; it does not expose a list destination. Back
  navigation must be an explicit route-owned prop.

## Target public contract

`DetailView` will require:

```ts
type DetailViewChromeProps = {
  title: string
  backTo: RouteLocationRaw
}
```

combined with the existing exclusive resource-first/raw-detail union. Keep only:

- `#controls`: optional far-end navigation/action content;
- forwarded `value:*` slots for `Detail`.

Remove `description`, `#header`, `#body`, `#print`, and `#footer`. Do not add a
generic default slot. `title` and `backTo` are required so every normal detail
surface has one predictable heading and deterministic back link.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused view tests | `pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/views/__tests__/views.spec.ts` | exit 0; all view-shell tests pass |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Web tests | `pnpm --filter @southneuhof/framework-web test` | exit 0 |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

Dependencies are already installed. Do not run `pnpm install`.

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/views/DetailView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`
- `apps/web/src/routes/(authenticated)/settings/users/[userId]/detail.route.vue`
- `apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail.route.vue`
- `apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/detail.route.vue`
- `docs/architecture/web-application-architecture.md`

**Out of scope**:

- `packages/is-vue-framework/src/components/core/Detail.vue` and its tests; plan
  020 owns them.
- `ListView.vue`, `FormView.vue`, `Card.vue`, `Button.vue`, and `Icon.vue`.
- Resource capability or surface contracts in `defineResource.ts`.
- Automatic edit/delete controls, permission decisions, record-aware controls,
  printing/export, browser-history fallback, or new navigation abstractions.
- The legacy `components/composites/Detail.vue` and previous
  `/Users/gamer/Documents/projects/iso-vue` sources.
- Unrelated route layout, tabs, workflow behavior, or user changes in
  `Table.vue`.

## Git workflow

- Suggested branch: `codex/021-simplify-detail-view`
- Commit implementation, consumer migration, tests, and doc correction as one
  atomic change if asked to commit; the new required props cannot land safely
  without consumers.
- Suggested message:
  `refactor(framework): simplify detail view shell`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Rewrite tests around the reduced contract

In `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts`:

1. Give every `DetailView` mount a `title` and deterministic `backTo`, such as
   `{ name: 'test-route' }`.
2. Keep the existing assertion that raw Detail props reach `Detail` unchanged in
   substance, but update DOM selectors for plan 020's table markup.
3. Replace the old “controls and footer” test with assertions that:
   - one `<h1>` renders the required title;
   - one back link exists, has accessible name `Kembali`, and resolves the
     supplied route;
   - `#controls` renders at the opposite end of the header;
   - no `<footer>` exists.
4. Replace the print-region test with a test proving `value:*` slot forwarding
   still works.
5. Add a source-boundary assertion that `DetailView.vue` contains none of:
   `name="header"`, `name="body"`, `name="print"`, `name="footer"`,
   `description`, `router.back`, or `useRouter`.
6. Keep the existing shell boundary assertion that core props are forwarded
   using `v-bind="surface.detail"`.

Do not weaken unrelated ListView or FormView tests.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/views/__tests__/views.spec.ts`
→ the new contract tests should fail against old `DetailView`; unrelated shell
tests should still execute.

### Step 2: Implement the minimal DetailView shell

In `packages/is-vue-framework/src/components/views/DetailView.vue`:

1. Add type-only `RouteLocationRaw` import.
2. Require `title: string` and `backTo: RouteLocationRaw`.
3. Remove the `description` prop and all obsolete slot regions.
4. Preserve the exclusive resource-first/raw-detail prop union, `surface`
   computation, `detailSlots` filtering, direct
   `<Detail v-bind="surface.detail">`, and `value:*` slot forwarding.
5. Import and reuse `Card`, `Button`, and `Icon`; use Vue Router's `RouterLink`
   rather than imperative router access.
6. Render an outer `.is-detail-view` section with vertical spacing and two
   outlined low-surface Cards:
   - header Card: responsive flex layout, left cluster with back link and one
     `<h1>`, right cluster containing `#controls` only when supplied;
   - body Card: padded container holding `Detail`.
7. Render the back control through `RouterLink` custom mode plus `Button`
   `kind="icon"`, `variant="standard"`, `href`, and `aria-label="Kembali"`.
   Use `Icon name="arrow-left"`. This must produce anchor navigation and must not
   call `router.back()`.
8. Follow `ListView.vue` design tokens and spacing. On narrow screens, allow the
   control group to wrap below/alongside the title without overlapping it.

Use semantic `<header>` rather than `<nav>` for the whole bar because it contains
both navigation and non-navigation actions. The back anchor itself supplies the
navigation semantics.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework exec vitest run --environment jsdom src/components/views/__tests__/views.spec.ts`
→ exit 0; all view-shell tests pass.

### Step 3: Migrate every active DetailView consumer

Update all three in-scope application routes atomically:

- Users: pass
  `:back-to="{ name: users.capabilities.list!.to!.name }"` and delete the footer
  slot.
- Roles: pass
  `:back-to="{ name: roles.capabilities.list!.to!.name }"` and delete the footer
  slot. Preserve update, delete, toast, and post-delete replacement behavior.
- Overtimes: pass
  `:back-to="{ name: overtimes.capabilities.list!.to!.name }"`, delete the footer
  slot, delete the now-unused `onBack()` function, and remove `useRouter` only if
  no other code in that file uses it. Preserve workflow actions and all record
  loading.

Use non-null assertions only where the existing route already depends on the
list capability. Do not derive back targets inside `DetailView`.

**Verify**:

- `rg -n "<template #footer>|onBack\\(|router\\.back\\(" 'apps/web/src/routes/(authenticated)' --glob 'detail.route.vue'`
  → no matches caused by these three routes.
- `rg -n "<DetailView" apps/web/src --glob '*.vue'`
  → every active `DetailView` call includes `back-to`.
- `pnpm --filter @southneuhof/framework-web type-check`
  → exit 0.

### Step 4: Reconcile architecture documentation

Update the `DetailView` bullet at
`docs/architecture/web-application-architecture.md:298-299` to state that the
shell composes a required deterministic back target, title, optional
route-owned `controls`, and `Detail`. Remove claims about generic layout regions.

Update the normal usage example around lines 304-309 so its `DetailView` call
includes `title` and `back-to`. Keep the rules “routes own navigation” and
“surface shells own application look” intact.

Do not rewrite unrelated architecture history.

**Verify**:
`rg -n "detail toolbar, layout regions|<DetailView :resource=\"incidents\" />" docs/architecture/web-application-architecture.md`
→ no stale layout-region claim or unqualified DetailView example.

### Step 5: Run full gates and review the breaking change

Run framework and web tests/typechecks. Inspect the final diff for obsolete API
names and out-of-scope changes.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework test` → exit 0.
- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.
- `pnpm --filter @southneuhof/framework-web test` → exit 0.
- `pnpm --filter @southneuhof/framework-web type-check` → exit 0.
- `rg -n "name=\"(header|body|print|footer)\"|description|router\\.back|useRouter" packages/is-vue-framework/src/components/views/DetailView.vue`
  → no output.
- `git diff --name-only -- packages/is-vue-framework/src/components/views/DetailView.vue packages/is-vue-framework/src/components/views/__tests__/views.spec.ts 'apps/web/src/routes/(authenticated)/settings/users/[userId]/detail.route.vue' 'apps/web/src/routes/(authenticated)/settings/roles/[roleId]/detail.route.vue' 'apps/web/src/routes/(authenticated)/hr/overtimes/[overtimeId]/detail.route.vue' docs/architecture/web-application-architecture.md`
  → only the six in-scope files. Pre-existing dirty files may remain dirty but
  must not gain new hunks from this plan.

## Test plan

- `views.spec.ts` covers:
  - required title;
  - deterministic accessible back anchor;
  - far-end `#controls`;
  - direct raw-detail forwarding;
  - resource-first forwarding through existing tests;
  - `value:*` passthrough;
  - absence of removed regions and router-history logic.
- Existing app tests remain the integration coverage for route imports,
  workflow controls, tabs, and resource behavior.
- Typechecks prove all DetailView callers adopted required `title` and `backTo`.
- Structural pattern: use `mountCore` and its memory router, as existing view
  tests do.

## Done criteria

- [ ] `DetailView` requires `title` and `backTo`.
- [ ] Header shows accessible deterministic back link and one `<h1>` on the left.
- [ ] Only `#controls` occupies the far end; it wraps safely at narrow widths.
- [ ] Body Card renders `Detail` with unchanged props and `value:*` slots.
- [ ] `description`, `#header`, `#body`, `#print`, and `#footer` are removed.
- [ ] `DetailView` contains no imperative router/history behavior.
- [ ] All three active application consumers pass `backTo` and use no footer.
- [ ] Architecture docs describe the reduced contract.
- [ ] Framework and web tests/typechecks exit 0.
- [ ] No out-of-scope source file receives a hunk.
- [ ] `plans/README.md` marks plan 021 DONE after implementation review.

## STOP conditions

Stop and report instead of improvising if:

- Another active `DetailView` consumer appears after the initial inventory and
  cannot provide a deterministic back destination.
- A consumer relies on `#body`, `#print`, `#header`, or `description` for shipped
  behavior not found during planning.
- `RouterLink` custom mode plus framework `Button` cannot produce a real anchor
  with accessible name `Kembali`.
- Correct migration requires changing resource capability contracts.
- Verification fails twice after a reasonable local correction.
- Work requires modifying a file outside Scope.

## Maintenance notes

- `backTo` is intentionally explicit. Never replace it with `router.back()`;
  direct links and refreshed tabs need deterministic behavior.
- Keep route-specific workflow buttons in `#controls`. Do not turn them into
  generic action descriptors or move authorization into the visual shell.
- Printing/export is deliberately removed from this shell. A future print
  feature needs its own explicit surface contract and evidence from a current
  product flow.
- Review responsive wrapping and anchor semantics closely; visual similarity
  must not turn the back control into a non-link button.
