# Workflow detail layout

Use `DetailView` for a standard detail page. Use this route-owned layout only
when a workflow needs cards, child tables, history, or workflow dialogs.
Read `docs/ui/surfaces.md` for the page chrome and action contract.

## Data loading

Start from the resource detail action. Use its namespace, identity, search
parameters, and run function with `recordKey` and `useLoader`. Do not call RPC
or create a second normalization path in the route.

After a successful custom action, await `resource.invalidate({ id })`, then
refresh the active loader. Keep errors visible through
`errorMessage(error, fallback)`.

## Page structure

- `NavigationHeader` owns title, status, subtitle, back navigation, and top
  controls.
- Use a responsive main/sidebar grid. Main content has record and history
  cards. The sidebar has only current workflow actions.
- Use framework `Card`, `Detail`, `Table`, `Timeline`, `DialogForm`,
  `ConfirmationDialog`, `Tooltip`, and base components.
- Loading uses `role="status"`; errors use `role="alert"`.

Use the spacing and component pattern from the UI contract. Use another
workflow detail only as domain evidence.

## Actions

- Put data actions such as Edit and Delete in the standard header resource
  action region.
- Show only server-derived workflow actions for the loaded record.
- Keep Delete out of the workflow-action group.
- Use icon buttons with `aria-label` and `Tooltip` for top controls.
- Every destructive or closing action uses a confirmation.
- Use `DialogForm` for action input. Pass a resource or action `{ run }` bag
  directly when available.

Add workflow instructions only when the approved design proves that the
controls and their states cannot communicate the rule.
