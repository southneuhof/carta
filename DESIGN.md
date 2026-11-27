# App design

Use this file when you design, build, or review an `apps/web` page. It owns the
app's visual and layout conventions. An explicit user requirement can change a
convention; record that change in the feature's existing work record. Component
APIs still define the supported implementation.

Keep app design rules here. Skills describe implementation and checks, and link
to the applicable section. Feature records contain required exceptions and
their reasons, not copies of these rules.

## Shell and navigation

Use one authenticated shell, with persistent navigation on wide screens, a
bottom-right navigation pill on narrow screens, a global toolbar on wide screens,
and one main content region. Public and sign-in pages use their own shell. A
module supplies the page body. Keep navigation available on direct entry to a
child page and hide empty groups. Add search, notifications, or a dashboard only
when the task requires them. Keep the top and side safe areas outside the
authenticated scroll area.

The narrow-screen pill identifies the current menu and expands into its
navigation window. Narrow screens have no shell header; show the logo and app
name at the top of the navigation window in a row with space between them.
Derive the current menu from the permission-filtered navigation manifest,
including on direct entry to a detail or edit page. Keep the label and menu
icon continuous through expansion and closure. Keep the menu and Close hit
targets stationary. Use shared controls, existing Material color tokens, and
the app's typography. Let page content scroll behind the pill. Place safe-area
and pill clearance at the end of the scrollable content so the last controls
can clear it.

## Page structure and layout craft

Use `ListView`, `DetailView`, and `FormView` with their standard layouts for
standard CRUD pages. Keep `DetailView`'s single default card on ordinary detail
pages instead of splitting fields across multiple custom cards, and keep all
fields of one card inside a single `defineDetail` map (using `sections` when
logical groups help scanning) so label colons align. `ListView`, `DetailView`,
and `FormView` share `PageHeader`. Custom pages use `PageHeader` directly: pass
`backTo` when the page has a back target and omit `backTo` on top-level sidebar
custom pages so no Back button renders. Show one page header on each page;
sections below it keep their own short headings. Keep module titles in the
standard header; omit decorative banners, repeated titles, and slogans.

Keep container framing consistent across peer sections on a page. Enclose peer
sections below `DetailView` (including child tables, lists, and routed tab
bodies) in framework `Card` containers (`variant="outlined"
color="surfaceContainer"`) so they match the framed summary rather than
floating bare on the page background. Never nest two same-tone outlined cards.
When a sub-group inside a `surface-container` card needs visual containment,
step up in Material 3 tonal elevation (`surface-container-high` or
`surface-container-highest`) without redundant borders; do not use
`surface-container-lowest` for nested cards inside `surface-container`, since
it reads as a recessed cutout. Inside a list or queue card, use flat divided
`ListItem` rows (`divide-y divide-outline-variant`) rather than nested cards.

Keep the main page focused on primary operational work. Show the record summary
first, with the primary task and its controls. Show each field or attachment
once. Use a sidebar for companion context: facts about the same record with no
row actions and no collection of its own. Companion context sits beside the
primary content on wide screens and below it on narrow screens.

Move secondary and reference inspection off the main scroll flow. Place
read-only audit metadata, technical details, and activity logs behind a button
in the header or section controls that opens a `Dialog`. Reserve inline
`Disclosure` and routed `Tabs` for primary operational sections that users
actively work in.

When a record has one primary operational child collection (such as line
items), show that section in a framed `Card` directly below `DetailView` on
entry without a single tab or an Open button. Use an adjacent component for a
section of the same record. Use a default child `detail/index.route.vue` with
`AppRouterView` only when the section owns an identity that users can link,
refresh, and return to. When a record has several primary operational child
sections, enclose the Loom `Tabs` and `AppRouterView` area cleanly below
`DetailView`, using named `RoutedTabItem` targets and a route-owned
default-child redirect while the detail remains visible. Length alone does not
earn a route. See [file routing](docs/architecture/file-routing.md) for file
placement, replacement pages, and Back targets.

Design custom interactive workspaces for clear reading and task order. Give the
primary work region clear visual dominance rather than equal-width columns of
identical cards, and auto-select the first queue item when present so the
workspace never opens on an empty stub. Keep comparison panels (such as
technician workload or schedule slots) visible without vertical jumping:
selecting a record must never expand a region above a sibling comparison section
and push it below the fold. Inside a queue or list pane, render selectable rows
with Loom `ListItem` inside one divided `Card` (`divide-y divide-outline-variant`)
rather than stacking bordered cards.

Group by proximity before adding boxes. Keep related facts close (`gap-1` to
`gap-2`) and separate distinct groups with more space (`gap-4` to `gap-6`, with
more space above a heading than below it) so the page header, primary work area,
and supporting regions read in clear priority order.

For collections, show the primary name or reference first, then useful status,
dates, and amounts. Put long prose and secondary audit fields in detail. Use
cards when images or summaries help users compare records; keep card interiors
tight with a clean footer row rather than empty vertical voids. Add a `Table`
and `Cards` switch using `Tabs` (with icons when switching visual modes) only
when both views serve the task.

## Actions, icons, and forms

Keep standard `ListView` Create controls and list row View, Edit, and Delete
actions in their normal locations. Preserve the default `Create` button label
(`+ Create`) unless the user or approved design explicitly requires custom
wording. Keep row actions compact (icon controls or a menu) so wide text
buttons do not distort narrow table rows.

Put requested record workflow actions in the detail controls area. `DetailView`
renders standard `Edit` (`variant="outlined"`) and `Delete` (`variant="outlined"
color="error"`) controls automatically when `update` or `delete` is declared on
the resource. Keep header actions right-aligned and ordered left-to-right from
lowest to highest emphasis so the **primary action is always top-rightmost**
(matching `ListView`'s rightmost `+ Create`):

1. Quiet utility icons and secondary reference dialog triggers on the left: `variant="text"` in `DetailView`'s `#secondary-controls` slot (for example `Audit Details`, `Activity Log`).
2. Record management and secondary workflow controls in the middle: `variant="outlined"` (automatic `Edit` and `Delete` with `color="error"`, or `Reject`).
3. Primary workflow action at the far top-rightmost position: `variant="filled"` in `#controls` (for example `Submit`, `Approve`, `Start Work`, `Complete Work`).

Use framework `Button` controls across an action bar so sibling actions share
the same height and treatment (wrap `Button` in `RouterLink` or navigate
programmatically rather than placing a raw styled link beside a `Button`). The
page header does not repeat form actions.

Apply the button icon rule consistently using Loom `Icon` in `Button`'s `#icon`
or `#trailing-icon` slot:

- **Add an icon:**
  - Header and toolbar actions (leading icon: `Create`, `Edit`, `Delete`, `Start Work`, `Approve`, `Reject`, `Complete Work`, `Export`).
  - Triggers that open a reference dialog or navigate to another page (leading icon such as `file-list` or `history` for dialogs; trailing `arrow-right-up` for navigation links).
  - Standalone destructive actions outside a confirmation footer (`Delete`, `Reject`).
  - Visual-mode tabs where icons aid recognition (for example `table` and `layout-grid` on `Table` / `Cards` `Tabs`).
- **Omit the icon:**
  - Form and dialog footer commits and dismissals (`Submit`, `Save`, `Cancel`, `Close`, `Continue`, `Previous`, `Next`).
  - Repeated unselected list or card buttons (add `check` only on the selected item, or use `kind="icon"` in table rows).
  - Inline text recovery actions inside alerts (`Retry`, `Clear filters`).
  - Text-driven domain or sub-resource tabs where icons add noise.

Use `FormView` for an independent form page, `DialogForm` for a short
contextual input form, `ConfirmationDialog` for yes/no confirmations, and
`Form` inside an existing surface. Group fields by task with `sections` on
`defineForm` and `defineDetail` when a record has multiple distinct field groups,
and put prerequisite fields before dependent fields.

Keep collection filter bars calm and uncluttered. Follow Material 3 filter
conventions and use progressive disclosure when horizontal space is tight:

- **Cramped panes or 2+ secondary filters** (such as a narrow split-workspace queue column or a multi-filter toolbar): keep `SearchBox` visible and place secondary filters inside a Loom `Popover` opened from a compact filter button (showing an active filter count or indicator when filters are set), matching `ListView`'s default filter popover. Do not stack mismatched search, lookup, select, and toggle controls across multiple cramped rows.
- **Single quick category or status filter**: use `ChipFilter` in one compact row, setting `filter-controls="slot"` on `ListView` when `#filters` already owns every filter.
- **Inline multi-filter row on wide lists**: derive controls through `field(key)` and keep sibling controls consistent in height and type (do not pair a filled `LookupInput` button next to outlined `SelectInput` dropdowns in the same row). Use the smallest filter width that fits the control.

A contextual dialog form opens from its own action and owns its normal open and
close interaction. In repeated content, use one dialog form for each record
action. Let the page control visibility only when another page control must
coordinate the same dialog.

## Controls, optical alignment, and values

Use shared Loom controls and keep their standard designs. Customize only for an
explicit user request or a required interaction they cannot support. Check the
[capability index](.agents/skills/web-ui-surfaces/references/capabilities.md)
before building any filter, dialog, list item, timeline, or button bar. Rely on
Loom component props, slots, and defaults rather than overriding component
internals with `:deep(...)` or descendant CSS selectors. Keep left edges
optically aligned by placing secondary navigation buttons right-aligned in the
section header row, or using a plain `RouterLink` when a link sits flush-left
under body copy.

Change wording through label configuration, and import components from
`@southneuhof/loom`.

Choose display behavior for every visible field. Use a reusable display
fragment when several fields share a renderer, accessor, or format. Pass the
needed fragments to each `defineTable` column map and `defineDetail` field map.
Keep form inputs in their own `defineForm` map.
Keep one empty-value placeholder (`-`) and one chip variant across a page. Show
attachments as previews or named file links, states as labelled framework
chips, relations as names, and dates, hours, and currency with one explicit
application locale and `tabular-nums` (never mix OS-default locale formatting
with a hardcoded locale). Show structured values as readable content; use raw
JSON only when the task requires JSON.

## Text, emphasis, and spacing

Use labels, values, validation, and short instructions that help the user do
the current task. Add help where a format, dependency, or consequence is
unclear. The standard create label is `Create`, the standard submit label is
`Submit`, and collection view labels are `Table` and `Cards`. Use the existing
app language and domain terms.

Establish obvious typographic weight and scale steps so section headings,
record titles, body copy, and muted metadata (`text-on-surface-variant`) read
in clear order. Use the selected framework surface's spacing and theme tokens.
Let actions wrap on narrow screens. Use colour with a text label for status.
Keep content and controls usable at narrow widths and with browser zoom. Keep
page actions separate from global actions. Use restrained borders and surfaces,
and support the app's light and dark themes.

Apply Material 3 emphasis consistently across the app's warm-neutral theme. Hold
Carta's Material 3 component roles above generic styling advice:

- **Primary CTA buttons**: `Button` `variant="filled"` (`rounded-full`, `bg-primary text-on-primary`), placed at the rightmost end of a header or form footer.
- **Secondary and record buttons**: `Button` `variant="outlined"` (or `variant="tonal"` when subtle secondary fill fits) and `variant="text"` for quiet reference dialog triggers.
- **Filter chips**: `ChipFilter` (built on Loom `Chip`, never styled as full-pill CTA buttons).
- **List selection**: `ListItem` (`bg-primary-container text-on-primary-container` selected inside a flat divided `Card`).

## Access and feedback

Use links for navigation and buttons for actions. Keep focus visible and
headings in order. Give icon controls accessible names. Support keyboard use;
keep focus inside an open navigation window and return it to the trigger when
Escape closes the window. When a resize closes mobile navigation, move focus to
a visible app region. Respect reduced motion preferences.

Preserve reading order when columns collapse. Keep labels, errors, and long
values accessible. Keep page scrolling usable; isolate wide table scrolling
and avoid other nested scroll areas unless the task needs them.

Keep loading, empty results, no filter matches, access denial, and failure
distinct. Offer Create or Clear filters when applicable. Preserve input on
failure and prevent duplicate submission. Confirm destructive actions with the
record and consequence. Show success after the write succeeds. If refresh then
fails, report stale data without asking the user to repeat the write.

## Technical references

Read the applicable [UI reference](docs/ui/README.md) for surface slots, form
selection, and collection controls. Use current source for exports and props.
Examples show implementation facts; compare their layout with this file before
you copy them.
