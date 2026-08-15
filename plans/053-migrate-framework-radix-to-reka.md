# Plan 053: Migrate framework primitives from Radix Vue to Reka UI

> Implementation instructions for one dependency boundary migration. Replace
> the shared framework's direct Radix Vue imports with Reka UI, update the
> verified generated selectors and CSS variable, and prove the public wrapper
> behavior through the Plan 052 browser gate.

## Status

- Priority: P1
- Effort: M
- Risk: MEDIUM
- Depends on: Plans 051 and 052
- Category: dependency migration / shared UI framework
- Planned at: commit `52e002c`, 2026-08-15

## Why this matters

`apps/web` does not import `radix-vue` directly. The direct source boundary is
inside `packages/is-vue-framework`, which owns the shared dialogs, menus,
popovers, disclosure, tabs, and split-button primitives. A single framework
boundary is the smallest safe migration unit.

Reka UI is the v2 evolution of Radix Vue, but it still has migration-sensitive
behavior. The official migration guide calls out the package import change,
the `radix` to `reka` generated attribute / CSS prefix change, and behavior
changes around `forceMount` for components such as Collapsible and Tabs:

- [Reka UI migration guide](https://www.reka-ui.com/docs/guides/migration)

The migration is therefore medium risk, not a blind text replacement.

## Current state

Direct `radix-vue` imports exist in exactly 12 framework source files:

- `packages/is-vue-framework/src/components/base/Button.vue`
- `packages/is-vue-framework/src/components/base/Menu.vue`
- `packages/is-vue-framework/src/components/base/Disclosure.vue`
- `packages/is-vue-framework/src/components/base/Popover.vue`
- `packages/is-vue-framework/src/components/base/Dialog/Dialog.vue`
- `packages/is-vue-framework/src/components/base/Dialog/DialogClose.vue`
- `packages/is-vue-framework/src/components/base/Dialog/DialogContent.vue`
- `packages/is-vue-framework/src/components/base/Dialog/DialogDescription.vue`
- `packages/is-vue-framework/src/components/base/Dialog/DialogScrollContent.vue`
- `packages/is-vue-framework/src/components/base/Dialog/DialogTitle.vue`
- `packages/is-vue-framework/src/components/base/Dialog/DialogTrigger.vue`
- `packages/is-vue-framework/src/components/composites/Tabs.vue`

The import groups are DropdownMenu, Dialog, Collapsible, Popover, and Tabs.
The wrappers use typed props, `useForwardProps`, `useForwardPropsEmits`,
`asChild`, portal components, outside-interaction events, offsets, and
`forceMount`.

Existing migration-sensitive references are:

- `apps/web/src/components/navigations/layouts/ProfileSegment.vue:26`
  uses `--radix-popover-trigger-width`.
- `packages/is-vue-framework/src/styles/framework.css:102-106` targets
  `[data-radix-dialog-overlay]` for TinyMCE interaction.
- `apps/web/src/assets/main.css:126-131` duplicates the same overlay rule.
- `packages/is-vue-framework/src/components/base/Dialog/DialogContent.vue:20`
  allows interaction with `[data-radix-popper-content-wrapper]` and
  `[data-radix-menu-content]`.
- `packages/is-vue-framework/src/components/base/Disclosure.vue:47` uses
  `CollapsibleContent forceMount v-show="panelState"`.

`vaul-vue` already brings `reka-ui` into the workspace transitively. The
framework must still declare Reka directly because its source imports Reka
components directly. Do not make the framework rely on a transitive package.

## Scope

Modify only these source and dependency files:

Dependency manifests:

- `packages/is-vue-framework/package.json`
- `apps/web/package.json`
- `pnpm-lock.yaml`

Framework imports:

- the 12 framework files listed above

Known Reka-generated selectors and variables:

- `packages/is-vue-framework/src/components/base/Dialog/DialogContent.vue`
- `packages/is-vue-framework/src/styles/framework.css`
- `apps/web/src/assets/main.css`
- `apps/web/src/components/navigations/layouts/ProfileSegment.vue`

Tests are covered by plans 051 and 052. Do not rewrite those tests during this
plan except to correct a test exposed as invalid by the documented public
behavior.

Do not migrate Headless UI, `vaul-vue`, unrelated app dependencies, or any
application route component beyond the listed CSS variable reference.

## Implementation steps

### 1. Confirm the dependency boundary

Before editing, run:

```sh
rg -n "from ['\"]radix-vue['\"]|from ['\"]reka-ui['\"]" apps/web/src packages/is-vue-framework/src
pnpm why radix-vue
pnpm why reka-ui
```

Expected result:

- no direct Radix or Reka source imports under `apps/web/src`;
- the 12 direct Radix imports under the framework;
- Reka is already present through `vaul-vue`, and Radix is present as the
  current direct dependency.

If the source boundary differs, stop and update this plan before editing.

### 2. Replace the direct package dependency

In `packages/is-vue-framework/package.json`:

- remove `radix-vue`;
- add `reka-ui` as a direct runtime dependency using the existing locked Reka
  2.x line, currently `2.9.8`;
- keep `vaul-vue` unchanged.

In `apps/web/package.json`:

- remove `radix-vue`, because the app has no direct source import;
- do not add `reka-ui` to the app. The shared framework owns the direct import.

Update the lockfile with the repository package manager. Prefer:

```sh
pnpm install --lockfile-only
```

Expected result: the framework has a direct Reka dependency, the web app has
no direct Radix dependency, and the lockfile remains internally consistent.

### 3. Replace framework imports and verify exported APIs

Change only the module source from `radix-vue` to `reka-ui` in the 12 listed
files. Preserve the wrapper API and application call sites:

- keep component names such as `DialogRoot`, `DialogContent`,
  `DropdownMenuContent`, `PopoverContent`, `CollapsibleContent`, `TabsRoot`,
  and `TabsTrigger`;
- keep `useForwardProps`, `useForwardPropsEmits`, typed prop declarations,
  and current event handling unless Reka's types require the documented v2
  spelling;
- keep `asChild`, portal placement, side / align offsets, and menu selection;
- do not add an adapter or compatibility alias.

Run framework type-check immediately after this step:

```sh
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected result: the shared framework compiles against direct Reka exports.

### 4. Update generated selector and variable names

Apply the official prefix change only to known generated integration points:

| Current reference | Replacement |
|---|---|
| `--radix-popover-trigger-width` | `--reka-popover-trigger-width` |
| `[data-radix-dialog-overlay]` | `[data-reka-dialog-overlay]` |
| `[data-radix-popper-content-wrapper]` | `[data-reka-popper-content-wrapper]` |
| `[data-radix-menu-content]` | `[data-reka-menu-content]` |

Update the two comments that name Radix so they describe the Reka overlay.
Do not rename generic `data-[state]`, `data-[side]`, or
`data-[highlighted]` classes; those are component behavior selectors, not the
library prefix.

### 5. Verify migration-sensitive behavior

Run the framework gate:

```sh
pnpm --filter @southneuhof/is-vue-framework test
pnpm --filter @southneuhof/is-vue-framework test:browser
pnpm --filter @southneuhof/is-vue-framework type-check
```

Expected result: unit tests and the Plan 052 browser characterization pass.
Pay special attention to:

- dialog close, portal, focus, and TinyMCE outside-interaction protection;
- popover outside close and offsets;
- menu selection and split-button open state;
- disclosure closed visibility with `forceMount`;
- tabs selection and disabled tabs.

Then run the web gate:

```sh
pnpm --filter @southneuhof/framework-web type-check
pnpm --filter @southneuhof/framework-web test
pnpm --filter @southneuhof/framework-web lint
pnpm --filter @southneuhof/framework-web build
```

Expected result: all commands pass. Existing lint warnings and existing build
chunk-size warnings are not part of this migration.

### 6. Prove no old source boundary remains

Run:

```sh
rg -n -i "radix-vue|data-radix|--radix" apps/web/src packages/is-vue-framework/src
pnpm why radix-vue --filter @southneuhof/framework-web
pnpm why reka-ui --filter @southneuhof/is-vue-framework
git diff --check
```

Expected result:

- the first command returns no matches;
- the web filter has no direct Radix dependency;
- the framework filter resolves its direct Reka dependency;
- `git diff --check` is clean.

## Test plan

Use the Plan 052 browser suite as the behavior gate. Use the existing
framework unit tests for fast wrapper state checks and the web suite for app
integration. Do not add snapshot coverage or tests for generated Reka
attributes.

## Done criteria

- Framework source imports `reka-ui`, not `radix-vue`.
- Framework directly declares Reka UI; the web app no longer directly
  declares Radix Vue.
- Known generated CSS variables and selectors use the Reka prefix.
- No `radix-vue`, `data-radix`, or `--radix` reference remains under the
  in-scope app and framework source directories.
- Framework unit tests, framework browser tests, web tests, type-checks, lint,
  and build pass.
- No compatibility alias, duplicate primitive wrapper, or unrelated library
  migration is added.

## Stop conditions

Stop the migration and report the exact error if:

- a required Reka export or type is absent;
- `useForwardProps` or `useForwardPropsEmits` changes require a new wrapper
  contract;
- `forceMount` changes disclosure or tabs behavior beyond the current public
  contract;
- TinyMCE outside-interaction protection cannot be preserved with the new
  generated selectors;
- `vaul-vue` and the direct Reka 2.x dependency resolve incompatible versions;
- a failing web test is unrelated to this migration and cannot be separated
  from the known baseline.

Do not solve a stop condition by adding a Radix compatibility package or by
rewriting application routes. That needs a new plan and an explicit decision.

## Maintenance notes

The framework owns the primitive dependency. Future app code must consume the
framework wrappers instead of importing Reka or Radix directly. If a future
Reka upgrade changes generated attributes or lifecycle behavior, update the
wrapper and this migration gate together.
