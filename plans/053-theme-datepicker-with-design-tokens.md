# Plan 053: Theme all datepicker surfaces with application design tokens

> **Implementation instructions**: Follow every step and verification gate.
> Update this plan's row in `plans/README.md` only after implementation review.
>
> **Drift check (run first)**:
> `git diff --stat a52ea98..HEAD -- packages/is-vue-framework/src/styles/framework.css packages/is-vue-framework/src/components/inputs apps/web/src/assets/main.css`
> Any mismatch with Current state is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW — CSS-variable substitution on one third-party widget family
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a52ea98`, 2026-07-29

## Why this matters

Datepicker uses hard-coded blue/gray palettes unrelated to active Material
theme. Screenshot shows popup disconnected from brown dark surface. Mapping
Vue Datepicker variables to existing `--md-sys-color-*` tokens makes Date,
Time, DateRange, Month, and Year pickers follow every application theme,
including runtime light/dark changes.

## Current state

- `packages/is-vue-framework/src/styles/framework.css:267-305` defines
  `.dp__theme_light` and `.dp__theme_dark` with hard-coded hex values.
- Active app tokens are RGB channels, e.g.
  `--md-sys-color-surface-container`, `--md-sys-color-on-surface`,
  `--md-sys-color-primary`, `--md-sys-color-on-primary`,
  `--md-sys-color-outline`, and `--md-sys-color-error`.
- `apps/web/src/assets/themes/light.css:2-50` and
  `apps/web/src/assets/themes/dark.css:2-50` supply those tokens. They are
  reference data, not in-scope files.
- `apps/web/src/main.ts:13` imports Vue Datepicker's base CSS before framework
  styling, so framework variable overrides are the correct integration point.
- All five picker components select `.dp__theme_light`/`.dp__theme_dark`
  through their `:dark` prop.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| CSS assertions | `pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/datepicker-theme.spec.ts` | exit 0 |
| Typecheck | `pnpm --filter @southneuhof/is-vue-framework type-check` | exit 0 |
| Package tests | `pnpm --filter @southneuhof/is-vue-framework test` | exit 0 |

## Scope

**In scope**:

- `packages/is-vue-framework/src/styles/framework.css`
- `apps/web/src/assets/main.css` — active web app duplicates framework picker
  overrides; live browser verification proved both copies must remain aligned
- `packages/is-vue-framework/src/components/inputs/__tests__/datepicker-theme.spec.ts`
  (create)
- `plans/README.md`

**Out of scope**:

- App theme token values.
- Tailwind configuration.
- Date/time parsing, formatting, layout, and teleport behavior.
- Third-party package upgrades.

## Git workflow

- Suggested branch: `codex/053-datepicker-theme`
- One logical commit. Do not push unless requested.

## Steps

### Step 1: Replace hard-coded widget colors with semantic tokens

Map both `.dp__theme_light` and `.dp__theme_dark` variables to
`rgb(var(--md-sys-color-...) / <alpha>)`. Prefer:

- popup/input background → surface or surface-container token;
- primary selection/action → primary;
- primary text → on-primary;
- normal text → on-surface;
- subdued/icon/disabled → on-surface-variant with explicit alpha;
- borders → outline or outline-variant;
- hover/highlight → primary or on-surface with low alpha;
- danger → error.

Set every currently declared Vue Datepicker variable; do not leave mixed hex
and semantic values. Add missing border/menu variables where needed so popup
edges match cards. Keep both selectors because Vue Datepicker emits them, but
they may share one comma-separated semantic rule when active app tokens already
carry light/dark values.

**Verify**:
`rg -n '#[0-9A-Fa-f]{3,8}|rgba?\\(' packages/is-vue-framework/src/styles/framework.css`
→ no hard-coded color match inside the datepicker theme blocks.

### Step 2: Add a static token contract test

Create `datepicker-theme.spec.ts` following existing Vitest style. Read
`framework.css` and assert:

- light and dark selectors exist;
- datepicker background, text, primary, primary-text, border, icon, danger, and
  highlight variables reference expected `--md-sys-color-*` families;
- datepicker theme blocks contain no hex color literals.

Static test is intentional: jsdom cannot reliably compute teleported
third-party CSS custom-property output.

**Verify**:
`pnpm --filter @southneuhof/is-vue-framework test -- src/components/inputs/__tests__/datepicker-theme.spec.ts`
→ exit 0.

### Step 3: Run gates and visually inspect both modes

Run package checks. In web input catalog, open at least Date and Time picker in
light and dark modes. Confirm popup background, text, selection, hover, icons,
and borders match surrounding card and remain readable.

**Verify**:

- `pnpm --filter @southneuhof/is-vue-framework type-check` → exit 0.
- `pnpm --filter @southneuhof/is-vue-framework test` → exit 0.
- `git diff --check` → no output.
- Manual matrix: Date/Time × light/dark has no light popup on dark card and no
  unreadable selection text.

## Test plan

Add one static token-contract suite. Manual check covers actual third-party
rendering and teleport. Use `apps/web/src/routes/(demo)/input-catalog` as visual
host; do not modify it.

## Done criteria

- [ ] Datepicker CSS has no hard-coded palette in light/dark blocks.
- [ ] Both widget theme selectors consume application semantic tokens.
- [ ] Static test, package typecheck, and package tests pass.
- [ ] Date and Time popup pass light/dark manual matrix.
- [ ] Only in-scope files plus `plans/README.md` changed.

## STOP conditions

- App themes do not load semantic RGB-channel variables before framework CSS.
- A required Vue Datepicker variable accepts a non-color keyword only.
- Token mapping causes contrast failure in either mode.
- Fix requires changing app theme values or third-party source.

## Maintenance notes

Any new app theme automatically affects widget palette. Reviewers should check
contrast, not exact hex equality. Keep widget variables semantic; never copy
one app theme's generated values into framework CSS.

## Execution result

- **Status**: COMPLETE — reviewed and approved
- **Verification**: token contract passed for framework and active web CSS;
  browser computed values match active semantic tokens.
- **Deviation**: live verification found `apps/web/src/assets/main.css`
  duplicates picker overrides. Added it to scope and contract test so active app
  and framework cannot silently diverge.
