# Plan 054: Apply shared popup-safety defaults to every datepicker input

> **Implementation instructions**: Follow every step and gate. Update status in
> `plans/README.md` after implementation and review.
>
> **Drift check (run first)**:
> `git diff --stat a52ea98..HEAD -- packages/is-vue-framework/src/components/inputs/DateInput.vue packages/is-vue-framework/src/components/inputs/TimeInput.vue packages/is-vue-framework/src/components/inputs/DateRangeInput.vue packages/is-vue-framework/src/components/inputs/MonthInput.vue packages/is-vue-framework/src/components/inputs/YearInput.vue`
> Any mismatch with Current state is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — popup mounting and event propagation affect cards/dialogs
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a52ea98`, 2026-07-29

## Why this matters

`TimeInput` popup can be clipped by card overflow. `DateInput` already avoids
this with teleport plus propagation config, but four sibling components omit
the fix. Centralizing popup defaults prevents future drift and applies same
safe behavior to every component built on `@vuepic/vue-datepicker`.

## Current state

Five direct consumers exist:

- `DateInput.vue:29-32,89-100` — exposes `teleport` default `true`, uses
  `class="pointer-events-auto"`, and passes
  `{ allowPreventDefault: false, allowStopPropagation: true }`.
- `TimeInput.vue:63-65` — none of those popup-safety settings.
- `DateRangeInput.vue:91-93` — none.
- `MonthInput.vue:73-83` — none.
- `YearInput.vue:58-69` — none.

`packages/is-vue-framework/src/components/base/Popover.vue:57` already
recognizes `.dp__menu`/`.dp__overlay`, proving datepicker overlays interact with
framework overlay-dismiss behavior. Preserve that separate compatibility code.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Focused tests | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/datepicker-popup.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/components/inputs/DateInput.vue`
- `packages/is-vue-framework/src/components/inputs/TimeInput.vue`
- `packages/is-vue-framework/src/components/inputs/DateRangeInput.vue`
- `packages/is-vue-framework/src/components/inputs/MonthInput.vue`
- `packages/is-vue-framework/src/components/inputs/YearInput.vue`
- One shared helper/component under
  `packages/is-vue-framework/src/components/inputs/`
- `packages/is-vue-framework/src/components/inputs/__tests__/datepicker-popup.spec.ts`
  (create)
- `plans/README.md`

**Out of scope**:

- Picker palette; handled by plan 053.
- Value parsing/formatting and default-to-current behavior.
- Popover, Card, and Dialog overflow rules.
- Third-party upgrade or fork.
- Non-datepicker overlays.

## Git workflow

- Suggested branch: `codex/054-datepicker-popup-safety`
- One logical commit. Do not push unless requested.

## Steps

### Step 1: Extract one shared popup contract

Create a small typed helper or wrapper for settings common to all
Vue Datepicker consumers:

- `teleport: true` default for non-inline popup mode;
- `config.allowPreventDefault: false`;
- `config.allowStopPropagation: true`;
- `pointer-events-auto` hook/class;
- reactive dark-mode selection if cleanly shared.

Keep component-specific picker modes and value contracts in each existing
component. Avoid a large wrapper with forwarded arbitrary attrs; shared code
should own only popup integration defaults.

Allow an explicit `teleport` override matching `DateInput`'s current
`boolean | string | HTMLElement` contract. Add this prop consistently to all
five components. Inline pickers may ignore teleport, but must not regress.

**Verify**:
`rg -n \"allowPreventDefault|allowStopPropagation\" packages/is-vue-framework/src/components/inputs`
→ one shared definition, not five divergent object literals.

### Step 2: Migrate all five consumers

Apply shared popup props/settings to Date, Time, DateRange, Month, and Year.
Preserve every component's existing mode props (`time-picker`, `range`,
`week-picker`, `month-picker`, `year-picker`), formatters, events, min-date,
and inline behavior. `DateInput` behavior must remain equivalent after
extraction.

Search all package source for direct `@vuepic/vue-datepicker` imports. Any new
direct consumer found must use shared contract or be documented as inline-only
with a test proving clipping cannot apply.

**Verify**:
`rg -l \"@vuepic/vue-datepicker\" packages/is-vue-framework/src -g '*.vue'`
→ exactly five known consumers, each visibly binds shared popup settings.

### Step 3: Add component contract tests

Create a Vitest suite that stubs `@vuepic/vue-datepicker`, mounts each input,
and records props received by stub. Assert all five receive:

- teleport enabled by default;
- shared event config;
- popup interaction class/hook;
- explicit teleport override when supplied.

Also assert one representative inline input retains `inline: true` and each
specialized mode prop survives migration. Use existing direct Vue mount style
from `components/inputs/__tests__/base-input.spec.ts`.

If jsdom cannot validate actual clipping, keep this as a contract test and use
manual overflow-card verification below.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/datepicker-popup.spec.ts`
→ exit 0; five-component matrix passes.

### Step 4: Run gates and reproduce inside overflow container

Run package gates. In web input catalog or a temporary browser-only harness,
place each non-inline picker inside a card/container with `overflow: hidden`.
Open popup and confirm it escapes card bounds and remains clickable. Do not
commit temporary harness changes.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.
- `pnpm --filter @southneuhof/is-vue-framework test` → exit 0.
- `git diff --check` → no output.
- Manual matrix: Date, Time, DateRange, Month, Year popup visible outside
  overflow-hidden card.

## Test plan

Automated prop-contract matrix covers all five direct consumers, default and
override teleport, event config, and specialized modes. Manual browser matrix
covers actual portal placement/clickability because jsdom has no layout.

## Done criteria

- [ ] One shared popup-safety contract exists.
- [ ] All five direct Vue Datepicker consumers use it.
- [ ] Time popup escapes card overflow like Date popup.
- [ ] Teleport remains explicitly overridable.
- [ ] Inline and specialized picker modes remain intact.
- [ ] Focused tests, typecheck, and package tests pass.
- [ ] Only in-scope files plus `plans/README.md` changed.

## STOP conditions

- Current Date fix depends on undocumented version-specific behavior not
  representable through shared props.
- Teleport breaks a picker inside Dialog/Popover despite event config.
- Shared extraction requires changing model-value formats or public events.
- Another direct consumer has materially different popup ownership.
- Actual overflow fix requires modifying Card/Dialog overflow instead.

## Maintenance notes

Future datepicker-based inputs must consume shared popup contract. Reviewer
should test nested Card, Dialog, and Popover contexts, especially outside-click
handling and keyboard focus after teleport.

## Execution result

- **Status**: COMPLETE — reviewed and approved
- **Verification**: 11/11 popup contract tests; browser matrix confirmed all
  five picker menus visible and teleported outside input-catalog `<main>`.
- **Deviation**: none.
