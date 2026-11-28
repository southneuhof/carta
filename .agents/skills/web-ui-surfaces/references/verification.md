# UI review and completion gate

Every changed `apps/web` module must pass all three gates before marking
implementation `Current`. Source review alone does not prove rendered layout,
hierarchy, or contrast.

## 1. Static and lint gate

- Run `pnpm verify:module` (covers web lint, type check, and
  `test:surface-architecture`).
- Resolve every new native-control `vue/no-restricted-syntax` warning
  (`button`, `input`, `select`, `textarea`, `table`, `form`) rather than
  ignoring warnings because ESLint exits `0`. Keep a warning only for a
  justified `#row-actions` or `#actions` slot override where no Loom component
  fits.
- Confirm any custom component still has an unsupported requirement verified
  against [capabilities.md](capabilities.md).

## 2. Source contract trace

- Trace one create or edit flow from `load` through draft mapping, `submit`,
  and cache invalidation, and one custom command through `allowedOperations`,
  `command.can`, `command.run`, and cross-resource `invalidates`.
- Confirm changed pages follow [web-ui-surfaces](../SKILL.md) and
  [DESIGN.md](../../../../DESIGN.md) with no `:deep(...)` Loom overrides,
  consistent explicit locale and `tabular-nums`, and `-` empty placeholders.

## 3. Rendered visual inspection

Run `pnpm verify:ui --config <path.json>` from the repository root (see
[Runtime proof](../../verify-carta-module/references/runtime.md#browser-proof-only-when-selected))
across **all three view states**: desktop (`1440px`) light mode, narrow (`375px`)
mobile width, and dark mode on custom workspaces (`10` to `16` representative
captures). Read `report.json` and inspect the saved PNGs directly against
[DESIGN.md](../../../../DESIGN.md):

1. Visual hierarchy, auto-selected first queue item, and flat `ListItem` rows
   inside divided `Card`s on custom workspaces.
2. Consistent `Card` framing below `DetailView`, no nested same-tone outlined
   cards, and secondary read-only views behind `Dialog` triggers.
3. Calm filters (progressive `Popover` disclosure for 2+ secondary filters,
   `ChipFilter` for single quick filters) and right-aligned action order with
   primary `filled` CTA top-rightmost.
4. Zero horizontal overflow (`375px`), no nested scroll traps, bottom
   navigation pill clearance, and readable contrast in dark mode.

Select automated proof through [$verify-carta-module](../../verify-carta-module/SKILL.md).
For documentation-only changes, check source facts, links, and scope.
