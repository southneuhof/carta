# App conventions

Read for app shell or visual composition work. Use existing theme tokens and
UI defaults. These are design defaults; choose a different arrangement when it
makes the requested task clearer.

## Shell and navigation

Keep one authenticated shell: persistent navigation on wide screens, a drawer
on narrow screens, a global toolbar, and one main content region. Public and
sign-in routes use their own shell. A module supplies its body, not another
sidebar or toolbar. Add search, notifications, or a dashboard only when the
application needs them.

Use the typed navigation manifest for menu labels, groups, order, routes, and
permission visibility. Use generated route names for links. Derive breadcrumbs
and active navigation from routing data; do not maintain parallel URL maps.
Use the [file-routing convention](file-routing.md) for retained parents and
replacement pages.
Keep navigation available on direct entry to nested routes. Hide empty groups.
The API still checks access when a hidden page is requested directly.

Keep mobile navigation focus inside the open drawer. Escape closes it and
returns focus to the trigger. Use a labelled main region and a route heading.
Keep page scrolling usable at narrow widths and browser zoom; avoid nested
scroll areas unless the task requires them.

## Hierarchy and density

Start with the framework navigation header: title, useful record identity or
subtitle, optional status, and a compact action group. Put the most useful
content first. Keep page actions separate from global actions.

Use semantic surface, text, outline, primary, and error tokens rather than
per-page color values. Check supported light and dark themes. Respect reduced
motion preferences. Fix overlay placement through the component portal and
layer contract, not escalating global z-index and pointer-event overrides. Prefer restrained borders and tonal surfaces. Reserve
strong emphasis for the primary action, selected state, and urgent feedback.
Use labelled status chips; color alone must not carry state.

Group related information under short section headings. Use cards for distinct
sections, not for every label. Start with the spacing in `docs/ui`; increase
space where content or touch access needs it. Use responsive grids for peer
sections and collapse them in reading order. Avoid fixed heights that cut off
translated labels, errors, or longer records.

Show dates, time zones, currency, units, booleans, and empty values consistently
through field formats or app defaults. Display relation names from the API,
not raw identifiers. Use wrapping for essential text; provide access to full
content when truncation is needed. Add help text where format, consequence, or
a dependency is otherwise unclear.

## Interaction and feedback

Use links for navigation and buttons for actions. Icon controls need accessible
names; tooltips supplement them. Keep focus visible and headings in order.
Make table actions and dialogs usable without a pointer. Let action groups wrap
on small screens; isolate wide table scrolling from page scrolling.

Keep initial loading, no records, no filter matches, permission denial, and
request failure distinct. Preserve query and draft state on retry. An empty
state can offer Create or Clear filters when that action is available.

Confirm destructive or irreversible actions with the record and consequence.
Use a specific action label when a generic label would hide the consequence.
Prevent duplicate submission, show pending state, and keep failed input open.
Show success only after the write succeeds. If refresh then fails, report stale
data without suggesting that the user repeat an already completed write.
