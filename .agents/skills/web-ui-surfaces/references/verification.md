# UI review and completion gate

Every changed `apps/web` module must pass all three gates below before
implementation is marked `Current`. Source review alone does not prove rendered
layout, visual hierarchy, or contrast.

## 1. Static and lint gate

- Run web lint, type check, and `pnpm run test:surface-architecture`.
- Resolve every new native-control `vue/no-restricted-syntax` warning
  (`button`, `input`, `select`, `textarea`, `table`, `form`) instead of ignoring
  warnings because ESLint exits 0. Use `ListView`, `DetailView`, `FormView`,
  `Form`, `Table`, `TreeTable`, `TableInput`, `ListItem`, `Button`, `Tabs`, and
  `ChipFilter` from `@southneuhof/loom`. Keep a warning only for a justified
  `#row-actions` or `#actions` slot override where no Loom component fits.
- Confirm every custom component or native control still has an unsupported
  requirement verified against [capabilities.md](capabilities.md).

## 2. Source contract trace

- Trace one representative create or edit flow from loader through draft
  mapping, submit, and cache invalidation.
- Trace one custom workflow command through permission, `allowedOperations`,
  bound `command.can` and `command.run`, and cross-resource invalidation.
- Confirm:
  - `ListView` keeps the default `Create` label unless the approved design
    explicitly requires custom wording, uses `field(key)` in `#filters`, and
    uses `filter-controls="slot"` when omitting the filter popover.
  - Standard CRUD detail pages keep `DetailView`'s single default card (with
    `sections` when helpful) and rely on built-in `DetailView` Edit and Delete
    actions.
  - Custom pages use `PageHeader` (omitting `backTo` on top-level sidebar
    pages), and changed pages do not override Loom internals with `:deep(...)`
    or descendant CSS selectors.
  - Detail page `load` placement, explicit date and timestamp locale,
    `tabular-nums` alignment, and empty-value placeholders (`-`) are consistent
    across sibling modules.

## 3. Rendered visual inspection

Run `pnpm verify:ui --config <path.json>` from the repository root. List the
changed routes in the config. The command can start the app, sign in, and
capture desktop and mobile views in light and dark modes. Read `report.json`
and open the screenshots. Use
[Runtime proof](../../verify-carta-module/references/runtime.md#browser-proof-only-when-selected)
for config fields and interactive workflows.

Inspect the screenshots for these conditions.

1. **Visual hierarchy and reading order.** Page header, primary work area, and
   supporting panels read in clear order. Custom workspaces give the primary
   work region width dominance, auto-select the first queue item when present
   so no blank stub appears, and render selectable queue rows with flat
   `ListItem` rows inside a divided `Card`.
2. **Containment discipline.** Peer sections below `DetailView` sit inside
   consistent `Card` containers rather than floating bare on the background.
   No two same-tone outlined cards are nested; nested containment inside
   `surface-container` steps up to `surface-container-high` without redundant
   borders (never `surface-container-lowest`).
3. **Secondary content in dialogs.** Read-only audit metadata, technical
   details, and activity logs open in a `Dialog` from `variant="text"` buttons
   with icons rather than stacking inline disclosures or low-priority tabs.
4. **Calm filters and progressive disclosure.** Filter controls stay compact
   and uncluttered. Narrow panes or filter groups with 2+ secondary filters
   keep `SearchBox` visible and place secondary filters inside a `Popover`
   opened from a compact filter button. Single quick status or category filters
   use `ChipFilter` directly. Local view switches (`Table` / `Cards`) use
   `Tabs` (with icons when helpful) rather than competing primary buttons.
   Flush-left links use plain `RouterLink`.
5. **Action order, icons, and emphasis.** Header bars order controls
   left-to-right from quietest to strongest so the primary `filled` CTA sits
   top-rightmost (automatic `outlined` `Edit`/`Delete`, followed by `#controls`
   from quietest actions to the primary `filled` workflow action).
   Form/dialog footer actions and repeated unselected buttons omit icons.
   Chips share one variant per page.
6. **Spatial stability, narrow screen, and dark theme.** Selecting a record in
   a custom workspace keeps sibling comparison panels visible without pushing
   them below the fold. At 375px, sections stack cleanly in logical task order
   with zero horizontal page overflow, zero nested scroll traps, and clearance
   above the bottom-right navigation pill. All text, cards, chips, and selected
   states remain readable in dark mode.

Select automated runtime and browser proof through
[$verify-carta-module](../../verify-carta-module/SKILL.md). For
documentation-only changes, check source facts, links, and scope.
