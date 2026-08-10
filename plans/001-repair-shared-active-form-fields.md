# Plan 001: Repair shared active form fields

> **Implementation instructions**: Follow this plan in order. Run each check
> before the next step. If a STOP condition occurs, stop and report it. After
> the implementation and review pass, update this plan row in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat abb232f..HEAD -- apps/web/src/configs/defaults.ts apps/web/src/framework/inputs/registry.ts apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`
> If the current excerpts do not match, stop and reassess this plan.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `abb232f`, 2026-08-10

## Why this matters

Most resource forms contain an `active` boolean. The shared field default gives
it a `radio` renderer and an option source. Schema inference changes the
renderer to `switch`, but source merge rules retain the radio source. The input
registry rejects a source for `switch`, so Form throws before it can display
the fields or action buttons.

This plan makes the shared `active` default a source-free switch. This is the
smallest app-only repair. It fixes the invalid merged state for all forms that
inherit the default. It does not change framework code.

## Current state

- `apps/web/src/configs/defaults.ts` owns web application field defaults.
- `packages/is-vue-framework/src/validation/zod.ts` infers `switch` for a
  boolean schema field.
- `packages/is-vue-framework/src/renderers/inputProps.ts` throws when a
  renderer has a source but no source adapter.
- `apps/web/src/framework/inputs/registry.ts` has adapters for `radio`,
  `select`, and lookup inputs. It intentionally has no adapter for `switch`.
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`
  is the existing resource test pattern.

Current shared configuration in `apps/web/src/configs/defaults.ts:41-53`:

```ts
active: {
  label: 'Status',
  form: { renderer: 'radio', source: activeOptions, props: { required: true } },
},
```

The error comes from `packages/is-vue-framework/src/renderers/inputProps.ts:42-54`:

```ts
if (!adapter) {
  if (hasSource) throw new Error(`... has no source normalizer.`)
  return { ...(input.props ?? {}) }
}
```

Use existing framework `Form` and the current application field-default
pattern. Do not add a new renderer, adapter, or compatibility layer.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused web test | `pnpm --filter @southneuhof/framework-web test -- roles.resource.spec.ts` | exit 0; all Role resource tests pass |
| Web type check | `pnpm --filter @southneuhof/framework-web type-check` | exit 0; no type errors |
| Full web test | `pnpm --filter @southneuhof/framework-web test` | exit 0; all tests pass |

## Scope

**In scope**:

- `apps/web/src/configs/defaults.ts`
- `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`

**Out of scope**:

- `packages/is-vue-framework/**` — Plan 009 owns the optional framework fix.
- Individual master-data resources — the shared default must repair them.
- PTS fields, API schemas, database migrations, and form redesign.

## Git workflow

- Branch: `codex/001-repair-active-form-fields`
- Commit message: `fix(web): repair shared active form field`
- Do not push, create a pull request, or change framework packages without
  separate user approval.

## Steps

### Step 1: Replace the incompatible shared default

In `apps/web/src/configs/defaults.ts`, replace the `active` form projection
with `renderer: 'switch'` and the existing `required: true` property. Remove
the now-unused `activeOptions` constant. Do not add `source`, `data`, or an
input-props adapter for `switch`.

**Verify**: `pnpm --filter @southneuhof/framework-web type-check` → exit 0.

### Step 2: Add the regression test at the Role resource boundary

In `apps/web/src/routes/(authenticated)/settings/roles/roles.resource.spec.ts`,
mount the framework `Form` with `roles.form()` and the normal application
defaults and input-props registry. Assert that fields `roleCode`, `name`,
`assignmentScope`, and `active` render. This must exercise schema inference,
the shared field default, and input-props resolution together.

Do not mock `Form`, `resolveFields`, or `appInputProps`. Existing RPC mocks may
remain because creation must not run during this render test.

**Verify**: `pnpm --filter @southneuhof/framework-web test -- roles.resource.spec.ts` → exit 0, including the new render regression test.

### Step 3: Check the shared repair

Run the complete web test suite. Inspect the changed files and confirm no
package source changed.

**Verify**: `pnpm --filter @southneuhof/framework-web test && git diff --check` → both exit 0.

## Test plan

- Add one Role Form render regression test. It must fail with the old radio
  source default and pass with the source-free switch default.
- Keep current Role resource capability and validation tests unchanged.
- Run the focused test and the full web suite.

## Done criteria

- [ ] The shared `active` form default is `switch` with no source.
- [ ] The unused `activeOptions` declaration is removed.
- [ ] The Role Form regression test renders all four current fields.
- [ ] Web type check and all web tests pass.
- [ ] Only in-scope files changed.
- [ ] `plans/README.md` marks Plan 001 as DONE.

## STOP conditions

- Product design requires a radio selection, not a switch. Stop and select the
  framework plan or explicit per-resource radio sources instead.
- A form still supplies a source to `switch` after this change. Stop and list
  its resource path; do not add a global switch source adapter.
- The required render test needs a framework source change. Stop; this plan is
  app-only.

## Maintenance notes

Future boolean fields should use source-free switch defaults unless they need a
defined option set. Review new form defaults for source/renderer pairs. Plan
009 can make this class of invalid merge impossible in the framework.
