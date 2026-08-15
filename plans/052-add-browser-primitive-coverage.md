# Plan 052: Add browser coverage for shared UI primitives

> Implementation instructions for a small browser characterization suite. The
> tests must cover observable behavior through the public framework wrappers,
> not implementation selectors or private Reka / Radix internals.

## Status

- Priority: P1
- Effort: M
- Risk: MEDIUM
- Depends on: Plan 051
- Category: tests / UI reliability
- Planned at: commit `52e002c`, 2026-08-15

## Why this matters

The shared framework wraps the primitive library used by the web app, but its
browser suite currently covers only table and list-view behavior. Unit tests
cover some menu, disclosure, split-button, tabs, and mock-dialog behavior, but
they do not prove portal placement, focus behavior, outside interaction, or
the real dialog implementation in a browser.

The Reka migration must preserve these behaviors. A small browser gate gives
the migration a useful failure signal without testing generated attributes or
duplicating every unit assertion.

## Current state

The browser configuration is:

- `packages/is-vue-framework/vitest.browser.config.ts`
- Playwright Chromium, headless
- explicit include list for two existing browser specs

The existing browser pattern is in:

- `packages/is-vue-framework/src/components/views/__tests__/ListView.browser.spec.ts`

The public wrappers to characterize are:

- `packages/is-vue-framework/src/components/base/Dialog.vue`
- `packages/is-vue-framework/src/components/base/Popover.vue`
- `packages/is-vue-framework/src/components/base/Menu.vue`
- `packages/is-vue-framework/src/components/base/Disclosure.vue`
- `packages/is-vue-framework/src/components/base/Button.vue` split menu
- `packages/is-vue-framework/src/components/composites/Tabs.vue`

Existing jsdom tests are useful references but are not sufficient for this
plan:

- `src/components/base/__tests__/Menu.spec.ts`
- `src/components/base/__tests__/Button.spec.ts`
- `src/components/base/__tests__/Disclosure.spec.ts`
- `src/components/composites/__tests__/Tabs.spec.ts`
- `src/components/composites/__tests__/DialogForm.spec.ts` mocks `Dialog.vue`

## Scope

Modify only:

- `packages/is-vue-framework/vitest.browser.config.ts`
- `packages/is-vue-framework/src/components/base/__tests__/primitives.browser.spec.ts`

Do not change framework components, app routes, or CSS in this plan.

## Implementation steps

### 1. Add one browser spec to the existing include list

Add the new file to the explicit `test.include` list in
`vitest.browser.config.ts`. Keep the existing browser provider and pointer
command unchanged.

Use the existing `createApp`, `h`, `nextTick`, and cleanup pattern. Add only a
small local `mount` helper if needed. Do not create a shared test framework.

### 2. Cover the public wrapper behavior

Use user-visible labels, roles, focus, model values, and visibility. Do not
assert `data-radix-*`, `data-reka-*`, generated IDs, portal wrapper class
names, or exact animation classes.

Add the smallest useful cases:

1. **Dialog**
   - Mount the real `Dialog.vue` wrapper with trigger, title, content, and
     close button slots.
   - Click the trigger.
   - Assert that the dialog content is portalled into `document.body`, has
     visible title/content text, and receives dialog semantics.
   - Activate the close control and assert the content is no longer visible.

2. **Popover**
   - Mount `Popover.vue` with a trigger and content.
   - Open it through the trigger.
   - Assert the content is visible outside the host mount element.
   - Click a normal outside element and assert the content closes.

3. **Menu**
   - Mount `Menu.vue` with one action item.
   - Open it and assert the item is visible with menu-item semantics.
   - Activate the item and assert the action runs.

4. **Disclosure**
   - Mount `Disclosure.vue` with content text.
   - Toggle it open and assert content is visible.
   - Toggle it closed and assert content is not visible while the wrapper
     remains mounted. This protects the current `forceMount` plus visibility
     behavior.

5. **Split Button**
   - Mount `Button.vue` with `kind="split"` and a menu slot.
   - Open the trailing menu button.
   - Assert `aria-expanded` changes to `true` and the menu slot is visible in
     the document body.
   - Close it through the exposed slot callback and assert it closes.

6. **Tabs**
   - Mount `Tabs.vue` with two tabs and a bound model.
   - Activate the second tab through a browser click.
   - Assert the bound model and change event report index `1`, and the second
     tab is selected by its accessible state.

Keep the cases independent. Unmount every app and clear `document.body` after
each case.

### 3. Run the browser and unit suites

Run:

```sh
pnpm --filter @southneuhof/is-vue-framework test:browser
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected result: all framework unit and browser tests pass. The browser run
must include the new primitive spec in addition to the existing table and
list-view specs.

### 4. Keep the test boundary honest

If a case needs a generated attribute, animation timing, or a private portal
wrapper selector to pass, replace that assertion with an accessible or
user-visible assertion. If the behavior cannot be observed without an
implementation detail, stop and record the gap instead of making the test
brittle.

## Test plan

The new browser file is the test plan. It must exercise the real Vue
components in Chromium, not mocked primitive components. Existing jsdom tests
remain unchanged and continue to cover fast state and prop checks.

## Done criteria

- The browser config includes the primitive browser spec.
- The real dialog and popover wrappers are tested in a browser.
- Portal visibility, close behavior, menu selection, disclosure visibility,
  split-button state, and tab selection are covered.
- Assertions use roles, text, model state, events, focus, or visibility.
- Framework unit tests, browser tests, and type-check pass.
- No framework source or app source changes are made.

## Stop conditions

Stop before adding more test helpers or broad coverage if:

- a wrapper cannot be mounted without importing unrelated application state;
- browser behavior is inconsistent across two consecutive runs;
- a test needs private generated attributes or timing sleeps; or
- the test exposes a real current primitive behavior defect rather than a
  migration contract.

Record the exact wrapper and behavior, then keep the migration plan blocked on
that decision.

## Maintenance notes

Keep this file as a migration contract. Add a browser case only when a shared
primitive wrapper gains a user-visible behavior that can fail during a future
dependency update. Do not turn it into a snapshot suite.
