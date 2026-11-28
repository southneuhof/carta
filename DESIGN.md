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

- **Standard CRUD views and bare pages.** Use `ListView`, `DetailView`, and
  `FormView` with default layouts. Keep one `DetailView` card with a single
  `defineDetail` map (using `sections` for logical groups) so colons align. On
  non-CRUD pages (dashboards, analytics, split queues, custom workspaces),
  prefer a bare typographic `<header>` (`<h1>` directly on the canvas with
  optional right-aligned filters or actions) instead of wrapping the title in a
  boxed `PageHeader` card. Reserve `PageHeader` for CRUD views or drill-down
  pages that need `backTo` and card toolbar chrome. Omit decorative banners,
  repeated titles, and slogans.
- **Framing and elevation.** Enclose peer sections below `DetailView` in
  `Card` (`variant="outlined" color="surfaceContainer"`), and prefer keeping
  `ListView`'s default outer `Card` around `#collection` card grids. Never nest
  two same-tone outlined cards: step inner cards up to borderless
  `surface-container-high` (`Card` `color="surfaceContainerHigh"`) or
  `surface-container-highest`. Inside a list or queue card, use flat `ListItem`
  rows (`divide-y divide-outline-variant`) rather than nested cards.
- **Hierarchy and secondary content.** Show primary work first and each field
  once. Keep detail pages and detail tabs read-first: render sub-sections as a
  read-only view (`Detail` or a read-only `Card`) with an `Edit` button that
  opens a `DialogForm` rather than embedding live forms directly on a detail
  page. Keep infrequent reference metadata in a `Dialog` rather than cluttering
  the main flow with inline disclosures or low-priority tabs. Show a single
  operational child collection in a framed `Card` directly below `DetailView`;
  use routed `Tabs` (`RoutedTabItem` + `AppRouterView`) only for multiple
  primary operational sections with independent linkable state.
- **Custom workspaces.** Give the primary work region clear width dominance,
  populate a default selection in split workspaces so no blank stub appears,
  and keep key comparison context visible.
- **Spacing and collections.** Use `gap-2` as the standard gap between page
  sections, stacked `Card`s, sibling panels, and views (matching `ListView`,
  `DetailView`, and `FormView`). Use `gap-6` horizontally between side-by-side
  labeled filter or form fields so controls stay comfortably grouped without
  stretching apart across empty space, and `gap-1` for tight inline label/fact
  pairs or compact icon rows. Put primary name/reference first, then status,
  dates, and amounts. Add a `Table` / `Cards` `Tabs` switch only when both views
  serve the task.

## Actions and forms

- **Header action order.** Keep default `ListView` `+ Create` and compact icon
  row actions. On `DetailView`, automatic `Edit` (`variant="outlined"`) and
  `Delete` (`variant="outlined" color="error"`) render first, followed by
  `#controls` rightmost, ordered left-to-right from quietest (`variant="text"`
  dialog triggers, secondary `variant="outlined"`) to the **primary
  `variant="filled"` CTA top-rightmost**. Use Loom `Button` across action bars
  and never repeat form footer actions in the page header.
- **Icons and icon-only controls (`Button` `#icon` / `#trailing-icon`):**
  - Icon-only first: when a familiar icon communicates a utility or secondary
    action clearly on its own (filter, columns, download/export, refresh, view,
    edit, delete, close), prefer a borderless icon button (`Button kind="icon"
    variant="standard"` with `aria-label`, stepping to `variant="tonal"` when
    active). Add text only when the action needs clarification (domain-specific
    verbs, ambiguous workflows, or primary CTAs).
  - Add icon with text: labeled header/toolbar actions, reference dialog or
    navigation triggers (trailing `arrow-right-up` for navigation), standalone
    destructive actions outside confirmation footers, and visual-mode `Tabs`
    (`table`, `layout-grid`).
  - Omit icon: routine text commits and dismissals in form or dialog footers,
    repeated unselected list/card buttons, inline recovery links, and
    text-driven domain tabs.
- **Calm filters.** In narrow panes or with 2+ secondary filters, keep
  `SearchBox` visible and place secondary filters inside a `Popover` behind a
  borderless filter icon button (matching `ListView`'s default filter trigger).
  Use `ChipFilter` for a single quick status/category filter
  (`filter-controls="slot"` on `ListView` when `#filters` owns all filters). On
  wide inline filter rows, derive controls via `field(key)` with consistent
  heights and minimal widths.
- **Forms and dialogs.** Use `FormView` for standalone form pages, `DialogForm`
  for short contextual input modals (including editing secondary detail
  sections), `ConfirmationDialog` for yes/no confirmations, `Dialog` for short
  list-triggered utilities and batch previews rather than dedicated routes, and
  `Form` inside an existing container. Group multi-section forms with `sections`
  and place prerequisite fields before dependent fields. For computed or
  read-only value previews inside forms, prefer a disabled controlled Loom
  input for grid consistency, or plain typography without faux-input box
  styling.

## Controls and values

Import shared controls from `@southneuhof/loom` and avoid `:deep(...)` or
descendant CSS overrides. Check [capabilities.md](.agents/skills/web-ui-surfaces/references/capabilities.md)
before building local wrappers. Keep left edges optically aligned.

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
