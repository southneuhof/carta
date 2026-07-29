# Plan 034: Rework app shell into responsive SaaS layout

> **Implementation instructions:** Rebuild application chrome only. Use supplied
> images as direction: persistent readable desktop sidebar, bottom account
> popover, mobile drawer below breakpoint. Do not copy branding blindly.
>
> **Drift check:** `git diff --stat 7700799..HEAD -- apps/web/src/App.vue apps/web/src/routes/(authenticated)/authenticated.layout.vue apps/web/src/components/navigations apps/web/src/manifest apps/web/src/stores/screen.ts apps/web/src/assets/main.css`

## Status

- **Priority:** P1
- **Effort:** L
- **Risk:** MED
- **Depends on:** `plans/028-extract-reusable-record-navigation-header.md` recommended
- **Category:** direction
- **Planned at:** commit `7700799`, 2026-07-29

## Why this matters

Current desktop uses a narrow icon rail plus expansion panel; mobile uses a
topbar/off-canvas drawer. Requested generic SaaS shell needs desktop sidebar
always readable/open, account anchored at bottom with ChatGPT-like popover, and
collapsible navigation only below the small-screen breakpoint. One responsive
shell gives every route predictable content sizing and spacing.

## Current state

- `apps/web/src/App.vue:31-45` centers `RouterView` in full-screen flex and
  mounts toaster/spinner.
- `apps/web/src/routes/(authenticated)/authenticated.layout.vue:9-17` renders
  `Sidebar` at `lg`, `NavigationDrawer` below, and subtracts 84px from content.
- `apps/web/src/components/navigations/sidebar/rail/Sidebar.vue:40-71` is a
  96px icon rail with expanding panel and profile rail item.
- `apps/web/src/components/navigations/sidebar/drawer/NavigationDrawer.vue:53-83`
  is a fixed 288px drawer with module/routes/profile modes.
- `apps/web/src/components/navigations/layouts/ProfileSegment.vue:8-41` reads
  local profile, toggles theme, signs out; it is not a bottom trigger/popover.
- `apps/web/src/manifest/navigation.ts:17-31` already provides permission-filtered
  modules/routes; reuse `visibleNavigation` and `activeNavigationModule`.
- `apps/web/src/stores/screen.ts` supplies `isAtLeast('lg')`; preserve convention
  unless tests prove another breakpoint.

Target behavior:

- `lg+`: persistent sticky/fixed sidebar, brand, readable module/route labels,
  active states, scrollable body, bottom account trigger/popover, main content
  in second column.
- `<lg`: hidden-by-default sidebar, compact menu/logo topbar, drawer/backdrop,
  Escape/outside close, closes on route selection.
- Popover: accessible trigger, identity, existing theme/sign-out actions, Escape
  and outside close, focus return. Include no fake settings/help actions.

## Commands

| Purpose | Command | Expected |
|---|---|---|
| Web tests | `pnpm --filter @southneuhof/framework-web test` | all pass |
| Web build/typecheck | `pnpm --filter @southneuhof/framework-web build` | exit 0 |
| Nav tests | `pnpm --filter @southneuhof/framework-web test -- src/router/__tests__/navigation.spec.ts src/manifest/__tests__/manifest.spec.ts` | all pass |
| Manual | `pnpm --filter @southneuhof/framework-web dev` | desktop/mobile inspectable |

## Scope

**In scope**

- `apps/web/src/routes/(authenticated)/authenticated.layout.vue`
- `apps/web/src/components/navigations/sidebar/rail/Sidebar.vue`
- `apps/web/src/components/navigations/sidebar/drawer/NavigationDrawer.vue`
- `apps/web/src/components/navigations/layouts/ProfileSegment.vue` and/or new
  account popover component
- `apps/web/src/App.vue` only for shell sizing/Suspense placement
- shell tests under `apps/web/src/components/navigations/**`
- `apps/web/src/stores/screen.ts` only for a tested breakpoint fix

**Out of scope**

- Manifest entries, permissions, API auth, business pages, forms/detail content.
- Replacing base `Button`, `Popover`, `Icon`; use existing primitives.
- Branding assets or global theme-token rewrite.

## Steps

### Step 1: Extract shared navigation model

Create shell-local state/helper consuming `visibleNavigation(allowsPermission)`,
computing active module from route, and exposing selection/open/close. Desktop
and mobile must render same filtered entries/separators. Preserve RouterLink
semantics or normalized manifest targets.

**Verify:** tests assert permission and active-state parity; existing manifest/nav
tests pass.

### Step 2: Implement persistent desktop sidebar

Refactor `Sidebar.vue` into non-collapsible desktop sidebar with explicit width,
`min-h-screen`, brand, scrollable nav, and bottom account trigger. Use existing
surface tokens and accessible focus states. Layout owns columns; remove reliance
on old 84px subtraction.

**Verify:** desktop component test finds visible labels, active route, bottom
trigger, and no expansion rail; typecheck passes.

### Step 3: Implement account popover

Add anchored popover using profile/theme/sign-out behavior from
`ProfileSegment.vue`. Provide role/name, Escape/outside close, focus return,
and sign-out loading if service supports it. Do not invent unsupported menu
items or profile fields.

**Verify:** interaction test opens/closes by click, Escape, outside click;
theme/sign-out callbacks called once.

### Step 4: Make mobile drawer responsive

Reuse shared model in drawer. Add backdrop, close button, Escape/outside close,
focus handling, and route-selection close. Desktop must not mount drawer;
mobile must not expose desktop sidebar.

**Verify:** responsive tests cover open/close/backdrop/Escape/route close and no
lingering drawer.

### Step 5: Recompose authenticated layout/app

Update authenticated layout to desktop two-column or mobile topbar/drawer.
Keep `NotificationInbox` mounted once. Adjust `App.vue` so Suspense/spinner
does not center authenticated shell incorrectly; leave public layout unchanged.

**Verify:** build/typecheck pass; manual desktop/mobile screenshots show target
layout and content sizing.

### Step 6: Accessibility/visual regression pass

Check landmarks (`aside`, `main`, navigation), tab order, visible focus,
contrast, reduced motion, long localized labels, narrow widths, and scroll
containers. Test selectors should not depend on Tailwind class order.

**Verify:** shell tests pass; keyboard-only traversal reaches nav, account,
popover actions, and main content without traps.

## Test plan

- Desktop sidebar tests for persistent rendering, active/permission states,
  account trigger, navigation.
- Account popover tests for keyboard/outside/Escape/focus return/actions.
- Mobile drawer tests for breakpoint, backdrop, Escape, route close.
- Existing manifest/router tests remain navigation truth.

## Done criteria

- [ ] Desktop sidebar never collapses at `lg+`; labels readable.
- [ ] Bottom account opens accessible popover with existing actions.
- [ ] `<lg` drawer/topbar works and closes correctly.
- [ ] Main content no longer depends on 84px rail subtraction.
- [ ] Tests/typecheck/build pass; public layout unchanged.
- [ ] No out-of-scope files changed; index updated.

## STOP conditions

- Existing `Popover.vue` cannot meet focus/outside/Escape without framework
  contract change.
- Breakpoint state causes SSR/initial hydration mismatch.
- Profile storage shape requires auth/data redesign.
- Visual requirement needs new global tokens/assets outside Scope.

## Maintenance notes

Keep menu truth in manifest; shell must not encode permissions/route names.
Review future nav entries at both breakpoints and with long localized labels.
Defer command palette, global search, notification redesign, and multi-level
collapse to separate plans.
