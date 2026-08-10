# Plan 004: Display page render errors

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. If a STOP condition occurs, stop and report it. After
> the implementation and review pass, update this plan row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/web/src/App.vue apps/web/src/App.spec.ts`
> If the current excerpts do not match, stop and reassess this plan.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 001
- **Category**: bug
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

A descendant render exception currently leaves its parent layout visible and
the failed page empty. The application records the exception in a local ref,
but the template never uses that ref. Users cannot tell that a page failed or
recover without manually reloading.

This plan adds one safe page-level error state. It must give a clear reload
action without showing internal exception text to an ordinary user. This is a
diagnostic safety net; Plan 001 remains the fix for the active-field crash.

## Current state

- `apps/web/src/App.vue` is the root application component and owns
  `onErrorCaptured`.
- No current `App.spec.ts` exists. App-level route tests use Vitest and Vue
  Test Utils elsewhere under `apps/web/src`.

Current error capture in `apps/web/src/App.vue:11-16`:

```ts
const error = ref<Error | null>(null)
onErrorCaptured((err, instance, info) => {
  console.error('App error:', err, instance, info)
  error.value = err
  return true
})
```

Current rendering always mounts `RouterView` in `apps/web/src/App.vue:31-43`.
The project uses framework `Button` and token classes for visible controls; see
`packages/is-vue-framework/src/components/views/FormView.vue:225-248` for the
current button and container pattern.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused test | `pnpm --filter @southneuhof/framework-web test -- App.spec.ts` | exit 0; app error tests pass |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no type errors |
| Full web test | `pnpm --filter @southneuhof/framework-web test` | exit 0; all tests pass |

## Scope

**In scope**:

- `apps/web/src/App.vue`
- `apps/web/src/App.spec.ts` (new)

**Out of scope**:

- Form field merge behavior — Plans 001 and 009 own it.
- Error reporting services, remote logging, or user data collection.
- Route-specific fallback views.

## Git workflow

- Branch: `codex/004-display-page-render-errors`
- Commit message: `fix(web): display page render errors`
- Do not push or create a pull request unless instructed.

## Steps

### Step 1: Add a safe root fallback

In `apps/web/src/App.vue`, render the normal router only while no captured
error exists. When an error exists, show one full-page alert with a generic
failure message and a native page reload action. Keep the existing console
error for development diagnosis. Do not render `error.message`, stack traces,
component names, or server response data.

Return `false` from `onErrorCaptured` after setting the fallback state, so the
same exception does not propagate into another handler.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

### Step 2: Test the fallback through a failing child route

Create `apps/web/src/App.spec.ts`. Mount App with a memory router whose route
component throws during render. Assert that the generic alert and reload button
appear and that the normal route content no longer appears. Add a second test
with a non-throwing route to assert that ordinary router rendering remains.

Mock the reload boundary; the test must not reload JSDOM. Do not snapshot the
full page.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- App.spec.ts` → exit 0; both cases pass.

### Step 3: Run the web checks

Run the full web test suite and inspect the diff for error-text exposure.

**Verify**: `pnpm --filter @southneuhof/framework-web test && git diff --check` → both exit 0.

## Test plan

- Failing route: generic fallback is visible; normal route is hidden.
- Healthy route: normal route still renders.
- The test must not assert framework implementation markup beyond the alert
  role and user-visible reload control.

## Done criteria

- [ ] A captured route error shows one accessible, generic fallback.
- [ ] No internal error details render in the fallback.
- [ ] Healthy routes still render.
- [ ] Focused and full web tests pass.
- [ ] Only in-scope files changed.
- [ ] `plans/README.md` marks Plan 004 as DONE.

## STOP conditions

- The root fallback causes a loop when it renders. Stop and report the render
  stack; do not add retry counters.
- The fallback needs a new dependency or remote telemetry. Stop; neither is in
  scope.
- The application has an existing global error UI outside these paths. Stop and
  use that component instead of adding another one.

## Maintenance notes

This screen is a last-resort error state, not a replacement for route or form
error handling. Review it whenever the root layout changes. Keep its content
generic because errors can include internal implementation data.
