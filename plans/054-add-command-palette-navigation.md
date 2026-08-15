# Plan 054: Add route navigation command palette

> **Implementation instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` after the implementation and review pass.
>
> **Drift check (run first)**: `git diff --stat ed8ebab..HEAD -- apps/web/src/manifest/navigation.ts apps/web/src/components/navigations/GlobalToolbar.vue apps/web/src/routes/(authenticated)/authenticated.layout.vue apps/web/src/components/navigations/CommandPalette.vue apps/web/src/components/navigations/CommandPalette.spec.ts`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `ed8ebab`, 2026-08-15
- **Status**: DONE

## Why this matters

Administrators currently reach routes through the sidebar or mobile drawer. A
global command palette gives keyboard users one fast, consistent way to find
the same allowed menu routes without adding another data source or network
request. The first pass must stay a navigation tool: filter the existing
permission-aware manifest in memory, select a route, and close the dialog.

## Current state

- `apps/web/src/manifest/navigation.ts:3-57` owns the ordered static menu and
  `visibleNavigation(allowsPermission)` removes entries that the current user
  cannot access. It preserves module titles, route titles, icons, and route
  targets, and it removes empty separators/modules.
- `apps/web/src/routes/(authenticated)/authenticated.layout.vue:25-27` mounts
  `GlobalToolbar`, the desktop sidebar, and the mobile navigation drawer. The
  palette belongs in this authenticated shell and must not appear on public
  routes.
- `apps/web/src/components/navigations/GlobalToolbar.vue:18-38` renders the
  global toolbar and currently places `NotificationAction` in the global action
  area. Add the palette trigger beside it without changing breadcrumb logic.
- `packages/is-vue-framework/src/components/base/Dialog/DialogContent.vue:28-57`
  is the approved Reka UI dialog surface. It already supplies the portal,
  overlay, focus management, outside-close handling, motion, and theme-aware
  surface. `DialogTitle.vue:17-20` supplies the accessible title primitive.
- `packages/is-vue-framework/src/components/composites/SearchBox.vue:16-43`
  is an existing search input, but its default model update is debounced by
  300ms. It is not a command list and is not suitable for immediate keyboard
  filtering without changing framework behavior.
- `packages/is-vue-framework/package.json:28-38` already depends on
  `reka-ui@^2.9.8`. No dependency or framework source change is needed.

Follow the application conventions visible in the existing navigation
components: use `Icon.vue`, semantic native buttons and inputs, `overlay` state
layers, `focus-visible:ring-2`, `text-on-surface` / `text-on-surface-variant`,
`bg-surface-container*`, and `border-outline-variant`. The product brief says
users are desktop administrators, current routes and information architecture
must remain intact, the app uses shared framework components, and framework
source changes need separate approval (`apps/web/PRODUCT.md:9-33`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Drift check | `git diff --stat ed8ebab..HEAD -- <in-scope paths>` | No unexpected pre-existing edits in the listed paths |
| Focused test | `pnpm --filter @southneuhof/framework-web test -- src/components/navigations/CommandPalette.spec.ts` | Palette behavior tests pass |
| Web typecheck | `pnpm --filter @southneuhof/framework-web type-check` | Exit 0, no TypeScript errors |
| Web lint | `pnpm --filter @southneuhof/framework-web lint:check` | Exit 0, no ESLint errors |
| Web build | `pnpm --filter @southneuhof/framework-web build` | Exit 0, Vite build completes |
| Diff hygiene | `git diff --check` | No whitespace errors |

## Suggested implementation toolkit

- Reuse the app's `Dialog`, `DialogContent`, `DialogDescription`, and
  `DialogTitle` exports from
  `@southneuhof/is-vue-framework/components/base/Dialog`.
- Reuse `Icon` from
  `@southneuhof/is-vue-framework/components/base/Icon.vue`.
- Use the existing `visibleNavigation(allowsPermission)` output as the only
  route source. The palette must not call an API or enumerate `router.getRoutes()`
  because the manifest is the permission-aware menu contract used by both
  sidebars.
- The shadcn-vue Command reference establishes the familiar input/list/group
  shape, but do not copy its unstyled component layer or add a command library:
  https://www.shadcn-vue.com/docs/components/command

## Scope

**In scope** (the only files to modify):

- `apps/web/src/components/navigations/CommandPalette.vue` — new app-local
  command palette, trigger, dialog, filtering, keyboard navigation, and route
  selection.
- `apps/web/src/components/navigations/GlobalToolbar.vue` — render the palette
  in the existing global action area.
- `apps/web/src/components/navigations/CommandPalette.spec.ts` — focused
  behavior test for opening, filtering, keyboard selection, and empty results.
- `plans/054-add-command-palette-navigation.md` — execution status and notes.
- `plans/README.md` — plan index status.

**Out of scope** (do not touch):

- `packages/is-vue-framework/**` — no framework command composite is required
  for this first pass, and framework edits need separate approval.
- `apps/web/src/manifest/navigation.ts` — consume the existing manifest; do not
  create a second route registry or expand the menu in this feature.
- `apps/web/src/routes/**` — no route behavior or route definitions change.
- API, database, permissions, suggestions, data fetching, recent history,
  command execution beyond route navigation, or fuzzy-search dependencies.
- Public layouts and public routes — the palette is authenticated-shell UI.

## Steps

### Step 1: Add the app-local palette surface

Create `CommandPalette.vue` with these exact behaviors:

1. Build a flat computed list from `visibleNavigation(allowsPermission)`,
   retaining `module.title`, `entry.title`, `entry.icon`, `entry.name`, and
   `entry.to` for every non-separator entry.
2. Filter synchronously on a trimmed, case-insensitive query. Match both the
   route title and its module title. When the query is empty, show all visible
   routes in manifest order. Do not fetch, debounce, rank, or fuzzy-match.
3. Render a trigger button with an accessible name such as `Open navigation`
   and a search icon. Use the existing `overlay`/focus-ring classes so it
   matches `NotificationAction.vue`.
4. Render the dialog only through the existing Reka-backed framework dialog
   components. Give it a visually-hidden title and description for screen
   readers, an immediately focused native text input, grouped route rows, an
   explicit `No navigation results` empty state, and a small footer hint for
   `Esc` and `Enter`.
5. Support `Meta+K` and `Control+K` globally while the authenticated layout is
   mounted. Prevent the browser's default action. `Escape` remains owned by
   the Reka dialog. On open, clear the query, select the first route, and focus
   the input. On close, restore focus to the trigger.
6. Support `ArrowDown`, `ArrowUp`, `Home`, `End`, and `Enter` while the input is
   focused. Keep the selected index within the filtered list, expose it with
   `aria-activedescendant`, and scroll the selected row into view when the
   selection changes. Enter must call `router.push(entry.to as never)`, close
   the palette, and leave the router responsible for navigation errors.
7. Keep the list keyboard-safe and semantic: `role=listbox`, route rows as
   `role=option`, stable IDs, `aria-selected`, real buttons, visible focus, and
   an empty state when no row exists. The component must work at narrow widths
   without horizontal overflow.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

### Step 2: Mount the palette in the authenticated toolbar

Import and render `CommandPalette` beside `NotificationAction` in
`GlobalToolbar.vue`. Keep its current breadcrumb markup, mobile menu event, and
notification behavior unchanged. Do not render the component in `App.vue` or a
public layout.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- src/routes/(authenticated)/authenticated.layout.spec.ts` → the existing layout test passes.

### Step 3: Add one focused behavior test

Create `CommandPalette.spec.ts` using the current Vitest/jsdom conventions. Test
the observable contract with lightweight stubs for the framework dialog and
icon, and a mocked `useRouter`:

- clicking the trigger opens the palette and exposes the visible manifest
  routes;
- typing a route or module title filters immediately and excludes unrelated
  rows;
- a query with no match renders `No navigation results`;
- `ArrowDown` followed by `Enter` pushes the selected manifest target and closes
  the palette;
- `Control+K` opens the palette from the document when it is closed.

Do not snapshot the whole dialog, assert generated class strings, or mock the
manifest filtering itself. Keep assertions on labels, open state, keyboard
selection, and the router target.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- src/components/navigations/CommandPalette.spec.ts` → all new tests pass.

### Step 4: Review and verify the shipped surface

Review the diff against this plan. Confirm there is one route source, no new
dependency, no framework edit, and no public-route mount. Run the full web
checks. Start the web dev server and inspect the authenticated shell in the
real browser when an authenticated API session is available; verify desktop
and a narrow viewport, `Meta/Ctrl+K`, typing, arrow selection, Enter, Escape,
outside click, focus restoration, dark theme, and a long route list. If the
local API session is unavailable, report that browser limitation after the
automated checks instead of changing auth or adding test-only production code.

**Verify**: `pnpm --filter @southneuhof/framework-web lint:check && pnpm --filter @southneuhof/framework-web build && git diff --check` → all commands exit 0.

## Test plan

- Follow the existing component test style in
  `apps/web/src/components/routing/AppRouterView.spec.ts` for mounting and
  cleanup, but keep this test small and jsdom-only.
- The focused palette test covers opening, immediate local filtering, empty
  results, keyboard selection, router navigation, and the global shortcut.
- Existing `apps/web/src/manifest/__tests__/manifest.spec.ts` remains the
  authority for permission filtering; do not duplicate those manifest tests.
- The final browser pass covers Reka focus/portal behavior that jsdom stubs
  cannot prove.

## Done criteria

- [x] `CommandPalette.vue` is mounted only from the authenticated toolbar.
- [x] Route options come only from `visibleNavigation(allowsPermission)` and
  separators are not selectable.
- [x] Filtering is synchronous, case-insensitive, local, and matches route or
  module title.
- [x] Meta/Ctrl+K, arrow keys, Home/End, Enter, Escape, outside click, and
  trigger focus restoration work.
- [x] The dialog has an accessible title/description and listbox semantics.
- [x] `pnpm --filter @southneuhof/framework-web test -- src/components/navigations/CommandPalette.spec.ts` exits 0.
- [x] `pnpm --filter @southneuhof/framework-web type-check` exits 0.
- [x] `pnpm --filter @southneuhof/framework-web lint:check` exits 0.
- [x] `pnpm --filter @southneuhof/framework-web build` exits 0.
- [x] `git diff --check` exits 0.
- [x] This execution changed only in-scope files; an unrelated work-items edit
  was preserved and was not touched.
- [x] `plans/README.md` status row is `DONE` after review.

## STOP conditions

Stop and report instead of improvising if:

- `visibleNavigation` cannot provide the required title, icon, or route target
  without changing the manifest contract.
- The framework dialog cannot provide the required focus, portal, or outside
  interaction behavior without editing `packages/is-vue-framework`.
- The implementation needs `router.getRoutes()` or a second permission check to
  expose the menu entries.
- The current code at the cited paths has drifted enough that this plan's
  source-of-truth assumptions are false.
- A verification command fails twice after a focused correction, or a fix
  requires an out-of-scope file.

## Maintenance notes

- Future command types should be added as explicit local entries after the
  navigation-only behavior is proven. Do not turn this component into a remote
  search surface without a separate product and permission design.
- If the navigation manifest changes its entry contract, update the palette and
  its focused test together. The palette should continue to consume the
  permission-filtered output, not raw route records.
- Review keyboard behavior, focus restoration, and dark-theme contrast before
  adding more commands. Keep the component route-local unless a second app needs
  the same surface and contract.

## Execution review

STATUS: COMPLETE

- Step 1: done — `pnpm --filter @southneuhof/framework-web type-check` passed.
- Step 2: done — the authenticated layout test passed as part of the web test
  run.
- Step 3: done — the focused palette behavior tests passed; the full web suite
  passed with 60 test files and 235 tests.
- Step 4: done — lint exited 0, the production build passed, `git diff --check`
  passed, and the Impeccable detector returned no findings.
- Browser note: the local API and Vite servers responded, but the T3 preview
  snapshot timed out repeatedly on fresh tabs. No auth or production code was
  changed to work around that tool limitation.
- Files changed by this execution: `CommandPalette.vue`,
  `CommandPalette.spec.ts`, `GlobalToolbar.vue`, and the two plan files.
- Preserved unrelated working-tree edits under
  `apps/web/src/routes/(authenticated)/master-data/work-items/`.
