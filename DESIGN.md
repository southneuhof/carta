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
fields of one card inside a single `defineDetail` map so label colons align.
`DetailView` and `FormView` own the page header through `NavigationHeader`. A
custom page with a back target uses `NavigationHeader` directly; top-level
sidebar custom pages omit any Back button by using a clean framed `Card` header
until `NavigationHeader` supports hiding its Back control (never hide it with
brittle CSS selector overrides). `ListView` renders its own title and toolbar
header. Show one page header on each page; sections below it keep their own
short headings. Keep module titles in the standard header; omit decorative
banners, repeated titles, and slogans.

Keep container framing consistent across peer sections on a page. Enclose peer
sections below `DetailView` (including child tables, lists, and routed tab
bodies) in framework `Card` containers (`variant="outlined"
color="surfaceContainer"`) so they match the framed summary rather than
floating bare on the page background. Never nest two same-tone outlined cards.
When a sub-group inside a card genuinely needs visual containment (such as
assigned job items inside a workload card or cards inside a collection), step
to a distinct Material 3 container tone (`surface-container-low`,
`surface-container-lowest`, or `surface-container-high` inside
`surface-container`) without redundant heavy borders.

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

Design custom interactive workspaces from a spatial thesis before coding. Name
the primary task order, give the primary work region clear visual dominance
rather than equal-width columns of identical cards, and auto-select the first
queue item when present so the workspace never opens on an empty stub. Keep
comparison panels (such as technician workload or schedule slots) visible
without vertical jumping: selecting a record must never expand a region above a
sibling comparison section and push it below the fold. Inside a queue or list
pane, present selectable rows inside one framed `Card` separated by subtle
dividers (`divide-y divide-outline-variant`) rather than stacking many
separate bordered cards.

Group by proximity before adding boxes. Keep related facts close (`gap-1` to
`gap-2`) and separate distinct groups generously (`gap-4` to `gap-6`, with more
space above a heading than below it). Avoid repeating one uniform spacing value
until every element has equal weight. Pass the squint test: with detail
blurred, the page header, primary work area, and supporting regions remain
distinct in priority order.

For collections, show the primary name or reference first, then useful status,
dates, and amounts. Keep high-priority columns visible on desktop (1440px+) so
status, priority, dates, and totals are not clipped off-screen behind sticky
row actions. Put long prose and secondary audit fields in detail. Use cards
when images or summaries help users compare records; keep card interiors tight
with a clean footer row rather than empty vertical voids. Add a `Table` and
`Cards` switch only when both views serve the task.

## Actions, icons, and forms

Keep standard `ListView` Create controls and list row View, Edit, and Delete
actions in their normal locations. Preserve the default `Create` button label
(`+ Create`) unless the user or approved design explicitly requires custom
wording. Keep row actions compact (icon controls or a menu) so wide text
buttons do not distort narrow table rows.

Put requested record workflow actions in the detail controls area. Keep header
actions right-aligned and visually tiered so unrelated buttons do not compete
at equal weight:

- Primary workflow action: `variant="filled"` (for example `Start Work`, `Approve`, `Complete Work`).
- Record management controls: `variant="outlined"` (for example `Edit`, `Delete` with `color="error"`).
- Secondary reference dialog triggers: `variant="text"` (for example `Audit Details`, `Activity Log`).

Use framework `Button` controls across an action bar so sibling actions share
the same height and treatment (wrap `Button` in `RouterLink` or navigate
programmatically rather than placing a raw styled link beside a `Button`). Keep
every form `Submit` button compact and right-aligned at the bottom of the form
(including inside custom workspaces); never stretch `Submit` full-width across
a column. The page header does not repeat form actions.

Apply the button icon rule consistently using Loom `Icon` in `Button`'s `#icon`
or `#trailing-icon` slot:

- **Add an icon:**
  - Header and toolbar actions (leading icon: `Create`, `Edit`, `Delete`, `Start Work`, `Approve`, `Reject`, `Complete Work`, `Export`).
  - Triggers that open a reference dialog or navigate to another page (leading icon such as `file-list` or `history` for dialogs; trailing `arrow-right-up` for navigation links such as `Open work order`).
  - Active selected toggle buttons (leading `check` icon alongside `variant="filled"`).
  - Standalone destructive actions outside a confirmation footer (`Delete`, `Reject`).
- **Omit the icon:**
  - Form and dialog footer commits and dismissals (`Submit`, `Save`, `Cancel`, `Close`, `Continue`, `Previous`, `Next`).
  - Repeated unselected list or card buttons (such as `Choose` repeated across technician cards; add `check` only on the selected item, or use `kind="icon"` in table rows).
  - Inline text recovery actions inside alerts (`Retry`, `Clear filters`).

Use `FormView` for an independent form page, `DialogForm` for a short
contextual input form, `ConfirmationDialog` for yes/no confirmations, and
`Form` inside an existing surface. Group fields by task and put prerequisite
fields before dependent fields.

Keep collection filter bars calm and aligned. Prefer `ListView`'s built-in
filter controls or a compact, single-row aligned filter bar. Keep controls in
the same filter row consistent in height and type. Represent boolean or single
category quick filters with `ChipFilter` rather than a stray floating switch or
a standalone pill action button above a list. Use the smallest filter width
that fits the control; use a full row only when needed.

A contextual dialog form opens from its own action and owns its normal open and
close interaction. In repeated content, use one dialog form for each record
action. Let the page control visibility only when another page control must
coordinate the same dialog.

## Controls, optical alignment, and values

Use shared Loom controls and keep their standard designs. Customize only for an
explicit user request or a required interaction they cannot support. Check the
[capability index](.agents/skills/web-ui-surfaces/references/capabilities.md)
before building any filter, dialog, timeline, or button bar. Never wrap a
record ID in a pill button just to make a list item clickable; make the full
list item selectable inside a divided container with a clear active highlight.
Keep default `Button` horizontal padding intact so Material 3 pill hover and
focus states frame the label cleanly (never strip padding with `px-0`). Keep
left edges optically aligned by placing secondary navigation buttons
right-aligned in the section header row, or using a plain `RouterLink` when a
link sits flush-left under body copy. Never inject fragile
`tr:nth-child(...)` divider CSS into `DetailView`.

Change wording through label configuration, and keep field labels clean without
appending `(required)` text. Import components from public exports or verified
Loom component paths.

Choose display behavior for every visible field. Use a reusable display
fragment when several fields share a renderer, accessor, or format. Pass the
needed fragments to each `defineTable` column map and `defineDetail` field map.
Keep form inputs in their own `defineForm` map. Use `renderer: 'date'`
consistently for calendar dates across the app rather than mixing `DateInput`
with raw text date inputs. Render plain-text textarea values as plain text
(`whitespace-pre-wrap` or standard display), never with `renderer: 'html'`.
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

Apply button emphasis for the app's warm-neutral monochrome Material 3 theme.
Because `secondary-container` sits very close to `surface-container` in light
mode, `variant="tonal"` blends into outlined cards and fails to signal active
selection. Use `variant="filled"` (`bg-primary text-on-primary`) for primary
actions and selected button states (paired with a leading `check` icon and
clear wording such as `Selected`), `variant="outlined"` for secondary and
unselected options, and `variant="text"` for quiet reference triggers.

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
