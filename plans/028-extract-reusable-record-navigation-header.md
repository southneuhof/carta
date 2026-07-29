# Plan 028: Extract reusable record navigation header

> **Implementation instructions:** Follow this plan in order. Run every
> verification gate before continuing. If a STOP condition occurs, stop and
> report it; do not widen scope by improvising.
>
> **Drift check:** `git diff --stat 7700799..HEAD -- packages/is-vue-framework/src/components/views packages/is-vue-framework/src/components/base packages/is-vue-framework/src/components/views/__tests__ packages/is-vue-framework/src/index.ts packages/is-vue-framework/package.json`

## Status

- **Priority:** P1
- **Effort:** M
- **Risk:** MED
- **Depends on:** none
- **Category:** tech-debt
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

`DetailView.vue` and `FormView.vue` each own nearly identical page-header chrome:
back navigation, title/description, and a controls slot inside an outlined
surface card. Custom screens often need this navigation while using neither
`DetailView` nor `FormView`; today they must duplicate private markup. A public,
framework-owned header component gives all screens one accessibility and spacing
contract while leaving data loading, form state, and custom body content in the
consumer.

## Current state

- `packages/is-vue-framework/src/components/views/DetailView.vue:41-57`
  renders a `Card`, `RouterLink` custom slot, icon back button, `title`, and
  `controls`; it always uses `backTo`.
- `packages/is-vue-framework/src/components/views/FormView.vue:219-237`
  renders a second card with a back button calling `router.back()`, an optional
  `title`/`description` block or `header` slot, and the same `controls` slot.
- `DetailView` imports `RouterLink`, `Button`, `Card`, and `Icon` at lines 9-18.
  `FormView` imports `useRouter` and the same visual primitives at lines 9-18.
- `packages/is-vue-framework/src/index.ts` is the package public barrel.
- Existing visual conventions: Tailwind utilities, `Card variant="outlined"
  color="surfaceContainer"`, base `Button`/`Icon`, `RouterLink` custom slot, and
  accessible `aria-label`. Do not introduce another UI system.

Target API:

```vue
<NavigationHeader
  title="Request Overtime"
  description="Optional explanatory text"
  :back-to="{ name: 'hr-overtimes' }"
>
  <template #controls>...</template>
</NavigationHeader>
```

Support `backTo?: RouteLocationRaw` plus fallback `useRouter().back()`. Expose
`header` (replaces default title/description) and `controls` slots. Preserve
existing form body/dirty-navigation behavior.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Framework typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Framework tests | `pnpm --filter @southneuhof/is-vue-framework test` | all pass |
| Browser tests | `pnpm --filter @southneuhof/is-vue-framework test:browser` | all pass or document prerequisite |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | exit 0 |

## Scope

**In scope**

- `packages/is-vue-framework/src/components/views/NavigationHeader.vue` (new)
- `packages/is-vue-framework/src/components/views/DetailView.vue`
- `packages/is-vue-framework/src/components/views/FormView.vue`
- `packages/is-vue-framework/src/components/views/__tests__/NavigationHeader.spec.ts` (new)
- `packages/is-vue-framework/src/components/views/__tests__/views.spec.ts` (only assertion updates)
- `packages/is-vue-framework/src/index.ts` (if needed for export)

**Out of scope**

- `Detail.vue`, `Form.vue`, renderer/input code, routes, or app shell.
- Form submission, dirty-leave, delete behavior, or global theme tokens.

## Steps

### Step 1: Characterize both existing headers

Add Vue Test Utils/Vitest tests using `views.spec.ts` as the harness pattern.
Cover title, description, custom `header`, controls, target link, fallback
history, accessible label, and keyboard activation.

**Verify:** targeted test runs and fails only for the missing component (or
passes with a deliberate stub); no unrelated failure.

### Step 2: Implement `NavigationHeader.vue`

Move only shared chrome into one outlined `Card`: header row, back control,
default heading/description, `header`, and controls slots. Use `RouterLink`
custom slot for `backTo`; otherwise call `router.back()`. Keep interactive
elements real buttons/links with explicit labels and focus-visible behavior.

**Verify:** targeted test passes; framework typecheck exits 0.

### Step 3: Make `DetailView` and `FormView` consumers

Replace duplicate blocks with `NavigationHeader`. Detail passes title/back target
and controls. Form passes title/description/header/controls and relies on
history fallback. Do not move body cards, form/detail slot forwarding, or
discard dialog logic.

**Verify:** framework tests and web typecheck both exit 0.

### Step 4: Export public contract

Export through the same barrel used by existing view components. Add a concise
API comment for `backTo`, fallback history, `header`, and `controls`.

**Verify:** framework typecheck passes and a type-only import from
`@southneuhof/is-vue-framework` resolves.

## Test plan

- New tests for rendering, slots, link navigation, history fallback,
  accessibility, and keyboard behavior.
- Existing view tests only update wrapper expectations.
- Run framework unit/browser tests and web typecheck.

## Done criteria

- [ ] One reusable public header owns shared nav/title/control markup.
- [ ] DetailView/FormView contain no duplicate header card markup.
- [ ] Custom screens can use it without Detail/Form.
- [ ] Tests/typechecks pass; no out-of-scope files changed.
- [ ] `plans/README.md` status row updated.

## STOP conditions

- Tests reveal conflicting intended back semantics with no product decision.
- `FormView` header slot is relied on to alter outer card/layout.
- Public export requires build changes outside Scope.
- Router test harness cannot model history/link behavior without out-of-scope
  infrastructure changes.

## Maintenance notes

Future shells should consume `NavigationHeader`. Keep it route/chrome-only; do
not add resource, loader, or form-state knowledge. Defer breadcrumbs, tabs,
global search, and responsive shell behavior to separate work.
