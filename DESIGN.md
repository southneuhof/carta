# App design

Single source of truth for `apps/web` visual and layout conventions. An explicit
user requirement can override a rule; record the exception in the feature work
record. Component APIs define the supported implementation.

## Shell and navigation

Use one authenticated shell: persistent sidebar and global toolbar on wide
screens, bottom-right navigation pill on narrow screens (`375px`), and one main
content region. Public and sign-in pages use their own shell. Derive the active
menu from the permission-filtered navigation manifest on direct entry to any
child route and hide empty groups. On narrow screens, omit the shell header,
place the logo and app name at the top of the expanded navigation window, keep
toggle/close targets stationary, and keep bottom clearance so scrolled controls
clear the pill.

## Page structure

- **Standard CRUD views.** Use `ListView`, `DetailView`, and `FormView` with
  default layouts. Keep one `DetailView` card with a single `defineDetail` map
  (using `sections` for logical groups) so colons align. Custom pages use one
  `PageHeader` (pass `backTo` when returning; omit `backTo` on top-level sidebar
  pages). Omit decorative banners, repeated titles, and slogans.
- **Framing and elevation.** Enclose peer sections below `DetailView` in
  `Card` (`variant="outlined" color="surfaceContainer"`). Never nest two
  same-tone outlined cards: step up to `surface-container-high` or
  `surface-container-highest` without borders (never `surface-container-lowest`,
  which reads as a recessed cutout). Inside a list or queue card, use flat
  `ListItem` rows (`divide-y divide-outline-variant`) rather than nested cards.
- **Hierarchy and secondary content.** Show primary work first and each field
  once. Place read-only audit metadata, technical details, and activity logs in
  a `Dialog` opened from a quiet `variant="text"` button rather than stacking
  inline disclosures or low-priority tabs. Show a single operational child
  collection in a framed `Card` directly below `DetailView`; use routed `Tabs`
  (`RoutedTabItem` + `AppRouterView`) only for multiple primary operational
  sections with independent linkable state.
- **Custom workspaces.** Give the primary work region clear width dominance,
  auto-select the first queue item so no blank stub appears, and keep sibling
  comparison panels visible without pushing them below the fold when a row is
  selected.
- **Spacing and collections.** Use `gap-2` as the standard gap between page
  sections, stacked `Card`s, sibling panels, and views (matching `ListView`,
  `DetailView`, and `FormView`). Use `gap-1` only for tight inline label/fact
  pairs or compact icon rows; avoid `gap-4` or `gap-6` between top-level cards
  and sections so spacing stays uniform across the page. Put primary
  name/reference first, then status, dates, and amounts. Add a `Table` /
  `Cards` `Tabs` switch only when both views serve the task.

## Actions and forms

- **Header action order.** Keep default `ListView` `+ Create` and compact icon
  row actions. On `DetailView`, automatic `Edit` (`variant="outlined"`) and
  `Delete` (`variant="outlined" color="error"`) render first, followed by
  `#controls` rightmost, ordered left-to-right from quietest (`variant="text"`
  dialog triggers, secondary `variant="outlined"`) to the **primary
  `variant="filled"` CTA top-rightmost**. Use Loom `Button` across action bars
  and never repeat form footer actions in the page header.
- **Icons (`Button` `#icon` / `#trailing-icon`):**
  - Add: header/toolbar actions, reference dialog or navigation triggers
    (trailing `arrow-right-up` for navigation), standalone destructive actions
    outside confirmation footers, and visual-mode `Tabs` (`table`, `layout-grid`).
  - Omit: form/dialog footer commits and dismissals (`Submit`, `Save`, `Cancel`,
    `Close`, `Continue`, `Previous`, `Next`), repeated unselected list/card
    buttons, inline alert recovery links (`Retry`, `Clear filters`), and
    text-driven domain tabs.
- **Calm filters.** In narrow panes or with 2+ secondary filters, keep
  `SearchBox` visible and place secondary filters inside a `Popover` behind a
  compact filter button (matching `ListView`'s default filter popover). Use
  `ChipFilter` for a single quick status/category filter (`filter-controls="slot"`
  on `ListView` when `#filters` owns all filters). On wide inline filter rows,
  derive controls via `field(key)` with consistent heights and minimal widths.
- **Forms and dialogs.** Use `FormView` for standalone form pages, `DialogForm`
  for short contextual input modals, `ConfirmationDialog` for yes/no
  confirmations, and `Form` inside an existing container. Group multi-section
  forms with `sections` and place prerequisite fields before dependent fields.

## Controls and values

Import shared controls from `@southneuhof/loom` and avoid `:deep(...)` or
descendant CSS overrides. Check [capabilities.md](.agents/skills/web-ui-surfaces/references/capabilities.md)
before building local wrappers. Keep left edges optically aligned (right-aligned
section buttons or flush-left plain `RouterLink` under body copy).

- **Values.** Keep one empty placeholder (`-`), one chip variant per page,
  relations as names, states as labelled chips, attachments as previews or named
  links, and dates/hours/currency in one explicit application locale with
  `tabular-nums`.
- **Material 3 roles.** Primary CTA = `Button` `variant="filled"` (`rounded-full`,
  rightmost). Secondary/record actions = `variant="outlined"` / `variant="tonal"`
  / `variant="text"`. Filter chips = `ChipFilter` (Loom `Chip`, never full-pill
  CTA buttons). Queue rows = `ListItem` (`bg-primary-container` when selected).
- **Theme and typography.** Keep clear weight/scale steps, muted metadata
  (`text-on-surface-variant`), restrained borders, and readable contrast in both
  light and dark themes.

## Access and feedback

Use links for navigation and buttons for actions, keep focus visible and
headings ordered, give icon buttons accessible names, and respect reduced
motion. Preserve reading order on narrow screens, isolate wide table scrolling,
and avoid nested scroll traps. Keep loading, empty, no-match, forbidden, and
error states distinct; preserve input on failure, prevent duplicate submits,
confirm destructive writes with consequences, and report stale data if a
post-write refresh fails.

## Technical references

See [UI reference](docs/ui/README.md) for detailed surface slots and controls.
