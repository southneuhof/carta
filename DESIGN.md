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

## Page structure

Use `ListView`, `DetailView`, and `FormView` with their standard layouts for
standard CRUD pages. Keep `DetailView`'s default body on ordinary detail pages
instead of replacing it with custom multi-card grids. `DetailView` and
`FormView` own the page header through `NavigationHeader`. A custom page
without those Views uses `NavigationHeader` directly, and top-level sidebar
pages pass `:back-to="false"` so they do not show a stray Back arrow.
`ListView` renders its own title and toolbar header. Show one
`NavigationHeader` on each page; sections below it keep their own short
headings. Keep module titles in the standard header; omit decorative banners,
repeated titles, and slogans.

Keep container framing consistent across peer sections on a page. Enclose peer
sections below `DetailView` (including child tables, lists, and routed tab
bodies) in framework `Card` containers (`variant="outlined"
color="surfaceContainer"`) so they match the framed summary rather than
floating bare on the page background. Keep card containers flat: place sibling
cards side by side or stacked, and never nest one `Card` inside another `Card`.

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

Keep custom interactive workspaces calm and spatially stable. When users work
across a queue and a comparison panel (such as technician workload or schedule
slots), keep both regions visible without vertical jumping. Selecting an item
must never expand a panel above a sibling comparison section and push it below
the fold. Present the selected item's detail and action form in a non-shifting
side pane, a `Dialog`, or a fixed layout region that preserves comparison
visibility on desktop and keeps reading order logical on narrow screens.

For collections, show the primary name or reference first, then useful status,
dates, and amounts. Keep high-priority columns visible on desktop (1440px+) so
status, priority, dates, and totals are not clipped off-screen behind sticky
row actions. Put long prose and secondary audit fields in detail. Use cards
when images or summaries help users compare records. Add a `Table` and `Cards`
switch only when both views serve the task.

## Actions and forms

Keep standard `ListView` Create controls and list row View, Edit, and Delete
actions in their normal locations. Preserve the default `Create` button label
(`+ Create`) unless the user or approved design explicitly requires custom
wording. Keep row actions compact (icon controls or a menu) so wide text
buttons do not distort narrow table rows.

Put requested record workflow actions in the detail controls area. Group
related actions, keep header actions right-aligned, and keep final form actions
together at the bottom-right. Use framework `Button` controls across an action
bar so sibling Edit, Delete, and workflow actions share the same height and
visual treatment (wrap `Button` in `RouterLink` or navigate programmatically
rather than placing a raw styled link beside a `Button`). The page header does
not repeat form actions.

Use `FormView` for an independent form page, `DialogForm` for a short
contextual input form, `ConfirmationDialog` for yes/no confirmations, and
`Form` inside an existing surface. Group fields by task and put prerequisite
fields before dependent fields.

Keep collection filter bars calm and aligned. Prefer `ListView`'s built-in
filter controls or a compact, single-row aligned filter bar. Keep controls in
the same filter row visually consistent in height and type, and group boolean
filters cleanly as chips or inside a filter bar rather than leaving a stray
floating switch above a list. Use the smallest filter width that fits the
control; use a full row only when needed.

A contextual dialog form opens from its own action and owns its normal open and
close interaction. In repeated content, use one dialog form for each record
action. Let the page control visibility only when another page control must
coordinate the same dialog.

## Controls and values

Use shared Loom controls and keep their standard designs. Customize only for an
explicit user request or a required interaction they cannot support. Check the
[capability index](.agents/skills/web-ui-surfaces/references/capabilities.md)
before building any filter, dialog, timeline, or button bar. Change wording
through label configuration, and keep field labels clean without appending
`(required)` text. Import components from public exports or verified Loom
component paths.

Choose display behavior for every visible field. Use a reusable display
fragment when several fields share a renderer, accessor, or format. Pass the
needed fragments to each `defineTable` column map and `defineDetail` field map.
Keep form inputs in their own `defineForm` map. Use `renderer: 'date'`
consistently for calendar dates across the app rather than mixing `DateInput`
with raw text date inputs. Render plain-text textarea values as plain text
(`whitespace-pre-wrap` or standard display), never with `renderer: 'html'`.
Keep one empty-value placeholder (`-`) and one chip variant across a page. Show
attachments as previews or named file links, states as labelled framework
chips, relations as names, and dates and currency with consistent formatting.
Show structured values as readable content; use raw JSON only when the task
requires JSON.

## Text, emphasis, and spacing

Use labels, values, validation, and short instructions that help the user do
the current task. Add help where a format, dependency, or consequence is
unclear. The standard create label is `Create`, the standard submit label is
`Submit`, and collection view labels are `Table` and `Cards`. Use the existing
app language and domain terms.

Use the selected framework surface's spacing and theme tokens. Start peer
sections and action groups with `gap-2`. Let actions wrap on narrow screens.
Use colour with a text label for status. Keep content and controls usable at
narrow widths and with browser zoom. Keep page actions separate from global
actions. Use restrained borders and surfaces, and support the app's light and
dark themes.

Apply button emphasis for the app's warm-neutral monochrome Material 3 theme.
Because `secondary-container` sits very close to `surface-container` in light
mode, `variant="tonal"` blends into outlined cards and fails to signal active
selection. Use `variant="filled"` (`bg-primary text-on-primary`) for primary
actions and selected button states (paired with clear selected wording such as
`Selected` or a check icon), `variant="outlined"` for secondary and unselected
options, and `variant="text"` for quiet secondary triggers.

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
